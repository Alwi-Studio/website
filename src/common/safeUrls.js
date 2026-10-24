export function isSafeUrl(value) {
  return /^(https?:\/\/|mailto:|\/)/i.test(value)
}

export function isSafeImageUrl(value) {
  return /^(https?:\/\/|\/)/i.test(value)
}

// Site settings have a stricter contract than the legacy news URL fields.
export function isSafeSiteUrl(value) {
  if (typeof value !== 'string' || /[\s\\]/.test(value)) return false
  for (const character of value) {
    const code = character.charCodeAt(0)
    if (code < 32 || code === 127) return false
  }
  if (value.startsWith('/')) return !value.startsWith('//')
  if (!/^https:\/\//i.test(value)) return false
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && Boolean(url.hostname)
  } catch {
    return false
  }
}
