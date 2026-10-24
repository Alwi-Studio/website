import { useEffect, useState } from 'react'

// Every source here is third-party: accept finite numbers only and keep the
// previous value when a response is missing, malformed or the request fails.
const finite = (value) => (Number.isFinite(value) ? value : null)
const serverIconPattern = /^data:image\/png;base64,[A-Za-z0-9+/=]+$/
const maxServerIconLength = 200000
const cacheMs = 60000

// The navbar, footer and home page all show the same numbers: share one request
// per URL for a minute instead of fetching once per component.
const cache = new Map()
function cachedJson(url) {
  const hit = cache.get(url)
  if (hit && Date.now() - hit.at < cacheMs) return hit.promise
  const promise = fetch(url).then((response) => (response.ok ? response.json() : Promise.reject(new Error(String(response.status)))))
  promise.catch(() => cache.delete(url))
  cache.set(url, { at: Date.now(), promise })
  return promise
}

function readServerStatus(data) {
  const online = data?.online === true
  const icon = typeof data?.icon === 'string' && data.icon.length < maxServerIconLength && serverIconPattern.test(data.icon)
    ? data.icon
    : null
  return {
    loading: false,
    online,
    players: online ? finite(Number(data.players?.online)) : null,
    maxPlayers: online ? finite(Number(data.players?.max)) : null,
    icon,
  }
}

export function useServerStatus(serverAddress) {
  const [status, setStatus] = useState({ loading: true, online: false, players: null, maxPlayers: null, icon: null })

  useEffect(() => {
    let active = true
    cachedJson(`https://api.mcsrvstat.us/3/${encodeURIComponent(serverAddress)}`)
      .then((data) => { if (active) setStatus(readServerStatus(data)) })
      .catch(() => { if (active) setStatus((current) => ({ ...current, loading: false, online: false })) })
    return () => { active = false }
  }, [serverAddress])

  return status
}

export function useDiscordCounts(inviteCode) {
  const [counts, setCounts] = useState({ members: null, online: null })

  useEffect(() => {
    if (!inviteCode) return undefined
    let active = true
    cachedJson(`https://discord.com/api/v10/invites/${encodeURIComponent(inviteCode)}?with_counts=true`)
      .then((data) => {
        if (active) {
          setCounts({
            members: finite(Number(data?.approximate_member_count)),
            online: finite(Number(data?.approximate_presence_count)),
          })
        }
      })
      .catch(() => {})
    return () => { active = false }
  }, [inviteCode])

  return counts
}

export const formatCount = (value) => (Number.isFinite(value) ? value.toLocaleString('en-US') : '—')
