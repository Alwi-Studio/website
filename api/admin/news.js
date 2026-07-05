import {
  isAuthenticated,
  json,
  methodNotAllowed,
  normalizeNewsItem,
  readAdminNews,
  readJsonBody,
  saveAdminNews,
  validateNewsItem,
} from '../_shared.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    methodNotAllowed(res, ['POST'])
    return
  }

  if (!isAuthenticated(req)) {
    json(res, 401, { error: 'Authentication required.' })
    return
  }

  try {
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
