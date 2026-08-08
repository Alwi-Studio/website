import {
  deleteChangelog,
  isAuthenticated,
  json,
  methodNotAllowed,
  normalizeChangelogEntry,
  readChangelog,
  readJsonBody,
  saveChangelog,
  validateChangelogEntry,
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
      const shouldHide = getQueryValue(req, 'hide') === 'true'

      if (!slug) {
        json(res, 400, { error: 'Changelog slug is required.' })
        return
      }

      await deleteChangelog(slug, { hide: shouldHide })
      json(res, 200, { items: await readChangelog() })
      return
    }

    const entry = normalizeChangelogEntry(await readJsonBody(req))
    const validationError = validateChangelogEntry(entry)

    if (validationError) {
      json(res, 400, { error: validationError })
      return
    }

    await saveChangelog(entry)
    json(res, 200, { items: await readChangelog() })
  } catch (error) {
    json(res, 500, { error: error.message })
  }
}
