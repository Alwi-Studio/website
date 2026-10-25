import { useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from './Icons.jsx'
import { getOptimizedImageUrl } from './imageOptimizer.js'
import { revealRef } from './reveal.js'
import { useSite } from './siteContext.js'
import { copyText } from './toastBus.js'
import './wiki.css'

// Picture for each category's card and its articles' header band. Presentation only:
// the wiki document has no image field, so unknown category ids get the default.
const WIKI_PICTURES = {
  'getting-started': ['/img/street-center.webp', '50% 60%'],
  realms: ['/img/hub-right.webp', '50% 40%'],
  economy: ['/img/street-right.webp', '40% 50%'],
  'ranks-perks': ['/img/hub-podium-wide.webp', '50% 45%'],
  commands: ['/img/street-left.webp', '50% 40%'],
}
const DEFAULT_PICTURE = ['/img/hub-wide.webp', '50% 40%']
const START_SLUGS = ['how-to-join', 'first-steps', 'essential-commands']
const EXAMPLE_SEARCHES = ['bedrock', '/sethome', 'shop', 'ranks']
const NUMBER_WORDS = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve']

const articleHref = (slug) => `/wiki/${encodeURIComponent(slug)}`

export function WikiPicture({ categoryId, ...props }) {
  const [src, position] = WIKI_PICTURES[categoryId] ?? DEFAULT_PICTURE
  return <img src={src} alt="" style={{ '--pos': position }} {...props} />
}

// Markdown to plain text for search and snippets; lines (list items, headings) join with " · ".
// Patterns are line-anchored or length-bounded, so a long admin-written body stays near linear.
function plainText(markdown) {
  return String(markdown ?? '')
    .replace(/\[([^\]\n]{1,200})\]\([^)\s]{0,500}\)/g, '$1')
    .replace(/^[ \t]*(?::::|```).*$/gm, '')
    .replace(/^[ \t:|-]+$/gm, '')
    .replace(/^[ \t]*(?:- \[[ xX]\]|#{1,3}|[-*]|>|\d+\.)[ \t]+/gm, '')
    .replace(/\*\*|__|~~|\|\||`/g, '')
    .replace(/\|/g, ' ')
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join(' · ')
}

// About 50 characters before the first match and 120 after, cut at spaces.
function snippet(doc, terms) {
  const lower = doc.text.toLowerCase()
  const at = Math.min(...terms.map((term) => lower.indexOf(term)).filter((index) => index >= 0))
  if (!Number.isFinite(at)) return doc.article.excerpt ?? ''
  const from = at > 50 ? doc.text.lastIndexOf(' ', at - 50) + 1 : 0
  const end = doc.text.indexOf(' ', at + 120)
  const to = end < 0 ? doc.text.length : end
  return (from ? '…' : '') + doc.text.slice(from, to).trim() + (to < doc.text.length ? '…' : '')
}

function searchDocs(docs, query) {
  const terms = [...new Set(query.toLowerCase().split(/\s+/).filter(Boolean))].slice(0, 6)
  if (terms.length === 0) return { terms, hits: [] }
  const hits = docs
    .filter((doc) => terms.every((term) => doc.hay.includes(term)))
    .map((doc) => ({ doc, score: terms.reduce((sum, term) => sum + (doc.titleLower.includes(term) ? 3 : 1), 0) }))
    .sort((a, b) => b.score - a.score)
    .map(({ doc }) => doc)
  return { terms, hits }
}

// The query is the viewer's own input: matches are wrapped in <mark> as React text, never parsed as HTML.
function Marked({ text, pattern }) {
  return String(text).split(pattern).map((part, index) => (index % 2 ? <mark key={index}>{part}</mark> : part))
}

// "Ask on Discord" band that closes both wiki pages.
export function WikiHelpBand({ kicker, title, lead, image }) {
  const { settings } = useSite()
  return (
    <div className="discord help-band" data-reveal ref={revealRef}>
      <img src={image} width="2000" height="1127" alt="" loading="lazy" />
      <p className="label">{kicker}</p>
      <h2 className="head">{title}</h2>
      <p className="lead">{lead}</p>
      <div className="row">
        <a className="btn btn-discord" href={settings.discordUrl} target="_blank" rel="noreferrer">
          <Icon name="discord" />
          Ask on Discord
        </a>
        <button className="btn btn-dark" type="button" onClick={() => copyText(settings.serverAddress)}>
          <Icon name="copy" />
          Copy server IP
        </button>
      </div>
    </div>
  )
}

