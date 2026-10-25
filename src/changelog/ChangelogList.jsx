import { useCallback, useEffect, useMemo, useState } from 'react'
import Changelog from './Changelog.jsx'
import { getRealms } from './adminChangelogStore.js'
import { changeTypeOrder, getChangeTypeLabel } from './changelogData.js'
import { groupChanges, monthOf } from './changeGroups.js'
import { Icon } from '../common/Icons.jsx'
import { reducedMotion, revealRef } from '../common/reveal.js'
import SwipeRow from '../common/SwipeRow.jsx'
import { useSite } from '../common/siteContext.js'
import { showToast } from '../common/toastBus.js'

const plural = (count, word) => `${count} ${word}${count === 1 ? '' : 's'}`
const matches = (item, { realm, type }) =>
  (realm === 'All' || item.realm === realm) && (type === 'all' || item.types.has(type))

function ChangelogList({ entries = [], isLoading = false }) {
  const { settings } = useSite()
  const [filters, setFilters] = useState({ realm: 'All', type: 'all' })
  // slug -> open; entries without a stored choice fall back to "newest is open".
  const [openMap, setOpenMap] = useState({})
  const [scrollTarget, setScrollTarget] = useState(null)

  const items = useMemo(
    () =>
      entries.map((entry) => {
        const groups = groupChanges(entry.changes)
        return { entry, groups, types: new Set(groups.map((group) => group.type)), realm: entry.realm || 'General' }
      }),
    [entries],
  )
  const realms = useMemo(() => getRealms(entries), [entries])
  const types = useMemo(() => changeTypeOrder.filter((type) => items.some((item) => item.types.has(type))), [items])
  const current = {
    realm: filters.realm === 'All' || realms.includes(filters.realm) ? filters.realm : 'All',
    type: filters.type === 'all' || types.includes(filters.type) ? filters.type : 'all',
  }
  const visible = items.filter((item) => matches(item, current))
  // Entries arrive newest first; keyed by month so a stray undated entry cannot split a month in two.
  const byMonth = new Map()
  for (const item of visible) {
    const month = monthOf(item.entry.dateValue)
    if (!byMonth.has(month.key)) byMonth.set(month.key, { ...month, items: [] })
    byMonth.get(month.key).items.push(item)
  }
  const months = [...byMonth.values()]
  const latest = entries[0]
  const isOpen = (slug) => openMap[slug] ?? slug === latest?.slug

  // Opens an entry (clearing filters that hide it) and scrolls to it once rendered.
  const openEntry = useCallback(
    (slug, behavior) => {
      const item = items.find(({ entry }) => entry.slug === slug)
      if (!item) return
      setFilters((value) => (matches(item, value) ? value : { realm: 'All', type: 'all' }))
      setOpenMap((value) => ({ ...value, [slug]: true }))
      setScrollTarget({ slug, behavior })
    },
    [items],
  )

  useEffect(() => {
    if (isLoading) return undefined
    const fromHash = (behavior) => {
      let slug = ''
      try {
        slug = decodeURIComponent(window.location.hash.slice(1))
      } catch {
        return
      }
      if (slug) openEntry(slug, behavior)
    }
    const onHashChange = () => fromHash(reducedMotion() ? 'auto' : 'smooth')
    fromHash('instant')
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [isLoading, openEntry])

  useEffect(() => {
    if (!scrollTarget) return
    document.getElementById(scrollTarget.slug)?.scrollIntoView({ block: 'start', behavior: scrollTarget.behavior })
    setScrollTarget(null)
  }, [scrollTarget])

  async function copyLink(entry) {
    const url = `${window.location.origin}/changelog#${entry.slug}`
    window.history.replaceState(null, '', `#${entry.slug}`)
    try {
      await navigator.clipboard.writeText(url)
      showToast('Link copied')
    } catch {
      showToast('Link is in the address bar')
    }
  }

  const where = current.realm === 'All' ? '' : `${current.realm} `
  const hasEntries = !isLoading && items.length > 0

  return (
    <main className="cl-page">
      <section className="page-hero">
        <img
          src="/img/changelog-hero.webp"
          srcSet="/img/changelog-hero-sm.webp 1000w, /img/changelog-hero.webp 2000w"
          sizes="100vw"
          width="2000"
          height="781"
          alt=""
          style={{ '--pos': '50% 30%' }}
          fetchPriority="high"
        />
        <div className="container">
          <nav className="crumbs" aria-label="Breadcrumb">
            <a href="/">Home</a><span aria-hidden="true">/</span><span aria-current="page">Changelog</span>
          </nav>
          <p className="label">Patch notes</p>
          <h1>Changelog</h1>
          <p className="lead">Every AlwiNation update across all realms, newest first. Open an entry to see everything that changed.</p>
          {hasEntries && latest && (
            <a className="cl-latest" href={`#${latest.slug}`} onClick={() => openEntry(latest.slug, reducedMotion() ? 'auto' : 'smooth')}>
              <span className="new">Latest</span>
              <span><b>{latest.realm} · {latest.version}</b> {latest.title}</span>
              <span className="go" aria-hidden="true">→</span>
            </a>
          )}
        </div>
      </section>

      <section className="page">
        <div className="container">
          {hasEntries && (
            <>
              <div className="cl-filters panel">
                <div className="cl-row">
                  <p className="label" id="cl-realm-label">Realm</p>
                  <SwipeRow role="group" aria-labelledby="cl-realm-label">
                    {['All', ...realms].map((realm) => (
                      <button type="button" key={realm} aria-pressed={current.realm === realm} onClick={() => setFilters({ ...current, realm })}>
                        {realm === 'All' ? 'All realms' : realm}
                        <span className="count">{items.filter((item) => matches(item, { ...current, realm })).length}</span>
                      </button>
                    ))}
                  </SwipeRow>
                </div>
                <div className="cl-row">
                  <p className="label" id="cl-type-label">Change type</p>
                  <SwipeRow role="group" aria-labelledby="cl-type-label">
                    {['all', ...types].map((type) => (
                      <button type="button" key={type} aria-pressed={current.type === type} onClick={() => setFilters({ ...current, type })}>
                        {type !== 'all' && <span className="sw" style={{ '--c': `var(--t-${type})` }} aria-hidden="true" />}
                        {type === 'all' ? 'All types' : getChangeTypeLabel(type)}
                        <span className="count">{items.filter((item) => matches(item, { ...current, type })).length}</span>
                      </button>
                    ))}
                  </SwipeRow>
                </div>
              </div>
              <p className="cl-status" aria-live="polite">
                Showing <b>{plural(visible.length, 'update')}</b>
                {visible.length === items.length ? '' : ` of ${items.length}`}
              </p>
            </>
          )}

          <div className={`with-side cl-layout${hasEntries ? '' : ' is-bare'}`}>
            {hasEntries && (
              <aside className="side">
                {visible.length > 0 && (
                  <nav className="toc cl-toc panel" aria-label="Updates">
                    <p className="label">Jump to</p>
                    {months.map((month) => (
                      <div key={month.key || 'undated'}>
                        <p className="m">{month.label}</p>
                        {month.items.map(({ entry }) => (
                          <a key={entry.slug} href={`#${entry.slug}`} onClick={() => openEntry(entry.slug, reducedMotion() ? 'auto' : 'smooth')}>
                            <small>{entry.realm} · {entry.version}</small>
                            {entry.title || entry.version}
                          </a>
                        ))}
                      </div>
                    ))}
                  </nav>
                )}
                <div className="cl-discord panel">
                  <p><b>Patch notes on Discord</b>Announcements, patch notes and staff support all happen on the AlwiNation Discord.</p>
                  <a className="btn btn-discord btn-sm" href={settings.discordUrl} target="_blank" rel="noreferrer">
                    <Icon name="discord" />Join Discord
                  </a>
                </div>
              </aside>
            )}

            <div aria-busy={isLoading}>
              {isLoading ? (
                <div className="cl-loading">
                  {[0, 1, 2].map((index) => <div className="skeleton" key={index} />)}
                </div>
              ) : items.length === 0 ? (
                <p className="panel empty">No changelog entries yet. Check back soon.</p>
              ) : visible.length === 0 ? (
                <div className="cl-empty panel empty">
                  <p>
                    <b>Nothing here yet</b>
                    {current.type === 'all'
                      ? `No ${where}updates yet.`
                      : `No ${where}update has anything under ${getChangeTypeLabel(current.type)}.`}
                  </p>
                  <button className="btn btn-stone btn-sm" type="button" onClick={() => setFilters({ realm: 'All', type: 'all' })}>
                    Show all updates
                  </button>
                </div>
              ) : (
                <div className="tl">
                  {months.map((month) => (
                    <section className="tl-month" key={month.key || 'undated'} aria-labelledby={`cl-m-${month.key || 'undated'}`}>
                      <header className="tl-head">
                        <h2 className="head" id={`cl-m-${month.key || 'undated'}`}>{month.label}</h2>
                        <p className="label">{plural(month.items.length, 'update')}</p>
                      </header>
                      {month.items.map(({ entry, groups }) => (
                        <Changelog
                          key={entry.id || entry.slug}
                          entry={entry}
                          groups={groups}
                          open={isOpen(entry.slug)}
                          onToggle={(slug, open) => setOpenMap((value) => (value[slug] === open ? value : { ...value, [slug]: open }))}
                          type={current.type}
                          onCopy={copyLink}
                        />
                      ))}
                    </section>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="discord cl-band" data-reveal ref={revealRef}>
            <img src="/img/hub-podium-wide.webp" width="1400" height="788" alt="" loading="lazy" />
            <p className="label">Community</p>
            <h2 className="head">Hear about updates first</h2>
            <p className="lead">Patch notes land on the AlwiNation Discord the moment they ship, along with events and staff support.</p>
            <a className="btn btn-discord" href={settings.discordUrl} target="_blank" rel="noreferrer">
              <Icon name="discord" />Join our Discord
            </a>
          </div>
        </div>
      </section>
    </main>
  )
}

export default ChangelogList
