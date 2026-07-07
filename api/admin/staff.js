import { deleteStaff, isAuthenticated, json, methodNotAllowed, readJsonBody, readStaff, saveStaff } from '../_shared.js'

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
      await deleteStaff()
      json(res, 200, { staff: await readStaff() })
      return
    }

    const body = await readJsonBody(req)
    const staff = await saveStaff(body.staff)
    json(res, 200, { staff })
  } catch (error) {
    json(res, 400, { error: error.message })
  }
}
