import { deletePolicy, isAuthenticated, json, methodNotAllowed, readPolicies } from '../../_shared.js'

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    methodNotAllowed(res, ['DELETE'])
    return
  }

  if (!isAuthenticated(req)) {
    json(res, 401, { error: 'Authentication required.' })
    return
  }

  const key = Array.isArray(req.query.key) ? req.query.key[0] : req.query.key

  try {
    await deletePolicy(key)
    json(res, 200, { policies: await readPolicies() })
  } catch (error) {
    json(res, 400, { error: error.message })
  }
}
