import { isAuthenticated, json, methodNotAllowed, readJsonBody, readPolicies, savePolicy } from '../_shared.js'

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
    const body = await readJsonBody(req)
    await savePolicy(body.key, body.policy)
    json(res, 200, { policies: await readPolicies() })
  } catch (error) {
    json(res, 400, { error: error.message })
  }
}
