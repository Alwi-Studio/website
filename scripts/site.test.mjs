// Unit tier: site schema and substitutions. No network or storage.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { normalizeSite, validateSite, SiteValidationError } from '../api/_shared.js'
import { defaultSite, fillSitePlaceholders } from '../src/content/site.js'
import { isSafeSiteUrl } from '../src/common/safeUrls.js'

function checked(input) {
  const site = normalizeSite(input)
  validateSite(site)
  return site
}

function changeSection(id, fields) {
  return { home: { sections: [{ id, ...fields }] } }
}

test('site normalization fills fresh defaults and drops unknown keys at every level', () => {
  assert.deepEqual(checked({}), defaultSite)
  const dirty = structuredClone(defaultSite)
  for (const value of [dirty, dirty.settings, dirty.home, dirty.home.hero, ...dirty.home.realms,
    ...dirty.home.sections, dirty.home.sections[1].tooltip, ...dirty.home.sections[1].tooltip.lines,
    ...dirty.home.sections[2].boards, ...dirty.home.sections[3].steps]) value.unknown = 'drop'
  dirty.home.sections.push({ id: 'unknown', title: 'drop' })
  assert.deepEqual(checked(dirty), defaultSite)
  const normalized = checked()
  normalized.home.realms[0].name = 'changed'
  normalized.home.sections[1].tooltip.lines[0].text = 'changed'
  assert.deepEqual(checked(), defaultSite)
})

test('site preserves stored section order, hidden sections and intentional realm deletion', () => {
  const site = checked({ home: {
    sections: [{ id: 'news', enabled: 'false', count: '6' }, { id: 'gameplay', enabled: 0, autoplaySeconds: '0' }],
    realms: [{ ...defaultSite.home.realms[0], enabled: '0' }],
  } })
  assert.deepEqual(site.home.sections.map((section) => section.id), ['news', 'gameplay', 'feature', 'players', 'join', 'community'])
  assert.equal(site.home.sections[0].enabled, false)
  assert.equal(site.home.sections[0].count, 6)
  assert.equal(site.home.sections[1].autoplaySeconds, 0)
  assert.equal(site.home.realms.length, 1)
  assert.equal(site.home.realms[0].enabled, false)
})

test('site trims text, caps each field category and coerces numeric settings', () => {
  const site = checked({ settings: { bedrockPort: '65535', serverAddress: ' test.example.org ' }, home: {
    hero: { subtitle: 's'.repeat(450), primaryLabel: 'b'.repeat(50) },
    realms: [{ ...defaultSite.home.realms[0], name: `  ${'n'.repeat(50)}  `, label: 'l'.repeat(70), description: 'd'.repeat(400), linkLabel: 'b'.repeat(50) }],
    sections: [{ id: 'gameplay', title: 't'.repeat(130), lead: 'l'.repeat(450) }],
  } })
  assert.equal(site.settings.bedrockPort, 65535)
  assert.equal(site.settings.serverAddress, 'test.example.org')
  assert.equal(site.home.realms[0].name.length, 40)
  assert.equal(site.home.realms[0].label.length, 60)
  assert.equal(site.home.realms[0].description.length, 300)
  assert.equal(site.home.realms[0].linkLabel.length, 40)
  assert.equal(site.home.hero.subtitle.length, 400)
  assert.equal(site.home.hero.primaryLabel.length, 40)
  assert.equal(site.home.sections[0].title.length, 120)
  assert.equal(site.home.sections[0].lead.length, 400)
})

test('site rejects unsafe URLs in every image and link field', () => {
  const setters = [
    (site, url) => { site.home.hero.image = url },
    (site, url) => { site.home.realms[0].image = url },
    (site, url) => { site.home.realms[0].href = url },
    (site, url) => { site.home.sections[1].image = url },
    (site, url) => { site.home.sections[1].buttonHref = url },
    (site, url) => { site.home.sections[5].image = url },
    ...['discordUrl', 'storeUrl', 'statusUrl', 'youtubeUrl', 'tiktokUrl'].map((key) => (site, url) => { site.settings[key] = url }),
  ]
  for (const url of ['javascript:alert(1)', '//evil.example', 'http://example.org', 'data:image/png;base64,AA', '/\\evil.example', '/\n/evil.example', 'https://', 'https://bad host']) {
    for (const set of setters) {
      const site = structuredClone(defaultSite)
      set(site, url)
      assert.throws(() => checked(site), SiteValidationError, url)
    }
  }
  for (const url of ['/img/test.webp', '/news/a?x=1#title', 'https://example.org/image.webp']) assert.equal(isSafeSiteUrl(url), true)
})

test('site rejects bad colour, duplicate or malformed ids, empty and oversized realm lists', () => {
  for (const fields of [{ color: '#fff' }, { color: 'red;display:none' }, { id: 'Bad_ID' }, { id: 'two--hyphens' }, { name: '' }]) {
    assert.throws(() => checked({ home: { realms: [{ ...defaultSite.home.realms[0], ...fields }] } }), SiteValidationError)
  }
  assert.throws(() => checked({ home: { realms: [defaultSite.home.realms[0], defaultSite.home.realms[0]] } }), /Duplicate realm/)
  for (const count of [0, 31]) {
    assert.throws(() => checked({ home: { realms: Array.from({ length: count }, (_, i) => ({ ...defaultSite.home.realms[0], id: `realm-${i}` })) } }), /Realms/)
  }
  const thirty = checked({ home: { realms: Array.from({ length: 30 }, (_, i) => ({ ...defaultSite.home.realms[0], id: `realm-${i}` })) } })
  assert.equal(thirty.home.realms.length, 30)
  assert.throws(() => checked({ home: { sections: [{ id: 'news' }, { id: 'news' }] } }), /Duplicate section/)
})

