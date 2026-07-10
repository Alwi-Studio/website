import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import { createReadStream, existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { extname, resolve } from 'node:path'
import { optimizedRemoteImage } from './image-optimizer.mjs'

const rootDir = process.cwd()
const distDir = resolve(rootDir, 'dist')
const dataDir = resolve(rootDir, 'data')
const newsFile = resolve(dataDir, 'admin-news.json')
const envFile = resolve(rootDir, '.env')
const port = Number(process.env.PORT ?? 4175)

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.avif': 'image/avif',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
}

async function loadEnv() {
  if (!existsSync(envFile)) {
    return
  }

  const contents = await readFile(envFile, 'utf8')

  for (const line of contents.split(/\r?\n/)) {
    const trimmedLine = line.trim()

    if (!trimmedLine || trimmedLine.startsWith('#')) {
      continue
    }

    const separatorIndex = trimmedLine.indexOf('=')

    if (separatorIndex === -1) {
      continue
    }

    const key = trimmedLine.slice(0, separatorIndex).trim()
    const value = trimmedLine.slice(separatorIndex + 1).trim()

    if (!process.env[key]) {
      process.env[key] = value
    }
  }
}

await loadEnv()

const adminUsername = process.env.ADMIN_USERNAME ?? 'admin'
const adminPassword = process.env.ADMIN_PASSWORD ?? ''
const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH ?? ''
const sessionSecret = process.env.SESSION_SECRET ?? ''
const supabaseUrl = process.env.SUPABASE_URL ?? ''
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
const hasSupabaseStorage = Boolean(supabaseUrl && supabaseServiceRoleKey)
const sessionMaxAgeMs = 1000 * 60 * 60 * 8
const failedLogins = new Map()
const maxNewsBodyBytes = 64 * 1024
const maxHighlights = 12
const maxHighlightLength = 160
const maxTextLength = 5000
if (!sessionSecret || sessionSecret.length < 32) {
  console.warn('SESSION_SECRET should be set to a random value with at least 32 characters.')
}

if (!adminPassword && !adminPasswordHash) {
  console.warn('Set ADMIN_PASSWORD or ADMIN_PASSWORD_HASH before using the admin API.')
}

if (!hasSupabaseStorage) {
  console.warn('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are not set. Falling back to local JSON storage.')
}

function json(res, status, body, extraHeaders = {}) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...extraHeaders,
  })
  res.end(JSON.stringify(body))
}

async function readJsonBody(req) {
  const chunks = []

  for await (const chunk of req) {
    chunks.push(chunk)
  }

  if (chunks.length === 0) {
    return {}
  }

  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
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

async function supabaseRequest(path, options = {}) {
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
      parsedData?.message?.includes("Could not find the table 'public.news_posts'")
    ) {
      throw new Error(
        'Supabase is configured, but public.news_posts does not exist yet. Run database/supabase-news.sql in the Supabase SQL editor, then retry.',
      )
    }

    throw new Error(parsedData?.message ?? 'Supabase request failed.')
  }

  return parsedData
}

async function readLocalAdminNews() {
  try {
    const contents = await readFile(newsFile, 'utf8')
    const items = JSON.parse(contents)

    return Array.isArray(items) ? items : []
  } catch {
    return []
  }
}

async function writeLocalAdminNews(items) {
  await mkdir(dataDir, { recursive: true })
  await writeFile(newsFile, `${JSON.stringify(items, null, 2)}\n`)
}

async function readAdminNews() {
  if (hasSupabaseStorage) {
    const rows = await supabaseRequest('news_posts?select=*&order=updated_at.desc')

    return Array.isArray(rows) ? rows.map(fromDatabaseRow) : []
  }

  return readLocalAdminNews()
}

async function saveAdminNews(item) {
  if (hasSupabaseStorage) {
    const rows = await supabaseRequest('news_posts?on_conflict=slug', {
      method: 'POST',
      body: JSON.stringify(toDatabaseRow(item)),
      headers: {
        Prefer: 'resolution=merge-duplicates,return=representation',
      },
    })

    return Array.isArray(rows) && rows[0] ? fromDatabaseRow(rows[0]) : item
  }

  const storedItems = await readLocalAdminNews()
  const nextItems = [item, ...storedItems.filter((storedItem) => storedItem.slug !== item.slug)]

  await writeLocalAdminNews(nextItems)

  return item
}

