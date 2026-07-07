import { staffPage as seedStaff } from './staff.js'

// The staff page has a single editable document. Admin edits are stored as one
// override object on top of the code-defined seed above.
const STORAGE_KEY = 'alwination:staff-override'

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

function mergeStaff(override) {
  if (!override || typeof override !== 'object') {
    return { ...seedStaff }
  }
  const groups =
    Array.isArray(override.groups) && override.groups.length > 0 ? override.groups : seedStaff.groups
  return { ...seedStaff, ...override, groups }
}

// Synchronous read for first paint (seed + any local override).
export function getStaff() {
  return mergeStaff(readOverride())
}

// Returns true when the staff page currently has a stored admin override.
export function isStaffCustomized() {
  return Boolean(readOverride())
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

// Load staff for the public page. Tries the server first (if an /api/staff
// endpoint exists) and falls back to seed + local override otherwise.
export async function loadStaff() {
  try {
    const data = await requestJson('/api/staff')
    const server = data && typeof data === 'object' ? data.staff ?? data : null
    if (server && (server.groups || server.title)) {
      return mergeStaff(server)
    }
  } catch {
    // No server endpoint \u2014 use local data.
  }
  return getStaff()
}

// Persist an admin edit. Tries the server, then always mirrors locally so the
// change is visible immediately even without a backend endpoint.
export async function saveAdminStaff(staff) {
  let savedStaff = staff

  try {
    const data = await requestJson('/api/admin/staff', {
      method: 'POST',
      body: JSON.stringify({ staff }),
    })
    savedStaff = data.staff ?? staff
  } catch (error) {
    if (error.status !== 404) {
      throw error
    }
    // Server endpoint not available in local/static mode; local override still applies.
  }
  writeOverride(savedStaff)
  return getStaff()
}

// Remove the admin edit and fall back to the code-defined default.
export async function resetAdminStaff() {
  try {
    await requestJson('/api/admin/staff', { method: 'DELETE' })
  } catch (error) {
    if (error.status !== 404) {
      throw error
    }
    // Ignore missing endpoint in local/static mode.
  }
  writeOverride(null)
  return getStaff()
}
