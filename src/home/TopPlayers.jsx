import { useEffect, useState } from 'react'
import { revealRef } from '../common/reveal.js'
import { loadLeaderboard } from '../leaderboard/leaderboardApi.js'
import { skinId } from '../leaderboard/playerProfiles.js'

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const fmt = (value) => value.toLocaleString('en-US')

// The API is trusted for shape only after this check: three ranked rows with a
// real UUID, a short name and a finite value, or nothing.
function topThree(data, mode) {
  const rows = mode === 'overall'
    ? (Array.isArray(data?.overall) ? data.overall : []).map((player) => ({ ...player, value: player.points }))
    : (Array.isArray(data?.modes) ? data.modes : []).find((m) => m?.id === mode)?.boards?.[0]?.entries ?? []
  const top = rows.slice(0, 3).map((row) => ({ uuid: row?.uuid, username: row?.username, value: Number(row?.value) }))
  const valid = top.length === 3 && top.every((row) =>
    typeof row.uuid === 'string' && uuidPattern.test(row.uuid) &&
    typeof row.username === 'string' && row.username.length > 0 && row.username.length <= 32 &&
    Number.isFinite(row.value))
  return valid ? top : null
}

function Board({ board, rows, first }) {
  const [winner, ...rest] = rows
  return (
    <div className={`board panel${first ? ' first' : ''}`} data-reveal ref={revealRef}>
      <div className="podium">
        <img className="body" src={`https://mc-heads.net/body/${skinId(winner.uuid, winner.username)}/240`} width="120" height="240" alt={`${winner.username}'s skin`} loading="lazy" />
        <span className="block" />
      </div>
      <p className="label">{board.label}</p>
      <p className="who"><b>{winner.username}</b><span className="val">{fmt(winner.value)} {board.unit}</span></p>
      <ol className="board-rest">
        {rest.map((row, i) => (
          <li key={row.uuid}>
            <span className="n">#{i + 2}</span>
            <img src={`https://mc-heads.net/avatar/${skinId(row.uuid, row.username)}/64`} width="32" height="32" alt="" loading="lazy" />
            <span className="name">{row.username}</span>
            <span className="v">{fmt(row.value)}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}

function TopPlayers({ section }) {
  const [state, setState] = useState({ status: 'loading', data: null })

  useEffect(() => {
    let active = true
    loadLeaderboard()
      .then((data) => { if (active) setState({ status: 'ready', data }) })
      .catch(() => { if (active) setState({ status: 'error', data: null }) })
    return () => { active = false }
  }, [])

  const boards = section.boards
    .map((board, i) => ({ board, first: i === 0, rows: state.data ? topThree(state.data, board.mode) : null }))
    .filter((entry) => entry.rows)
  // The first board stands raised in the middle when there are three.
  const ordered = boards.length === 3 ? [boards[1], boards[0], boards[2]] : boards

  return (
    <section className="section" id="players">
      <div className="container">
        <header className="sec-head" data-reveal ref={revealRef}>
          {section.kicker && <p className="label">{section.kicker}</p>}
          <h2 className="head">{section.title}</h2>
          {section.lead && <p>{section.lead}</p>}
        </header>
        {ordered.length > 0 ? (
          <div className="boards">
            {ordered.map((entry) => <Board key={entry.board.mode} board={entry.board} rows={entry.rows} first={entry.first} />)}
          </div>
        ) : (
          <p className="empty">{state.status === 'loading' ? 'Loading the top players…' : 'The leaderboard is unavailable right now.'}</p>
        )}
        <div className="sec-foot"><a className="btn btn-stone" href="/leaderboard">View full leaderboard</a></div>
      </div>
    </section>
  )
}

export default TopPlayers
