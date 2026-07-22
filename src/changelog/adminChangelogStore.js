import { changelogEntries as seedEntries, showSeedChangelog } from './changelogData.js'

function normalizeEntry(entry) {
  return {
    ...entry,
    realm: entry.realm || 'General',
    changes: Array.isArray(entry.changes) ? entry.changes : [],
    source: entry.source === 'bot' ? 'bot' : entry.source === 'seed' ? 'seed' : 'admin',
    deleted: Boolean(entry.deleted),
  }
}

function sortEntries(entries) {
  return [...entries].sort((a, b) => {
    const left = a.dateValue || ''
    const right = b.dateValue || ''

    if (left && right && left !== right) {
      return right.localeCompare(left)
    }

    return 0
  })
}

function mergeEntries(remoteEntries, includeDeleted = false) {
  const normalizedRemote = remoteEntries.map(normalizeEntry)
  const remoteSlugs = new Set(normalizedRemote.map((entry) => entry.slug))
  const visibleRemote = includeDeleted
    ? normalizedRemote.filter((entry) => showSeedChangelog || !entry.deleted)
    : normalizedRemote.filter((entry) => !entry.deleted)
  const visibleSeed = showSeedChangelog ? seedEntries.filter((entry) => !remoteSlugs.has(entry.slug)) : []

  return sortEntries([...visibleRemote, ...visibleSeed])
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

export function getAllChangelogEntries() {
  return mergeEntries([])
}

export async function loadChangelogData(options = {}) {
  try {
    const data = await requestJson('/api/changelog')

    return {
      entries: mergeEntries(Array.isArray(data.items) ? data.items : [], options.includeDeleted),
      realms: Array.isArray(data.realms) ? data.realms : [],
    }
  } catch {
    return { entries: getAllChangelogEntries(), realms: [] }
  }
}

export async function saveChangelogRealms(realms) {
  const data = await requestJson('/api/admin/changelog-realms', {
    method: 'POST',
    body: JSON.stringify({ realms }),
  })

  return Array.isArray(data.realms) ? data.realms : []
}

export async function saveAdminChangelogEntry(entry) {
  const data = await requestJson('/api/admin/changelog', {
    method: 'POST',
    body: JSON.stringify(entry),
  })

  return mergeEntries(Array.isArray(data.items) ? data.items : [], true)
}

export async function deleteAdminChangelogEntry(slug) {
  const shouldHideSeed = seedEntries.some((entry) => entry.slug === slug)
  const params = new URLSearchParams({ slug })

  if (shouldHideSeed) {
    params.set('hide', 'true')
  }

  const data = await requestJson(`/api/admin/changelog?${params.toString()}`, {
    method: 'DELETE',
  })

  return mergeEntries(Array.isArray(data.items) ? data.items : [], true)
}

export function getChangelogEntryBySlug(entries, slug) {
  return entries.find((entry) => entry.slug === slug)
}

export function getRealms(entries) {
  const realms = []

  for (const entry of entries) {
    const realm = entry.realm || 'General'

    if (!realms.includes(realm)) {
      realms.push(realm)
    }
  }

  return realms.sort((a, b) => a.localeCompare(b))
}
