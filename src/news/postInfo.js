// News card and hero helpers, shared by the index, the article page and its
// "More news" cards. plainText is also used by the shared rich-text renderer.
import { getOptimizedImageUrl } from '../common/imageOptimizer.js'
import { isSafeImageUrl } from '../common/safeUrls.js'

const tagClasses = { Update: 'tag-update', Announcement: 'tag-news', Community: 'tag-community', Preview: 'tag-preview' }
export const tagClass = (category) => tagClasses[category] ?? 'tag-news'

// The server's own screenshots stand in for posts without a usable image (same set as the home page).
const fallbackImages = ['/img/hub-center.webp', '/img/hub-left.webp', '/img/street-right.webp', '/img/street-center.webp', '/img/hub-right.webp', '/img/street-left.webp']
export const fallbackImage = (index = 0) => fallbackImages[index % fallbackImages.length]

// Seed posts carry a bundled AVIF; remote images go through /api/image; local paths are used as is.
export function postImage(item, width, index = 0) {
  if (item.imgAvif) return item.imgAvif
  if (typeof item.img !== 'string' || !isSafeImageUrl(item.img)) return fallbackImage(index)
  return getOptimizedImageUrl(item.img, width) || item.img
}

// Season posts get the cold grade and snow, like the home page's Season band.
export const isSeasonPost = (item) => /\bseason\b/i.test(item.title ?? '')
export const seasonNumber = (item) => (item.title ?? '').match(/\bseason\s+(\d{1,3})\b/i)?.[1] ?? ''

// Inline markup (**bold**, [text](url), `code` ...) reduced to its visible text, for labels.
export function plainText(text) {
  return String(text ?? '')
    .replace(/\[([^\]]+?)\]\(([^)]+?)\)/g, '$1')
    .replace(/\|\||\*\*|__|~~|`|\*/g, '')
    .trim()
}

// Patch notes list their feature-card titles (":::columns" blocks); other posts their highlights.
export function postHighlights(item) {
  const body = Array.isArray(item.body) ? item.body : []
  const changes = body
    .filter((block) => block?.type === 'columns' && Array.isArray(block.items))
    .flatMap((block) => block.items.map((entry) => plainText(entry.title)))
    .filter(Boolean)
  if (changes.length) return { items: changes, changes: true }
  const highlights = Array.isArray(item.highlights) ? item.highlights.map(plainText).filter(Boolean) : []
  return { items: highlights, changes: false }
}

// Closing Discord band on both news pages (CommunityBand's section shape).
export const newsDiscordBand = {
  image: '/img/hub-podium-wide.webp',
  kicker: 'Community',
  title: 'Never miss a patch note',
  lead: 'Event announcements, patch notes and staff support all happen on the AlwiNation Discord.',
  buttonLabel: 'Join our Discord',
}
