import { useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from '../common/Icons.jsx'
import { formatCount, useDiscordCounts } from '../common/liveData.js'
import { revealRef } from '../common/reveal.js'
import SwipeRow from '../common/SwipeRow.jsx'
import { useSite } from '../common/siteContext.js'
import { copyText } from '../common/toastBus.js'
import { loadLeaderboard } from './leaderboardApi.js'
import { fmt, formatValue, modeIntro, timeAgo, validateLeaderboard } from './leaderboardData.js'
import PlayerProfile from './PlayerProfile.jsx'
import { buildPlayerProfiles, isBedrock, skinId } from './playerProfiles.js'
import './leaderboard.css'

// A player can place on dozens of boards; past this many the overall row shows "+N more".
// Phones show fewer (CSS hides the .x pills and swaps the "+N" pill).
const maxPills = 6
const phonePills = 3
// Overall shows this many rows until "Show all" or a search.
const firstRows = 50

const medal = (position) => (position <= 3 ? `r${position}` : '')
const stamp = (time) => new Date(time).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })

function readModeFromUrl() {
  return new URLSearchParams(window.location.search).get('mode')?.toLowerCase() || 'overall'
}

function modeHref(id) {
  return id === 'overall' ? '/leaderboard' : `/leaderboard?mode=${encodeURIComponent(id)}`
}

// A failed head becomes a letter tile. Rows are keyed by player, so a reused row never
// keeps another player's failed state (tied players share a position).
function PlayerHead({ player }) {
  const [failed, setFailed] = useState(false)
  if (failed) {
    return <span className="lb-head" aria-hidden="true">{player.username.replace(/^\./, '').charAt(0).toUpperCase() || '?'}</span>
  }
  return (
    <img className="lb-head" src={`https://mc-heads.net/avatar/${skinId(player.uuid, player.username)}/64`} width="64" height="64" alt="" loading="lazy" onError={() => setFailed(true)} />
  )
}

// The head is a mouse shortcut only; the name button is the row's single keyboard stop.
function HeadButton({ player, onSelect }) {
  return (
    <button className="lb-profile-link lb-head-btn" type="button" tabIndex={-1} aria-hidden="true" onClick={() => onSelect(player)}>
      <PlayerHead player={player} />
    </button>
  )
}

function NameButton({ player, onSelect, className = '' }) {
  return (
    <button className={`lb-profile-link ${className}`} type="button" aria-haspopup="dialog" aria-label={`Open profile for ${player.username}`} title={player.username} onClick={() => onSelect(player)}>
      {player.username}
    </button>
  )
}

