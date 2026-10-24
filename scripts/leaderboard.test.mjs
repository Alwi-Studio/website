// Unit tier: pure shaping of query rows into tabs and boards. Run with `pnpm test`.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { attachProfiles, shapeLeaderboard } from '../api/leaderboard.js'

// A kit-stats row as KIT_STATS_SQL returns it; ranks default to "off the board".
function kitRow(kit, uuid, stats) {
  return {
    kit,
    uuid,
    username: `name-${uuid}`,
    wins: 0,
    losses: 0,
    kills: 0,
    streak: 0,
    winsRow: 99,
    streakRow: 99,
    killsRow: 99,
    winRateRow: 99,
    players: 50,
    winners: 20,
    ...stats,
  }
}

function boardRow(scope, kitName, teamSize, typeName, position, uuid, value) {
  return { scope, kitName, teamSize, typeName, position, uuid, username: `name-${uuid}`, value }
}

function board(result, modeId, label) {
  return result.modes.find((mode) => mode.id === modeId)?.boards.find((candidate) => candidate.label === label)
}

test('kit rows fill wins, streak, kills and win rate, skipping zeros and short records', () => {
  const result = shapeLeaderboard(
    [
      kitRow('Crystal', 'b', { wins: 5, losses: 1, winsRow: 2, streakRow: 1, streak: 4, winRateRow: 1 }),
      kitRow('Crystal', 'a', { wins: 30, losses: 10, kills: 0, winsRow: 1, killsRow: 1, winRateRow: 2 }),
    ],
    [],
  )
  assert.deepEqual(board(result, 'crystal', 'Wins').entries.map((entry) => [entry.uuid, entry.position, entry.value]), [
    ['a', 1, 30],
    ['b', 2, 5],
  ])
  assert.deepEqual(board(result, 'crystal', 'Best Win Streak').entries.map((entry) => entry.uuid), ['b'])
  // a has the kills rank but no kills, b has the top win rate but only 6 games.
  assert.equal(board(result, 'crystal', 'Kills'), undefined)
  assert.deepEqual(board(result, 'crystal', 'Win Rate').entries.map((entry) => [entry.uuid, entry.value]), [['a', 0.75]])
})

test('a kit with too few winners gets no casual tab, but ranked results still show it', () => {
  const quiet = shapeLeaderboard([kitRow('forge', 'a', { wins: 3, winsRow: 1, winners: 2 })], [])
  assert.equal(quiet.modes.find((mode) => mode.id === 'forge'), undefined)

  const ranked = shapeLeaderboard(
    [kitRow('forge', 'a', { wins: 3, winsRow: 1, winners: 2 })],
    [boardRow('SOLO', 'forge', '', 'ELO', 1, 'a', 1016), boardRow('SOLO', 'forge', '', 'ELO', 2, 'b', 1000)],
  )
  const forge = ranked.modes.find((mode) => mode.id === 'forge')
  assert.deepEqual(forge.boards.map((candidate) => candidate.label), ['Ranked ELO'])
  assert.deepEqual(forge.boards[0].entries.map((entry) => entry.uuid), ['a'])
})

test('starting-ELO and zero-count filler never shows; team boards get their size label', () => {
  const result = shapeLeaderboard(
    [],
    [
      boardRow('FFA', 'FFA', '', 'KILLS', 1, 'a', 9),
      boardRow('FFA', 'FFA', '', 'KILLS', 2, 'b', 0),
      boardRow('TEAM', 'Sword', 'TWO', 'ELO', 1, 'c', 1000),
      boardRow('TEAM', 'Sword', 'THREE', 'ELO', 1, 'd', 1030),
    ],
  )
  assert.deepEqual(board(result, 'ffa', 'Kills').entries.map((entry) => entry.uuid), ['a'])
  assert.deepEqual(result.modes.find((mode) => mode.id === 'sword').boards.map((candidate) => candidate.label), ['3v3 ELO'])
})

