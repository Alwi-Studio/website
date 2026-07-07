import { json, methodNotAllowed, readWiki } from './_shared.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    methodNotAllowed(res, ['GET'])
    return
  }

  try {
    json(res, 200, { wiki: await readWiki() })
  } catch (error) {
    json(res, 500, { error: error.message })
  }
}
