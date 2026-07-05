import backgroundImg from '../assets/background.webp'
import { newsItems as seedNewsItems } from './newsData.js'

function normalizeAdminItem(item) {
  return {
    ...item,
    img: item.img || item.imageUrl || backgroundImg,
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

  return [
    ...visibleAdminItems,
    ...seedNewsItems.filter((item) => !adminSlugs.has(item.slug)),
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
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.error ?? 'Request failed.')
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
  const data = await requestJson(`/api/admin/news/${encodeURIComponent(slug)}`, {
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
