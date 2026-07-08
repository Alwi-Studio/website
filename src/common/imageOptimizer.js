export function getOptimizedImageUrl(src, width) {
  if (!src || (!src.startsWith('http://') && !src.startsWith('https://'))) {
    return ''
  }

  return `/api/image?url=${encodeURIComponent(src)}&w=${width}`
}