test('site rejects all numeric and collection boundaries without clamping', () => {
  for (const bedrockPort of [0, -1, 65536, 1.5, '', null, true, 'no']) assert.throws(() => checked({ settings: { bedrockPort } }), /bedrockPort/)
  for (const bedrockPort of [1, 65535]) assert.equal(checked({ settings: { bedrockPort } }).settings.bedrockPort, bedrockPort)
  for (const autoplaySeconds of [-1, 1, 2, 21, 3.5]) assert.throws(() => checked(changeSection('gameplay', { autoplaySeconds })), /autoplaySeconds/)
  for (const count of [0, 7, 1.5]) assert.throws(() => checked(changeSection('news', { count })), /News count/)
  assert.throws(() => checked(changeSection('feature', { tooltip: { lines: Array(13).fill({}) } })), /Tooltip lines/)
  assert.equal(checked(changeSection('feature', { tooltip: { lines: [] } })).home.sections[0].tooltip.lines.length, 0)
  assert.throws(() => checked(changeSection('feature', { effect: 'rain' })), /effect/)
  assert.throws(() => checked({ home: { hero: { effect: 'rain' } } }), /Hero effect/)
  assert.equal(checked({ home: { hero: { effect: 'snow' } } }).home.hero.effect, 'snow')
  // Documents saved before the hero had an effect keep the embers.
  assert.equal(checked({ home: { hero: { subtitle: 'Hi' } } }).home.hero.effect, 'embers')
  for (const steps of [[], Array(7).fill({})]) assert.throws(() => checked(changeSection('join', { steps })), /Join steps/)
  for (const boards of [[], Array(4).fill({}), [{ mode: 'bad_mode' }], [{ mode: 'a'.repeat(33) }]]) assert.throws(() => checked(changeSection('players', { boards })), SiteValidationError)
  for (const serverAddress of ['ab', 'x'.repeat(101), 'a:25565']) assert.throws(() => checked({ settings: { serverAddress } }), /serverAddress/)
  for (const discordInviteCode of ['x', 'a'.repeat(33), 'bad/code']) assert.throws(() => checked({ settings: { discordInviteCode } }), /discordInviteCode/)
})

test('site rejects oversize input before dropping unknown fields or truncating text', () => {
  assert.throws(() => checked({ ignored: 'x'.repeat(65536) }), /64 KB/)
  assert.throws(() => checked({ settings: { footerBlurb: '雪'.repeat(23000) } }), /64 KB/)
  const realms = Array.from({ length: 30 }, (_, i) => ({
    ...defaultSite.home.realms[0], id: `realm-${i}`, image: `https://example.org/${'a'.repeat(1900)}`,
  }))
  assert.throws(() => checked({ home: { realms } }), /64 KB/)
})

test('site rejects malformed structures and unsupported versions', () => {
  for (const input of [null, [], 'text', { version: 2 }, { settings: null }, { home: { realms: null } },
    { home: { hero: [] } }, { home: { sections: [null] } }, { home: { sections: {} } },
    { home: { sections: [{ id: 'news', enabled: 'maybe' }] } }, { settings: { tagline: {} } }]) {
    assert.throws(() => checked(input), SiteValidationError)
  }
})

test('site text stays valid Unicode at truncation boundaries and rejects malformed storage text', () => {
  const name = 'a'.repeat(39) + '😀'
  const realm = checked({ home: { realms: [{ ...defaultSite.home.realms[0], name }] } }).home.realms[0]
  assert.equal(Buffer.from(realm.name, 'utf8').toString('utf8'), realm.name)
  assert.ok(realm.name.length <= 40)
  for (const tagline of ['bad\0text', 'bad\ud800text', 'bad\udc00text']) {
    assert.throws(() => checked({ settings: { tagline } }), SiteValidationError)
  }
})

test('site placeholders substitute only the three known keys, once, as plain text', () => {
  assert.equal(fillSitePlaceholders('{serverAddress}:{bedrockPort} {javaVersion} {unknown} {constructor}'), 'play.alwination.id:19132 1.21.11 {unknown} {constructor}')
  assert.equal(fillSitePlaceholders('{serverAddress}', { serverAddress: '{bedrockPort}', bedrockPort: 123 }), '{bedrockPort}')
  assert.equal(fillSitePlaceholders('<b>{serverAddress}</b>', { serverAddress: '<script>' }), '<b><script></b>')
})

test('site checks run without Node globals, as they do in the browser', () => {
  // siteStore and the admin editors run normalizeSite/validateSite in the browser,
  // where Buffer does not exist; using it there made every page fall back to the seed.
  const nodeBuffer = globalThis.Buffer
  delete globalThis.Buffer
  try {
    assert.doesNotThrow(() => checked(defaultSite))
    assert.throws(() => checked({ settings: { serverName: 'x'.repeat(70_000) } }), SiteValidationError)
  } finally {
    globalThis.Buffer = nodeBuffer
  }
})