test('overall sums placement points per uuid, skips deaths, and shares rank on ties', () => {
  const result = shapeLeaderboard(
    [kitRow('Sword', 'a', { wins: 9, winsRow: 2 }), kitRow('Sword', 'c', { wins: 10, winsRow: 1 })],
    [
      boardRow('FFA', 'FFA', '', 'DEATHS', 1, 'a', 600),
      boardRow('FFA', 'FFA', '', 'KILLS', 1, 'a', 900),
      boardRow('FFA', 'FFA', '', 'KILLS', 2, 'b', 800),
      boardRow('FFA', 'FFA', '', 'KILLS', 3, 'c', 700),
    ],
  )
  assert.deepEqual(
    result.overall.map((player) => [player.uuid, player.points, player.rank]),
    [
      ['a', 19, 1],
      ['c', 18, 2],
      ['b', 9, 3],
    ],
  )
  assert.deepEqual(result.overall[0].placements, [
    { label: 'FFA Kills', position: 1 },
    { label: 'Sword Wins', position: 2 },
  ])

  const tied = shapeLeaderboard(
    [],
    [
      boardRow('FFA', 'FFA', '', 'KILLS', 1, 'a', 30),
      boardRow('FFA', 'FFA', '', 'KILLS', 2, 'b', 20),
      boardRow('FFA', 'FFA', '', 'FFA_BEST_KILL_STREAK', 1, 'c', 9),
      boardRow('FFA', 'FFA', '', 'FFA_BEST_KILL_STREAK', 2, 'd', 8),
    ],
  )
  // a and c each top one board (10 points), b and d are second on one (9 points).
  assert.deepEqual(tied.overall.map((player) => [player.uuid, player.rank]), [['a', 1], ['c', 1], ['b', 3], ['d', 3]])
})

test('tabs are FFA first, then kits by player count', () => {
  const result = shapeLeaderboard(
    [
      kitRow('Axe', 'a', { wins: 1, winsRow: 1, players: 40 }),
      kitRow('Crystal', 'a', { wins: 1, winsRow: 1, players: 900 }),
    ],
    [boardRow('FFA', 'FFA', '', 'KILLS', 1, 'a', 5)],
  )
  assert.deepEqual(result.modes.map((mode) => mode.id), ['ffa', 'crystal', 'axe'])
})

test('profiles list played kits most-played first, FFA separately, and skip unknown players', () => {
  const zero = { wins: 0, losses: 0, kills: 0, streak: 0, ffaKills: 0, ffaDeaths: 0, ffaStreak: 0 }
  const [profile, idle] = attachProfiles(
    [{ uuid: 'a', username: 'A', points: 10, rank: 1, placements: [] }, { uuid: 'b', username: 'B', points: 1, rank: 2, placements: [] }],
    [
      { ...zero, uuid: 'a', kit: 'forge', wins: 1, losses: 0 },
      { ...zero, uuid: 'a', kit: 'Crystal', wins: 5, losses: 5, kills: 7, streak: 3 },
      { ...zero, uuid: 'a', kit: 'Axe' },
      { ...zero, uuid: 'a', kit: 'FFA', ffaKills: 12, ffaDeaths: 4, ffaStreak: 6 },
      { ...zero, uuid: 'a', kit: 'lastPlayedKit' },
      { ...zero, uuid: 'z', kit: 'Crystal', wins: 99 },
    ],
  )
  assert.deepEqual(profile.kits, [
    { label: 'Crystal', wins: 5, losses: 5, kills: 7, streak: 3 },
    { label: 'Forge', wins: 1, losses: 0, kills: 0, streak: 0 },
  ])
  assert.deepEqual(profile.ffa, { kills: 12, deaths: 4, bestStreak: 6 })
  assert.deepEqual([idle.kits, idle.ffa], [[], null])
})

test('tied values share a board position and the same points, whatever the row order', () => {
  const bedrock = '00000000-0000-0000-0009-000000000001'
  const result = shapeLeaderboard(
    [
      kitRow('Sword', 'top', { streak: 9, streakRow: 1 }),
      kitRow('Sword', bedrock, { streak: 8, streakRow: 2 }),
      kitRow('Sword', 'java', { streak: 8, streakRow: 3 }),
      kitRow('Sword', 'last', { streak: 7, streakRow: 4 }),
    ],
    [],
  )
  assert.deepEqual(
    board(result, 'sword', 'Best Win Streak').entries.map((entry) => [entry.uuid, entry.position]),
    [['top', 1], [bedrock, 2], ['java', 2], ['last', 4]],
  )
  const points = Object.fromEntries(result.overall.map((player) => [player.uuid, player.points]))
  assert.equal(points[bedrock], points.java)
})