// Top three of the mode's first board (Overall: points), #1 in the middle.
function Stage({ data, mode, onSelect }) {
  const board = mode?.boards[0]
  const rows = mode
    ? board.entries.slice(0, 3).map((entry) => ({ ...entry, shown: `${formatValue(board, entry.value)} ${board.label.toLowerCase()}` }))
    : data.overall.slice(0, 3).map((player) => ({ ...player, position: player.rank, shown: `${fmt(player.points)} pts` }))
  const label = mode ? `Top three · ${mode.label} ${board.label}` : 'Top three · Overall points'

  return (
    <section className="lb-stage" aria-labelledby="lb-stage-title">
      <h2 className="label" id="lb-stage-title">{label}</h2>
      <ol className="lb-steps">
        {[0, 1, 2].map((index) => {
          const row = rows[index]
          if (!row) {
            return (
              <li key={`open-${index}`} className={`lb-step s${index + 1}`}>
                <span className="lb-block r0" aria-hidden="true" />
                <p className="who"><b>Open spot</b><span>—</span></p>
              </li>
            )
          }
          return (
            <li key={row.uuid} className={`lb-step s${index + 1} ${medal(row.position)}`} data-reveal data-delay={index + 1} ref={revealRef}>
              <img className="body" src={`https://mc-heads.net/body/${skinId(row.uuid, row.username)}/240`} width="240" height="576" alt={`${row.username}'s skin`} loading="lazy" onError={(event) => { event.currentTarget.style.visibility = 'hidden' }} />
              <span className={`lb-block ${medal(row.position)}`} aria-hidden="true"><span>{row.position}</span></span>
              <p className="who">
                <b><NameButton player={row} onSelect={onSelect} /></b>
                <span>#{row.position} · {row.shown}</span>
              </p>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

function SearchEmpty({ query }) {
  return <p className="empty panel" role="status">No player matching “{query}” on this tab.</p>
}

function BoardsView({ mode, query, rawQuery, onSelect }) {
  const boards = mode.boards
    .map((board) => ({ board, entries: query ? board.entries.filter((entry) => entry.username.toLowerCase().includes(query)) : board.entries }))
    .filter(({ entries }) => entries.length > 0)

  return (
    <>
      <h2 className="head lb-h">
        {mode.label} boards
        <span className="count">{mode.boards.length} {mode.boards.length === 1 ? 'board' : 'boards'}</span>
      </h2>
      {boards.length > 0 ? (
        <div className="lb-boards">
          {boards.map(({ board, entries }) => (
            <section key={board.label} className="panel lb-board" aria-label={`${mode.label} ${board.label}`} data-reveal ref={revealRef}>
              <header>
                <p className="label">{mode.label}</p>
                <h3>
                  {board.label}
                  {board.note && <span className="pill">{board.note}</span>}
                  {!board.scored && <span className="pill" title="Shown, but earns no overall points">No points</span>}
                </h3>
              </header>
              <ol>
                {entries.map((entry) => (
                  <li key={entry.uuid} className={medal(entry.position)}>
                    <span className={`lb-rk ${medal(entry.position)}`}>{entry.position}</span>
                    <HeadButton player={entry} onSelect={onSelect} />
                    <NameButton player={entry} onSelect={onSelect} className="name" />
                    <span className="v">{formatValue(board, entry.value)}</span>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      ) : <SearchEmpty query={rawQuery} />}
    </>
  )
}

function MorePill({ placements, after, className }) {
  if (placements.length <= after) return null
  return (
    <span className={`pill more ${className}`} title={placements.slice(after).map((placement) => `${placement.label} #${placement.position}`).join(', ')}>
      +{placements.length - after} more
    </span>
  )
}

function OverallView({ overall, query, rawQuery, showAll, onShowAll, onSelect }) {
  if (overall.length === 0) return <p className="empty panel">No rankings yet. Play some matches to appear here.</p>

  const rows = query
    ? overall.filter((player) => player.username.toLowerCase().includes(query))
    : showAll ? overall : overall.slice(0, firstRows)

  return (
    <>
      <h2 className="head lb-h">Overall ranking<span className="count">{fmt(overall.length)} players</span></h2>
      {rows.length > 0 ? (
        <div className="panel lb-table">
          <div className="lb-row thead" aria-hidden="true">
            <span>#</span><span /><span>Player</span><span className="pts-h">Points</span><span className="places-h">Placements</span>
          </div>
          <ol aria-label="Overall ranking">
            {rows.map((player) => (
              <li key={player.uuid} className={`lb-row ${medal(player.rank)}`}>
                <span className={`lb-rk ${medal(player.rank)}`}>{player.rank}</span>
                <HeadButton player={player} onSelect={onSelect} />
                <span className="who">
                  <b><NameButton player={player} onSelect={onSelect} /></b>
                  {isBedrock(player.uuid) ? <span className="tag tag-update">Bedrock</span> : <span className="tag tag-community">Java</span>}
                </span>
                <span className="pts">{fmt(player.points)}<small>{player.points === 1 ? 'point' : 'points'}</small></span>
                <span className="places">
                  {player.placements.slice(0, maxPills).map((placement, index) => (
                    <span key={placement.label} className={`pill ${medal(placement.position)}${index >= phonePills ? ' x' : ''}`}>
                      {placement.label} <b>#{placement.position}</b>
                    </span>
                  ))}
                  <MorePill placements={player.placements} after={maxPills} className="wide" />
                  <MorePill placements={player.placements} after={phonePills} className="phone" />
                </span>
              </li>
            ))}
          </ol>
        </div>
      ) : <SearchEmpty query={rawQuery} />}
      {!query && !showAll && overall.length > firstRows && (
        <div className="lb-more">
          <button className="btn btn-stone" type="button" onClick={onShowAll}>Show all {fmt(overall.length)} players</button>
        </div>
      )}
    </>
  )
}

function LoadingState() {
  return (
    <div aria-hidden="true">
      <div className="lb-stage is-skel">
        <p className="label">&nbsp;</p>
        <ol className="lb-steps">
          {[1, 2, 3].map((place) => (
            <li key={place} className={`lb-step s${place}`}>
              <span className="body" />
              <span className={`lb-block r${place} skeleton`} />
              <p className="who"><b>&nbsp;</b><span>&nbsp;</span></p>
            </li>
          ))}
        </ol>
      </div>
      <div className="head lb-h"><span className="skeleton lb-skel-title" /></div>
      {Array.from({ length: 6 }, (_, index) => <div key={index} className="skeleton lb-skel-row" />)}
    </div>
  )
}

// Content pages end with the Discord band before the footer (handoff consistency fix 10).
function DiscordBand() {
  const { settings } = useSite()
  const counts = useDiscordCounts(settings.discordInviteCode)

  return (
    <section className="discord lb-discord" aria-labelledby="lb-discord-title" data-reveal ref={revealRef}>
      <img src="/img/hub-podium-wide.webp" width="1400" height="788" alt="" loading="lazy" />
      <p className="label">Community</p>
      <h2 className="head" id="lb-discord-title">Join the community</h2>
      <p className="lead">Event announcements, patch notes and staff support all happen on the AlwiNation Discord.</p>
      <div className="discord-stats">
        <div><b>{formatCount(counts.members)}</b><span>Members</span></div>
        <div><b className="on">{formatCount(counts.online)}</b><span>Online now</span></div>
      </div>
      <div className="lb-discord-actions">
        <a className="btn btn-discord" href={settings.discordUrl} target="_blank" rel="noreferrer"><Icon name="discord" />Join our Discord</a>
        <button className="btn btn-dark" type="button" onClick={() => copyText(settings.serverAddress)}><Icon name="copy" />Copy server IP</button>
      </div>
    </section>
  )
}

function LeaderboardPage() {
  const [result, setResult] = useState({ status: 'loading', data: null })
  const [attempt, setAttempt] = useState(0)
  const [modeId, setModeId] = useState(readModeFromUrl)
  const [search, setSearch] = useState('')
  const [showAll, setShowAll] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  // Re-renders once a minute so "Updated N minutes ago" stays true.
  const [now, setNow] = useState(Date.now)
  const tabsRef = useRef(null)

  useEffect(() => {
    let active = true
    loadLeaderboard()
      .then(validateLeaderboard)
      .then((data) => {
        if (!active) return
        setNow(Date.now())
        setResult({ status: 'ready', data })
      })
      .catch((error) => {
        if (!active) return
        console.warn('Leaderboard unavailable:', error)
        setResult({ status: 'error', data: null })
      })
    return () => { active = false }
  }, [attempt])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60000)
    function syncMode() {
      setModeId(readModeFromUrl())
      setShowAll(false)
    }
    window.addEventListener('popstate', syncMode)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener('popstate', syncMode)
    }
  }, [])

  const data = result.data
  // null = Overall, also for an unknown ?mode=.
  const activeMode = data?.modes.find((mode) => mode.id === modeId) ?? null
  const activeId = activeMode?.id ?? 'overall'
  const profiles = useMemo(() => buildPlayerProfiles(data), [data])
  const title = data ? (activeMode ? `${activeMode.label} Rankings` : 'Overall Rankings') : 'Leaderboard'
  const rawQuery = search.trim()
  const query = rawQuery.toLowerCase()

  useEffect(() => {
    document.title = `${title} — AlwiNation Leaderboard`
  }, [title])

  // Keep the selected tab in view where the row scrolls sideways (touch), without scrolling the page.
  useEffect(() => {
    const tabs = tabsRef.current
    const current = tabs?.querySelector('[aria-current]')
    if (current) tabs.scrollLeft = current.offsetLeft - tabs.offsetLeft - (tabs.clientWidth - current.offsetWidth) / 2
  }, [activeId, result.status])

  function selectMode(event, id) {
    // Leave modified clicks (new tab, new window) to the browser.
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    if (id === activeId) return
    window.history.pushState(null, '', modeHref(id))
    setModeId(id)
    setShowAll(false)
  }

  function selectPlayer(player) {
    setSelectedPlayer(profiles.get(player.uuid) ?? null)
  }

  function retry() {
    setResult({ status: 'loading', data: null })
    setAttempt((count) => count + 1)
  }

  const isEmpty = data && data.modes.length === 0 && data.overall.length === 0

  return (
    <main className="lb-page">
      <section className="page-hero">
        <img src="/img/lb-hero.webp" srcSet="/img/lb-hero-sm.webp 1000w, /img/lb-hero.webp 2000w" sizes="100vw" width="2000" height="1108" alt="" style={{ '--pos': '56% 66%' }} fetchPriority="high" />
        <div className="container">
          <nav className="crumbs" aria-label="Breadcrumb">
            <a href="/">Home</a><span aria-hidden="true">/</span><span aria-current="page">Leaderboard</span>
          </nav>
          <p className="label">Arena PvP · Ranked</p>
          <h1 id="lb-title">{title}</h1>
          <p className="lead">{data ? modeIntro(activeMode, data.overall.length) : 'The best PvP players on AlwiNation, across every kit.'}</p>
          {result.status === 'loading' && <p className="lb-meta skeleton" aria-hidden="true" />}
          {data && (
            <p className="lb-meta">
              <b>Live</b>
              <span className="sep" aria-hidden="true" />
              <time dateTime={new Date(data.updatedAt).toISOString()} title={stamp(data.updatedAt)}>Updated {timeAgo(data.updatedAt, now)}</time>
            </p>
          )}
        </div>
      </section>

      <section className="page" aria-labelledby="lb-title">
        <div className="container" aria-busy={result.status === 'loading'}>
          {result.status !== 'error' && (
            <div className="lb-tools">
              <nav aria-label="Leaderboard modes">
                <SwipeRow ref={tabsRef}>
                  {data ? (
                    [{ id: 'overall', label: 'Overall', players: data.overall.length }, ...data.modes].map((mode) => (
                      <a
                        key={mode.id}
                        href={modeHref(mode.id)}
                        onClick={(event) => selectMode(event, mode.id)}
                        aria-current={mode.id === activeId ? 'page' : undefined}
                        aria-label={mode.players > 0 ? `${mode.label}, ${fmt(mode.players)} players` : undefined}
                      >
                        {mode.label}
                        {mode.players > 0 && <span className="count" aria-hidden="true">{fmt(mode.players)}</span>}
                      </a>
                    ))
                  ) : (
                    <div className="lb-tabs-skel" aria-hidden="true">
                      {Array.from({ length: 8 }, (_, index) => <span key={index} className="skeleton" />)}
                    </div>
                  )}
                </SwipeRow>
              </nav>
              <label className="field">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
                <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find a player" aria-label="Find a player by name" autoComplete="off" spellCheck="false" maxLength={32} />
              </label>
            </div>
          )}

          {result.status === 'loading' && <LoadingState />}

          {result.status === 'error' && (
            <div className="empty panel lb-msg" role="alert">
              <p>The leaderboard is unavailable right now.</p>
              <p className="lb-retry"><button className="btn btn-stone" type="button" onClick={retry}>Try again</button></p>
            </div>
          )}

          {isEmpty && <p className="empty panel lb-msg">No rankings yet. Play some matches to appear here.</p>}

          {data && !isEmpty && (
            <>
              <Stage data={data} mode={activeMode} onSelect={selectPlayer} />
              <div className="lb-list">
                {activeMode ? (
                  <BoardsView mode={activeMode} query={query} rawQuery={rawQuery} onSelect={selectPlayer} />
                ) : (
                  <OverallView overall={data.overall} query={query} rawQuery={rawQuery} showAll={showAll} onShowAll={() => setShowAll(true)} onSelect={selectPlayer} />
                )}
              </div>
            </>
          )}

          <DiscordBand />
        </div>
      </section>

      {selectedPlayer && <PlayerProfile key={selectedPlayer.uuid} player={selectedPlayer} onClose={() => setSelectedPlayer(null)} />}
    </main>
  )
}

export default LeaderboardPage
