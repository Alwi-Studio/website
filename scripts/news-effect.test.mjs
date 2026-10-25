// Unit tier: per-post news particle effect. Supabase is a fake fetch; no network or disk.
import assert from 'node:assert/strict'
import { test } from 'node:test'

// _shared.js captures these on load.
Object.assign(process.env, {
  SUPABASE_URL: 'http://supabase.fake',
  SUPABASE_SERVICE_ROLE_KEY: 'fake-service-key',
  SESSION_SECRET: 'news-effect-test-secret-at-least-32-characters',
})
const shared = await import('../api/_shared.js')
const { default: newsHandler } = await import('../api/admin/news.js')
const { normalizeNewsItem, validateNewsItem, saveAdminNews, readAdminNews, createSessionCookie } = shared

// Fake PostgREST news_posts: upsert merges the posted columns into the stored row, like
// resolution=merge-duplicates. Without the effect column it rejects writes naming it.
// jsonb keeps no key order; PostgreSQL returns shorter keys first (kind, color, amount).
const asJsonb = (value) => value && Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.length - b.length || (a < b ? -1 : 1)))
const store = { rows: new Map(), hasEffectColumn: true }
globalThis.fetch = async (url, options = {}) => {
  assert.equal(new URL(url).pathname, '/rest/v1/news_posts')
  const reply = (status, body) => new Response(JSON.stringify(body), { status })
  if (options.method === 'POST') {
    const row = JSON.parse(options.body)
    if ('effect' in row && !store.hasEffectColumn) {
      return reply(400, { code: 'PGRST204', message: "Could not find the 'effect' column of 'news_posts' in the schema cache" })
    }
    if ('effect' in row) row.effect = asJsonb(row.effect)
    store.rows.set(row.slug, { ...store.rows.get(row.slug), ...row })
    return reply(201, [store.rows.get(row.slug)])
  }
  return reply(200, [...store.rows.values()])
}

function post(effect, slug = 'winter-update') {
  const item = { id: slug, slug, title: 'Winter update', description: 'Snow.', date: 'October 2026', body: ['Hello.'] }
  return effect === undefined ? item : { ...item, effect }
}

function checked(input) {
  const item = normalizeNewsItem(input)
  return { item, error: validateNewsItem(item) }
}

test('absent and null effect stay null (Automatic)', () => {
  for (const input of [post(undefined), post(null)]) {
    const { item, error } = checked(input)
    assert.equal(error, '')
    assert.equal(item.effect, null)
  }
})

test('valid effects normalise to exactly { kind, amount, color }', () => {
  const cases = [
    [{ kind: 'fireflies', amount: 'lots', color: '#A1b2C3' }, { kind: 'fireflies', amount: 'lots', color: '#A1b2C3' }],
    [{ kind: ' petals ', amount: 'few', color: '', extra: 'x'.repeat(10000) }, { kind: 'petals', amount: 'few', color: '' }],
    [{ kind: 'none', amount: 'normal', color: '' }, { kind: 'none', amount: 'normal', color: '' }],
    [{}, { kind: 'snow', amount: 'normal', color: '' }],
    ['rain', { kind: 'rain', amount: 'normal', color: '' }], // legacy plain-string kind
  ]
  for (const [effect, expected] of cases) {
    const { item, error } = checked(post(effect))
    assert.equal(error, '', JSON.stringify(effect))
    assert.deepEqual(item.effect, expected)
  }
})

test('hostile effects are rejected with a message, never patched into a valid one', () => {
  const hostile = [
    { kind: 'lava' }, { kind: 'snow', amount: 'tons' }, { kind: 'snow', color: 'red' }, { kind: 'snow', color: '#12345' },
    { kind: 'snow', color: '#ggg000' }, { kind: 'snow', color: '#ff000099' }, { kind: 'snow', color: '#abcdefZZZ' }, { kind: 'snow'.repeat(100000) }, { kind: 'snow\0' }, { kind: 'sn\ud800ow' },
    { kind: {} }, { kind: null }, { kind: ['snow'] }, { kind: 'snow', amount: 5 }, { kind: 'snow', color: ['#ffffff'] },
    5, true, false, '', 'lava', [], [{ kind: 'snow' }],
  ]
  for (const effect of hostile) {
    const { error } = checked(post(effect))
    assert.match(error, /\S/, `accepted ${JSON.stringify(effect)?.slice(0, 80)}`)
  }
})

