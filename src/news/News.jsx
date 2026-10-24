import { useState } from 'react'
import { revealRef } from '../common/reveal.js'
import { fallbackImage, plainText, postImage, tagClass } from './postInfo.js'
import './news.css'

// One news card for the index grid and the article's "More news" row.
function News({ item, index = 0, delay }) {
  // A broken remote image swaps once to one of the server's own screenshots.
  const [failed, setFailed] = useState(false)
  const src = failed ? fallbackImage(index) : postImage(item, 700, index)

  return (
    <a className="post panel news-card" href={`/news/${encodeURIComponent(item.slug)}`} data-reveal data-delay={delay} ref={revealRef}>
      <div className="pic">
        <img src={src} width="1400" height="788" alt="" loading="lazy" decoding="async" onError={() => setFailed(true)} />
      </div>
      <div className="post-body">
        <p className="post-meta">
          {item.category && <span className={`tag ${tagClass(item.category)}`}>{item.category}</span>}
          {item.date && <span>{item.date}</span>}
          {item.date && item.readingTime && <span aria-hidden="true">·</span>}
          {item.readingTime && <span>{item.readingTime}</span>}
        </p>
        <h3>{item.title}</h3>
        {/* Plain text: the whole card is a link, and a link inside a link is invalid. */}
        {item.description && <p>{plainText(item.description)}</p>}
        <p className="post-foot">
          <span className="by"><img src="/img/logo-mark.webp" width="20" height="20" alt="" />{item.author || 'AlwiNation Team'}</span>
          <span className="go">Read <span aria-hidden="true">→</span></span>
        </p>
      </div>
    </a>
  )
}

export default News
