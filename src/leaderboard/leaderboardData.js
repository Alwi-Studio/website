// /api/leaderboard is rendered as-is after this check, so anything off rejects the
// whole response (error state) instead of being patched into something plausible.
// Limits mirror the approved mockup's validator and the API's own shape.
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const text = (value, max) => typeof value === 'string' && value.length > 0 && value.length <= max
const int = (value, low, high) => Number.isInteger(value) && value >= low && value <= high

function need(ok, what) {
  if (!ok) throw new Error(`Unexpected leaderboard data: ${what}`)
}

function needPlayer(player) {
  need(player && typeof player.uuid === 'string' && uuidPattern.test(player.uuid) && text(player.username, 32), 'player')
}

export function validateLeaderboard(data) {
  // updatedAt is bounded to the Date range: a finite value past it makes toISOString() throw during render.
  need(data && int(data.updatedAt, 0, 8.64e15) && Array.isArray(data.modes) && data.modes.length <= 50 && Array.isArray(data.overall) && data.overall.length <= 5000, 'shape')
  for (const mode of data.modes) {
    // "overall" is the built-in first tab; a mode with that id would shadow it.
    need(mode && typeof mode.id === 'string' && /^[a-z0-9_-]{1,32}$/.test(mode.id) && mode.id !== 'overall' && text(mode.label, 40) && int(mode.players, 0, 1e8) && Array.isArray(mode.boards) && mode.boards.length > 0 && mode.boards.length <= 20, 'mode')
    for (const board of mode.boards) {
      need(board && text(board.label, 40) && (board.format === 'number' || board.format === 'percent') && typeof board.scored === 'boolean' && typeof board.note === 'string' && board.note.length <= 40 && Array.isArray(board.entries) && board.entries.length <= 10, 'board')
      for (const entry of board.entries) {
        needPlayer(entry)
        // Same value bounds as buildPlayerProfiles, so every row shown has a profile to open.
        need(int(entry.position, 1, 10) && Number.isFinite(entry.value) && entry.value >= 0 && entry.value <= (board.format === 'percent' ? 1 : Number.MAX_SAFE_INTEGER), 'entry')
      }
    }
  }
  for (const player of data.overall) {
    needPlayer(player)
    need(int(player.rank, 1, 1e6) && int(player.points, 0, 1e6) && Array.isArray(player.placements) && player.placements.length <= 500, 'overall')
    for (const placement of player.placements) need(placement && text(placement.label, 80) && int(placement.position, 1, 10), 'placement')
  }
  return data
}

export const fmt = (value) => value.toLocaleString('en-US')

// Rounded down so only a record with no losses ever reads 100%.
export function formatValue(board, value) {
  return board.format === 'percent' ? `${Math.floor(value * 100)}%` : fmt(value)
}

// mode null = Overall.
export function modeIntro(mode, overallCount) {
  if (!mode) {
    return `${fmt(overallCount)} player${overallCount === 1 ? '' : 's'} ranked by points from every leaderboard. 1st place earns 10 points down to 1 point for 10th; deaths don't count.`
  }
  if (mode.id === 'ffa') return 'Top free-for-all players by kills, best kill streak, and deaths.'
  // Kits with only ranked results have no casual player count.
  return mode.players > 0 ? `The best of ${fmt(mode.players)} players who have played ${mode.label}.` : `Top ${mode.label} players.`
}

const relative = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
export function timeAgo(time, now = Date.now()) {
  const seconds = (now - time) / 1000
  if (seconds < 60) return 'just now'
  const [unit, size] = [['day', 86400], ['hour', 3600]].find(([, step]) => seconds >= step) ?? ['minute', 60]
  return relative.format(-Math.floor(seconds / size), unit)
}
