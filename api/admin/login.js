import { createSessionCookie, getAdminUsername, json, methodNotAllowed, readJsonBody, verifyPassword } from '../_shared.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    methodNotAllowed(res, ['POST'])
    return
  }

  try {
    const body = await readJsonBody(req)
    const validLogin =
      body.username === getAdminUsername() && typeof body.password === 'string' && verifyPassword(body.password)

    if (!validLogin) {
      json(res, 401, { error: 'Invalid username or password.' })
      return
    }

    json(res, 200, { ok: true }, { 'Set-Cookie': createSessionCookie() })
  } catch {
    json(res, 400, { error: 'Invalid login request.' })
  }
}
