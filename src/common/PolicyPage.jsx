import { useEffect, useMemo, useState } from 'react'
import { Icon } from './Icons.jsx'
import MarkdownBody from './MarkdownBody.jsx'
import { RichInline } from './RichText.jsx'
import { revealRef } from './reveal.js'
import { useSite } from './siteContext.js'
import './pages.css'

const DOCS = [
  { key: 'rules', href: '/rules', label: 'Server rules', crumb: 'Rules' },
  { key: 'terms', href: '/terms', label: 'Terms of service', crumb: 'Terms' },
]

function PolicyDescription({ text }) {
  if (/^\s*:::(?:accordion|collapse)(?:\s|$)/m.test(text)) {
    return <MarkdownBody text={text} />
  }

  return <p className="pol-desc"><RichInline text={text} /></p>
}

// Items are numbered "<section>.<n>". "---" is a divider; an item written "3. text" keeps its own number.
function RuleItems({ items, prefix }) {
  let count = 0
  return (
    <ol className="rule-items">
      {items.map((value, index) => {
        const item = String(value ?? '')
        if (item === '---') return <li className="rule-break" role="presentation" key={index} />
        const own = /^(\d+)\.\s+/.exec(item)
        count = own ? Number(own[1]) : count + 1
        return (
          <li key={index}>
            <span className="rn">{prefix}.{count}</span>
            <span><RichInline text={own ? item.slice(own[0].length) : item} /></span>
          </li>
        )
      })}
    </ol>
  )
}

function slugifySection(value, index) {
  const base = String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return base || `section-${index + 1}`
}

const pad = (number) => String(number).padStart(2, '0')

