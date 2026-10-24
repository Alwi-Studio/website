import { normalizeSite } from '../../api/_site.js'
import { defaultSite } from './site.js'

// The site document (settings + home page) is owned by the server: both the
// Vercel functions and server.mjs implement /api/site and /api/admin/site, so
// unlike the staff store there is no localStorage override that could mask it.

// Server data still passes through the shared schema so a malformed or older
// document can never crash the page; anything unusable falls back to the seed.
function toSite(value) {
  try {
    return normalizeSite(value ?? {})
  } catch {
    return defaultSite
  }
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(data.error ?? 'Request failed.')
    error.status = response.status
    throw error
  }
  return data
}

// Synchronous read for first paint.
export function getSite() {
  return defaultSite
}

export async function loadSite() {
  const data = await requestJson('/api/site')
  return toSite(data.site)
}

export async function saveAdminSite(site) {
  const data = await requestJson('/api/admin/site', { method: 'POST', body: JSON.stringify({ site }) })
  return toSite(data.site)
}

export async function resetAdminSite() {
  const data = await requestJson('/api/admin/site', { method: 'DELETE' })
  return toSite(data.site)
}
