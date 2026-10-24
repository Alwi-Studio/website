import { useEffect, useRef, useState } from 'react'
import { isBedrock, skinId, winRate } from './playerProfiles.js'
import './playerProfile.css'

function PlayerProfile({ player, onClose }) {
  const dialogRef = useRef(null)
  const [skinStatus, setSkinStatus] = useState('loading')
  const unscored = player.boards.filter((board) => !board.scored)

  useEffect(() => {
    const dialog = dialogRef.current
    const previousOverflow = document.body.style.overflow
    // StrictMode replays effects on the same dialog; keep it open during that replay.
    if (!dialog.open) dialog.showModal()
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previousOverflow }
  }, [])

  return (
    <dialog
      ref={dialogRef}
      className="lb-player-profile panel"
      aria-labelledby="player-profile-name"
      aria-describedby="player-profile-summary"
      onClose={onClose}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return
        const bounds = event.currentTarget.getBoundingClientRect()
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) {
          event.currentTarget.close()
        }
      }}
    >
      <div className="lb-profile-toolbar">
        <p className="label">Arena PvP · Player profile</p>
        <button className="btn btn-sm btn-stone lb-profile-close" type="button" onClick={() => dialogRef.current.close()} aria-label={`Close ${player.username}'s profile`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
        </button>
      </div>

      <div className="lb-profile-hero">
        <div className="lb-profile-skin" aria-busy={skinStatus === 'loading'}>
          {skinStatus !== 'ready' && (
            <span className="lb-profile-skin-fallback" role="img" aria-label={`${player.username}'s skin is ${skinStatus === 'loading' ? 'loading' : 'unavailable'}`}>
              {player.username.replace(/^\./, '').charAt(0).toUpperCase()}
            </span>
          )}
          {skinStatus !== 'failed' && (
            <img className={skinStatus === 'ready' ? 'is-ready' : ''} src={`https://mc-heads.net/body/${skinId(player.uuid, player.username)}/240`} alt={`${player.username}'s Minecraft skin`} width="120" height="240" onLoad={() => setSkinStatus('ready')} onError={() => setSkinStatus('failed')} />
          )}
          <span className="lb-profile-plinth" aria-hidden="true" />
        </div>

        <div className="lb-profile-identity">
          <div className="lb-profile-badges">
            <span className="pill">{player.rank ? `#${player.rank} Overall` : 'Unranked overall'}</span>
            <span className="lb-profile-platform">{isBedrock(player.uuid) ? 'Bedrock' : 'Java'}</span>
          </div>
          <h2 className="head" id="player-profile-name">{player.username}</h2>
          <p id="player-profile-summary">{player.rank ? 'Ranked results across the AlwiNation arena.' : 'Unscored board results do not earn overall points.'}</p>
          <dl className="lb-profile-summary">
            <div><dt className="label">Points</dt><dd>{player.points.toLocaleString()}</dd></div>
            <div><dt className="label">Placements</dt><dd>{player.placements.length}</dd></div>
            <div><dt className="label">Kits played</dt><dd>{player.detailsAvailable ? player.kits.length : '—'}</dd></div>
          </dl>
        </div>
      </div>

      {player.ffa && (
        <section className="lb-profile-section" aria-labelledby="player-profile-ffa">
          <div className="lb-profile-section-head"><h3 id="player-profile-ffa">Free for all</h3><span className="label">FFA</span></div>
          <dl className="lb-profile-stats">
            <div className="panel"><dt className="label">Kills</dt><dd>{player.ffa.kills.toLocaleString()}</dd></div>
            <div className="panel"><dt className="label">Deaths</dt><dd>{player.ffa.deaths.toLocaleString()}</dd></div>
            <div className="panel"><dt className="label">K/D</dt><dd>{(player.ffa.kills / Math.max(1, player.ffa.deaths)).toFixed(2)}</dd></div>
            <div className="panel"><dt className="label">Best streak</dt><dd>{player.ffa.bestStreak.toLocaleString()}</dd></div>
          </dl>
        </section>
      )}

      {player.kits.length > 0 && (
        <section className="lb-profile-section" aria-labelledby="player-profile-kits">
          <div className="lb-profile-section-head"><h3 id="player-profile-kits">Kit statistics</h3><span className="label">{player.kits.length} kits</span></div>
          <div className="lb-profile-table-scroll" tabIndex={0} role="region" aria-labelledby="player-profile-kits">
            <table className="lb-profile-table">
              <thead><tr><th scope="col">Kit</th><th scope="col">Wins</th><th scope="col">Losses</th><th scope="col">Win rate</th><th scope="col">Kills</th><th scope="col">Best streak</th></tr></thead>
              <tbody>
                {player.kits.map((kit) => (
                  <tr key={kit.label}>
                    <th scope="row">{kit.label}</th>
                    <td>{kit.wins.toLocaleString()}</td><td>{kit.losses.toLocaleString()}</td><td className="lb-profile-rate">{winRate(kit.wins, kit.losses)}</td><td>{kit.kills.toLocaleString()}</td><td>{kit.streak.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="lb-profile-section" aria-labelledby="player-profile-placements">
        <div className="lb-profile-section-head">
          <h3 id="player-profile-placements">Leaderboard results</h3>
          <span className="label">{player.placements.length + unscored.length} placements</span>
        </div>
        {player.placements.length + unscored.length > 0 ? (
          <ul className="lb-profile-placements">
            {player.placements.map((placement) => (
              <li key={placement.label}><span className="pill lb-profile-placement">{placement.label}<b>#{placement.position}</b></span></li>
            ))}
            {unscored.map((board) => (
              <li key={`${board.modeId}:${board.label}`}><span className="pill lb-profile-placement lb-profile-unscored">{board.modeLabel} {board.label}<b>#{board.position}</b><span>{board.value.toLocaleString()}</span><small>No points</small></span></li>
            ))}
          </ul>
        ) : <p className="lb-profile-empty">No leaderboard placements have been returned for this player.</p>}
      </section>

      {!player.ffa && player.kits.length === 0 && (
        <section className="lb-profile-section lb-profile-empty" aria-label="Match statistics">
          <p>Detailed match statistics are unavailable for this player. Their available leaderboard results are shown above.</p>
        </section>
      )}
    </dialog>
  )
}

export default PlayerProfile
