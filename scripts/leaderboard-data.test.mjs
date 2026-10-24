// Unit tier: the browser-side check on /api/leaderboard. Anything it lets through is
// rendered as-is, so a bad value here can crash the page. Run with `pnpm test`.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { formatValue, modeIntro, timeAgo, validateLeaderboard } from '../src/leaderboard/leaderboardData.js'

const java = '0f3c2a1b-1111-4222-8333-944455556666'
const bedrock = '00000000-0000-0000-0009-000000000001'

function sample() {
  const entry = (uuid, username, position, value) => ({ uuid, username, position, value })
  return {
    updatedAt: 1_760_000_000_000,
    modes: [
      {
        id: 'crystal',
        label: 'Crystal',
        players: 2,
        boards: [
          { label: 'Wins', format: 'number', scored: true, note: '', entries: [entry(java, 'Steve', 1, 30), entry(bedrock, '.Alex', 2, 5)] },
          { label: 'Win Rate', format: 'percent', scored: false, note: 'min 10 games', entries: [entry(java, 'Steve', 1, 0.75)] },
        ],
      },
    ],
    overall: [
      { uuid: java, username: 'Steve', rank: 1, points: 19, placements: [{ label: 'Crystal Wins', position: 1 }] },
      { uuid: bedrock, username: '.Alex', rank: 2, points: 9, placements: [] },
    ],
  }
}

test('a well-formed response passes unchanged', () => {
  const data = sample()
  assert.equal(validateLeaderboard(data), data)
})

test('malformed responses are rejected whole, not patched', () => {
  const bad = {
    'updatedAt not a number': (d) => { d.updatedAt = 'x' },
    // Finite but past the Date range: toISOString() would throw during render.
    'updatedAt past the Date range': (d) => { d.updatedAt = 1e16 },
    'updatedAt not an integer': (d) => { d.updatedAt = 1.5 },
    'mode shadowing the overall tab': (d) => { d.modes[0].id = 'overall' },
    'mode with no boards': (d) => { d.modes[0].boards = [] },
    'infinite value': (d) => { d.modes[0].boards[0].entries[0].value = Infinity },
    'unsafe integer value': (d) => { d.modes[0].boards[0].entries[0].value = Number.MAX_SAFE_INTEGER + 2 },
    'percent above 100%': (d) => { d.modes[0].boards[1].entries[0].value = 1.01 },
    'position off the board': (d) => { d.modes[0].boards[0].entries[0].position = 11 },
    'username too long': (d) => { d.overall[0].username = 'x'.repeat(33) },
    'uuid not a uuid': (d) => { d.overall[0].uuid = '../etc' },
    'placements missing': (d) => { d.overall[0].placements = null },
    'overall not a list': (d) => { d.overall = {} },
  }
  for (const [name, mutate] of Object.entries(bad)) {
    const data = sample()
    mutate(data)
    assert.throws(() => validateLeaderboard(data), /Unexpected leaderboard data/, name)
  }
  assert.throws(() => validateLeaderboard(null), /Unexpected leaderboard data/)
})

test('values, intros and ages format as the page shows them', () => {
  assert.equal(formatValue({ format: 'percent' }, 0.999), '99%')
  assert.equal(formatValue({ format: 'percent' }, 1), '100%')
  assert.equal(formatValue({ format: 'number' }, 1767), '1,767')
  assert.match(modeIntro(null, 1), /^1 player ranked/)
  assert.equal(modeIntro({ id: 'axe', label: 'Axe', players: 0 }), 'Top Axe players.')
  assert.equal(timeAgo(0, 30_000), 'just now')
  assert.equal(timeAgo(0, 5 * 60_000), '5 minutes ago')
  assert.equal(timeAgo(0, 3 * 3600_000), '3 hours ago')
  // A server clock ahead of the browser never reads as "in the future".
  assert.equal(timeAgo(10_000, 0), 'just now')
})
