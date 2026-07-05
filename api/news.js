import { json, methodNotAllowed, readAdminNews } from './_shared.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    methodNotAllowed(res, ['GET'])
    return
  }

  try {
    json(res, 200, { items: await readAdminNews() })
  } catch (error) {
    json(res, 500, { error: error.message })
  }
}