test('rows map effect both ways; a row without the column reads as Automatic', async () => {
  store.rows.clear()
  store.hasEffectColumn = true
  const snowy = normalizeNewsItem(post({ kind: 'leaves', amount: 'lots', color: '#ff8800' }))
  assert.deepEqual((await saveAdminNews(snowy)).effect, { kind: 'leaves', amount: 'lots', color: '#ff8800' })
  assert.deepEqual(store.rows.get('winter-update').effect, { kind: 'leaves', amount: 'lots', color: '#ff8800' })
  // Reads return the local JSON store's key order, not jsonb's (clients compare JSON text).
  assert.equal(JSON.stringify((await readAdminNews())[0].effect), '{"kind":"leaves","amount":"lots","color":"#ff8800"}')

  // Switching back to Automatic must overwrite the stored effect, not leave it in place.
  await saveAdminNews(normalizeNewsItem(post(null)))
  assert.equal(store.rows.get('winter-update').effect, null)
  assert.equal((await readAdminNews())[0].effect, null)

  store.rows.set('old-post', { id: 'old-post', slug: 'old-post', title: 'Old', body: [] }) // pre-migration row
  const old = (await readAdminNews()).find((item) => item.slug === 'old-post')
  assert.equal(old.effect, null)
})

test('writing before the migration names the column and the SQL file instead of dropping the field', async () => {
  store.rows.clear()
  store.hasEffectColumn = false
  try {
    await assert.rejects(saveAdminNews(normalizeNewsItem(post(null))),
      (error) => /'effect' column/.test(error.message) && /public\.news_posts/.test(error.message) && /database\/supabase-news\.sql/.test(error.message))
    assert.equal(store.rows.size, 0)
  } finally {
    store.hasEffectColumn = true
  }
})

test('POST /api/admin/news returns 400 for a bad effect and stores nothing', async () => {
  store.rows.clear()
  const cookie = createSessionCookie().split(';')[0]
  const invoke = async (body) => {
    const res = { statusCode: 200, setHeader() {}, end(value) { this.body = JSON.parse(value) } }
    await newsHandler({ method: 'POST', body, headers: { cookie }, query: {} }, res)
    return res
  }
  for (const effect of [{ kind: 'lava' }, { kind: {} }, 7]) {
    const res = await invoke(post(effect))
    assert.equal(res.statusCode, 400)
    assert.match(res.body.error, /\S/)
  }
  assert.equal(store.rows.size, 0)
  const ok = await invoke(post({ kind: 'hearts', amount: 'few', color: '' }))
  assert.equal(ok.statusCode, 200)
  assert.deepEqual(ok.body.items[0].effect, { kind: 'hearts', amount: 'few', color: '' })
})

test('the page shows the effect stored on a post, or snow on Season posts when it is Automatic', async () => {
  const { postEffect } = await import('../src/news/postInfo.js')
  const snow = { kind: 'snow', amount: 'normal', color: '' }
  assert.deepEqual(postEffect({ title: 'Season 6 is here', effect: null }), snow)
  assert.deepEqual(postEffect({ title: 'Season 6 is here' }), snow)
  assert.equal(postEffect({ title: 'Plain update', effect: null }), null)
  assert.equal(postEffect({ title: 'Season 6', effect: { kind: 'none', amount: 'normal', color: '' } }), null)
  assert.deepEqual(postEffect({ title: 'x', effect: { kind: 'hearts', amount: 'lots', color: '#ff00aa' } }), { kind: 'hearts', amount: 'lots', color: '#ff00aa' })
  // Stored rows are not re-validated on read; stray keys must never reach <Particles>.
  assert.deepEqual(postEffect({ title: 'x', effect: { kind: 'rain', amount: 'lots', color: '', scale: 1e9 } }), { kind: 'rain', amount: 'lots', color: '' })
})
