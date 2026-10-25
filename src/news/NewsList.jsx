import { useMemo, useRef, useState } from 'react'
import Particles from '../common/Particles.jsx'
import { revealRef } from '../common/reveal.js'
import CommunityBand from '../home/CommunityBand.jsx'
import News from './News.jsx'
import {
  fallbackImage,
  isSeasonPost,
  newsDiscordBand,
  plainText,
  postEffect,
  postHighlights,
  postImage,
  seasonNumber,
  tagClass,
} from './postInfo.js'
import './news.css'

// What the search box looks through: the card's own text plus the highlights / patch-note titles.
function searchText(item) {
  return [item.title, item.description, item.category, item.date, item.author, ...postHighlights(item).items]
    .map(plainText)
    .join(' ')
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

function FeaturedPost({ item }) {
  const [failed, setFailed] = useState(false)
  const cold = isSeasonPost(item)
  const effect = postEffect(item)
  const season = seasonNumber(item)
  const { items: highlights, changes } = postHighlights(item)

  return (
    <article className={`post panel feature${cold ? ' is-cold' : ''}`} data-reveal ref={revealRef}>
      <div className="pic">
        <img src={failed ? fallbackImage(0) : postImage(item, 1400)} width="1400" height="1114" alt="" decoding="async" onError={() => setFailed(true)} />
        {effect && <Particles {...effect} scale={0.7} />}
        <span className="feature-badge label">Featured</span>
        {season && <p className="feature-mark" aria-hidden="true"><span className="label">New season</span><b>Season <em>{season}</em></b></p>}
      </div>
      <div className="post-body">
        <p className="post-meta">
          {item.category && <span className={`tag ${tagClass(item.category)}`}>{item.category}</span>}
          {item.date && <span>{item.date}</span>}
          {item.date && item.readingTime && <span aria-hidden="true">·</span>}
          {item.readingTime && <span>{item.readingTime}</span>}
        </p>
        <h2><a href={`/news/${encodeURIComponent(item.slug)}`}>{item.title}</a></h2>
        {item.description && <p className="feature-desc">{plainText(item.description)}</p>}
        {highlights.length > 0 && (
          <>
            <p className="label feature-list-head">{changes ? `${highlights.length} headline changes` : 'Highlights'}</p>
            <ul className="feature-list">
              {highlights.slice(0, 12).map((text, index) => <li key={`${text}-${index}`}>{text}</li>)}
            </ul>
          </>
        )}
        <span className="btn btn-primary" aria-hidden="true">{changes ? 'Read the patch notes' : 'Read the post'} <span>→</span></span>
      </div>
    </article>
  )
}

function NewsList({ newsItems, isLoading = false }) {
  const [category, setCategory] = useState('all')
  const [query, setQuery] = useState('')
  const searchRef = useRef(null)

  // The newest post (admin posts come first, most recently updated first). The old seed-only
  // `featured` flag is ignored: the admin cannot set it, so it would pin a seed over real posts.
  const featured = newsItems[0]
  const categories = useMemo(() => ['all', ...new Set(newsItems.map((item) => item.category).filter(Boolean))], [newsItems])
  const haystacks = useMemo(() => new Map(newsItems.map((item) => [item, searchText(item)])), [newsItems])

  // The featured post is one of the results: it stays while it matches and hides when it does not.
  const q = query.trim().toLowerCase()
  const words = q.split(/\s+/).filter(Boolean)
  const shown = newsItems.filter(
    (item) => (category === 'all' || item.category === category) && words.every((word) => haystacks.get(item).includes(word)),
  )
  const featureShown = Boolean(featured) && shown.includes(featured)
  const rest = shown.filter((item) => item !== featured)

  let status = `${shown.length} ${shown.length === 1 ? 'post' : 'posts'}`
  if (category !== 'all') status += ` · ${category}`
  if (q) status += ` · “${q}”`

  function showAll() {
    setQuery('')
    setCategory('all')
    searchRef.current?.focus()
  }

  return (
    <main className="news-index">
      <section className="page-hero">
        <img src="/img/news-hero.webp" width="2000" height="1061" alt="" style={{ '--pos': '50% 30%' }} fetchPriority="high" />
        <div className="container">
          <nav className="crumbs" aria-label="Breadcrumb">
            <a href="/">Home</a><span aria-hidden="true">/</span><span aria-current="page">News</span>
          </nav>
          <p className="label">From the team</p>
          <h1>News &amp; Updates</h1>
          <p className="lead">Patch notes, events and announcements from the AlwiNation team, all in one place.</p>
        </div>
      </section>

      <section className="page">
        <div className="container">
          {isLoading ? (
            <>
              <p className="label news-count" role="status">Loading posts…</p>
              <div className="news-list" aria-hidden="true">
                {[0, 1, 2].map((index) => (
                  <div className="post panel news-card news-skel" key={index}>
                    <div className="pic skeleton" />
                    <div className="post-body">
                      <div className="skeleton" style={{ width: '40%' }} />
                      <div className="skeleton sk-title" />
                      <div className="skeleton" />
                      <div className="skeleton" style={{ width: '70%' }} />
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : newsItems.length === 0 ? (
            <div className="empty panel news-empty">
              <b className="head">No posts yet</b>
              <p>Check back soon. Announcements also go out on the Discord first.</p>
            </div>
          ) : (
            <>
              <div className="news-tools">
                <div className="seg scroll" role="group" aria-label="Filter posts by category">
                  {categories.map((name) => (
                    <button key={name} type="button" aria-pressed={category === name} onClick={() => setCategory(name)}>
                      {name === 'all' ? 'All' : name}{' '}
                      <span className="count">{name === 'all' ? newsItems.length : newsItems.filter((item) => item.category === name).length}</span>
                    </button>
                  ))}
                </div>
                <div className="field news-search">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="M20 20l-4.6-4.6" /></svg>
                  <input
                    ref={searchRef}
                    type="search"
                    placeholder="Search news"
                    aria-label="Search news"
                    autoComplete="off"
                    maxLength={80}
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                </div>
              </div>
              <p className="label news-count" role="status">{status}</p>

              {featureShown && <FeaturedPost item={featured} />}

              {rest.length > 0 && (
                <>
                  {featureShown && <header className="group-head news-sub"><h2 className="head">More posts</h2></header>}
                  <div className="news-list">
                    {rest.map((item, index) => (
                      <News key={item.slug} item={item} index={index + 1} delay={index % 3 ? String(index % 3) : undefined} />
                    ))}
                  </div>
                </>
              )}

              {shown.length === 0 && (
                <div className="empty panel news-empty">
                  <b className="head">No posts found</b>
                  <p>
                    {q
                      ? `Nothing matches “${q}”${category === 'all' ? '.' : ` in ${category}.`} Try another word or category.`
                      : `There are no ${category} posts yet.`}
                  </p>
                  <button className="btn btn-stone" type="button" onClick={showAll}>Show all posts</button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <CommunityBand section={newsDiscordBand} />
    </main>
  )
}

export default NewsList
