import mysql from 'mysql2/promise'
import { json, methodNotAllowed } from './_shared.js'

// Public read of the Neptune practice plugin's player database. Never writes, and no
// request input reaches SQL.
//   GET /api/leaderboard -> { updatedAt, modes: [{ id, label, players, boards }], overall: [...] }
// Kit tabs rank casual stats computed here from `playerData`; FFA and ranked/team ELO come
// from the plugin's own precomputed `leaderboards` table.

const BOARD_SIZE = 10
// Win rate is only ranked for players with this many games, so a 1-0 record cannot top it.
const MIN_WIN_RATE_GAMES = 20
// A kit gets casual boards once this many players have won in it; hides dead or test kits.
const MIN_KIT_WINNERS = 10
// Neptune pads ELO boards with players who never played ranked, all on the starting rating,
// and pads counter boards with zeros. Those rows are filler, not results. A player who
// played ranked and landed back on exactly 1000 is hidden too; that is accepted.
const STARTING_ELO = 1000
// The kit query scans every player document (~1.2 s on 7.7k players), so results are
// reused for this long per warm instance however many requests arrive.
const CACHE_MS = 5 * 60_000
// After a failed load, requests share the failure this long instead of each opening a connection.
const FAILURE_CACHE_MS = 15_000
const QUERY_TIMEOUT_MS = 15_000

const teamLabels = { TWO: '2v2', THREE: '3v3', FOUR: '4v4' }
const ffaBoards = [
  { type: 'KILLS', label: 'Kills', scored: true },
  { type: 'FFA_BEST_KILL_STREAK', label: 'Best Kill Streak', scored: true },
  // Ranks the most deaths: shown, but earns no overall points.
  { type: 'DEATHS', label: 'Deaths', scored: false },
]

// One JSON parse per player: the wildcard walks kitData's members in document order and
// JSON_KEYS lists their names in that same order, so idx maps each member to its kit.
// Non-kit members (lastPlayedKit, FFA) have no casual stats and fall out on the WHERE.
// The username sits after the large match history, so it is read only for the top rows.
// The row numbers pick who fills a board and in what order; tied values then share a position
// in shapeLeaderboard, so the tie-break keys only matter at the 10th-place cut, where real
// stats (fewer losses, more wins) decide before uuid. `+ 0e0` makes the win rate a double:
// INT / INT is a DECIMAL rounded to 4 places, which would tie 100/199 with 101/201.
// max_statement_time makes MariaDB itself stop at the deadline the client gives up at.
const KIT_STATS_SQL = `
SET STATEMENT max_statement_time = ${QUERY_TIMEOUT_MS / 1000} FOR
WITH stats AS (
  SELECT p.uuid,
         JSON_VALUE(JSON_KEYS(p.data, '$.kitData'), CONCAT('$[', k.idx - 1, ']')) kit,
         k.wins, k.losses, k.kills, k.streak
  FROM playerData p,
       JSON_TABLE(p.data, '$.kitData.*' COLUMNS (
         idx FOR ORDINALITY,
         wins INT PATH '$.CASUAL_WINS' DEFAULT '0' ON EMPTY,
         losses INT PATH '$.CASUAL_LOSSES' DEFAULT '0' ON EMPTY,
         kills INT PATH '$.CASUAL_KILLS' DEFAULT '0' ON EMPTY,
         streak INT PATH '$.CASUAL_WIN_STREAK_BEST' DEFAULT '0' ON EMPTY
       )) k
  WHERE k.wins + k.losses + k.kills > 0
), ranked AS (
  SELECT stats.*,
         ROW_NUMBER() OVER (PARTITION BY kit ORDER BY wins DESC, losses, uuid) winsRow,
         ROW_NUMBER() OVER (PARTITION BY kit ORDER BY streak DESC, wins DESC, uuid) streakRow,
         ROW_NUMBER() OVER (PARTITION BY kit ORDER BY kills DESC, wins DESC, uuid) killsRow,
         ROW_NUMBER() OVER (
           PARTITION BY kit
           ORDER BY IF(wins + losses >= ?, (wins + 0e0) / (wins + losses), -1) DESC, wins + losses DESC, uuid
         ) winRateRow,
         COUNT(*) OVER (PARTITION BY kit) players,
         COUNT(CASE WHEN wins > 0 THEN 1 END) OVER (PARTITION BY kit) winners
  FROM stats
)
SELECT ranked.*, COALESCE(JSON_VALUE(p.data, '$.username'), ranked.uuid) username
FROM ranked JOIN playerData p ON p.uuid = ranked.uuid
WHERE winsRow <= ? OR streakRow <= ? OR killsRow <= ? OR winRateRow <= ?`

