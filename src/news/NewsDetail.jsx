import { useEffect, useMemo, useState } from 'react'
import { Icon } from '../common/Icons.jsx'
import { RichBlocks } from '../common/MarkdownBody.jsx'
import Particles from '../common/Particles.jsx'
import { RichInline } from '../common/RichText.jsx'
import { revealRef } from '../common/reveal.js'
import { useSite } from '../common/siteContext.js'
import { copyText, showToast } from '../common/toastBus.js'
import CommunityBand from '../home/CommunityBand.jsx'
import News from './News.jsx'
import { isSeasonPost, newsDiscordBand, plainText, postHighlights, postImage, seasonNumber, tagClass } from './postInfo.js'
import './news.css'

const comparable = (text) => plainText(text).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

// Contents entries for the two shallowest heading levels, with unique ids. RichBlocks
// maps the shallowest level to h2 the same way, so entry.sub marks the h3s.
function buildContents(blocks) {
  const top = Math.min(3, ...blocks.filter((block) => block?.type === 'heading').map((block) => block.level ?? 2))
  const used = new Set()
  const ids = []
  const entries = []
  blocks.forEach((block, index) => {
    const depth = block?.type === 'heading' ? (block.level ?? 2) - top : 2
    if (depth > 1) return
    const label = plainText(block.text)
    let id = `s-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'section'}`
    while (used.has(id)) id += '-2'
    used.add(id)
    ids[index] = id
    entries.push({ id, label, sub: depth === 1 })
  })
  return { ids, entries }
}

// Marks the contents entry whose section is under the line 150px from the top.
function useScrollSpy(targetIds) {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    if (targetIds.length < 2) return undefined
    const targets = targetIds.map((id) => document.getElementById(id))
    let frame = 0
    const spy = () => {
      frame = 0
      let next = 0
      targets.forEach((target, index) => {
        if (target && target.getBoundingClientRect().top < 150) next = index
      })
      setCurrent(next)
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(spy)
    }
    spy()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(frame)
    }
  }, [targetIds])

  return current
}

async function copyPageLink() {
  try {
    await navigator.clipboard.writeText(window.location.href)
    showToast('Link copied')
  } catch {
    showToast('Copy the address bar to share this post')
  }
}

// The dark band keeps the clear navbar readable while the post loads.
export function NewsDetailLoading() {
  return (
    <main className="news-article art-loading" aria-busy="true">
      <section className="page-hero art-hero">
        <img src="/img/news-hero.webp" width="2000" height="1061" alt="" style={{ '--pos': '50% 30%' }} />
        <div className="container">
          <nav className="crumbs" aria-label="Breadcrumb">
            <a href="/">Home</a><span aria-hidden="true">/</span><a href="/news">News</a>
          </nav>
          <p className="label" role="status">Loading post…</p>
        </div>
      </section>
      <section className="page">
        <div className="container" aria-hidden="true">
          {[0, 1, 2, 3, 4, 5].map((index) => <div className="skeleton" key={index} />)}
        </div>
      </section>
    </main>
  )
}

