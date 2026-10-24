import { defaultSite } from '../src/content/site.js'
import { isSafeSiteUrl } from '../src/common/safeUrls.js'

export class SiteValidationError extends Error {}

const maxSiteBytes = 65536
const maxRequestBytes = 128 * 1024
const sectionDefaults = new Map(defaultSite.home.sections.map((section) => [section.id, section]))

function object(value, field) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new SiteValidationError(`${field} must be an object.`)
  }
  return value
}

const particleEffects = ['snow', 'embers', 'none']

function text(value, fallback = '', max = Infinity) {
  const input = value === undefined ? fallback : value
  if (!['string', 'number', 'boolean'].includes(typeof input) || String(input).includes('\0')) {
    throw new SiteValidationError('Site text fields must contain plain text without null characters.')
  }
  const valueText = String(input).trim()
  for (const character of valueText) {
    const code = character.charCodeAt(0)
    if (character.length === 1 && code >= 0xd800 && code <= 0xdfff) {
      throw new SiteValidationError('Site text must contain valid Unicode.')
    }
  }
  const capped = valueText.slice(0, max)
  const last = capped.charCodeAt(capped.length - 1)
  return last >= 0xd800 && last <= 0xdbff ? capped.slice(0, -1) : capped
}

function bool(value, fallback = true) {
  if (value === undefined) return fallback
  if (value === true || value === 1 || value === 'true' || value === '1') return true
  if (value === false || value === 0 || value === 'false' || value === '0') return false
  throw new SiteValidationError('enabled must be a boolean.')
}

function number(value, fallback) {
  return value === undefined ? fallback : (typeof value === 'number' || typeof value === 'string') && String(value).trim() ? Number(value) : NaN
}

function list(value, fallback, field, min, max) {
  const result = value === undefined ? fallback : value
  if (!Array.isArray(result) || result.length < min || result.length > max) {
    throw new SiteValidationError(`${field} must contain ${min}–${max} items.`)
  }
  return result
}

function checkSize(site) {
  let serialized
  try {
    serialized = JSON.stringify(site)
  } catch {
    throw new SiteValidationError('Site must be a serializable JSON document under 64 KB.')
  }
  // TextEncoder, not Buffer: the browser runs this too (siteStore and the admin editors).
  if (!serialized || new TextEncoder().encode(serialized).length > maxSiteBytes) {
    throw new SiteValidationError('Site document must be under 64 KB.')
  }
  return serialized
}

function normalizeSection(input) {
  const seed = sectionDefaults.get(input.id)
  const section = {
    id: seed.id, enabled: bool(input.enabled, seed.enabled),
    kicker: text(input.kicker, seed.kicker, 60),
    title: text(input.title, seed.title, 120), lead: text(input.lead, seed.lead, 400),
  }
  switch (seed.id) {
    case 'gameplay':
      section.autoplaySeconds = number(input.autoplaySeconds, seed.autoplaySeconds)
      break
    case 'feature': {
      section.titleAccent = text(input.titleAccent, seed.titleAccent, 120)
      section.image = text(input.image, seed.image)
      section.effect = text(input.effect, seed.effect)
      section.buttonLabel = text(input.buttonLabel, seed.buttonLabel, 40)
      section.buttonHref = text(input.buttonHref, seed.buttonHref)
      const tooltip = input.tooltip === undefined ? seed.tooltip : object(input.tooltip, 'feature.tooltip')
      section.tooltip = {
        title: text(tooltip.title, seed.tooltip.title, 120),
        subtitle: text(tooltip.subtitle, seed.tooltip.subtitle, 60),
        footer: text(tooltip.footer, seed.tooltip.footer, 120),
        lines: list(tooltip.lines, seed.tooltip.lines, 'Tooltip lines', 0, 12).map((line) => {
          object(line, 'Tooltip line')
          return { name: text(line.name, '', 40), text: text(line.text, '', 300) }
        }),
      }
      break
    }
    case 'players':
      section.boards = list(input.boards, seed.boards, 'Home boards', 1, 3).map((board) => {
        object(board, 'Home board')
        return { mode: text(board.mode), label: text(board.label, '', 60), unit: text(board.unit, '', 60) }
      })
      break
    case 'join':
      section.steps = list(input.steps, seed.steps, 'Join steps', 1, 6).map((step) => {
        object(step, 'Join step')
        return { title: text(step.title, '', 120), text: text(step.text, '', 300) }
      })
      break
    case 'news':
      section.count = number(input.count, seed.count)
      break
    case 'community':
      section.image = text(input.image, seed.image)
      section.buttonLabel = text(input.buttonLabel, seed.buttonLabel, 40)
      break
  }
  return section
}

