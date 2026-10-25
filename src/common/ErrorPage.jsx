import './pages.css'

// "Off the map": a filled map in an item frame, the trail walking off its edge. Every "not found"
// route uses it; callers pass their own message and buttons.
//
// /img/spawn-map.webp is the 144×144 canvas the 404-b mockup draws (8px parchment border around a
// 128×128 map), baked once instead of shipping its noise code to every page. Only the land along this
// trail is explored in that picture, so the trail, its end point (136, 36) and the .you chip's position
// in pages.css only move together with a rebaked image.
const TRAIL = 'M72 72 L77 68 L82 69 L87 64 L94 63 L99 57 L106 55 L112 49 L119 48 L125 42 L131 40 L136 36'

// Each waypoint is a card below and a flag on the map. `at` is the foot of the flag's pole in map
// coordinates; `plate` is the width of its name in the pixel face, measured in the mockup.
const WAYPOINTS = [
  { id: 'realms', href: '/#realms', img: '/img/hub-center.webp', width: 1400, height: 788, color: '#ff7a52', fill: '#ff5a30', edge: '#160904', at: '52 50', plate: 17.29, tag: 'Play', distance: '640 blocks', name: 'Realms', text: 'Ten realms, from Tycoon and Survival RPG to plain Vanilla.' },
  { id: 'leaderboard', href: '/leaderboard', img: '/img/hub-podium.webp', width: 1000, height: 1000, color: '#b89cff', fill: '#b89cff', edge: '#160d2e', at: '64 98', plate: 30.32, tag: 'Rankings', distance: '760 blocks', name: 'Leaderboard', text: 'See who tops each realm this season.' },
  { id: 'news', href: '/news', img: '/img/hub-lanterns.webp', width: 900, height: 1200, color: '#67e8f9', fill: '#67e8f9', edge: '#06232a', at: '93 90', plate: 13.68, tag: 'Updates', distance: '520 blocks', name: 'News', text: 'Patch notes, events and announcements from the team.' },
  { id: 'wiki', href: '/wiki', img: '/img/street-path.webp', width: 1000, height: 1250, color: '#6ee06e', fill: '#6ee06e', edge: '#0b1f0b', at: '44 80', plate: 10.83, tag: 'Guides', distance: '810 blocks', name: 'Wiki', text: 'Guides, commands and how every system works.' },
]

function ErrorPage({
  code = '404',
  eyebrow = 'Page not found',
  title = 'You wandered off the map.',
  description = 'This address is unexplored territory: the link may have a typo, or the page has moved.',
  primaryHref = '/',
  primaryLabel = 'Back to spawn',
  secondaryHref = '/#realms',
  secondaryLabel = 'Browse realms',
}) {
  // The address that missed, as plain React text. Left percent-encoded: decoding throws on a malformed
  // escape and would let a crafted link print readable sentences or bidi tricks under our domain.
  const lastSeen = window.location.pathname.slice(0, 120)

  return (
    <main className="error-page">
      <section className="lost" aria-labelledby="lost-title">
        <img className="lost-bg" src="/img/street-wide.webp" width="2000" height="1127" alt="" fetchPriority="high" />
        <div className="container lost-in">
          <div className="lost-copy">
            <p className="label">Error {code} · {eyebrow}</p>
            <h1 id="lost-title">{title}</h1>
            <p className="lead">{description}</p>
            <div className="lost-cta">
              <a className="btn btn-primary" href={primaryHref}><span aria-hidden="true">←</span><b>{primaryLabel}</b></a>
              <a className="btn btn-dark" href={secondaryHref}>{secondaryLabel}</a>
            </div>
            <p className="lost-seen label">Last seen at <code>{lastSeen}</code></p>
          </div>

          <figure className="atlas" role="img" aria-label="A map of spawn. Your marker is pinned to the edge, because you are off the map.">
            <div className="frame">
              <div className="map">
                <img src="/img/spawn-map.webp" width="144" height="144" alt="" />
                <svg viewBox="0 0 144 144" aria-hidden="true">
                  <defs>
                    <mask id="trail-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="144" height="144">
                      <path className="trail-reveal" d={TRAIL} fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" pathLength="1" />
                    </mask>
                  </defs>
                  <g mask="url(#trail-mask)" fill="none" strokeLinejoin="round">
                    <path d={TRAIL} stroke="rgba(20, 12, 4, 0.6)" strokeWidth="2.4" strokeDasharray="2.2 1.4" strokeDashoffset="0.4" />
                    <path d={TRAIL} stroke="#fff" strokeWidth="1.2" strokeDasharray="1.4 2.2" />
                  </g>
                  {/* Spawn: the hub town at the map centre. */}
                  <g transform="translate(72 59)" className="flag-label"><rect className="flag-box" x="-8.26" y="-4.2" width="16.52" height="5.6" /><text className="flag-name" textAnchor="middle" y="0">Spawn</text></g>
                  {WAYPOINTS.map((wp) => (
                    <g key={wp.id} className="flag" data-wp={wp.id} transform={`translate(${wp.at})`}>
                      <g className="flag-mark">
                        <rect x="-.6" y="-10" width="1.2" height="10" fill="#2a1d10" />
                        <path d="M.6 -10h6.4v6.6l-3.2-1.6-3.2 1.6z" fill={wp.fill} stroke={wp.edge} strokeWidth="1" />
                        <g className="flag-label"><rect className="flag-box" x={-wp.plate / 2} y="1.4" width={wp.plate} height="5.6" /><text className="flag-name" textAnchor="middle" y="5.6">{wp.name}</text></g>
                      </g>
                    </g>
                  ))}
                  {/* Off-map marker: the game pins a plain white dot to the edge when the holder is outside the map. */}
                  <g className="you-dot">
                    <circle className="you-ring" cx="136" cy="36" r="3" />
                    <circle cx="136" cy="36" r="2.7" fill="#fff" stroke="#111" strokeWidth=".9" />
                  </g>
                </svg>
                <span className="you" aria-hidden="true">You</span>
              </div>
            </div>
            <div className="mc-tooltip map-tip" aria-hidden="true">
              <div className="t-title">Map #{code}</div>
              <div className="t-sub">Scaling at 1:8</div>
              <div className="t-warn">Player not on this map</div>
            </div>
          </figure>
        </div>
      </section>

      <section className="warp" aria-labelledby="warp-title">
        <div className="container">
          <div className="warp-head">
            <div>
              <p className="label">Fast travel</p>
              <h2 className="head" id="warp-title">Pick a waypoint</h2>
            </div>
            <p>Every flag on that map is a page that does exist. Jump to one.</p>
          </div>
          <div className="wp-grid">
            {WAYPOINTS.map((wp) => (
              <a key={wp.id} className="wp" href={wp.href} data-wp={wp.id} style={{ '--wp': wp.color }}>
                <img src={wp.img} width={wp.width} height={wp.height} alt="" loading="lazy" />
                <span className="wp-top">
                  <span className="wp-flag label">
                    <svg viewBox="0 0 11 14" aria-hidden="true"><rect width="1.6" height="14" fill="currentColor" opacity=".6" /><path d="M1.6 .5h9v8.5l-4.5-2.2-4.5 2.2z" fill="currentColor" /></svg>
                    {wp.tag}
                  </span>
                  <span className="wp-dist">{wp.distance}</span>
                </span>
                <h3 className="wp-name">{wp.name}</h3>
                <p className="wp-desc">{wp.text}</p>
                <span className="wp-go">Travel <span aria-hidden="true">→</span></span>
              </a>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}

export default ErrorPage
