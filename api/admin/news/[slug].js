import { deleteAdminNews, isAuthenticated, json, methodNotAllowed, readAdminNews } from '../../_shared.js'

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    methodNotAllowed(res, ['DELETE'])
    return
  }

  if (!isAuthenticated(req)) {
    json(res, 401, { error: 'Authentication required.' })
    return
  }

  const slug = Array.isArray(req.query.slug) ? req.query.slug[0] : req.query.slug

  if (!slug) {
    json(res, 400, { error: 'Slug is required.' })
    return
  }

  try {
    await deleteAdminNews(slug)
    json(res, 200, { items: await readAdminNews() })
  } catch (error) {
    json(res, 500, { error: error.message })
  }
}