export function normalizeSite(input = {}) {
  object(input, 'Site')
  checkSize(input)
  if (input.version !== undefined && number(input.version) !== 1) throw new SiteValidationError('Unsupported site version; expected 1.')
  const settings = input.settings === undefined ? {} : object(input.settings, 'settings')
  const home = input.home === undefined ? {} : object(input.home, 'home')
  const hero = home.hero === undefined ? {} : object(home.hero, 'home.hero')
  const seed = defaultSite.settings
  const sections = []
  const seen = new Set()
  if (home.sections !== undefined && !Array.isArray(home.sections)) throw new SiteValidationError('home.sections must be an array.')
  for (const section of home.sections ?? []) {
    object(section, 'Home section')
    if (!sectionDefaults.has(section.id)) continue
    if (seen.has(section.id)) throw new SiteValidationError(`Duplicate section id: ${section.id}.`)
    seen.add(section.id)
    sections.push(normalizeSection(section))
  }
  for (const section of sectionDefaults.values()) {
    if (!seen.has(section.id)) sections.push(normalizeSection(section))
  }
  return {
    version: 1,
    settings: {
      serverAddress: text(settings.serverAddress, seed.serverAddress),
      bedrockPort: number(settings.bedrockPort, seed.bedrockPort),
      javaVersion: text(settings.javaVersion, seed.javaVersion, 60),
      discordUrl: text(settings.discordUrl, seed.discordUrl),
      discordInviteCode: text(settings.discordInviteCode, seed.discordInviteCode),
      storeUrl: text(settings.storeUrl, seed.storeUrl), statusUrl: text(settings.statusUrl, seed.statusUrl),
      youtubeUrl: text(settings.youtubeUrl, seed.youtubeUrl), tiktokUrl: text(settings.tiktokUrl, seed.tiktokUrl),
      tagline: text(settings.tagline, seed.tagline, 120), footerBlurb: text(settings.footerBlurb, seed.footerBlurb, 400),
    },
    home: {
      hero: {
        image: text(hero.image, defaultSite.home.hero.image),
        subtitle: text(hero.subtitle, defaultSite.home.hero.subtitle, 400),
        primaryLabel: text(hero.primaryLabel, defaultSite.home.hero.primaryLabel, 40),
        secondaryLabel: text(hero.secondaryLabel, defaultSite.home.hero.secondaryLabel, 40),
        effect: text(hero.effect, defaultSite.home.hero.effect),
      },
      sections,
      // Never merge arrays with the seed: removed realms must stay removed.
      realms: list(home.realms, defaultSite.home.realms, 'Realms', 1, 30).map((realm) => {
        object(realm, 'Realm')
        return {
          id: text(realm.id), enabled: bool(realm.enabled), name: text(realm.name, '', 40),
          label: text(realm.label, '', 60), color: text(realm.color), image: text(realm.image),
          badge: text(realm.badge, '', 60), description: text(realm.description, '', 300),
          linkLabel: text(realm.linkLabel, '', 40), href: text(realm.href),
        }
      }),
    },
  }
}

