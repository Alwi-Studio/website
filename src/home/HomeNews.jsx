import { getOptimizedImageUrl } from '../common/imageOptimizer.js'
import { revealRef } from '../common/reveal.js'

const tagClass = { Update: 'tag-update', Announcement: 'tag-news', Community: 'tag-community', Preview: 'tag-preview' }
const fallbackImages = ['/img/hub-center.webp', '/img/hub-left.webp', '/img/street-right.webp', '/img/street-center.webp', '/img/hub-right.webp', '/img/street-left.webp']

// Remote news images go through the existing /api/image optimizer; local paths are used as is.
function postImage(item, index, width) {
  if (typeof item.img !== 'string' || !item.img) return fallbackImages[index % fallbackImages.length]
  return getOptimizedImageUrl(item.img, width) || item.img
}

function Post({ item, index, big }) {
  return (
    <a className={`post ${big ? 'post-big' : 'post-small'} panel`} href={`/news/${encodeURIComponent(item.slug)}`} data-reveal data-delay={big ? undefined : String(index)} ref={revealRef}>
      <div className="pic"><img src={postImage(item, index, big ? 1400 : 700)} width="1400" height="788" alt="" loading="lazy" /></div>
      <div className="post-body">
        <p className="post-meta">
          {item.category && <span className={`tag ${tagClass[item.category] ?? 'tag-news'}`}>{item.category}</span>}
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