async function deleteAdminNews(slug, options = {}) {
  if (hasSupabaseStorage) {
    if (!options.hide) {
      await supabaseRequest(`news_posts?slug=eq.${encodeURIComponent(slug)}`, {
        method: 'DELETE',
        headers: {
          Prefer: 'return=minimal',
        },
      })
      return
    }

    const existingRows = await supabaseRequest(`news_posts?slug=eq.${encodeURIComponent(slug)}&select=id&limit=1`)
    const existingId = Array.isArray(existingRows) ? existingRows[0]?.id : ''

    await supabaseRequest('news_posts?on_conflict=slug', {
      method: 'POST',
      body: JSON.stringify({
        id: existingId || `deleted-${slug}`,
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
    return
  }

  const storedItems = await readLocalAdminNews()
  if (!options.hide) {
    await writeLocalAdminNews(storedItems.filter((item) => item.slug !== slug))
    return
  }

  const existingItem = storedItems.find((item) => item.slug === slug)
  const nextItems = [
    {
      id: existingItem?.id || `deleted-${slug}`,
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
      readingTime: '0 min read',
      featured: false,
      body: [],
      highlights: [],
      source: 'admin',
      deleted: true,
    },
    ...storedItems.filter((item) => item.slug !== slug),
  ]

  await writeLocalAdminNews(nextItems)
}

function safeEqualText(left, right) {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)

  if (leftBuffer.length !== rightBuffer.length) {
    return false
  }

  return timingSafeEqual(leftBuffer, rightBuffer)
}

function verifyPassword(password) {
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

function createSessionCookie() {
  const payload = JSON.stringify({
    id: randomBytes(16).toString('hex'),
    expiresAt: Date.now() + sessionMaxAgeMs,
  })
  const encodedPayload = Buffer.from(payload).toString('base64url')
  const token = `${encodedPayload}.${sign(encodedPayload)}`
  const secureFlag = process.env.NODE_ENV === 'production' ? '; Secure' : ''

  return `alwination_admin=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${Math.floor(
    sessionMaxAgeMs / 1000,
  )}${secureFlag}`
}

function clearSessionCookie() {
  return 'alwination_admin=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0'
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

function isAuthenticated(req) {
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

function isRateLimited(ip) {
  const now = Date.now()
  const current = failedLogins.get(ip) ?? { count: 0, resetAt: now + 60_000 }

  if (current.resetAt < now) {
    failedLogins.set(ip, { count: 0, resetAt: now + 60_000 })
    return false
  }

  return current.count >= 8
}

function recordFailedLogin(ip) {
  const now = Date.now()
  const current = failedLogins.get(ip) ?? { count: 0, resetAt: now + 60_000 }

  if (current.resetAt < now) {
    failedLogins.set(ip, { count: 1, resetAt: now + 60_000 })
    return
  }

  failedLogins.set(ip, { count: current.count + 1, resetAt: current.resetAt })
}

function normalizeNewsItem(item) {
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
      ? item.highlights
          .map((highlight) => String(highlight).trim())
          .filter(Boolean)
          .slice(0, maxHighlights)
      : [],
    source: 'admin',
  }
}

function trimText(value, maxLength = maxTextLength) {
  return String(value ?? '').trim().slice(0, maxLength)
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

  if (block.type === 'divider') {
    return { type: 'divider' }
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

  if (block.type === 'checklist') {
    const items = Array.isArray(block.items)
      ? block.items
          .map((item) => ({
            checked: Boolean(item?.checked),
            text: trimText(item?.text, 500),
          }))
          .filter((item) => item.text)
          .slice(0, 24)
      : []

    return items.length > 0 ? { type: 'checklist', items } : null
  }

  if (block.type === 'table') {
    const headers = Array.isArray(block.headers)
      ? block.headers.map((header) => trimText(header, 120)).filter(Boolean).slice(0, 8)
      : []
    const alignments = Array.isArray(block.alignments)
      ? block.alignments
          .slice(0, headers.length)
          .map((alignment) => (alignment === 'center' || alignment === 'right' ? alignment : 'left'))
      : []
    const rows = Array.isArray(block.rows)
      ? block.rows
          .map((row) =>
            Array.isArray(row) ? headers.map((_, index) => trimText(row[index], 500)) : [],
          )
          .filter((row) => row.some(Boolean))
          .slice(0, 24)
      : []

    return headers.length > 0 && rows.length > 0 ? { type: 'table', headers, alignments, rows } : null
  }

  if (block.type === 'columns' || block.type === 'grid' || block.type === 'cards' || block.type === 'tabs' || block.type === 'accordion') {
    const items = Array.isArray(block.items)
      ? block.items
          .map((item) => ({
            title: trimText(item?.title, 120),
            text: trimText(item?.text, 800),
            ...(trimText(item?.meta, 120) ? { meta: trimText(item.meta, 120) } : {}),
          }))
          .filter((item) => item.title && item.text)
          .slice(0, 12)
      : []
    const columns = Math.min(Math.max(Number(block.columns) || 2, 2), 4)

    return items.length > 0
      ? {
          type: block.type,
          ...(block.type === 'columns' || block.type === 'grid' ? { columns } : {}),
          items,
        }
      : null
  }

  if (block.type === 'section' || block.type === 'container') {
    const title = trimText(block.title, 160)
    const text = trimText(block.text, 1200)
    return title || text ? { type: block.type, title, text } : null
  }

  if (block.type === 'sidebar') {
    const title = trimText(block.title, 160)
    const text = trimText(block.text, 1200)
    const sidebar = trimText(block.sidebar, 800)
    return title || text || sidebar ? { type: 'sidebar', title, text, sidebar } : null
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

  if (block.type === 'callout') {
    const title = trimText(block.title, 160)
    const text = trimText(block.text)

    return title || text ? { type: 'callout', title, text } : null
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

  if (block.type === 'image') {
    const src = trimText(block.src, 1000)
    const alt = trimText(block.alt, 180)
    const caption = trimText(block.caption, 500)

    return /^(https?:\/\/|\/)/i.test(src) ? { type: 'image', src, alt, ...(caption ? { caption } : {}) } : null
  }

  const text = trimText(block.text)

  return text ? { type: 'paragraph', text } : null
}

function validateNewsItem(item) {
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

async function handleApi(req, res, url) {
  const { pathname } = url

  if (req.method === 'GET' && pathname === '/api/image') {
    const image = await optimizedRemoteImage(url)

    res.writeHead(200, {
      'Content-Type': image.contentType,
      'Content-Length': String(image.buffer.byteLength),
      'Cache-Control': 'public, max-age=86400, s-maxage=31536000, stale-while-revalidate=604800',
    })
    res.end(image.buffer)
    return
  }

  if (req.method === 'GET' && pathname === '/api/news') {
    json(res, 200, { items: await readAdminNews() })
    return
  }

  if (req.method === 'GET' && pathname === '/api/admin/session') {
    json(res, 200, { authenticated: isAuthenticated(req) })
    return
  }

  if (req.method === 'POST' && pathname === '/api/admin/login') {
    const ip = req.socket.remoteAddress ?? 'unknown'

    if (isRateLimited(ip)) {
      json(res, 429, { error: 'Too many login attempts. Try again soon.' })
      return
    }

    const body = await readJsonBody(req)
    const validLogin =
      body.username === adminUsername && typeof body.password === 'string' && verifyPassword(body.password)

    if (!validLogin) {
      recordFailedLogin(ip)
      json(res, 401, { error: 'Invalid username or password.' })
      return
    }

    failedLogins.delete(ip)
    json(res, 200, { ok: true }, { 'Set-Cookie': createSessionCookie() })
    return
  }

  if (req.method === 'POST' && pathname === '/api/admin/logout') {
    json(res, 200, { ok: true }, { 'Set-Cookie': clearSessionCookie() })
    return
  }

  if (!isAuthenticated(req)) {
    json(res, 401, { error: 'Authentication required.' })
    return
  }

  if (req.method === 'POST' && pathname === '/api/admin/news') {
    const item = normalizeNewsItem(await readJsonBody(req))

    const validationError = validateNewsItem(item)

    if (validationError) {
      json(res, 400, { error: validationError })
      return
    }

    await saveAdminNews(item)
    json(res, 200, { items: await readAdminNews() })
    return
  }

  if (req.method === 'DELETE' && pathname === '/api/admin/news') {
    const slug = url.searchParams.get('slug')?.trim() ?? ''
    const shouldHide = url.searchParams.get('hide') === 'true'

    if (!slug) {
      json(res, 400, { error: 'News slug is required.' })
      return
    }

    await deleteAdminNews(slug, { hide: shouldHide })
    json(res, 200, { items: await readAdminNews() })
    return
  }

  if (req.method === 'DELETE' && pathname.startsWith('/api/admin/news/')) {
    const slug = decodeURIComponent(pathname.replace('/api/admin/news/', ''))

    await deleteAdminNews(slug, { hide: true })
    json(res, 200, { items: await readAdminNews() })
    return
  }

  json(res, 404, { error: 'Not found.' })
}

function serveFile(req, res, pathname) {
  const requestedPath = pathname === '/' ? '/index.html' : pathname
  const filePath = resolve(distDir, `.${requestedPath}`)
  const resolvedIndex = resolve(distDir, 'index.html')
  const hasStaticFile = filePath.startsWith(distDir) && existsSync(filePath)
  const isKnownSpaRoute =
    pathname === '/' ||
    pathname === '/news' ||
    pathname === '/admin' ||
    pathname === '/admin/docs' ||
    pathname === '/rules' ||
    pathname === '/terms' ||
    /^\/news\/[^/]+\/?$/.test(pathname)
  const safeFilePath = hasStaticFile ? filePath : resolvedIndex
  const extension = extname(safeFilePath)

  res.writeHead(hasStaticFile || isKnownSpaRoute ? 200 : 404, {
    'Content-Type': contentTypes[extension] ?? 'application/octet-stream',
  })
  createReadStream(safeFilePath).pipe(res)
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? '/', `http://${req.headers.host}`)

    if (url.pathname.startsWith('/api/')) {
      await handleApi(req, res, url)
      return
    }

    serveFile(req, res, url.pathname)
  } catch {
    json(res, 500, { error: 'Server error.' })
  }
})

server.listen(port, () => {
  console.log(`AlwiNation server running at http://127.0.0.1:${port}`)
})
