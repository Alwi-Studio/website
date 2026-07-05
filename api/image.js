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

function validateImageUrl(value) {
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

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.statusCode = 405
    res.setHeader('Allow', 'GET')
    res.end('Method not allowed.')
    return
  }

  try {
    const requestUrl = new URL(req.url ?? '/', `https://${req.headers.host ?? 'localhost'}`)
    const imageUrl = validateImageUrl(requestUrl.searchParams.get('url') ?? '')
    const width = getWidth(requestUrl.searchParams.get('w'))
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)

    const response = await fetch(imageUrl, {
      signal: controller.signal,
      headers: {
        Accept: 'image/avif,image/webp,image/*,*/*;q=0.8',
        'User-Agent': 'AlwiNation image optimizer',
      },
    })

    clearTimeout(timeout)

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

    const optimized = await sharp(sourceBuffer, { animated: false })
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .avif({ quality: 52, effort: 6 })
      .toBuffer()

    res.statusCode = 200
    res.setHeader('Content-Type', 'image/avif')
    res.setHeader('Content-Length', String(optimized.byteLength))
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=31536000, stale-while-revalidate=604800')
    res.end(optimized)
  } catch (error) {
    res.statusCode = 400
    res.setHeader('Cache-Control', 'no-store')
    res.end(error.message)
  }
}
