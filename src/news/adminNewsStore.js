import { newsItems as seedNewsItems, showSeedNews } from './newsData.js'

function normalizeText(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim()
}

function getLegacyBlockText(block) {
  if (typeof block === 'string') {
    return block
  }

  if (block.type === 'list') {
    return block.items.join(' ')
  }

  if (block.type === 'checklist') {
    return block.items.map((item) => item.text).join(' ')
  }

  if (block.type === 'table') {
    return [
      ...(block.headers ?? []),
      ...(block.rows ?? []).flat(),
    ].join(' ')
  }

  if (block.type === 'columns' || block.type === 'grid' || block.type === 'cards' || block.type === 'tabs' || block.type === 'accordion') {
    return block.items.map((item) => [item.title, item.text, item.meta].filter(Boolean).join(' ')).join(' ')
  }

  if (block.type === 'section' || block.type === 'container') {
    return [block.title, block.text].filter(Boolean).join(' ')
  }

  if (block.type === 'sidebar') {
    return [block.title, block.text, block.sidebar].filter(Boolean).join(' ')
  }

  if (block.type === 'quote') {
    return [block.text, block.cite].filter(Boolean).join(' ')
  }

  if (block.type === 'callout') {
    return [block.title, block.text].filter(Boolean).join(' ')
  }

  if (block.type === 'stats') {
    return block.items.map((item) => `${item.label}: ${item.value}`).join(' ')
  }

  return block.text ?? ''
}

function repairLegacySeedBody(item) {
  const seedItem = seedNewsItems.find((seed) => seed.slug === item.slug)

  if (!seedItem || !Array.isArray(item.body)) {
    return item.body
  }

  return item.body.map((block) => {
    if (!block || typeof block === 'string' || (block.type !== 'paragraph' && block.type !== 'lead')) {
      return block
    }

    const flattenedText = normalizeText(block.text)
    const matchingSeedBlock = seedItem.body.find(
      (seedBlock) =>
        typeof seedBlock === 'object' &&
        seedBlock.type !== 'paragraph' &&
        seedBlock.type !== 'lead' &&
        normalizeText(getLegacyBlockText(seedBlock)) === flattenedText,
    )

    return matchingSeedBlock ?? block
  })
}

function normalizeAdminItem(item) {
  return {
    ...item,
    img: item.img || item.imageUrl || '',
    body: repairLegacySeedBody(item),
    source: 'admin',
    deleted: Boolean(item.deleted),
  }
}

function mergeNewsItems(adminItems, includeDeleted = false) {
  const normalizedAdminItems = adminItems.map(normalizeAdminItem)
  const adminSlugs = new Set(normalizedAdminItems.map((item) => item.slug))
  const visibleAdminItems = includeDeleted
    ? normalizedAdminItems
    : normalizedAdminItems.filter((item) => !item.deleted)
  const visibleSeedItems = showSeedNews ? seedNewsItems.filter((item) => !adminSlugs.has(item.slug)) : []

  return [
    ...visibleAdminItems,
    ...visibleSeedItems,
  ]
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })
  const responseText = await response.text()
  let data = {}

  try {
    data = responseText ? JSON.parse(responseText) : {}
  } catch {
    data = {}
  }

  if (!response.ok) {
    throw new Error(data.error ?? (responseText || `Request failed with status ${response.status}.`))
  }

  return data
}

export function getAllNewsItems() {
  return mergeNewsItems([])
}

export async function loadNewsItems(options = {}) {
  try {
    const data = await requestJson('/api/news')

    return mergeNewsItems(Array.isArray(data.items) ? data.items : [], options.includeDeleted)
  } catch {
    return getAllNewsItems()
  }
}

export async function saveAdminNewsItem(item) {
  const data = await requestJson('/api/admin/news', {
    method: 'POST',
    body: JSON.stringify(normalizeAdminItem(item)),
  })

  return mergeNewsItems(Array.isArray(data.items) ? data.items : [], true)
}

export async function deleteAdminNewsItem(slug) {
  const data = await requestJson(`/api/admin/news?slug=${encodeURIComponent(slug)}`, {
    method: 'DELETE',
  })

  return mergeNewsItems(Array.isArray(data.items) ? data.items : [], true)
}

export function getNewsItemBySlug(items, slug) {
  return items.find((item) => item.slug === slug)
}

export async function loginAdmin(username, password) {
  await requestJson('/api/admin/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })

  return true
}

export async function logoutAdmin() {
  await requestJson('/api/admin/logout', { method: 'POST' })
}

export async function isAdminSessionActive() {
  try {
    const data = await requestJson('/api/admin/session')

    return Boolean(data.authenticated)
  } catch {
    return false
  }
}
