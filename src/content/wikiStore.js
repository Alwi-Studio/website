import { wikiPage as seedWiki } from './wiki.js'

// The wiki is a single editable document made of categories ("realms"), each
// holding a list of articles. Admin edits are stored as one override object on
// top of the code-defined seed above.
const STORAGE_KEY = 'alwination:wiki-override'

function readOverride() {
  if (typeof window === 'undefined') {
    return null
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return null
    }
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

function writeOverride(value) {
  if (typeof window === 'undefined') {
    return
  }
  try {
    if (value === null) {
      window.localStorage.removeItem(STORAGE_KEY)
    } else {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
    }
  } catch {
    // Storage may be unavailable (private mode / quota). Fail quietly.
  }
}

function mergeWiki(override) {
  if (!override || typeof override !== 'object') {
    return { ...seedWiki }
  }
  const categories =
    Array.isArray(override.categories) && override.categories.length > 0
      ? override.categories
      : seedWiki.categories
  return { ...seedWiki, ...override, categories }
}

// Synchronous read for first paint (seed + any local override).
export function getWiki() {
  return mergeWiki(readOverride())
}

// Returns true when the wiki currently has a stored admin override.
export function isWikiCustomized() {
  return Boolean(readOverride())
}

// Find an article (and its category) by slug across all categories.
export function getWikiArticle(wiki, slug) {
  const categories = wiki?.categories ?? []
  for (const category of categories) {
    const article = (category.articles ?? []).find((item) => item.slug === slug)
    if (article) {
      return { article, category }
    }
  }
  return null
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.error ?? 'Request failed.')
  }
  return data
}

// Load wiki for the public page. Tries the server first (if an /api/wiki endpoint
// exists) and falls back to seed + local override otherwise.
export async function loadWiki() {
  try {
    const data = await requestJson('/api/wiki')
    const server = data && typeof data === 'object' ? data.wiki ?? data : null
    if (server && (server.categories || server.title)) {
      return mergeWiki(server)
    }
  } catch {
    // No server endpoint \u2014 use local data.
  }
  return getWiki()
}

// Persist an admin edit. Tries the server, then always mirrors locally so the
// change is visible immediately even without a backend endpoint.
export async function saveAdminWiki(wiki) {
  try {
    await requestJson('/api/admin/wiki', {
      method: 'POST',
      body: JSON.stringify({ wiki }),
    })
  } catch {
    // Server endpoint not available \u2014 local override still applies.
  }
  writeOverride(wiki)
  return getWiki()
}

// Remove the admin edit and fall back to the code-defined default.
export async function resetAdminWiki() {
  try {
    await requestJson('/api/admin/wiki', { method: 'DELETE' })
  } catch {
    // Ignore missing endpoint.
  }
  writeOverride(null)
  return getWiki()
}
