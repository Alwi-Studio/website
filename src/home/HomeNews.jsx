import { useState } from 'react'
import { revealRef } from '../common/reveal.js'
import { fallbackImage, postImage, tagClass } from '../news/postInfo.js'

function Post({ item, index, big }) {
  // A dead remote image (an expired Discord link, say) swaps once to one of the server's screenshots.
  const [failed, setFailed] = useState(false)
  const src = failed ? fallbackImage(index) : postImage(item, big ? 1400 : 700, index)
  return (
    <a className={`post ${big ? 'post-big' : 'post-small'} panel`} href={`/news/${encodeURIComponent(item.slug)}`} data-reveal data-delay={big ? undefined : String(index)} ref={revealRef}>
      <div className="pic"><img src={src} width="1400" height="788" alt="" loading="lazy" onError={() => setFailed(true)} /></div>
      <div className="post-body">
        <p className="post-meta">
          {item.category && <span className={`tag ${tagClass(item.category)}`}>{item.category}</span>}
          {item.date}
        </p>
        <h3>{item.title}</h3>
        {item.description && <p>{item.description}</p>}
      </div>
    </a>
  )
}

function HomeNews({ section, items, isLoading }) {
  const posts = items.slice(0, section.count)
  const [first, ...rest] = posts

  return (
    <section className="section" id="news">
      <div className="container">
        <header className="sec-head" data-reveal ref={revealRef}>
          {section.kicker && <p className="label">{section.kicker}</p>}
          <h2 className="head">{section.title}</h2>
          {section.lead && <p>{section.lead}</p>}
        </header>
        {first ? (
          <div className="news-grid">
            <Post item={first} index={0} big />
            {rest.length > 0 && (
              <div className="news-side">
                {rest.map((item, i) => <Post key={item.slug} item={item} index={i + 1} />)}
              </div>
            )}
          </div>
        ) : (
          <p className="empty">{isLoading ? 'Loading news…' : 'No news yet.'}</p>
        )}
        <div className="sec-foot"><a className="btn btn-stone" href="/news">All news</a></div>
      </div>
    </section>
  )
}

export default HomeNews
