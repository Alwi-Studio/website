import sharp from 'sharp'

const maxSourceBytes = 8 * 1024 * 1024
const defaultWidth = 1200
const maxWidth = 1920

function isPrivateIpv4(hostname) {
  const parts = hostname.split('.').map((part) => Number(part))

  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return false
  }

  const [first, second] = parts

  return (
    first === 10 ||
    first === 127 ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168) ||
    (first === 169 && second === 254) ||
    first === 0
  )
}

function validateRemoteImageUrl(value) {
  let url

  try {
    url = new URL(value)
  } catch {
    throw new Error('Invalid image URL.')
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('Image URL must use HTTP or HTTPS.')
  }

  const hostname = url.hostname.toLowerCase()

  if (
    hostname === 'localhost' ||
    hostname === '::1' ||
    hostname.endsWith('.local') ||
    isPrivateIpv4(hostname)
  ) {
    throw new Error('Image host is not allowed.')
  }

  return url
}

function getWidth(value) {
  const width = Number(value)

  if (!Number.isFinite(width) || width <= 0) {
    return defaultWidth
  }

  return Math.min(Math.round(width), maxWidth)
}

async function fetchRemoteImage(imageUrl) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)

  try {
    const response = await fetch(imageUrl, {
      signal: controller.signal,
      headers: {
        Accept: 'image/png,image/webp,image/jpeg,image/*,*/*;q=0.8',
        'User-Agent': 'AlwiNation image optimizer',
      },
    })

    if (!response.ok) {
      throw new Error('Could not fetch image.')
    }

    const contentLength = Number(response.headers.get('content-length') ?? '0')

    if (contentLength > maxSourceBytes) {
      throw new Error('Image is too large.')
    }

    const sourceBuffer = Buffer.from(await response.arrayBuffer())

    if (sourceBuffer.byteLength > maxSourceBytes) {
      throw new Error('Image is too large.')
    }

    return sourceBuffer
  } finally {
    clearTimeout(timeout)
  }
}

async function convertImageToWebp(sourceBuffer, width) {
  try {
    return await sharp(sourceBuffer, { limitInputPixels: 40_000_000 })
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 78, effort: 5 })
      .toBuffer()
  } catch {
    throw new Error('Image conversion failed.')
  }
}

export async function optimizedRemoteImage(requestUrl) {
  const imageUrl = validateRemoteImageUrl(requestUrl.searchParams.get('url') ?? '')
  const width = getWidth(requestUrl.searchParams.get('w'))
  const sourceBuffer = await fetchRemoteImage(imageUrl)
  const buffer = await convertImageToWebp(sourceBuffer, width)

  return {
    buffer,
    contentType: 'image/webp',
  }
}
