import {
  deleteAdminNews,
  isAuthenticated,
  json,
  methodNotAllowed,
  normalizeNewsItem,
  readAdminNews,
  readJsonBody,
  saveAdminNews,
  validateNewsItem,
} from '../_shared.js'

function getQueryValue(req, key) {
  if (typeof req.query?.[key] === 'string') {
    return req.query[key]
  }

  const url = new URL(req.url, 'http://localhost')
  return url.searchParams.get(key) ?? ''
}

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'DELETE') {
    methodNotAllowed(res, ['POST', 'DELETE'])
    return
  }

  if (!isAuthenticated(req)) {
    json(res, 401, { error: 'Authentication required.' })
    return
  }

  try {
    if (req.method === 'DELETE') {
      const slug = getQueryValue(req, 'slug').trim()

      if (!slug) {
        json(res, 400, { error: 'News slug is required.' })
        return
      }

      await deleteAdminNews(slug)
      json(res, 200, { items: await readAdminNews() })
      return
    }

    const item = normalizeNewsItem(await readJsonBody(req))
    const validationError = validateNewsItem(item)

    if (validationError) {
      json(res, 400, { error: validationError })
      return
    }

    await saveAdminNews(item)
    json(res, 200, { items: await readAdminNews() })
  } catch (error) {
    json(res, 500, { error: error.message })
  }
}
