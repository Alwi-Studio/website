// Unit tier: profiles include every displayed player without changing ranking rules.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { buildPlayerProfiles, isBedrock, skinId, winRate } from '../src/leaderboard/playerProfiles.js'

const java = 'b5fc9338-5a39-46ac-8212-0ff9441162db'
const bedrock = '00000000-0000-0000-0009-000000000001'

function leaderboard() {
  return {
    overall: [{ uuid: java, username: 'RankedPlayer', rank: 1, points: 10, placements: [{ label: 'FFA Kills', position: 1 }], kits: [{ label: 'Sword', wins: 5, losses: 2, kills: 8, streak: 3 }], ffa: { kills: 50, deaths: 4, bestStreak: 9 } }],
    modes: [{ id: 'ffa', label: 'FFA', boards: [
      { label: 'Kills', format: 'number', scored: true, entries: [{ uuid: java, username: 'RankedPlayer', position: 1, value: 50 }] },
      { label: 'Deaths', format: 'number', scored: false, entries: [{ uuid: bedrock, username: '.BoardOnly', position: 2, value: 436 }] },
    ] }],
  }
}

test('a player only on an unscored board has a profile with the observed result and no invented match stats', () => {
  const profile = buildPlayerProfiles(leaderboard()).get(bedrock)
  assert.ok(profile, 'an unscored board player must still have a profile')
  assert.equal(profile.username, '.BoardOnly')
  assert.equal(profile.rank, null)
  assert.equal(profile.points, 0)
  assert.deepEqual(profile.placements, [])
  assert.deepEqual(profile.kits, [])
  assert.equal(profile.ffa, null)
  assert.equal(profile.detailsAvailable, false)
  assert.deepEqual(profile.boards, [{ modeId: 'ffa', modeLabel: 'FFA', label: 'Deaths', position: 2, value: 436, format: 'number', scored: false }])
})

test('ranked profiles retain complete kit and FFA stats without mutating the leaderboard', () => {
  const data = leaderboard()
  const before = structuredClone(data)
  const profile = buildPlayerProfiles(data).get(java)
  assert.equal(profile.rank, 1)
  assert.equal(profile.points, 10)
  assert.equal(profile.detailsAvailable, true)
  assert.deepEqual(profile.kits, before.overall[0].kits)
  assert.deepEqual(profile.ffa, before.overall[0].ffa)
  assert.deepEqual(data, before)
})

test('older snapshots retain placements and mark missing detailed statistics as unavailable', () => {
  const data = leaderboard()
  delete data.overall[0].kits
  delete data.overall[0].ffa
  const profile = buildPlayerProfiles(data).get(java)
  assert.deepEqual(profile.placements, [{ label: 'FFA Kills', position: 1 }])
  assert.deepEqual(profile.kits, [])
  assert.equal(profile.ffa, null)
  assert.equal(profile.detailsAvailable, false)
})

test('malformed remote identities and non-finite board results cannot enter a profile', () => {
  const data = leaderboard()
  data.overall.push({ uuid: 'not-a-uuid', username: 'Invalid' })
  data.modes[0].boards[0].entries.push({ uuid: bedrock, username: 'x'.repeat(33), position: 1, value: 5 })
  data.modes[0].boards[0].entries.push({ uuid: bedrock, username: '.BoardOnly', position: 1, value: Infinity })
  const profiles = buildPlayerProfiles(data)
  assert.equal(profiles.has('not-a-uuid'), false)
  assert.equal(profiles.get(bedrock).boards.length, 1)
  assert.equal(profiles.get(bedrock).boards[0].label, 'Deaths')
})

test('empty and unloaded leaderboards yield no profiles', () => {
  assert.equal(buildPlayerProfiles(null).size, 0)
  assert.equal(buildPlayerProfiles({ overall: [], modes: [] }).size, 0)
})

test('invalid match counters are omitted while real zero records remain available', () => {
  const data = leaderboard()
  data.overall[0].kits.push({ label: 'Invalid', wins: -1, losses: 0, kills: 0, streak: 0 })
  data.overall[0].kits.push({ label: 'Idle', wins: 0, losses: 0, kills: 0, streak: 0 })
  data.overall[0].ffa.kills = NaN
  const profile = buildPlayerProfiles(data).get(java)
  assert.deepEqual(profile.kits.map(kit => kit.label), ['Sword', 'Idle'])
  assert.equal(profile.ffa, null)
})

test('offline Java skins use the escaped username and Floodgate skins use the UUID', () => {
  assert.equal(isBedrock(bedrock), true)
  assert.equal(isBedrock(java), false)
  assert.equal(skinId(java, 'Player/Name'), 'Player%2FName')
  assert.equal(skinId(bedrock, '.BoardOnly'), bedrock)
})

test('win rate keeps the existing floor rule and shows unavailable for no games', () => {
  assert.equal(winRate(999, 1), '99%')
  assert.equal(winRate(1, 0), '100%')
  assert.equal(winRate(0, 1), '0%')
  assert.equal(winRate(0, 0), '—')
})
