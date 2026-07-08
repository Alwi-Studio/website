export function isSafeUrl(value) {
  return /^(https?:\/\/|mailto:|\/)/i.test(value)
}

export function isSafeImageUrl(value) {
  return /^(https?:\/\/|\/)/i.test(value)
}
