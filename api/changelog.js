import {
  json,
  methodNotAllowed,
  normalizeChangelogEntry,
  readChangelog,
  readJsonBody,
  saveChangelog,
  validateChangelogEntry,
  verifyBotApiKey,
} from './_shared.js'

// Public read + Discord-bot write.
//   GET  /api/changelog                 -> { items: [...] }  (public)
//   POST /api/changelog                 -> create/update an entry (requires CHANGELOG_API_KEY)
// The bot authenticates with the key via the `x-api-key` header or `Authorization: Bearer <key>`.
export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      json(res, 200, { items: await readChangelog() })
    } catch (error) {
      json(res, 500, { error: error.message })
    }
    return
  }

  if (req.method === 'POST') {
    if (!verifyBotApiKey(req)) {
      json(res, 401, { error: 'A valid changelog API key is required.' })
      return
    }

    try {
      const entry = normalizeChangelogEntry({ ...(await readJsonBody(req)), source: 'bot' })
      const validationError = validateChangelogEntry(entry)

      if (validationError) {
        json(res, 400, { error: validationError })
        return
      }

      const saved = await saveChangelog(entry)
      json(res, 201, { ok: true, entry: saved })
    } catch (error) {
      json(res, 500, { error: error.message })
    }
    return
  }

  methodNotAllowed(res, ['GET', 'POST'])
}
