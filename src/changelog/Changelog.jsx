import { useMemo } from 'react'
import { Icon } from '../common/Icons.jsx'
import { RichInline } from '../common/RichText.jsx'
import { getOptimizedImageUrl } from '../common/imageOptimizer.js'
import { isSafeImageUrl } from '../common/safeUrls.js'
import { getChangeTypeLabel } from './changelogData.js'
import { isIsoDate } from './changeGroups.js'
import './pages-changelog.css'

export function EntryMeta({ entry }) {
  return (
    <p className="e-meta">
      {entry.version && <span className="e-ver">{entry.version}</span>}
      <span className="pill">{entry.realm}</span>
      {entry.tag && <span className="pill" style={{ '--c': 'var(--muted)' }}>{entry.tag}</span>}
      {entry.date && (isIsoDate(entry.dateValue) ? <time dateTime={entry.dateValue}>{entry.date}</time> : <span>{entry.date}</span>)}
    </p>
  )
}

export function ChangeCounts({ groups }) {
  return (
    <p className="e-counts">
      {groups.map((group) => (
        <span key={group.type} style={{ '--c': `var(--t-${group.type})` }}>
          {group.items.length} {getChangeTypeLabel(group.type).toLowerCase()}
        </span>
      ))}
    </p>
  )
}

// type: the active change-type filter; groups of other types are hidden, not removed.
export function ChangeGroups({ groups, type = 'all', Heading = 'h4' }) {
  return (
    <div className="e-groups">
      {groups.map((group) => (
        <section className="cg" key={group.type} style={{ '--tc': `var(--t-${group.type})` }} hidden={type !== 'all' && type !== group.type}>
          <Heading className="cg-head">
            <span className="pill">{getChangeTypeLabel(group.type)}</span>
            <span className="rule" aria-hidden="true" />
            <span className="n">{group.items.length}</span>
          </Heading>
          <ul>
            {group.items.map((item, index) => (
              <li key={index}><RichInline text={item} /></li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

// One timeline entry. `open` is controlled so deep links and the filters can open it.
function Changelog({ entry, groups, open, onToggle, type, onCopy }) {
  const title = entry.title || entry.version
  const imageSrc = useMemo(
    () => (isSafeImageUrl(entry.img) ? getOptimizedImageUrl(entry.img, 900) || entry.img : ''),
    [entry.img],
  )

  return (
    <article className="entry panel" id={entry.slug}>
      <details open={open} onToggle={(event) => onToggle(entry.slug, event.currentTarget.open)}>
        <summary>
          <EntryMeta entry={entry} />
          <h3 className="e-title">{title}</h3>
          {groups.length > 0 && <ChangeCounts groups={groups} />}
          <span className="e-chev" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
          </span>
        </summary>
        <div className="e-body">
          {imageSrc && <img className="e-pic" src={imageSrc} alt="" width="900" height="338" loading="lazy" decoding="async" />}
          {entry.summary && <p className="e-sum"><RichInline text={entry.summary} /></p>}
          {groups.length > 0 ? <ChangeGroups groups={groups} type={type} /> : <p className="e-sum">No changes were listed for this entry.</p>}
          <div className="e-actions">
            <button className="btn btn-stone btn-sm" type="button" onClick={() => onCopy(entry)} aria-label={`Copy link to ${title}`}>
              <Icon name="copy" />Copy link
            </button>
            <a className="btn btn-primary btn-sm" href={`/changelog/${encodeURIComponent(entry.slug)}`}>Open page</a>
            {entry.author && <span className="e-by">By {entry.author}</span>}
          </div>
        </div>
      </details>
    </article>
  )
}

export default Changelog
