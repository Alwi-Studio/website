import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

const adminUsername = process.env.ADMIN_USERNAME ?? 'admin'
const adminPassword = process.env.ADMIN_PASSWORD ?? ''
const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH ?? ''
const sessionSecret = process.env.SESSION_SECRET ?? ''
const supabaseUrl = process.env.SUPABASE_URL ?? ''
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
const sessionMaxAgeMs = 1000 * 60 * 60 * 8
const maxNewsBodyBytes = 64 * 1024
const maxHighlights = 12
const maxHighlightLength = 160
const maxTextLength = 5000
const maxStaffGroups = 24
const maxStaffMembers = 200
const maxWikiCategories = 40
const maxWikiArticles = 400

export function json(res, status, body, extraHeaders = {}) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  for (const [key, value] of Object.entries(extraHeaders)) {
    res.setHeader(key, value)
  }
  res.end(JSON.stringify(body))
}

export async function readJsonBody(req) {
  if (req.body && typeof req.body === 'object') {
    return req.body
  }

  if (typeof req.body === 'string') {
    return req.body ? JSON.parse(req.body) : {}
  }

  const chunks = []
  for await (const chunk of req) {
    chunks.push(chunk)
  }

  if (chunks.length === 0) {
    return {}
  }

  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

export function methodNotAllowed(res, allowed) {
  json(res, 405, { error: 'Method not allowed.' }, { Allow: allowed.join(', ') })
}

function safeEqualText(left, right) {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)

  if (leftBuffer.length !== rightBuffer.length) {
    return false
  }

  return timingSafeEqual(leftBuffer, rightBuffer)
}

export function verifyPassword(password) {
  if (adminPasswordHash) {
    const [salt, expectedHash] = adminPasswordHash.split(':')

    if (!salt || !expectedHash) {
      return false
    }

    const hash = scryptSync(password, salt, 64).toString('hex')

    return safeEqualText(hash, expectedHash)
  }

  return Boolean(adminPassword) && safeEqualText(password, adminPassword)
}

function sign(value) {
  const secret = sessionSecret || 'development-session-secret-change-me'
  return createHmac('sha256', secret).update(value).digest('hex')
}

export function createSessionCookie() {
  const payload = JSON.stringify({
    id: randomBytes(16).toString('hex'),
    expiresAt: Date.now() + sessionMaxAgeMs,
  })
  const encodedPayload = Buffer.from(payload).toString('base64url')
  const token = `${encodedPayload}.${sign(encodedPayload)}`

  return `alwination_admin=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${Math.floor(
    sessionMaxAgeMs / 1000,
  )}; Secure`
}

export function clearSessionCookie() {
  return 'alwination_admin=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0; Secure'
}

function getCookie(req, name) {
  const cookies = req.headers.cookie?.split(';') ?? []

  for (const cookie of cookies) {
    const [cookieName, ...valueParts] = cookie.trim().split('=')

    if (cookieName === name) {
      return valueParts.join('=')
    }
  }

  return ''
}

export function isAuthenticated(req) {
  const token = getCookie(req, 'alwination_admin')
  const [encodedPayload, signature] = token.split('.')

  if (!encodedPayload || !signature || !safeEqualText(signature, sign(encodedPayload))) {
    return false
  }

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'))
    return Number(payload.expiresAt) > Date.now()
  } catch {
    return false
  }
}

export function getAdminUsername() {
  return adminUsername
}

function requireSupabase() {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for admin news storage.')
  }
}

