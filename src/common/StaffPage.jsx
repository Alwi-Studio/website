import { useEffect } from 'react'
import { customLook, rankOf } from '../content/staffLook.js'
import { Icon } from './Icons.jsx'
import { RichInline } from './RichText.jsx'
import { revealRef } from './reveal.js'
import { useSite } from './siteContext.js'
import './pages.css'

function slug(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

// mc-heads.net renders a player's skin from the username; a failed load just leaves the plinth.
function Skin({ name, size }) {
  const username = String(name || '').trim()
  return (
    <img
      className="skin"
      src={`https://mc-heads.net/body/${encodeURIComponent(username)}/${size}`}
      width={size === 400 ? 170 : 100}
      height={size === 400 ? 408 : 240}
      alt={`${username}'s Minecraft skin`}
      loading={size === 400 ? undefined : 'lazy'}
      onError={(event) => { event.currentTarget.hidden = true }}
    />
  )
}

function Member({ member, rank }) {
  return (
    <article className="member panel">
      <div className="stage">
        <img className="bg" src={`/img/${rank.stage}.webp`} alt="" loading="lazy" />
        <div className="figure">
          <Skin name={member.name} size={200} />
          <span className="plinth" aria-hidden="true" />
        </div>
      </div>
      <div className="member-body">
        <span className="rank-tag">[{rank.tag}]</span>
        <h3>{member.name}</h3>
        {member.role && <p className="role">{member.role}</p>}
        {member.note && <p className="note"><RichInline text={member.note} /></p>}
      </div>
    </article>
  )
}

function StaffPage({ eyebrow, title, intro, updated, groups = [], isLoading = false }) {
  const { settings } = useSite()
  const totalMembers = groups.reduce((sum, group) => sum + (group.members?.length ?? 0), 0)
  const used = new Set()
  const ranked = groups.map((group, index) => {
    let id = slug(group.name) || `rank-${index + 1}`
    if (used.has(id)) id = `${id}-${index + 1}`
    used.add(id)
    // A group's own colour, tag and picture win over the ones its name gives it.
    return { ...group, id, rank: { ...rankOf(group.name), ...customLook(group) }, members: group.members ?? [] }
  })
  // The first owner-rank member gets the large founder card.
  const founderGroup = ranked.find((group) => group.rank.owner)

  // The groups render after the staff list loads, so the browser's own jump to #rank missed them.
  useEffect(() => {
    if (isLoading) return
    let id = ''
    try {
      id = decodeURIComponent(window.location.hash.slice(1))
    } catch {
      return
    }
    if (id) document.getElementById(id)?.scrollIntoView({ block: 'start', behavior: 'instant' })
  }, [isLoading])

  return (
    <main className="staff-page">
      <section className="page-hero">
        <img src="/img/staff-hero.webp" width="2000" height="861" alt="" style={{ '--pos': '50% 72%' }} fetchPriority="high" />
        <div className="container">
          <nav className="crumbs" aria-label="Breadcrumb">
            <a href="/">Home</a><span aria-hidden="true">/</span><span aria-current="page">Staff</span>
          </nav>
          {eyebrow && <p className="label">{eyebrow}</p>}
          <h1>{title}</h1>
          {intro && <p className="lead"><RichInline text={intro} /></p>}
          {!isLoading && (ranked.length > 0 || updated) && (
            <div className="hero-meta">
              {ranked.length > 0 && (
                <nav className="rank-legend" aria-label="Jump to a rank">
                  {ranked.map((group) => (
                    <a key={group.id} className="rank-tag" style={{ '--rank': group.rank.color }} href={`#${group.id}`}>[{group.rank.tag}]</a>
                  ))}
                </nav>
              )}
              <p className="hero-stats">
                <b>{totalMembers}</b> member{totalMembers === 1 ? '' : 's'}
                {updated && <> · Last updated <b>{updated}</b></>}
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="page">
        <div className="container">
          {isLoading ? (
            <div className="staff-loading" aria-busy="true">
              {[0, 1, 2].map((index) => <div className="skeleton" key={index} />)}
            </div>
          ) : ranked.length === 0 ? (
            <p className="panel empty">The staff list is being updated. Check back soon.</p>
          ) : (
            ranked.map((group) => {
              const founder = group === founderGroup ? group.members[0] : null
              const others = founder ? group.members.slice(1) : group.members
              return (
                <section className="group" style={{ '--rank': group.rank.color }} id={group.id} aria-labelledby={`${group.id}-title`} key={group.id}>
                  <header className="group-head" data-reveal ref={revealRef}>
                    <span className="rank-tag">[{group.rank.tag}]</span>
                    <h2 className="head" id={`${group.id}-title`}>{group.name}</h2>
                    <span className="label count">{group.members.length} member{group.members.length === 1 ? '' : 's'}</span>
                  </header>
                  {founder && (
                    <article className="founder" data-reveal data-delay="1" ref={revealRef}>
                      <img className="bg" src="/img/staff-founder.webp" width="1400" height="875" alt="" loading="lazy" />
                      <div className="founder-copy">
                        <span className="rank-tag">[{group.rank.tag}]</span>
                        <h3 className="founder-name">{founder.name}</h3>
                        {founder.role && <p className="role">{founder.role}</p>}
                        {founder.note && <p className="note"><RichInline text={founder.note} /></p>}
                      </div>
                      <div className="figure">
                        <Skin name={founder.name} size={400} />
                        <span className="plinth" aria-hidden="true" />
                      </div>
                    </article>
                  )}
                  {others.length > 0 && (
                    <div className="roster" data-reveal data-delay="1" ref={revealRef}>
                      {others.map((member, index) => (
                        <Member key={`${member.name}-${index}`} member={member} rank={group.rank} />
                      ))}
                    </div>
                  )}
                </section>
              )
            })
          )}

          <div className="discord join-team" data-reveal ref={revealRef}>
            <img src="/img/street-wide.webp" width="2000" height="1127" alt="" loading="lazy" />
            <p className="label">Staff applications</p>
            <h2 className="head">Want to join the team?</h2>
            <p className="lead">We open staff applications from time to time. Join our Discord to hear when applications go live.</p>
            <a className="btn btn-discord" href={settings.discordUrl} target="_blank" rel="noreferrer">
              <Icon name="discord" />Apply on Discord
            </a>
          </div>
        </div>
      </section>
    </main>
  )
}

export default StaffPage
