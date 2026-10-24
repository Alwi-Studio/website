// Integration tier: isolated self-host process; no project .env or production writes.
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { mkdir, mkdtemp, readFile, readdir, rm, rmdir, writeFile } from 'node:fs/promises'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { isAbsolute, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'
import { setTimeout as delay } from 'node:timers/promises'
import { defaultSite } from '../src/content/site.js'

test('self-host site defaults, authenticated atomic saves and reset', { timeout: 20000 }, async () => {
  const directory = await mkdtemp(resolve(tmpdir(), 'alwination-site-'))
  const listener = createServer()
  listener.listen(0, '127.0.0.1')
  await once(listener, 'listening')
  const port = listener.address().port
  await new Promise((done) => listener.close(done))
  const child = spawn(process.execPath, [fileURLToPath(new URL('../server.mjs', import.meta.url))], {
    cwd: directory,
    env: {
      ...process.env, PORT: String(port), NODE_ENV: 'test',
      SUPABASE_URL: '', SUPABASE_SERVICE_ROLE_KEY: '', LEADERBOARD_DATABASE_URL: '',
      ADMIN_USERNAME: 'site-test', ADMIN_PASSWORD: 'fixture-password', ADMIN_PASSWORD_HASH: '',
      SESSION_SECRET: 'local-site-test-secret-at-least-32-characters',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  let output = ''
  child.stdout.on('data', (chunk) => { output += chunk })
  child.stderr.on('data', (chunk) => { output += chunk })
  const base = `http://127.0.0.1:${port}`
  try {
    for (let attempt = 0; attempt < 100; attempt++) {
      if (output.includes('server running')) break
      assert.equal(child.exitCode, null, output)
      await delay(40)
    }
    assert.match(output, /server running/)
    let response = await fetch(`${base}/api/site`)
    assert.equal(response.status, 200)
    assert.equal(response.headers.get('cache-control'), 'no-store')
    assert.deepEqual(await response.json(), { site: defaultSite })
    response = await fetch(`${base}/api/admin/site`, { method: 'POST', body: '{bad json' })
    assert.equal(response.status, 401)
    response = await fetch(`${base}/api/admin/login`, {
      method: 'POST', body: JSON.stringify({ username: 'site-test', password: 'fixture-password' }),
    })
    assert.equal(response.status, 200)
    const cookie = response.headers.get('set-cookie').split(';')[0]
    const headers = { cookie, 'Content-Type': 'application/json' }
    const saved = structuredClone(defaultSite)
    saved.settings.serverAddress = 'test.example.org'
    saved.home.realms = saved.home.realms.slice(0, 1)
    saved.home.sections[0].enabled = false
    for (let attempt = 0; attempt < 2; attempt++) {
      response = await fetch(`${base}/api/admin/site`, { method: 'POST', headers, body: JSON.stringify({ site: saved }) })
      assert.equal(response.status, 200, await response.clone().text())
      assert.deepEqual(await response.json(), { site: saved })
    }
    assert.deepEqual(JSON.parse(await readFile(resolve(directory, 'data/site.json'), 'utf8')), saved)
    assert.deepEqual(await (await fetch(`${base}/api/site`)).json(), { site: saved })
    for (const body of ['{bad json', '{}', JSON.stringify({ site: { settings: { bedrockPort: 0 } } }), JSON.stringify({ site: {}, padding: 'x'.repeat(140000) })]) {
      response = await fetch(`${base}/api/admin/site`, { method: 'POST', headers, body })
      assert.equal(response.status, 400, await response.clone().text())
      assert.ok((await response.json()).error)
      assert.deepEqual(await (await fetch(`${base}/api/site`)).json(), { site: saved })
    }
    response = await fetch(`${base}/api/admin/site`, { method: 'DELETE', headers })
    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), { site: defaultSite })
    response = await fetch(`${base}/api/site`, { method: 'POST' })
    assert.equal(response.status, 405)
    response = await fetch(`${base}/api/admin/site`, { headers })
    assert.equal(response.status, 405)
    const variants = Array.from({ length: 8 }, (_, i) => ({ ...saved, settings: { ...saved.settings, serverAddress: `test-${i}.example.org` } }))
    const concurrent = await Promise.all(variants.map((site) => fetch(`${base}/api/admin/site`, { method: 'POST', headers, body: JSON.stringify({ site }) })))
    for (const result of concurrent) assert.equal(result.status, 200, await result.text())
    const stored = JSON.parse(await readFile(resolve(directory, 'data/site.json'), 'utf8'))
    assert.ok(variants.some((site) => site.settings.serverAddress === stored.settings.serverAddress))
    assert.deepEqual((await readdir(resolve(directory, 'data'))).filter((file) => file.endsWith('.tmp')), [])
    await writeFile(resolve(directory, 'data/site.json'), '{broken fixture')
    response = await fetch(`${base}/api/site`)
    assert.equal(response.status, 500)
    assert.ok((await response.json()).error)
    assert.equal(await readFile(resolve(directory, 'data/site.json'), 'utf8'), '{broken fixture')
    await rm(resolve(directory, 'data/site.json'))
    await mkdir(resolve(directory, 'data/site.json'))
    response = await fetch(`${base}/api/admin/site`, { method: 'POST', headers, body: JSON.stringify({ site: saved }) })
    assert.equal(response.status, 500)
    assert.deepEqual((await readdir(resolve(directory, 'data'))).filter((file) => file.endsWith('.tmp')), [])
    await rmdir(resolve(directory, 'data/site.json'))
    response = await fetch(`${base}/api/admin/site`, { method: 'POST', headers, body: JSON.stringify({ site: saved }) })
    assert.equal(response.status, 200, await response.clone().text())
    assert.deepEqual(await response.json(), { site: saved })
  } finally {
    const ended = once(child, 'exit')
    child.kill()
    if (child.exitCode === null) await ended
    // Only recursively remove the exact temporary workspace created above.
    const withinTemp = relative(resolve(tmpdir()), directory)
    assert.ok(withinTemp.startsWith('alwination-site-') && !withinTemp.startsWith('..') && !isAbsolute(withinTemp))
    await rm(directory, { recursive: true, force: true })
  }
})
