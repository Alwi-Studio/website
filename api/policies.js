import { json, methodNotAllowed, readPolicies } from './_shared.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    methodNotAllowed(res, ['GET'])
    return
  }

  try {
    json(res, 200, { policies: await readPolicies() })
  } catch (error) {
    json(res, 500, { error: error.message })
  }
}
