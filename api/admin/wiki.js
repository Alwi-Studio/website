import { deleteWiki, isAuthenticated, json, methodNotAllowed, readJsonBody, readWiki, saveWiki } from '../_shared.js'

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
      await deleteWiki()
      json(res, 200, { wiki: await readWiki() })
      return
    }

    const body = await readJsonBody(req)
    const wiki = await saveWiki(body.wiki)
    json(res, 200, { wiki })
  } catch (error) {
    json(res, 400, { error: error.message })
  }
}
