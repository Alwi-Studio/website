// Unit tier: per-group staff look (colour, tag, card picture). Supabase is a fake fetch; no network.
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { test } from 'node:test'

// _shared.js captures these on load.
Object.assign(process.env, {
  SUPABASE_URL: 'http://supabase.fake',
  SUPABASE_SERVICE_ROLE_KEY: 'fake-service-key',
  SESSION_SECRET: 'staff-look-test-secret-at-least-32-characters',
})
const { normalizeStaff, validateStaff, saveStaff, readStaff, createSessionCookie } = await import('../api/_shared.js')
const { default: adminHandler } = await import('../api/admin/[...path].js')
const { staffPage: seed } = await import('../src/content/staff.js')
const { customLook, rankOf, staffStages } = await import('../src/content/staffLook.js')

// Fake PostgREST staff_pages: one row, replaced on upsert.
const store = { staff: null }
globalThis.fetch = async (url, options = {}) => {
  assert.equal(new URL(url).pathname, '/rest/v1/staff_pages')
  const reply = (status, body) => new Response(JSON.stringify(body), { status })
  if (options.method === 'POST') {
    store.staff = JSON.parse(options.body).staff
    return reply(201, [{ key: 'main', staff: store.staff }])
  }
  return reply(200, store.staff ? [{ staff: store.staff }] : [])
}

const member = { name: 'Alya', role: 'Moderator' }
const doc = (look) => ({ title: 'Staff', groups: [{ name: 'Moderators', members: [member], ...look }] })

function checked(input) {
  const staff = normalizeStaff(input)
  validateStaff(staff)
  return staff
}

test('valid colour, tag and picture are kept, trimmed, after name and members', () => {
  const [group] = checked(doc({ stage: ' hub-lanterns ', tag: '  SR MOD ', color: '#A1b2C3' })).groups
  assert.deepEqual(group, { name: 'Moderators', members: [member], color: '#A1b2C3', tag: 'SR MOD', stage: 'hub-lanterns' })
  assert.equal(checked(doc({ tag: 'x'.repeat(16) })).groups[0].tag, 'x'.repeat(16))
  for (const stage of staffStages) assert.equal(checked(doc({ stage })).groups[0].stage, stage)
})

test('absent or blank settings are left out of the stored group (Auto)', () => {
  for (const look of [{}, { color: '', tag: '', stage: '' }, { color: '   ', tag: ' \n\t ', stage: ' ' }, { color: undefined }]) {
    assert.deepEqual(checked(doc(look)).groups[0], { name: 'Moderators', members: [member] }, JSON.stringify(look))
  }
})

test('documents without the settings come out unchanged, and so does the seed with its own', () => {
  const plain = { ...seed, groups: seed.groups.map(({ name, members }) => ({ name, members })) }
  const staff = checked(plain)
  assert.deepEqual(staff.groups, plain.groups)
  for (const group of staff.groups) assert.deepEqual(Object.keys(group), ['name', 'members'])
  assert.deepEqual(checked(seed).groups, seed.groups)
})

test('hostile settings are rejected with a message naming the group, never patched into valid ones', () => {
  const notText = [null, 5, 0, true, false, {}, [], ['#ffffff'], ['hub-wide'], { toString: () => '#ffffff' }]
  const hostile = {
    color: [
      ...notText, 'red', '#12345', '#1234567', '#ff000099', '#abcdefZZZ', '#ggg000', 'ff0000', '#fff', 'javascript:alert(1)',
      '#ff0000;background:url(x)', 'var(--brand)', `#ff0000${' '.repeat(100)}x`, '#ff0000\0', '#ff\ud800000', 'x'.repeat(1_000_000),
    ],
    tag: [...notText, 'x'.repeat(17), `ADMIN${' '.repeat(40)}X`, 'x'.repeat(1_000_000), 'MOD\0', 'MO\ud800D'],
    stage: [
      ...notText, 'javascript:alert(1)', 'https://evil.example/x.webp', '//evil.example/x.webp', '/img/street-wide.webp', 'street-wide.webp',
      '../street-wide', '../../api/_shared', 'street-wide/../hub-wide', 'STREET-WIDE', 'lava', 'hub-podium', '__proto__', 'constructor',
      'toString', 'x'.repeat(1_000_000), 'hub-wide\0',
    ],
  }
  for (const [field, values] of Object.entries(hostile)) {
    for (const value of values) {
      const label = `${field}=${JSON.stringify(value)?.slice(0, 60)}`
      assert.throws(() => checked(doc({ [field]: value })), (error) => /"Moderators"/.test(error.message), label)
    }
  }
})