// Shown by App while the wiki document loads, on both wiki routes.
export function WikiLoading() {
  return (
    <main className="wiki" aria-busy="true">
      <section className="page-hero">
        <img src="/img/wiki-hero.webp" srcSet="/img/wiki-hero-sm.webp 1000w, /img/wiki-hero.webp 2000w" sizes="100vw" width="2000" height="963" alt="" style={{ '--pos': '50% 30%' }} />
        <div className="container">
          <nav className="crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span><span aria-current="page">Wiki</span></nav>
          <p className="label">Server Wiki</p>
          <div className="skeleton" style={{ marginTop: 16, height: 56, maxWidth: 440 }} />
          <div className="skeleton" style={{ marginTop: 30, height: 66, maxWidth: 780 }} />
        </div>
      </section>
      <div className="page">
        <div className="container wiki-skel-cards">
          {[0, 1, 2].map((index) => <div className="skeleton" style={{ height: 200 }} key={index} />)}
        </div>
      </div>
    </main>
  )
}

function RealmIndex({ realms, articles }) {
  if (realms.length === 0) return null
  const bySlug = new Map(articles.map((article) => [article.slug, article]))
  // A realm's guide is the article with the realm's id as slug, or the article its link points at.
  // Nothing else counts: a realm without one says so instead of linking to an invented guide.
  const items = realms.map((realm) => {
    const linkedSlug = /^\/wiki\/([^/?#]+)/.exec(realm.href)?.[1]
    return { realm, guide: bySlug.get(realm.id) ?? (linkedSlug ? bySlug.get(linkedSlug) : undefined) }
  })
  const missing = items.filter((item) => !item.guide).length
  const count = realms.length
  const lead = missing === count
    ? 'None has its own guide yet; for help with a realm, ask on Discord.'
    : missing === 0
      ? 'Each one has its own guide.'
      : 'Realms marked "Guide coming soon" have no guide yet; for help with those, ask on Discord.'

  return (
    <section className="wiki-sec" aria-labelledby="ri-h">
      <header className="sec-head" data-reveal ref={revealRef}>
        <p className="label">Realm index</p>
        <h2 className="head" id="ri-h">{NUMBER_WORDS[count] ?? count} {count === 1 ? 'realm' : 'realms'}, one IP</h2>
        <p>Every realm you can walk into from the hub. {lead}</p>
      </header>
      <div className="ri">
        {items.map(({ realm, guide }, index) => {
          // Without a guide, a card still follows the realm's own link (leaderboard, patch notes),
          // but not a link back into the wiki, which would only lead here.
          const href = guide ? articleHref(guide.slug) : /^\/wiki(?:[/?#]|$)/.test(realm.href) ? '' : realm.href
          const external = Boolean(href) && !href.startsWith('/')
          const Card = href ? 'a' : 'div'
          return (
            <Card
              key={realm.id}
              className="realm"
              href={href || undefined}
              target={external ? '_blank' : undefined}
              rel={external ? 'noreferrer' : undefined}
              style={{ '--realm': realm.color }}
              data-reveal
              data-delay={index % 4 || undefined}
              ref={revealRef}
            >
              <img src={getOptimizedImageUrl(realm.image, 600) || realm.image} width="900" height="1200" alt="" loading="lazy" />
              {realm.label && <p className="label">{realm.label}</p>}
              <h3 className="realm-name">{realm.name}</h3>
              {guide
                ? <span className="realm-go">Read guide <span aria-hidden="true">→</span></span>
                : <span className="soon">Guide coming soon</span>}
              {!guide && href && realm.linkLabel && <span className="realm-go">{realm.linkLabel} <span aria-hidden="true">→</span></span>}
            </Card>
          )
        })}
      </div>
    </section>
  )
}

function WikiPage({ eyebrow, title, intro, updated, categories = [] }) {
  const { home, settings } = useSite()
  const [query, setQuery] = useState('')
  // The results float over the page, so they close once focus leaves the search (or on Escape).
  const [open, setOpen] = useState(false)
  const inputRef = useRef(null)

  const docs = useMemo(() => categories.flatMap((category) => (category.articles ?? []).map((article) => {
    const text = plainText(`${article.excerpt ?? ''}\n${article.body ?? ''}`)
    return {
      article,
      category,
      text,
      hay: `${article.title} ${category.name} ${text}`.toLowerCase(),
      titleLower: String(article.title).toLowerCase(),
    }
  })), [categories])
  const articles = docs.map((doc) => doc.article)
  const bySlug = new Map(docs.map((doc) => [doc.article.slug, doc]))
  const start = START_SLUGS.map((slug) => bySlug.get(slug)).filter(Boolean)
  const examples = useMemo(() => EXAMPLE_SEARCHES.filter((example) => searchDocs(docs, example).hits.length > 0), [docs])

  const trimmed = query.trim().slice(0, 80)
  const { terms, hits } = searchDocs(docs, trimmed)
  const pattern = terms.length ? new RegExp(`(${terms.map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi') : null
  const resultsHead = hits.length ? `${hits.length} ${hits.length === 1 ? 'guide' : 'guides'} found` : 'No guides found'

  // "/" jumps to the search field from anywhere on the page.
  useEffect(() => {
    function onKey(event) {
      const active = document.activeElement
      if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey) return
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(active?.tagName) || active?.isContentEditable) return
      event.preventDefault()
      inputRef.current?.focus()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // The page renders after the wiki loads, so the browser's own jump to /wiki#cat-… already missed it.
  // Jump once the web fonts are in: a font swap after the jump pushes the target under the nav.
  useEffect(() => {
    const target = window.location.hash.length > 1 ? document.getElementById(window.location.hash.slice(1)) : null
    if (target) document.fonts.ready.then(() => target.scrollIntoView({ block: 'start' }))
  }, [])

  function onSubmit(event) {
    event.preventDefault()
    if (hits[0]) window.location.assign(articleHref(hits[0].article.slug))
  }

  function runExample(example) {
    setQuery(example)
    inputRef.current?.focus()
  }

  return (
    <main className="wiki">
      <section className="page-hero">
        <img src="/img/wiki-hero.webp" srcSet="/img/wiki-hero-sm.webp 1000w, /img/wiki-hero.webp 2000w" sizes="100vw" width="2000" height="963" alt="" style={{ '--pos': '50% 30%' }} fetchPriority="high" />
        <div className="container">
          <nav className="crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span><span aria-current="page">Wiki</span></nav>
          {eyebrow && <p className="label">{eyebrow}</p>}
          <h1>{title}</h1>
          {intro && <p className="lead">{intro}</p>}
          <p className="wiki-stats label">
            <span><b>{articles.length}</b> {articles.length === 1 ? 'guide' : 'guides'}</span>
            <span><b>{categories.length}</b> {categories.length === 1 ? 'topic' : 'topics'}</span>
            {updated && <span>Updated <b>{updated}</b></span>}
          </p>
          <form
            className="wiki-search"
            role="search"
            autoComplete="off"
            onSubmit={onSubmit}
            onFocus={() => setOpen(true)}
            onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false) }}
            onKeyDown={(event) => { if (event.key === 'Escape') setOpen(false) }}
          >
            <div className="field">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.6-3.6" /></svg>
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(event) => { setQuery(event.target.value); setOpen(true) }}
                placeholder="Search guides, commands, realms…"
                maxLength={80}
                aria-label="Search the wiki"
                aria-describedby="wiki-results-status"
                enterKeyHint="search"
              />
              {query ? (
                <button className="wiki-clear" type="button" aria-label="Clear search" onClick={() => { setQuery(''); inputRef.current?.focus() }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
                </button>
              ) : (
                <kbd aria-hidden="true">/</kbd>
              )}
            </div>
            {trimmed && open && (
              <div className="results panel" onMouseDown={(event) => event.preventDefault()}>
                <p className="results-head label">{resultsHead}</p>
                {hits.length === 0 ? (
                  <p className="none">
                    Nothing in the wiki matches “{trimmed}”.{' '}
                    <a href={settings.discordUrl} target="_blank" rel="noreferrer">Ask on Discord</a> and staff will help.
                  </p>
                ) : (
                  hits.map((doc) => (
                    <a className="result" href={articleHref(doc.article.slug)} key={doc.article.slug}>
                      <span className="result-top">
                        <b><Marked text={doc.article.title} pattern={pattern} /></b>
                        <span className="pill">{doc.category.name}</span>
                      </span>
                      <span className="snip"><Marked text={snippet(doc, terms)} pattern={pattern} /></span>
                    </a>
                  ))
                )}
              </div>
            )}
            {examples.length > 0 && (
              <div className="try" role="group" aria-label="Example searches">
                <span className="label">Try</span>
                {examples.map((example) => (
                  <button key={example} type="button" onClick={() => runExample(example)}>{example}</button>
                ))}
              </div>
            )}
          </form>
          <p className="sr-only" id="wiki-results-status" role="status">{trimmed ? resultsHead : ''}</p>
        </div>
      </section>

      <div className="page">
        <div className="container">
          {start.length > 0 && (
            <section className="wiki-sec" aria-labelledby="start-h">
              <header className="sec-head" data-reveal ref={revealRef}>
                <p className="label">New here?</p>
                <h2 className="head" id="start-h">Start here</h2>
                <p>
                  {NUMBER_WORDS[start.length]} {start.length === 1 ? 'guide that takes' : 'guides that take'} you from the multiplayer screen to your first home in the hub.
                </p>
              </header>
              <ol className="start">
                {start.map((doc, index) => (
                  <li key={doc.article.slug} data-reveal data-delay={index || undefined} ref={revealRef}>
                    <a className="panel" href={articleHref(doc.article.slug)}>
                      <span className="num" aria-hidden="true">{index + 1}</span>
                      <span>
                        <span className="label">Step {index + 1} · {doc.category.name}</span>
                        <b>{doc.article.title}</b>
                        {doc.article.excerpt && <p>{doc.article.excerpt}</p>}
                        <span className="go">Read guide <span aria-hidden="true">→</span></span>
                      </span>
                    </a>
                  </li>
                ))}
              </ol>
            </section>
          )}

          <section className="wiki-sec" aria-labelledby="cats-h">
            <header className="sec-head" data-reveal ref={revealRef}>
              <p className="label">Browse</p>
              <h2 className="head" id="cats-h">Every guide, by topic</h2>
            </header>
            {categories.length === 0 ? (
              <p className="empty panel">The wiki is being written. Check back soon.</p>
            ) : (
              <div className="cats">
                {categories.map((category, index) => {
                  const list = category.articles ?? []
                  return (
                    <article className="cat panel" id={`cat-${category.id}`} key={category.id} data-reveal data-delay={index % 3 || undefined} ref={revealRef}>
                      <div className="cat-pic">
                        <WikiPicture categoryId={category.id} loading="lazy" />
                        <span className="realm-badge label">{list.length} {list.length === 1 ? 'guide' : 'guides'}</span>
                        <h3>{list[0] ? <a href={articleHref(list[0].slug)}>{category.name}</a> : category.name}</h3>
                      </div>
                      <div className="cat-body">
                        {category.description && <p className="cat-desc">{category.description}</p>}
                        {list.length === 0 ? (
                          <p className="cat-empty">No guides in this topic yet.</p>
                        ) : (
                          <ul className="cat-list">
                            {list.map((article) => (
                              <li key={article.slug}>
                                <a href={articleHref(article.slug)}>
                                  <b>{article.title}</b>
                                  {article.excerpt && <small>{article.excerpt}</small>}
                                  <span className="arr" aria-hidden="true">→</span>
                                </a>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </section>

          <RealmIndex realms={home.realms.filter((realm) => realm.enabled)} articles={articles} />

          <WikiHelpBand
            kicker="Still stuck?"
            title="Ask on Discord"
            lead="Staff support happens on the AlwiNation Discord. Ask there and someone will point you the right way."
            image="/img/street-wide.webp"
          />
        </div>
      </div>
    </main>
  )
}

export default WikiPage
