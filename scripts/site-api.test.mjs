// Integration tier: real REST requests against a local Supabase protocol fixture.
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { mkdtemp, rm } from 'node:fs/promises'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import { isAbsolute, relative, resolve } from 'node:path'
import { test } from 'node:test'
import { setTimeout as delay } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'
import { defaultSite } from '../src/content/site.js'

function invoke(handler, method, body, cookie = '', path = 'site') {
  const headers = {}
  const res = {
    statusCode: 200,
    setHeader(key, value) { headers[key.toLowerCase()] = value },
    end(value) { this.body = JSON.parse(value) },
  }
  return Promise.resolve(handler({ method, body, headers: { cookie }, query: { path: [path] } }, res))
    .then(() => ({ status: res.statusCode, body: res.body, headers }))
}

test('serverless site endpoints preserve auth, validation, defaults and Supabase failure semantics', { timeout: 20000 }, async (t) => {
  const state = { mode: 'missing', row: null, writes: 0 }
  const fixture = createServer(async (req, res) => {
    assert.equal(req.headers.apikey, 'local-fixture-service-key')
    assert.equal(req.headers.authorization, 'Bearer local-fixture-service-key')
    assert.match(req.url, /^\/rest\/v1\/site_pages\?/)
    res.setHeader('Content-Type', 'application/json')
    if (state.mode !== 'ready') {
      res.writeHead(state.mode === 'missing' ? 404 : 503)
      res.end(JSON.stringify(state.mode === 'missing'
        ? { code: 'PGRST205', message: "Could not find the table 'public.site_pages'" }
        : { message: 'Fixture database unavailable.' }))
      return
    }
    if (req.method === 'POST') {
      let body = ''
      for await (const chunk of req) body += chunk
      const row = JSON.parse(body)
      assert.equal(row.key, 'main')
      assert.ok(Number.isFinite(Date.parse(row.updated_at)))
      assert.equal(req.headers.prefer, 'resolution=merge-duplicates,return=representation')
      state.row = row
      state.writes++
    } else if (req.method === 'DELETE') {
      assert.match(req.url, /key=eq.main/)
      state.row = null
      state.writes++
    } else {
      assert.equal(req.method, 'GET')
      assert.match(req.url, /key=eq.main&select=site&limit=1/)
    }
    res.end(JSON.stringify(state.row ? [state.row] : []))
  })
  fixture.listen(0, '127.0.0.1')
  await once(fixture, 'listening')
  const env = {
    SUPABASE_URL: `http://127.0.0.1:${fixture.address().port}`,
    SUPABASE_SERVICE_ROLE_KEY: 'local-fixture-service-key',
    ADMIN_USERNAME: 'site-test', ADMIN_PASSWORD: 'fixture-password', ADMIN_PASSWORD_HASH: '',
    SESSION_SECRET: 'local-site-test-secret-at-least-32-characters',
  }
  const original = Object.fromEntries(Object.keys(env).map((key) => [key, process.env[key]]))
  Object.assign(process.env, env)
  try {
    const { default: publicHandler } = await import('../api/site.js')
    const { default: adminHandler } = await import('../api/admin/[...path].js')
    const login = await invoke(adminHandler, 'POST', { username: env.ADMIN_USERNAME, password: env.ADMIN_PASSWORD }, '', 'login')
    assert.equal(login.status, 200)
    const cookie = login.headers['set-cookie'].split(';')[0]
    await t.test('missing table reads defaults; writes explain the SQL prerequisite', async () => {
      const result = await invoke(publicHandler, 'GET')
      assert.equal(result.status, 200)
      assert.equal(result.headers['cache-control'], 'no-store')
      assert.deepEqual(result.body, { site: defaultSite })
      const save = await invoke(adminHandler, 'POST', { site: {} }, cookie)
      assert.equal(save.status, 500)
      assert.match(save.body.error, /database\/supabase-site.sql/)
    })
    state.mode = 'ready'
    await t.test('unauthenticated or tampered session is rejected before body parsing', async () => {
      for (const method of ['POST', 'DELETE']) {
        const result = await invoke(adminHandler, method, '{bad json')
        assert.equal(result.status, 401)
      }
      assert.equal((await invoke(adminHandler, 'POST', '{bad json', `${cookie}tampered`)).status, 401)
      assert.equal(state.writes, 0)
    })
    await t.test('authenticated POST roundtrips normalized data and repeated saves; DELETE resets', async () => {
      const site = structuredClone(defaultSite)
      site.home.realms = [site.home.realms[1]]
      site.home.sections[0].enabled = false
      site.settings.serverAddress = 'fixture.example.org'
      for (let attempt = 0; attempt < 2; attempt++) {
        const save = await invoke(adminHandler, 'POST', Buffer.from(JSON.stringify({ site })), cookie)
        assert.equal(save.status, 200)
        assert.deepEqual(save.body, { site })
        assert.deepEqual((await invoke(publicHandler, 'GET')).body, { site })
      }
      const reset = await invoke(adminHandler, 'DELETE', undefined, cookie)
      assert.equal(reset.status, 200)
      assert.deepEqual(reset.body, { site: defaultSite })
    })
    await t.test('invalid requests return clear 400 without any storage write', async () => {
      const before = state.writes
      for (const body of [undefined, {}, { site: null }, '{bad json', { site: { settings: { storeUrl: '//evil.test' } } },
        { site: { settings: { bedrockPort: 0 } } }, { site: { ignored: 'x'.repeat(65536) } }]) {
        const result = await invoke(adminHandler, 'POST', body ?? '', cookie)
        assert.equal(result.status, 400)
        assert.ok(result.body.error)
      }
      assert.equal(state.writes, before)
    })
    await t.test('methods are explicit and operational failures never become defaults', async () => {
      assert.equal((await invoke(publicHandler, 'POST')).status, 405)
      const method = await invoke(adminHandler, 'GET', undefined, cookie)
      assert.equal(method.status, 405)
      assert.equal(method.headers.allow, 'POST, DELETE')
      state.mode = 'down'
      const read = await invoke(publicHandler, 'GET')
      assert.equal(read.status, 500)
      assert.match(read.body.error, /database unavailable/)
      assert.equal((await invoke(adminHandler, 'POST', { site: {} }, cookie)).status, 500)
      state.mode = 'ready'
      state.row = { site: { settings: { bedrockPort: 0 } } }
      assert.equal((await invoke(publicHandler, 'GET')).status, 500)
      state.row = null
    })
    await t.test('self-host Supabase mode has the same defaults, save, reset and outage behaviour', async () => {
      const directory = await mkdtemp(resolve(tmpdir(), 'alwination-site-db-'))
      const probe = createServer()
      probe.listen(0, '127.0.0.1')
      await once(probe, 'listening')
      const port = probe.address().port
      await new Promise((done) => probe.close(done))
      const server = spawn(process.execPath, [fileURLToPath(new URL('../server.mjs', import.meta.url))], {
        cwd: directory, env: { ...process.env, ...env, PORT: String(port), NODE_ENV: 'test', LEADERBOARD_DATABASE_URL: '' },
        stdio: ['ignore', 'pipe', 'pipe'],
      })
      let output = ''
      server.stdout.on('data', (chunk) => { output += chunk })
      server.stderr.on('data', (chunk) => { output += chunk })
      const base = `http://127.0.0.1:${port}`
      const headers = { cookie, 'Content-Type': 'application/json' }
      try {
        for (let attempt = 0; attempt < 100 && !output.includes('server running'); attempt++) {
          assert.equal(server.exitCode, null, output)
          await delay(40)
        }
        assert.match(output, /server running/)
        state.mode = 'missing'
        assert.deepEqual(await (await fetch(`${base}/api/site`)).json(), { site: defaultSite })
        let response = await fetch(`${base}/api/admin/site`, { method: 'POST', headers, body: '{"site":{}}' })
        assert.equal(response.status, 500)
        assert.match((await response.json()).error, /database\/supabase-site.sql/)
        state.mode = 'ready'
        response = await fetch(`${base}/api/admin/site`, { method: 'POST', headers, body: '{"site":{"settings":{"serverAddress":"selfhost.example.org"}}}' })
        assert.equal(response.status, 200)
        assert.equal((await (await fetch(`${base}/api/site`)).json()).site.settings.serverAddress, 'selfhost.example.org')
        response = await fetch(`${base}/api/admin/site`, { method: 'DELETE', headers })
        assert.equal(response.status, 200)
        assert.deepEqual(await response.json(), { site: defaultSite })
        state.mode = 'down'
        assert.equal((await fetch(`${base}/api/site`)).status, 500)
      } finally {
        const ended = once(server, 'exit')
        server.kill()
        if (server.exitCode === null) await ended
        const withinTemp = relative(resolve(tmpdir()), directory)
        assert.ok(withinTemp.startsWith('alwination-site-db-') && !withinTemp.startsWith('..') && !isAbsolute(withinTemp))
        await rm(directory, { recursive: true, force: true })
      }
    })
    await t.test('serverless read works with no Supabase configuration', async () => {
      process.env.SUPABASE_URL = ''
      process.env.SUPABASE_SERVICE_ROLE_KEY = ''
      const { readSite } = await import('../api/_shared.js?site-no-config-test')
      assert.deepEqual(await readSite(), defaultSite)
    })
  } finally {
    for (const [key, value] of Object.entries(original)) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
    fixture.closeAllConnections()
    await new Promise((done) => fixture.close(done))
  }
})
