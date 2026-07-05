import { isAuthenticated, json, methodNotAllowed } from '../_shared.js'

export default function handler(req, res) {
  if (req.method !== 'GET') {
    methodNotAllowed(res, ['GET'])
    return
  }

  json(res, 200, { authenticated: isAuthenticated(req) })
}
