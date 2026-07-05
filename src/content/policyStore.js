import { rulesPage as seedRules, termsPage as seedTerms } from './policies.js'

// Seed (code-defined) defaults. Admin edits are stored as overrides on top of these.
const seeds = { rules: seedRules, terms: seedTerms }
export const policyKeys = ['rules', 'terms']

const STORAGE_KEY = 'alwination:policy-overrides'

function readOverrides() {
  if (typeof window === 'undefined') {
    return {}
  }
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}')
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeOverrides(overrides) {
  if (typeof window === 'undefined') {
    return
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides))
  } catch {
    // Storage may be unavailable (private mode / quota). Fail quietly.
  }
}

function mergePolicy(key, override) {
  const seed = seeds[key]
  if (!override || typeof override !== 'object') {
    return { ...seed }
  }
  const sections =
    Array.isArray(override.sections) && override.sections.length > 0
      ? override.sections
      : seed.sections
  return { ...seed, ...override, sections }
}

function mergeAll(overrides) {
  return {
    rules: mergePolicy('rules', overrides.rules),
    terms: mergePolicy('terms', overrides.terms),
  }
}

// Synchronous read for first paint (seed + any local overrides).
export function getPolicies() {
  return mergeAll(readOverrides())
}

export function getPolicy(key) {
  return mergePolicy(key, readOverrides()[key])
}

// Returns true when the given policy currently has a stored admin override.
export function isPolicyCustomized(key) {
  return Boolean(readOverrides()[key])
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

// Load policies for public pages. Tries the server first (if an /api/policies
// endpoint exists) and falls back to seed + local overrides otherwise.
export async function loadPolicies() {
  try {
    const data = await requestJson('/api/policies')
    const server = data && typeof data === 'object' ? data.policies ?? data : {}
    if (server.rules || server.terms) {
      return mergeAll(server)
    }
  } catch {
    // No server endpoint — use local data.
  }
  return getPolicies()
}

// Persist an admin edit. Tries the server, then always mirrors locally so the
// change is visible immediately even without a backend endpoint.
export async function saveAdminPolicy(key, policy) {
  try {
    await requestJson('/api/admin/policies', {
      method: 'POST',
      body: JSON.stringify({ key, policy }),
    })
  } catch {
    // Server endpoint not available — local override still applies.
  }
  const overrides = readOverrides()
  overrides[key] = policy
  writeOverrides(overrides)
  return getPolicies()
}

// Remove an admin edit and fall back to the code-defined default.
export async function resetAdminPolicy(key) {
  try {
    await requestJson(`/api/admin/policies/${encodeURIComponent(key)}`, {
      method: 'DELETE',
    })
  } catch {
    // Ignore missing endpoint.
  }
  const overrides = readOverrides()
  delete overrides[key]
  writeOverrides(overrides)
  return getPolicies()
}