// Every kit each overall player has played, for the profile dialog. A primary-key lookup of
// the few hundred players on the overall list, so only their documents are parsed.
// KILLS/DEATHS/FFA_BEST_KILL_STREAK are only meaningful on the FFA member.
const PROFILE_SQL = `
SELECT p.uuid,
       JSON_VALUE(JSON_KEYS(p.data, '$.kitData'), CONCAT('$[', k.idx - 1, ']')) kit,
       k.wins, k.losses, k.kills, k.streak, k.ffaKills, k.ffaDeaths, k.ffaStreak
FROM playerData p,
     JSON_TABLE(p.data, '$.kitData.*' COLUMNS (
       idx FOR ORDINALITY,
       wins INT PATH '$.CASUAL_WINS' DEFAULT '0' ON EMPTY,
       losses INT PATH '$.CASUAL_LOSSES' DEFAULT '0' ON EMPTY,
       kills INT PATH '$.CASUAL_KILLS' DEFAULT '0' ON EMPTY,
       streak INT PATH '$.CASUAL_WIN_STREAK_BEST' DEFAULT '0' ON EMPTY,
       ffaKills INT PATH '$.KILLS' DEFAULT '0' ON EMPTY,
       ffaDeaths INT PATH '$.DEATHS' DEFAULT '0' ON EMPTY,
       ffaStreak INT PATH '$.FFA_BEST_KILL_STREAK' DEFAULT '0' ON EMPTY
     )) k
WHERE p.uuid IN (?)`

const BOARD_ROWS_SQL = `
SELECT scope, kitName, teamSize, typeName, position, uuid, username, value
FROM leaderboards
WHERE position <= ?
ORDER BY scope, kitName, FIELD(teamSize, '', 'TWO', 'THREE', 'FOUR'), position`

let cached = null

function newBoard(label, { format = 'number', scored = true, note = '' } = {}) {
  return { label, format, scored, note, entries: [] }
}

function kitLabel(kit) {
  return kit.charAt(0).toUpperCase() + kit.slice(1)
}

// Competition ranking over items already sorted best-first: equal values share a place and
// the next place skips (1, 2, 2, 4). Used for every board and for overall, so a tie never
// hands one player more points than another because of row order.
function competitionRanks(sortedItems, valueOf) {
  const ranks = []
  sortedItems.forEach((item, index) => {
    ranks.push(index > 0 && valueOf(item) === valueOf(sortedItems[index - 1]) ? ranks[index - 1] : index + 1)
  })
  return ranks
}

// Adds each overall player's per-kit stats (most played first) and FFA stats for the profile dialog.
export function attachProfiles(overall, profileRows) {
  const byUuid = new Map(overall.map((player) => [player.uuid, { ...player, kits: [], ffa: null }]))
  for (const row of profileRows) {
    const player = byUuid.get(row.uuid)
    if (!player) {
      continue
    }
    if (row.kit === 'FFA') {
      if (row.ffaKills + row.ffaDeaths > 0) {
        player.ffa = { kills: row.ffaKills, deaths: row.ffaDeaths, bestStreak: row.ffaStreak }
      }
    } else if (row.wins + row.losses + row.kills > 0) {
      player.kits.push({ label: kitLabel(row.kit), wins: row.wins, losses: row.losses, kills: row.kills, streak: row.streak })
    }
  }
  const profiles = [...byUuid.values()]
  for (const player of profiles) {
    player.kits.sort((left, right) => right.wins + right.losses - (left.wins + left.losses))
  }
  return profiles
}

