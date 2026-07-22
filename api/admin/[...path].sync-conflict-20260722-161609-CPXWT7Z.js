import {
  clearSessionCookie,
  createSessionCookie,
  deleteAdminNews,
  deleteChangelog,
  deletePolicy,
  deleteStaff,
  deleteWiki,
  getAdminUsername,
  isAuthenticated,
  json,
  methodNotAllowed,
  normalizeChangelogEntry,
  normalizeNewsItem,
  readAdminNews,
  readChangelog,
  readChangelogRealms,
  readJsonBody,
  saveChangelogRealms,
  readPolicies,
  readStaff,
  readWiki,
  saveAdminNews,
  saveChangelog,
  savePolicy,
  saveStaff,
  saveWiki,
  validateChangelogEntry,
  validateNewsItem,
  verifyPassword,
} from '../_shared.js'

function getPathParts(req) {
  if (Array.isArray(req.query.path)) {
    return req.query.path
  }

  if (typeof req.query.path === 'string') {
    return req.query.path.split('/').filter(Boolean).map(decodeURIComponent)
  }

  const pathname = new URL(req.url, 'http://localhost').pathname
  return pathname.replace(/^\/api\/admin\/?/, '').split('/').filter(Boolean).map(decodeURIComponent)
}

async function handleLogin(req, res) {
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

function handleLogout(req, res) {
  if (req.method !== 'POST') {
    methodNotAllowed(res, ['POST'])
    return
  }

  json(res, 200, { ok: true }, { 'Set-Cookie': clearSessionCookie() })
}

function handleSession(req, res) {
  if (req.method !== 'GET') {
    methodNotAllowed(res, ['GET'])
    return
  }

  json(res, 200, { authenticated: isAuthenticated(req) })
}

async function handleNews(req, res, slug) {
  if (!slug && req.method !== 'POST') {
    methodNotAllowed(res, ['POST'])
    return
  }

  if (slug && req.method !== 'DELETE') {
    methodNotAllowed(res, ['DELETE'])
    return
  }

  try {
    if (slug) {
      await deleteAdminNews(slug, { hide: true })
      json(res, 200, { items: await readAdminNews() })
      return
    }

    const item = normalizeNewsItem(await readJsonBody(req))
    const validationError = validateNewsItem(item)

    if (validationError) {
      json(res, 400, { error: validationError })
      return
    }

    await saveAdminNews(item)
    json(res, 200, { items: await readAdminNews() })
  } catch (error) {
    json(res, 500, { error: error.message })
  }
}

async function handleChangelog(req, res, slug) {
  if (!slug && req.method !== 'POST') {
    methodNotAllowed(res, ['POST'])
    return
  }

  if (slug && req.method !== 'DELETE') {
    methodNotAllowed(res, ['DELETE'])
    return
  }

  try {
    if (slug) {
      await deleteChangelog(slug, { hide: true })
      json(res, 200, { items: await readChangelog() })
      return
    }

    const entry = normalizeChangelogEntry(await readJsonBody(req))
    const validationError = validateChangelogEntry(entry)

    if (validationError) {
      json(res, 400, { error: validationError })
      return
    }

    await saveChangelog(entry)
    json(res, 200, { items: await readChangelog() })
  } catch (error) {
    json(res, 500, { error: error.message })
  }
}

async function handlePolicies(req, res, key) {
  if (!key && req.method !== 'POST') {
    methodNotAllowed(res, ['POST'])
    return
  }

  if (key && req.method !== 'DELETE') {
    methodNotAllowed(res, ['DELETE'])
    return
  }

  try {
    if (key) {
      await deletePolicy(key)
      json(res, 200, { policies: await readPolicies() })
      return
    }

    const body = await readJsonBody(req)
    await savePolicy(body.key, body.policy)
    json(res, 200, { policies: await readPolicies() })
  } catch (error) {
    json(res, 400, { error: error.message })
  }
}

async function handleStaff(req, res) {
  if (req.method !== 'POST' && req.method !== 'DELETE') {
    methodNotAllowed(res, ['POST', 'DELETE'])
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

async function handleWiki(req, res) {
  if (req.method !== 'POST' && req.method !== 'DELETE') {
    methodNotAllowed(res, ['POST', 'DELETE'])
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

export default async function handler(req, res) {
  const [resource, id] = getPathParts(req)

  if (resource === 'login') {
    await handleLogin(req, res)
    return
  }

  if (resource === 'logout') {
    handleLogout(req, res)
    return
  }

  if (resource === 'session') {
    handleSession(req, res)
    return
  }

  if (!isAuthenticated(req)) {
    json(res, 401, { error: 'Authentication required.' })
    return
  }

  if (resource === 'news') {
    await handleNews(req, res, id)
    return
  }

  if (resource === 'changelog') {
    await handleChangelog(req, res, id)
    return
  }

  if (resource === 'policies') {
    await handlePolicies(req, res, id)
    return
  }

  if (resource === 'staff') {
    await handleStaff(req, res)
    return
  }

  if (resource === 'wiki') {
    await handleWiki(req, res)
    return
  }

  json(res, 404, { error: 'Not found.' })
}
