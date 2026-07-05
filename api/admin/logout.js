import { clearSessionCookie, json, methodNotAllowed } from '../_shared.js'

export default function handler(req, res) {
  if (req.method !== 'POST') {
    methodNotAllowed(res, ['POST'])
    return
  }

  json(res, 200, { ok: true }, { 'Set-Cookie': clearSessionCookie() })
}