test('a group dropped for having no members does not trip the look checks', () => {
  const staff = checked({ title: 'Staff', groups: [{ name: 'Empty', members: [], color: 'red' }, { name: 'Moderators', members: [member] }] })
  assert.deepEqual(staff.groups.map((group) => group.name), ['Moderators'])
})

test('saved settings read back as the same document; clearing them removes them from storage', async () => {
  const look = { color: '#ff8800', tag: 'HELPER', stage: 'street-right' }
  const input = { ...seed, groups: [...seed.groups, { name: 'Helpers', members: [member], ...look }] }
  const saved = await saveStaff(input)
  assert.deepEqual(saved.groups.at(-1), { name: 'Helpers', members: [member], ...look })
  assert.deepEqual(await readStaff(), saved)
  assert.deepEqual(normalizeStaff(await readStaff()), saved, 'normalize is idempotent')

  await saveStaff({ ...input, groups: [...seed.groups, { name: 'Helpers', members: [member], color: '', tag: '', stage: '' }] })
  assert.deepEqual(store.staff.groups.at(-1), { name: 'Helpers', members: [member] })
})

test('POST /api/admin/staff answers 400 with the reason and stores nothing for a bad setting', async () => {
  store.staff = null
  const cookie = createSessionCookie().split(';')[0]
  const invoke = async (staff) => {
    const res = { statusCode: 200, setHeader() {}, end(value) { this.body = JSON.parse(value) } }
    await adminHandler({ method: 'POST', body: { staff }, headers: { cookie }, query: { path: ['staff'] } }, res)
    return res
  }
  for (const [look, reason] of [[{ color: 'red' }, /colour/], [{ tag: 'x'.repeat(17) }, /tag/], [{ stage: '../x' }, /picture/], [{ stage: {} }, /picture/]]) {
    const res = await invoke(doc(look))
    assert.equal(res.statusCode, 400, JSON.stringify(look))
    assert.match(res.body.error, reason)
  }
  assert.equal(store.staff, null)
  const ok = await invoke(doc({ color: '#55ff55', stage: 'hub-wide' }))
  assert.equal(ok.statusCode, 200)
  assert.deepEqual(ok.body.staff.groups[0], { name: 'Moderators', members: [member], color: '#55ff55', stage: 'hub-wide' })
})

test('every picture key is a real image under public/img', () => {
  for (const key of staffStages) assert.ok(existsSync(new URL(`../public/img/${key}.webp`, import.meta.url)), key)
})

test('the page keeps valid custom settings and ignores invalid ones from an unchecked local copy', () => {
  assert.deepEqual(customLook({ name: 'Mods', color: '#aabbcc', tag: ' SR ', stage: 'hub-left' }), { color: '#aabbcc', tag: 'SR', stage: 'hub-left' })
  assert.deepEqual(customLook({ name: 'Mods' }), {})
  for (const look of [
    { color: 'red', tag: 'x'.repeat(17), stage: '/img/hub-left.webp' },
    { color: ['#aabbcc'], tag: ['MOD'], stage: ['hub-left'] },
    { color: '#aabbcc;x', tag: '   ', stage: 'https://evil.example/x' },
    { color: null, tag: 5, stage: '__proto__' },
  ]) {
    assert.deepEqual(customLook({ name: 'Mods', ...look }), {}, JSON.stringify(look))
  }
  // Auto look still comes from the name.
  assert.equal(rankOf('Server Owners').owner, true)
  assert.deepEqual([rankOf('Moderators').tag, rankOf('Moderators').color, rankOf('Moderators').stage], ['MOD', '#55ffff', 'street-lamps'])
  assert.deepEqual([rankOf('Helpers').tag, rankOf('Helpers').stage], ['HELPERS', 'street-wide'])
  for (const name of ['Owner', 'Admins', 'Mods', 'Builders', 'Helpers']) {
    const auto = rankOf(name)
    assert.match(auto.color, /^#[0-9a-f]{6}$/)
    assert.ok(staffStages.includes(auto.stage), name)
  }
})