async function supabaseRequest(path, options = {}) {
  requireSupabase()
  const tableName = path.split('?')[0]

  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: supabaseServiceRoleKey,
      Authorization: `Bearer ${supabaseServiceRoleKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...options.headers,
    },
  })
  const data = await response.text()
  const parsedData = data ? JSON.parse(data) : null

  if (!response.ok) {
    if (
      parsedData?.code === 'PGRST205' ||
      parsedData?.message?.includes(`Could not find the table 'public.${tableName}'`)
    ) {
      throw new Error(
        `Supabase is configured, but public.${tableName} does not exist yet. Run database/supabase-news.sql in the Supabase SQL editor, then retry.`,
      )
    }

    throw new Error(parsedData?.message ?? 'Supabase request failed.')
  }

  return parsedData
}

function toDatabaseRow(item) {
  return {
    id: item.id,
    slug: item.slug,
    img: item.img,
    title: item.title,
    description: item.description,
    category: item.category,
    date: item.date,
    date_value: item.dateValue || null,
    author: item.author,
    reading_time: item.readingTime,
    featured: item.featured,
    body: item.body,
    highlights: item.highlights,
    source: 'admin',
    deleted: Boolean(item.deleted),
    updated_at: new Date().toISOString(),
  }
}

function fromDatabaseRow(row) {
  return {
    id: row.id,
    slug: row.slug,
    img: row.img,
    title: row.title,
    description: row.description,
    category: row.category,
    date: row.date,
    dateValue: row.date_value ?? '',
    author: row.author,
    readingTime: row.reading_time,
    featured: Boolean(row.featured),
    body: Array.isArray(row.body) ? row.body : [],
    highlights: Array.isArray(row.highlights) ? row.highlights : [],
    source: 'admin',
    deleted: Boolean(row.deleted),
  }
}

export async function readAdminNews() {
  const rows = await supabaseRequest('news_posts?select=*&order=updated_at.desc')
  return Array.isArray(rows) ? rows.map(fromDatabaseRow) : []
}

export async function readPolicies() {
  const rows = await supabaseRequest('policy_pages?select=key,policy')
  if (!Array.isArray(rows)) {
    return {}
  }

  return rows.reduce((policies, row) => {
    if (row.key === 'rules' || row.key === 'terms') {
      policies[row.key] = row.policy
    }
    return policies
  }, {})
}

export async function readStaff() {
  const rows = await supabaseRequest('staff_pages?key=eq.main&select=staff&limit=1')
  if (!Array.isArray(rows) || !rows[0]?.staff) {
    return null
  }

  return normalizeStaff(rows[0].staff)
}

export async function readWiki() {
  const rows = await supabaseRequest('wiki_pages?key=eq.main&select=wiki&limit=1')
  if (!Array.isArray(rows) || !rows[0]?.wiki) {
    return null
  }

  return normalizeWiki(rows[0].wiki)
}

export async function savePolicy(key, policy) {
  if (key !== 'rules' && key !== 'terms') {
    throw new Error('Unknown policy key.')
  }

  await supabaseRequest('policy_pages?on_conflict=key', {
    method: 'POST',
    body: JSON.stringify({
      key,
      policy,
      updated_at: new Date().toISOString(),
    }),
    headers: {
      Prefer: 'resolution=merge-duplicates,return=representation',
    },
  })
}

export async function saveStaff(staff) {
  const normalizedStaff = normalizeStaff(staff)
  validateStaff(normalizedStaff)

  await supabaseRequest('staff_pages?on_conflict=key', {
    method: 'POST',
    body: JSON.stringify({
      key: 'main',
      staff: normalizedStaff,
      updated_at: new Date().toISOString(),
    }),
    headers: {
      Prefer: 'resolution=merge-duplicates,return=representation',
    },
  })

  return normalizedStaff
}

export async function saveWiki(wiki) {
  const normalizedWiki = normalizeWiki(wiki)
  validateWiki(normalizedWiki)

  await supabaseRequest('wiki_pages?on_conflict=key', {
    method: 'POST',
    body: JSON.stringify({
      key: 'main',
      wiki: normalizedWiki,
      updated_at: new Date().toISOString(),
    }),
    headers: {
      Prefer: 'resolution=merge-duplicates,return=representation',
    },
  })

  return normalizedWiki
}

export async function deletePolicy(key) {
  if (key !== 'rules' && key !== 'terms') {
    throw new Error('Unknown policy key.')
  }

  await supabaseRequest(`policy_pages?key=eq.${encodeURIComponent(key)}`, {
    method: 'DELETE',
    headers: {
      Prefer: 'return=minimal',
    },
  })
}

export async function deleteStaff() {
  await supabaseRequest('staff_pages?key=eq.main', {
    method: 'DELETE',
    headers: {
      Prefer: 'return=minimal',
    },
  })
}

export async function deleteWiki() {
  await supabaseRequest('wiki_pages?key=eq.main', {
    method: 'DELETE',
    headers: {
      Prefer: 'return=minimal',
    },
  })
}

export async function saveAdminNews(item) {
  const rows = await supabaseRequest('news_posts?on_conflict=slug', {
    method: 'POST',
    body: JSON.stringify(toDatabaseRow(item)),
    headers: {
      Prefer: 'resolution=merge-duplicates,return=representation',
    },
  })

  return Array.isArray(rows) && rows[0] ? fromDatabaseRow(rows[0]) : item
}

export async function deleteAdminNews(slug) {
  await supabaseRequest('news_posts?on_conflict=slug', {
    method: 'POST',
    body: JSON.stringify({
      id: `deleted-${slug}`,
      slug,
      title: 'Deleted news post',
      description: 'This post has been hidden.',
      category: 'Deleted',
      date: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      author: 'AlwiNation Team',
      reading_time: '0 min read',
      featured: false,
      body: [],
      highlights: [],
      source: 'admin',
      deleted: true,
      updated_at: new Date().toISOString(),
    }),
    headers: {
      Prefer: 'resolution=merge-duplicates,return=representation',
    },
  })
}

function trimText(value, maxLength = maxTextLength) {
  return String(value ?? '').trim().slice(0, maxLength)
}

function normalizeStaffMember(member) {
  if (typeof member === 'string') {
    const name = trimText(member, 120)
    return name ? { name } : null
  }

  if (!member || typeof member !== 'object') {
    return null
  }

  const name = trimText(member.name, 120)
  if (!name) {
    return null
  }

  const role = trimText(member.role, 160)
  const note = trimText(member.note, 1000)

  return {
    name,
    ...(role ? { role } : {}),
    ...(note ? { note } : {}),
  }
}

function normalizeStaffGroup(group) {
  if (!group || typeof group !== 'object') {
    return null
  }

  const name = trimText(group.name, 120)
  const members = Array.isArray(group.members)
    ? group.members.map(normalizeStaffMember).filter(Boolean)
    : []

  if (!name || members.length === 0) {
    return null
  }

  return {
    name,
    members,
  }
}

export function normalizeStaff(staff) {
  const groups = Array.isArray(staff?.groups)
    ? staff.groups.map(normalizeStaffGroup).filter(Boolean).slice(0, maxStaffGroups)
    : []

  return {
    eyebrow: trimText(staff?.eyebrow, 80) || 'Meet the Team',
    title: trimText(staff?.title, 160),
    updated: trimText(staff?.updated, 80),
    intro: trimText(staff?.intro, 1000),
    groups,
  }
}

export function validateStaff(staff) {
  if (!staff.title || !Array.isArray(staff.groups) || staff.groups.length === 0) {
    throw new Error('Staff title and at least one staff member are required.')
  }

  const memberCount = staff.groups.reduce((sum, group) => sum + group.members.length, 0)
  if (memberCount > maxStaffMembers) {
    throw new Error(`Staff page can include up to ${maxStaffMembers} members.`)
  }

  if (Buffer.byteLength(JSON.stringify(staff), 'utf8') > 65536) {
    throw new Error('Staff page is too large. Keep it under 64 KB of text content.')
  }
}

function slugifyText(value) {
  return trimText(value, 160)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function normalizeWikiArticle(article, usedSlugs) {
  if (!article || typeof article !== 'object') {
    return null
  }

  const title = trimText(article.title, 180)
  if (!title) {
    return null
  }

  const baseSlug = slugifyText(article.slug) || slugifyText(title) || 'page'
  let slug = baseSlug
  let counter = 2
  while (usedSlugs.has(slug)) {
    slug = `${baseSlug}-${counter}`
    counter += 1
  }
  usedSlugs.add(slug)

  return {
    slug,
    title,
    ...(trimText(article.excerpt, 400) ? { excerpt: trimText(article.excerpt, 400) } : {}),
    ...(trimText(article.updated, 80) ? { updated: trimText(article.updated, 80) } : {}),
    body: trimText(article.body, 20000),
  }
}

function normalizeWikiCategory(category, usedSlugs) {
  if (!category || typeof category !== 'object') {
    return null
  }

  const name = trimText(category.name, 140)
  if (!name) {
    return null
  }

  const articles = Array.isArray(category.articles)
    ? category.articles.map((article) => normalizeWikiArticle(article, usedSlugs)).filter(Boolean)
    : []

  return {
    id: slugifyText(category.id) || slugifyText(name) || 'category',
    name,
    icon: trimText(category.icon, 8) || '\uD83D\uDCC4',
    ...(trimText(category.description, 500) ? { description: trimText(category.description, 500) } : {}),
    articles,
  }
}

export function normalizeWiki(wiki) {
  const usedSlugs = new Set()
  const categories = Array.isArray(wiki?.categories)
    ? wiki.categories
        .map((category) => normalizeWikiCategory(category, usedSlugs))
        .filter(Boolean)
        .slice(0, maxWikiCategories)
    : []

  return {
    eyebrow: trimText(wiki?.eyebrow, 80) || 'Server Wiki',
    title: trimText(wiki?.title, 160),
    updated: trimText(wiki?.updated, 80),
    intro: trimText(wiki?.intro, 1000),
    categories,
  }
}

export function validateWiki(wiki) {
  if (!wiki.title || !Array.isArray(wiki.categories) || wiki.categories.length === 0) {
    throw new Error('Wiki title and at least one category are required.')
  }

  const articleCount = wiki.categories.reduce((sum, category) => sum + category.articles.length, 0)
  if (articleCount > maxWikiArticles) {
    throw new Error(`Wiki can include up to ${maxWikiArticles} articles.`)
  }

  if (Buffer.byteLength(JSON.stringify(wiki), 'utf8') > 512 * 1024) {
    throw new Error('Wiki is too large. Keep it under 512 KB of text content.')
  }
}

function normalizeBodyBlock(block) {
  if (typeof block === 'string') {
    const text = trimText(block)
    return text ? { type: 'paragraph', text } : null
  }

  if (!block || typeof block !== 'object') {
    return null
  }

  if (block.type === 'lead' || block.type === 'paragraph') {
    const text = trimText(block.text)
    return text ? { type: block.type, text } : null
  }

  if (block.type === 'heading') {
    const text = trimText(block.text)
    const level = Number(block.level)
    const normalizedLevel = level === 1 || level === 3 ? level : 2
    return text ? { type: 'heading', level: normalizedLevel, text } : null
  }

  if (block.type === 'list') {
    const items = Array.isArray(block.items)
      ? block.items.map((item) => trimText(item, 500)).filter(Boolean).slice(0, 24)
      : []
    return items.length > 0 ? { type: 'list', items } : null
  }

  if (block.type === 'quote') {
    const text = trimText(block.text)
    const cite = trimText(block.cite, 160)
    return text ? { type: 'quote', text, ...(cite ? { cite } : {}) } : null
  }

  if (block.type === 'code') {
    const text = trimText(block.text)
    const language = trimText(block.language, 40)
    return text ? { type: 'code', text, ...(language ? { language } : {}) } : null
  }

  if (block.type === 'stats') {
    const items = Array.isArray(block.items)
      ? block.items
          .map((item) => ({
            label: trimText(item?.label, 80),
            value: trimText(item?.value, 80),
          }))
          .filter((item) => item.label && item.value)
          .slice(0, 8)
      : []
    return items.length > 0 ? { type: 'stats', items } : null
  }

  if (block.type === 'callout') {
    const title = trimText(block.title, 160)
    const text = trimText(block.text)
    return title || text ? { type: 'callout', title, text } : null
  }

  const text = trimText(block.text)
  return text ? { type: 'paragraph', text } : null
}

export function normalizeNewsItem(item) {
  return {
    id: item.id?.trim(),
    slug: item.slug?.trim(),
    img: item.img?.trim() || '',
    title: item.title?.trim(),
    description: item.description?.trim(),
    category: item.category?.trim() || 'Announcement',
    date: item.date?.trim(),
    dateValue: item.dateValue?.trim() || '',
    author: item.author?.trim() || 'AlwiNation Team',
    readingTime: item.readingTime?.trim() || '2 min read',
    featured: Boolean(item.featured),
    body: Array.isArray(item.body) ? item.body.map(normalizeBodyBlock).filter(Boolean) : [],
    highlights: Array.isArray(item.highlights)
      ? item.highlights.map((highlight) => String(highlight).trim()).filter(Boolean).slice(0, maxHighlights)
      : [],
    source: 'admin',
  }
}

export function validateNewsItem(item) {
  if (!item.slug || !item.title || !item.description || !Array.isArray(item.body) || item.body.length === 0) {
    return 'Title, slug, description, and body are required.'
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.slug)) {
    return 'Slug must contain only lowercase letters, numbers, and hyphens.'
  }

  if (Buffer.byteLength(JSON.stringify(item.body), 'utf8') > maxNewsBodyBytes) {
    return 'Article body is too large. Keep one post under 64 KB of text content.'
  }

  if (item.highlights.some((highlight) => highlight.length > maxHighlightLength)) {
    return `Highlights must be ${maxHighlightLength} characters or less.`
  }

  return ''
}
