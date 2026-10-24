import { useMemo } from 'react'
import { ChangeCounts, ChangeGroups, EntryMeta } from './Changelog.jsx'
import { groupChanges } from './changeGroups.js'
import { Icon } from '../common/Icons.jsx'
import { RichInline } from '../common/RichText.jsx'
import { getOptimizedImageUrl } from '../common/imageOptimizer.js'
import { revealRef } from '../common/reveal.js'
import { isSafeImageUrl } from '../common/safeUrls.js'
import { useSite } from '../common/siteContext.js'
import { showToast } from '../common/toastBus.js'

function ChangelogDetail({ entry, entries = [] }) {
  const { settings } = useSite()
  const groups = useMemo(() => groupChanges(entry.changes), [entry.changes])
  const title = entry.title || entry.version
  const realm = entry.realm || 'General'

  const heroImage = useMemo(
    () => (isSafeImageUrl(entry.img) ? getOptimizedImageUrl(entry.img, 1920) || entry.img : ''),
    [entry.img],
  )

  const related = useMemo(() => {
    const others = entries.filter((item) => item.slug !== entry.slug)
    const sameRealm = others.filter((item) => (item.realm || 'General') === realm)
    const rest = others.filter((item) => (item.realm || 'General') !== realm)

    return [...sameRealm, ...rest].slice(0, 3)
  }, [entries, entry.slug, realm])

  async function copyLink() {
    const url = `${window.location.origin}/changelog/${encodeURIComponent(entry.slug)}`
    try {
      await navigator.clipboard.writeText(url)
      showToast('Link copied')
    } catch {
      showToast('Link is in the address bar')
    }
  }

  const facts = [
    ['Realm', realm],
    ['Version', entry.version],
    ['Type', entry.tag],
    ['Date', entry.date],
    ['Author', entry.author],
  ].filter(([, value]) => value)

  return (
    <main className="cl-page">
      <section className="page-hero">
        {heroImage ? (
          <img src={heroImage} width="1920" height="750" alt="" fetchPriority="high" decoding="async" />
        ) : (
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
        )}
        <div className="container">
          <nav className="crumbs" aria-label="Breadcrumb">
            <a href="/">Home</a><span aria-hidden="true">/</span>
            <a href="/changelog">Changelog</a><span aria-hidden="true">/</span>
            <span aria-current="page">{entry.version || title}</span>
          </nav>
          <p className="label">{realm}{entry.tag ? ` · ${entry.tag}` : ''}</p>
          <h1>{title}</h1>
          {entry.summary && <p className="lead"><RichInline text={entry.summary} /></p>}
          <p className="cl-hero-meta">
            {entry.version && <span className="e-ver">{entry.version}</span>}
            {entry.date && <span>{entry.date}</span>}
            {entry.author && <span>By {entry.author}</span>}
          </p>
        </div>
      </section>

      <section className="page">
        <div className="container cl-detail">
          <div className="panel cl-changes">
            {groups.length > 0 ? <ChangeGroups groups={groups} Heading="h2" /> : <p className="e-sum">No changes were listed for this entry.</p>}
          </div>
          <aside className="side">
            <div className="panel cl-facts">
              <p className="label">Update details</p>
              <dl>
                {facts.map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
              <div className="cl-facts-actions">
                <button className="btn btn-stone btn-sm" type="button" onClick={copyLink} aria-label={`Copy link to ${title}`}>
                  <Icon name="copy" />Copy link
                </button>
                <a className="btn btn-stone btn-sm" href={`/changelog#${encodeURIComponent(entry.slug)}`}>All updates</a>
              </div>
            </div>
          </aside>
        </div>

        <div className="container">
          {related.length > 0 && (
            <section className="cl-related" aria-labelledby="cl-related-title">
              <p className="label">More updates</p>
              <h2 className="head" id="cl-related-title">Related changes</h2>
              <div className="cl-rel-grid">
                {related.map((item) => (
                  <a className="panel cl-rel" key={item.id || item.slug} href={`/changelog/${encodeURIComponent(item.slug)}`}>
                    <EntryMeta entry={{ ...item, realm: item.realm || 'General' }} />
                    <h3 className="e-title">{item.title || item.version}</h3>
                    <ChangeCounts groups={groupChanges(item.changes)} />
                  </a>
                ))}
              </div>
            </section>
          )}

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

export default ChangelogDetail
