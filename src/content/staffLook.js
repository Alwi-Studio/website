// How a staff group looks: colour, chat tag and the picture behind its member cards.
// Shared by the API (api/_shared.js validates against it) and the browser (staff page, admin).

// Pictures a group may pick, stored as the key; the page shows /img/<key>.webp. Never a URL.
export const staffStages = [
  'street-center', 'street-lamps', 'street-path', 'street-wide', 'street-left', 'street-right',
  'hub-center', 'hub-lanterns', 'hub-left', 'hub-right', 'hub-wide', 'staff-founder',
]
export const maxStaffTagLength = 16

// Without its own settings a group's look is read from its name. Colours are Minecraft's chat
// colours: §c owner, §d admin, §b moderator, §a builder, §7 anyone else. `owner` also picks the
// group whose first member gets the founder card, so it stays name-based.
const ranks = [
  { test: /own|founder/i, owner: true, tag: 'OWNER', color: '#ff5555', stage: 'staff-founder' },
  { test: /admin/i, tag: 'ADMIN', color: '#ff55ff', stage: 'street-center' },
  { test: /mod/i, tag: 'MOD', color: '#55ffff', stage: 'street-lamps' },
  { test: /build/i, tag: 'BUILDER', color: '#55ff55', stage: 'street-path' },
]

export function rankOf(name) {
  return ranks.find((rank) => rank.test.test(name)) ?? {
    tag: String(name).toUpperCase().slice(0, maxStaffTagLength),
    color: '#aaaaaa',
    stage: 'street-wide',
  }
}

// The settings a group sets for itself, keeping only values the API accepts, in a fixed key order
// (the admin's unsaved-changes check compares JSON). The local override is never checked by a
// server, and the colour reaches CSS, so anything else is dropped here and the group stays on Auto.
export function customLook({ color, tag, stage } = {}) {
  const text = typeof tag === 'string' ? tag.trim() : ''
  return {
    ...(typeof color === 'string' && /^#[0-9a-f]{6}$/i.test(color) ? { color } : {}),
    ...(text && text.length <= maxStaffTagLength ? { tag: text } : {}),
    ...(staffStages.includes(stage) ? { stage } : {}),
  }
}