function NewsDetail({ item, newsItems = [] }) {
  const { settings } = useSite()
  const [heroFailed, setHeroFailed] = useState(false)
  const cold = isSeasonPost(item)
  const season = seasonNumber(item)
  const { items: highlights, changes } = postHighlights(item)
  const related = newsItems.filter((newsItem) => newsItem.slug !== item.slug).slice(0, 3)

  // Patch notes often open with the post title as a "#" heading; the hero already shows it.
  const blocks = useMemo(() => {
    const body = Array.isArray(item.body) ? item.body : []
    return body[0]?.type === 'heading' && comparable(body[0].text) === comparable(item.title) ? body.slice(1) : body
  }, [item])
  const { ids, entries } = useMemo(() => buildContents(blocks), [blocks])
  const spyTargets = useMemo(() => ['art-body', ...entries.map((entry) => entry.id)], [entries])
  const current = useScrollSpy(spyTargets)

  useEffect(() => {
    document.title = `${item.title} — AlwiNation`
  }, [item.title])

  // The post renders after the news request, too late for the browser's own jump to a shared
  // "#section" link (the contents links and "Copy link" produce those).
  useEffect(() => {
    if (window.location.hash) document.getElementById(window.location.hash.slice(1))?.scrollIntoView({ block: 'start' })
  }, [])

  return (
    <main className="news-article">
      <article>
        <section className={`page-hero art-hero${cold ? ' is-cold' : ''}`}>
          <img
            src={heroFailed ? '/img/hub-wide.webp' : postImage(item, 1920)}
            width="1920"
            height="1080"
            alt=""
            style={{ '--pos': '50% 40%' }}
            fetchPriority="high"
            onError={() => setHeroFailed(true)}
          />
          {cold && <Particles kind="snow" />}
          <div className="container art-hero-in">
            <div>
              <nav className="crumbs" aria-label="Breadcrumb">
                <a href="/">Home</a><span aria-hidden="true">/</span>
                <a href="/news">News</a><span aria-hidden="true">/</span>
                <span aria-current="page">{item.title}</span>
              </nav>
              {(item.category || season) && (
                <p className="art-kicker">
                  {item.category && <span className={`tag ${tagClass(item.category)}`}>{item.category}</span>}
                  {season && <span className="label">Season {season}</span>}
                </p>
              )}
              <h1>{item.title}</h1>
              {item.description && <p className="lead"><RichInline text={item.description} /></p>}
              <ul className="art-meta">
                <li>
                  <img src="/img/logo-mark.webp" width="34" height="34" alt="" />
                  <span><span className="label">Author</span><b>{item.author || 'AlwiNation Team'}</b></span>
                </li>
                {item.date && <li><span><span className="label">Date</span><b>{item.date}</b></span></li>}
                {item.readingTime && <li><span><span className="label">Read time</span><b>{item.readingTime}</b></span></li>}
              </ul>
              <div className="art-actions">
                <button className="btn btn-primary" type="button" onClick={() => copyText(settings.serverAddress)}>Play now</button>
                <button className="btn btn-dark" type="button" onClick={copyPageLink}><Icon name="copy" />Copy link</button>
              </div>
            </div>
            {highlights.length > 0 && (
              <div className="mc-tooltip art-tip" role="note" aria-label={`${item.title} highlights`}>
                <p className="t-title">{item.title}</p>
                <p className="t-sub">{changes ? `${highlights.length} changes` : `${item.category || 'News'} · highlights`}</p>
                <ul className={highlights.length > 6 ? undefined : 'one'}>
                  {highlights.slice(0, 12).map((text, index) => <li key={`${text}-${index}`}><b>{text}</b></li>)}
                </ul>
                {changes && <p className="t-foot">Every change, explained below</p>}
              </div>
            )}
          </div>
        </section>

        <section className="page">
          <div className={`container with-side art-layout${entries.length ? '' : ' no-toc'}`}>
            {entries.length > 0 && (
              <aside className="side">
                <nav className="toc panel" aria-label="Contents">
                  <p className="label">Contents</p>
                  {[{ id: 'art-body', label: 'Overview' }, ...entries].map((entry, index) => (
                    <a
                      key={entry.id}
                      className={entry.sub ? 'sub' : undefined}
                      href={`#${entry.id}`}
                      aria-current={index === current ? 'location' : undefined}
                    >
                      {entry.label}
                    </a>
                  ))}
                </nav>
              </aside>
            )}
            <div>
              <div className="art-body prose rich" id="art-body">
                <RichBlocks blocks={blocks} anchors={ids} />
              </div>
              <div className="art-end">
                <p className="label">Share this post</p>
                <div>
                  <a className="btn btn-stone" href="/news">All news</a>
                  <button className="btn btn-primary" type="button" onClick={copyPageLink}><Icon name="copy" />Copy link</button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </article>

      {related.length > 0 && (
        <section className="section more" aria-labelledby="more-title">
          <div className="container">
            <header className="sec-head" data-reveal ref={revealRef}>
              <p className="label">From the team</p>
              <h2 className="head" id="more-title">More news</h2>
            </header>
            <div className="more-grid">
              {related.map((post, index) => (
                <News key={post.slug} item={post} index={index + 1} delay={index ? String(index) : undefined} />
              ))}
            </div>
            <div className="sec-foot"><a className="btn btn-stone" href="/news">All news</a></div>
          </div>
        </section>
      )}

      <CommunityBand section={newsDiscordBand} />
    </main>
  )
}

export default NewsDetail
