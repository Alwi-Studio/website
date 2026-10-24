import { useEffect, useRef, useState } from 'react'
import MarkdownBody from './MarkdownBody.jsx'
import { WikiHelpBand, WikiPicture } from './WikiPage.jsx'

const articleHref = (slug) => `/wiki/${encodeURIComponent(slug)}`

// "On this page" links with scrollspy: the last heading that has passed under the nav is current.
function OnThisPage({ items }) {
  const [active, setActive] = useState(0)

  useEffect(() => {
    let frame = 0
    function spy() {
      frame = 0
      let current = 0
      items.forEach((item, index) => {
        const top = document.getElementById(item.id)?.getBoundingClientRect().top
        if (top !== undefined && top < 140) current = index
      })
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) current = items.length - 1
      setActive(current)
    }
    function onScroll() {
      if (!frame) frame = requestAnimationFrame(spy)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    spy()
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(frame)
    }
  }, [items])

  return (
    <nav className="side-group" aria-labelledby="wiki-on-page">
      <p className="label" id="wiki-on-page">On this page</p>
      {items.map((item, index) => (
        <a href={`#${item.id}`} key={item.id} aria-current={index === active ? 'true' : undefined}>{item.text}</a>
      ))}
    </nav>
  )
}

function WikiArticle({ article, category, wiki }) {
  const categories = wiki?.categories ?? []
  const siblingArticles = category.articles ?? []
  const otherCategories = categories.filter((cat) => cat.id !== category.id)
  const all = categories.flatMap((cat) => (cat.articles ?? []).map((item) => ({ item, cat })))
  const index = all.findIndex(({ item }) => item.slug === article.slug)
  const prev = index > 0 ? all[index - 1] : null
  const next = index >= 0 && index < all.length - 1 ? all[index + 1] : null
  const body = String(article.body ?? '')
  const hasBody = Boolean(body.trim())
  const words = body.split(/\s+/).filter((word) => /[\p{L}\p{N}]/u.test(word)).length
  const categoryHref = `/wiki#cat-${category.id}`

  // The shared renderer gives its headings no ids, so the contents list names them here.
  // Ids are "sec-" plus [a-z0-9-], unique on the page; an id the renderer already set is kept.
  const proseRef = useRef(null)
  const [contents, setContents] = useState([])
  useEffect(() => {
    const headings = [...(proseRef.current?.querySelectorAll('h2') ?? [])]
    for (const heading of headings) {
      if (heading.id) continue
      const base = `sec-${heading.textContent.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'section'}`
      let id = base
      for (let n = 2; document.getElementById(id); n += 1) id = `${base}-${n}`
      heading.id = id
    }
    setContents(headings.map((heading) => ({ id: heading.id, text: heading.textContent })))
    // A shared /wiki/<slug>#sec-… link arrives before these ids exist, so jump once they do,
    // and after the web fonts are in (a later font swap moves the heading under the nav).
    const target = headings.find((heading) => `#${heading.id}` === window.location.hash)
    if (target) document.fonts.ready.then(() => target.scrollIntoView({ block: 'start' }))
  }, [body])

  return (
    <main className="wiki wiki-art">
      <section className="page-hero">
        <WikiPicture categoryId={category.id} width="1400" height="788" fetchPriority="high" />
        <div className="container">
          <nav className="crumbs" aria-label="Breadcrumb">
            <a href="/">Home</a>
            <span aria-hidden="true">/</span>
            <a href="/wiki">Wiki</a>
            <span aria-hidden="true">/</span>
            <a href={categoryHref}>{category.name}</a>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{article.title}</span>
          </nav>
          <p className="label">{category.name}</p>
          <h1>{article.title}</h1>
          {article.excerpt && <p className="lead">{article.excerpt}</p>}
          <div className="art-meta">
            {article.updated && <span className="chip">Updated <b>{article.updated}</b></span>}
            {hasBody && <span className="chip">Read <b>{Math.max(1, Math.round(words / 200))} min</b></span>}
          </div>
        </div>
      </section>

      <div className="page">
        <div className="container">
          <div className="with-side">
            <aside className="side">
              <div className="toc panel">
                <nav className="side-group" aria-labelledby="wiki-side-topic">
                  <p className="label" id="wiki-side-topic"><a href={categoryHref}>{category.name}</a></p>
                  {siblingArticles.map((item) => (
                    <a href={articleHref(item.slug)} key={item.slug} aria-current={item.slug === article.slug ? 'page' : undefined}>
                      {item.title}
                    </a>
                  ))}
                </nav>
                {contents.length > 0 && <OnThisPage items={contents} />}
                {otherCategories.length > 0 && (
                  <nav className="side-group side-other" aria-labelledby="wiki-side-other">
                    <p className="label" id="wiki-side-other">Other topics</p>
                    {otherCategories.map((cat) => (
                      <a href={`/wiki#cat-${cat.id}`} key={cat.id}>{cat.name}</a>
                    ))}
                  </nav>
                )}
                <a className="back" href="/wiki"><span aria-hidden="true">←</span> All guides</a>
              </div>
            </aside>

            <div className="art">
              <article className="prose" ref={proseRef}>
                {hasBody ? <MarkdownBody text={body} /> : <p className="art-empty">This article does not have any content yet.</p>}
              </article>

              {(prev || next) && (
                <nav className="pager" aria-label="More guides">
                  {prev && (
                    <a className="panel prev" href={articleHref(prev.item.slug)}>
                      <span className="label">← Previous</span>
                      <b>{prev.item.title}</b>
                      <small>{prev.cat.name}</small>
                    </a>
                  )}
                  {next && (
                    <a className="panel next" href={articleHref(next.item.slug)}>
                      <span className="label">Next →</span>
                      <b>{next.item.title}</b>
                      <small>{next.cat.name}</small>
                    </a>
                  )}
                </nav>
              )}
            </div>
          </div>

          <WikiHelpBand
            kicker="Was this helpful?"
            title="Still have a question?"
            lead="If something here is unclear or out of date, ask on the AlwiNation Discord. Staff support happens there."
            image="/img/wiki-hero.webp"
          />
        </div>
      </div>
    </main>
  )
}

export default WikiArticle