export function validateSite(site) {
  const serialized = checkSize(site)
  // PostgreSQL jsonb::text inserts spaces after commas and colons. Count those
  // outside strings so a document accepted here also fits the SQL constraint.
  const punctuation = serialized.replace(/"(?:[^"\\]|\\.)*"/g, '').match(/[:,]/g)?.length ?? 0
  if (new TextEncoder().encode(serialized).length + punctuation > maxSiteBytes) throw new SiteValidationError('Site document must be under 64 KB.')
  const integer = (value, min, max, field) => {
    if (!Number.isInteger(value) || value < min || value > max) throw new SiteValidationError(`${field} must be an integer from ${min} to ${max}.`)
  }
  const url = (value, field) => {
    if (!isSafeSiteUrl(value)) throw new SiteValidationError(`${field} must be a single-/ site path or an https:// URL.`)
  }
  const settings = site.settings
  if (!/^[a-z0-9.-]{3,100}$/i.test(settings.serverAddress)) throw new SiteValidationError('serverAddress must be a hostname of 3–100 characters.')
  if (!/^[A-Za-z0-9-]{2,32}$/.test(settings.discordInviteCode)) throw new SiteValidationError('discordInviteCode must contain 2–32 letters, digits or hyphens.')
  integer(settings.bedrockPort, 1, 65535, 'bedrockPort')
  for (const key of ['discordUrl', 'storeUrl', 'statusUrl', 'youtubeUrl', 'tiktokUrl']) url(settings[key], key)
  url(site.home.hero.image, 'Hero image')
  if (!particleEffects.includes(site.home.hero.effect)) throw new SiteValidationError('Hero effect must be snow, embers or none.')
  const ids = new Set()
  list(site.home.realms, [], 'Realms', 1, 30)
  for (const realm of site.home.realms) {
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(realm.id)) throw new SiteValidationError('Realm id must use lowercase letters, digits and single hyphens.')
    if (ids.has(realm.id)) throw new SiteValidationError(`Duplicate realm id: ${realm.id}.`)
    ids.add(realm.id)
    if (!realm.name) throw new SiteValidationError('Realm name is required.')
    if (!/^#[0-9a-f]{6}$/i.test(realm.color)) throw new SiteValidationError(`Realm ${realm.id} color must be a six-digit hex colour.`)
    url(realm.image, `Realm ${realm.id} image`)
    url(realm.href, `Realm ${realm.id} href`)
  }
  for (const section of site.home.sections) {
    switch (section.id) {
      case 'gameplay':
        if (section.autoplaySeconds !== 0) integer(section.autoplaySeconds, 3, 20, 'autoplaySeconds')
        break
      case 'feature':
        if (!particleEffects.includes(section.effect)) throw new SiteValidationError('Feature effect must be snow, embers or none.')
        url(section.image, 'Feature image')
        url(section.buttonHref, 'Feature buttonHref')
        list(section.tooltip.lines, [], 'Tooltip lines', 0, 12)
        break
      case 'players':
        list(section.boards, [], 'Home boards', 1, 3)
        for (const board of section.boards) {
          if (!/^[a-z0-9-]{1,32}$/.test(board.mode)) throw new SiteValidationError('Home board mode must contain 1–32 lowercase letters, digits or hyphens.')
        }
        break
      case 'join': list(section.steps, [], 'Join steps', 1, 6); break
      case 'news': integer(section.count, 1, 6, 'News count'); break
      case 'community': url(section.image, 'Community image'); break
    }
  }
}

export async function readSiteBody(req) {
  let body = req.body
  if (body === undefined) {
    const chunks = []
    let size = 0
    // Keep the socket open on a size rejection so the client receives JSON 400.
    for await (const chunk of req.iterator({ destroyOnReturn: false })) {
      size += Buffer.byteLength(chunk)
      if (size > maxRequestBytes) {
        req.resume()
        throw new SiteValidationError('Site request must be under 128 KB; the site document limit is 64 KB.')
      }
      chunks.push(chunk)
    }
    body = Buffer.concat(chunks).toString('utf8')
  }
  if (Buffer.isBuffer(body) || typeof body === 'string') {
    if (Buffer.byteLength(body) > maxRequestBytes) throw new SiteValidationError('Site request must be under 128 KB; the site document limit is 64 KB.')
    try {
      body = JSON.parse(body.toString())
    } catch {
      throw new SiteValidationError('Invalid JSON in site request.')
    }
  }
  object(body, 'Request body')
  return object(body.site, 'site')
}