// counts: optional { rules, terms } section counts for the tab badges.
function PolicyPage({ eyebrow, title, intro, updated, sections = [], activeKey = 'rules', counts, isLoading = false }) {
  const { settings } = useSite()
  const withIds = useMemo(
    () =>
      sections.map((section, index) => ({
        ...section,
        _id: slugifySection(section.title, index),
        subsections: Array.isArray(section.subsections)
          ? section.subsections.map((subsection, subsectionIndex) => ({
              ...subsection,
              _id: `${slugifySection(section.title, index)}-${slugifySection(subsection.title, subsectionIndex)}`,
            }))
          : [],
      })),
    [sections],
  )
  const targetIds = useMemo(
    () => withIds.flatMap((section) => [section._id, ...section.subsections.map((subsection) => subsection._id)]),
    [withIds],
  )
  const [activeId, setActiveId] = useState('')

  // Scrollspy: the current target is the last one whose top has passed under the nav.
  useEffect(() => {
    if (isLoading || targetIds.length === 0) return undefined
    let queued = false
    function spy() {
      queued = false
      let current = targetIds[0]
      for (const id of targetIds) {
        const top = document.getElementById(id)?.getBoundingClientRect().top
        if (top !== undefined && top <= 140) current = id
      }
      setActiveId(current)
    }
    function onScroll() {
      if (queued) return
      queued = true
      window.requestAnimationFrame(spy)
    }
    // The sections render after the policies load, so the browser's own jump to #section missed them.
    let hashId = ''
    try {
      hashId = decodeURIComponent(window.location.hash.slice(1))
    } catch {
      hashId = ''
    }
    if (targetIds.includes(hashId)) document.getElementById(hashId)?.scrollIntoView({ block: 'start', behavior: 'instant' })
    spy()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [isLoading, targetIds])

  const current = DOCS.find((doc) => doc.key === activeKey) ?? DOCS[0]
  const tocCurrent = (id) => (id === activeId ? 'location' : undefined)

  return (
    <main className="policy-page">
      <section className="page-hero rules-hero">
        <img src="/img/rules-hero.webp" width="2000" height="750" alt="" style={{ '--pos': '42% 45%' }} fetchPriority="high" />
        <div className="container">
          <nav className="crumbs" aria-label="Breadcrumb">
            <a href="/">Home</a><span aria-hidden="true">/</span><span aria-current="page">{current.crumb}</span>
          </nav>
          {eyebrow && <p className="label">{eyebrow}</p>}
          <h1>{title}</h1>
          {intro && <p className="lead"><RichInline text={intro} /></p>}
          <div className="rules-bar">
            <nav className="seg rules-tabs" aria-label="Document">
              {DOCS.map((doc) => (
                <a key={doc.key} href={doc.href} aria-current={doc.key === current.key ? 'page' : undefined}>
                  {doc.label}
                  {counts?.[doc.key] != null && <span className="count">{counts[doc.key]}</span>}
                </a>
              ))}
            </nav>
            {updated && (
              <p className="rules-updated">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M3 10h18M8 2v4M16 2v4" /></svg>
                Last updated <b>{updated}</b>
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="page">
        <div className="container">
          <div className="with-side">
            <aside className="side">
              {!isLoading && withIds.length > 0 && (
                <nav className="toc panel" aria-label="On this page">
                  <p className="label">On this page</p>
                  <ol>
                    {withIds.map((section, index) => (
                      <li key={section._id}>
                        <a href={`#${section._id}`} aria-current={tocCurrent(section._id)}>
                          <span className="n">{pad(index + 1)}</span>{section.title}
                        </a>
                        {section.subsections.length > 0 && (
                          <ol className="toc-sub">
                            {section.subsections.map((subsection) => (
                              <li key={subsection._id}>
                                <a href={`#${subsection._id}`} aria-current={tocCurrent(subsection._id)}>{subsection.title}</a>
                              </li>
                            ))}
                          </ol>
                        )}
                      </li>
                    ))}
                  </ol>
                </nav>
              )}
              <div className="panel side-report">
                <p className="label">Need staff?</p>
                <p>Report a player, appeal a punishment or ask about a rule.</p>
                <a className="btn btn-discord btn-sm" href={settings.discordUrl} target="_blank" rel="noreferrer">
                  <Icon name="discord" />Report a player
                </a>
              </div>
            </aside>

            <div className="rule-list" aria-busy={isLoading}>
              {isLoading
                ? [0, 1, 2].map((index) => <div className="skeleton pol-skel" key={index} />)
                : withIds.map((section, index) => (
                    <article className="panel rule-sec" id={section._id} aria-labelledby={`h-${section._id}`} key={section._id}>
                      <header className="rule-head">
                        <span className="rule-num" aria-hidden="true">{pad(index + 1)}</span>
                        <h2 id={`h-${section._id}`}><RichInline text={section.title} /></h2>
                      </header>
                      <div className="prose">
                        {section.description && <PolicyDescription text={section.description} />}
                        {Array.isArray(section.items) && section.items.length > 0 && <RuleItems items={section.items} prefix={index + 1} />}
                        {section.subsections.map((subsection, subsectionIndex) => (
                          <section className="rule-sub" id={subsection._id} aria-labelledby={`h-${subsection._id}`} key={subsection._id}>
                            <h3 id={`h-${subsection._id}`}><RichInline text={subsection.title} /></h3>
                            {subsection.description && <PolicyDescription text={subsection.description} />}
                            {Array.isArray(subsection.items) && subsection.items.length > 0 && (
                              <RuleItems items={subsection.items} prefix={`${index + 1}.${subsectionIndex + 1}`} />
                            )}
                          </section>
                        ))}
                      </div>
                    </article>
                  ))}
            </div>
          </div>

          <section className="discord report" aria-labelledby="report-title" data-reveal ref={revealRef}>
            <img src="/img/rules-report.webp" width="1400" height="583" alt="" loading="lazy" />
            <p className="label">Report a player</p>
            <h2 className="head" id="report-title">Saw someone break a rule?</h2>
            <p className="lead">Reports, appeals and questions about the rules go to the staff team on the AlwiNation Discord. Include the player's name and what happened. You can also contact staff in-game.</p>
            <div className="report-actions">
              <a className="btn btn-discord" href={settings.discordUrl} target="_blank" rel="noreferrer">
                <Icon name="discord" />Report on Discord
              </a>
              <a className="btn btn-dark" href="/staff">Meet the staff</a>
            </div>
          </section>
        </div>
      </section>
    </main>
  )
}

export default PolicyPage
