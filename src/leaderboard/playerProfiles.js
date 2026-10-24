const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const text = (value, max) => typeof value === 'string' && value.trim().length > 0 && value.length <= max
const counter = (value) => Number.isSafeInteger(value) && value >= 0
const identity = (player) => player && typeof player.uuid === 'string' && uuidPattern.test(player.uuid) && text(player.username, 32)
const list = (value, max) => Array.isArray(value) ? value.slice(0, max) : []

export function isBedrock(uuid) {
  return typeof uuid === 'string' && uuid.startsWith('00000000-0000-0000-')
}

// Java UUIDs are offline IDs; Floodgate UUIDs identify Bedrock skins directly.
export function skinId(uuid, username) {
  return encodeURIComponent(isBedrock(uuid) ? uuid : username)
}

// Round down so a record with losses never reads as 100%.
export function winRate(wins, losses) {
  return wins + losses > 0 ? `${Math.floor(wins / (wins + losses) * 100)}%` : '—'
}

export function buildPlayerProfiles(data) {
  const profiles = new Map()
  for (const player of list(data?.overall, 5000)) {
    if (!identity(player)) continue
    const kits = list(player.kits, 100)
      .filter((kit) => kit && text(kit.label, 40) && ['wins', 'losses', 'kills', 'streak'].every((key) => counter(kit[key])))
      .map(({ label, wins, losses, kills, streak }) => ({ label, wins, losses, kills, streak }))
    const ffa = player.ffa && ['kills', 'deaths', 'bestStreak'].every((key) => counter(player.ffa[key]))
      ? { kills: player.ffa.kills, deaths: player.ffa.deaths, bestStreak: player.ffa.bestStreak }
      : null
    profiles.set(player.uuid, {
      uuid: player.uuid,
      username: player.username,
      rank: counter(player.rank) && player.rank > 0 ? player.rank : null,
      points: counter(player.points) ? player.points : 0,
      placements: list(player.placements, 500)
        .filter((placement) => placement && text(placement.label, 80) && counter(placement.position) && placement.position >= 1 && placement.position <= 10)
        .map(({ label, position }) => ({ label, position })),
      kits,
      ffa,
      detailsAvailable: Array.isArray(player.kits) || ffa !== null,
      boards: [],
    })
  }

  for (const mode of list(data?.modes, 50)) {
    if (!mode || typeof mode.id !== 'string' || !/^[a-z0-9_-]{1,32}$/.test(mode.id) || !text(mode.label, 40)) continue
    for (const board of list(mode.boards, 20)) {
      if (!board || !text(board.label, 40) || !['number', 'percent'].includes(board.format) || typeof board.scored !== 'boolean') continue
      for (const entry of list(board.entries, 10)) {
        if (!identity(entry) || !counter(entry.position) || entry.position < 1 || entry.position > 10 || !Number.isFinite(entry.value) || entry.value < 0 || entry.value > Number.MAX_SAFE_INTEGER || (board.format === 'percent' && entry.value > 1)) continue
        if (!profiles.has(entry.uuid)) {
          // Unscored boards do not create an overall rank or imply missing match counters are zero.
          profiles.set(entry.uuid, { uuid: entry.uuid, username: entry.username, rank: null, points: 0, placements: [], kits: [], ffa: null, detailsAvailable: false, boards: [] })
        }
        profiles.get(entry.uuid).boards.push({ modeId: mode.id, modeLabel: mode.label, label: board.label, position: entry.position, value: entry.value, format: board.format, scored: board.scored })
      }
    }
  }
  return profiles
}