export function shapeLeaderboard(kitRows, boardRows) {
  const kits = new Map()

  function kitMode(kit) {
    if (!kits.has(kit)) {
      kits.set(kit, {
        id: kit.toLowerCase(),
        label: kitLabel(kit),
        players: 0,
        winners: 0,
        casual: [
          newBoard('Wins'),
          newBoard('Best Win Streak'),
          newBoard('Kills'),
          newBoard('Win Rate', { format: 'percent', note: `${MIN_WIN_RATE_GAMES}+ games` }),
        ],
        ranked: [],
      })
    }
    return kits.get(kit)
  }

  for (const row of kitRows) {
    const mode = kitMode(row.kit)
    mode.players = row.players
    mode.winners = row.winners
    const [wins, streak, kills, winRate] = mode.casual
    const player = { uuid: row.uuid, username: row.username }
    const games = row.wins + row.losses

    // `position` holds the SQL row number until the boards are ranked below.
    if (row.winsRow <= BOARD_SIZE && row.wins > 0) {
      wins.entries.push({ ...player, position: row.winsRow, value: row.wins })
    }
    if (row.streakRow <= BOARD_SIZE && row.streak > 0) {
      streak.entries.push({ ...player, position: row.streakRow, value: row.streak })
    }
    if (row.killsRow <= BOARD_SIZE && row.kills > 0) {
      kills.entries.push({ ...player, position: row.killsRow, value: row.kills })
    }
    if (row.winRateRow <= BOARD_SIZE && games >= MIN_WIN_RATE_GAMES) {
      winRate.entries.push({ ...player, position: row.winRateRow, value: row.wins / games })
    }
  }

  const ffa = { id: 'ffa', label: 'FFA', players: 0, boards: ffaBoards.map((board) => newBoard(board.label, board)) }
  for (const row of boardRows) {
    const entry = { position: row.position, uuid: row.uuid, username: row.username, value: row.value }
    if (row.scope === 'FFA') {
      const index = ffaBoards.findIndex((board) => board.type === row.typeName)
      if (index !== -1 && row.value > 0) {
        ffa.boards[index].entries.push(entry)
      }
    } else if (row.typeName === 'ELO' && row.value !== STARTING_ELO) {
      // Rows arrive ordered by kit, then solo/2v2/3v3/4v4, then position.
      const mode = kitMode(row.kitName)
      const label = row.scope === 'TEAM' ? `${teamLabels[row.teamSize] ?? row.teamSize} ELO` : 'Ranked ELO'
      if (mode.ranked.at(-1)?.label !== label) {
        mode.ranked.push(newBoard(label))
      }
      mode.ranked.at(-1).entries.push(entry)
    }
  }

  const kitModes = [...kits.values()]
    .map((kit) => ({
      id: kit.id,
      label: kit.label,
      players: kit.players,
      boards: [...(kit.winners >= MIN_KIT_WINNERS ? kit.casual : []), ...kit.ranked],
    }))
    .sort((left, right) => right.players - left.players)

  // A board with no real results is hidden, and so is a tab with no boards left.
  const modes = [ffa, ...kitModes]
    .map((mode) => ({
      ...mode,
      boards: mode.boards
        .filter((board) => board.entries.length > 0)
        .map((board) => {
          const entries = board.entries.sort((left, right) => left.position - right.position)
          const positions = competitionRanks(entries, (entry) => entry.value)
          return { ...board, entries: entries.map((entry, index) => ({ ...entry, position: positions[index] })) }
        }),
    }))
    .filter((mode) => mode.boards.length > 0)

  const players = new Map()
  for (const mode of modes) {
    for (const board of mode.boards.filter((candidate) => candidate.scored)) {
      for (const entry of board.entries) {
        if (!players.has(entry.uuid)) {
          players.set(entry.uuid, { uuid: entry.uuid, username: entry.username, points: 0, placements: [] })
        }
        const player = players.get(entry.uuid)
        player.points += BOARD_SIZE + 1 - entry.position
        player.placements.push({ label: `${mode.label} ${board.label}`, position: entry.position })
      }
    }
  }

  const overall = [...players.values()].sort(
    (left, right) => right.points - left.points || left.username.localeCompare(right.username),
  )
  const ranks = competitionRanks(overall, (player) => player.points)
  overall.forEach((player, index) => {
    player.rank = ranks[index]
    player.placements.sort((left, right) => left.position - right.position)
  })

  return { modes, overall }
}

async function queryLeaderboard() {
  const databaseUrl = process.env.LEADERBOARD_DATABASE_URL
  if (!databaseUrl) {
    throw new Error('Missing LEADERBOARD_DATABASE_URL; set it to mysql://user:password@host:port/database and restart.')
  }

  // Accept the JDBC form the plugin config uses as well as a plain mysql:// URL.
  const connection = await mysql.createConnection({ uri: databaseUrl.replace(/^jdbc:/, ''), connectTimeout: 8000 })
  let leaderboard
  let profileRows = []
  try {
    const [kitRows] = await connection.query({ sql: KIT_STATS_SQL, timeout: QUERY_TIMEOUT_MS }, [
      MIN_WIN_RATE_GAMES,
      BOARD_SIZE,
      BOARD_SIZE,
      BOARD_SIZE,
      BOARD_SIZE,
    ])
    const [boardRows] = await connection.query({ sql: BOARD_ROWS_SQL, timeout: QUERY_TIMEOUT_MS }, [BOARD_SIZE])
    leaderboard = shapeLeaderboard(kitRows, boardRows)
    // `IN ()` is invalid SQL, so an empty overall list skips the lookup.
    if (leaderboard.overall.length > 0) {
      ;[profileRows] = await connection.query({ sql: PROFILE_SQL, timeout: QUERY_TIMEOUT_MS }, [
        leaderboard.overall.map((player) => player.uuid),
      ])
    }
  } catch (error) {
    connection.destroy()
    throw error
  }
  await connection.end()
  return { updatedAt: Date.now(), modes: leaderboard.modes, overall: attachProfiles(leaderboard.overall, profileRows) }
}

function loadLeaderboard() {
  if (!cached || Date.now() > cached.expiresAt) {
    const pending = queryLeaderboard()
    const entry = { expiresAt: Date.now() + CACHE_MS, pending }
    cached = entry
    // Concurrent requests share the in-flight query; a failure is kept briefly, then retried.
    pending.catch(() => {
      entry.expiresAt = Date.now() + FAILURE_CACHE_MS
    })
  }
  return cached.pending
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    methodNotAllowed(res, ['GET'])
    return
  }

  try {
    json(res, 200, await loadLeaderboard(), {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    })
  } catch (error) {
    // Driver errors name the database host and user; keep them in the server log only.
    console.error('Leaderboard query failed:', error)
    json(res, 503, { error: 'The leaderboard is unavailable right now.' }, { 'Cache-Control': 'public, s-maxage=15' })
  }
}
