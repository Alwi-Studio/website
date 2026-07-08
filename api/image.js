import { optimizedRemoteImage } from '../image-optimizer.mjs'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.statusCode = 405
    res.setHeader('Allow', 'GET')
    res.end('Method not allowed.')
    return
  }

  try {
    const requestUrl = new URL(req.url ?? '/', `https://${req.headers.host ?? 'localhost'}`)
    const optimized = await optimizedRemoteImage(requestUrl)

    res.statusCode = 200
    res.setHeader('Content-Type', optimized.contentType)
    res.setHeader('Content-Length', String(optimized.buffer.byteLength))
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=31536000, stale-while-revalidate=604800')
    res.end(optimized.buffer)
  } catch (error) {
    res.statusCode = 400
    res.setHeader('Cache-Control', 'no-store')
    res.end(error.message)
  }
}
