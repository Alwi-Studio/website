// One /api/leaderboard request shared by the home podiums and the leaderboard
// page for a minute; a failed request is forgotten so the next caller retries.
const cacheMs = 60000
let cached = null

export function loadLeaderboard() {
  if (cached && Date.now() - cached.at < cacheMs) return cached.promise
  const promise = fetch('/api/leaderboard').then((response) =>
    response.ok ? response.json() : Promise.reject(new Error(`Leaderboard request failed (${response.status}).`)),
  )
  promise.catch(() => { if (cached?.promise === promise) cached = null })
  cached = { at: Date.now(), promise }
  return promise
}
