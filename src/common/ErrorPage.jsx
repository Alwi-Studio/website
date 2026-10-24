import './pages.css'

// The Minecraft death screen. Every "not found" route uses it; callers pass their own
// message and buttons (title is the line under "You Died!", code is the score).
function ErrorPage({
  code = '404',
  eyebrow = 'Page not found',
  title = 'This page fell out of the world.',
  description = 'The link may be incorrect, or the page may have been moved.',
  primaryHref = '/',
  primaryLabel = 'Respawn',
  secondaryHref = '/#realms',
  secondaryLabel = 'Title Screen',
}) {
  return (
    <main>
      <section className="death" aria-labelledby="death-title">
        <picture className="death-bg">
          <source media="(max-aspect-ratio: 4/5)" srcSet="/img/street-path.webp" width="1000" height="1250" />
          <img src="/img/street-wide.webp" width="2000" height="1127" alt="" fetchPriority="high" />
        </picture>
        <div className="container death-in">
          <p className="label">Error {code} · {eyebrow}</p>
          <h1 id="death-title">You Died!</h1>
          <p className="death-msg">{title}</p>
          <p className="death-sub">{description}</p>
          <p className="death-score">Score: <b>{code}</b></p>
          <div className="death-btns">
            <a className="mc-btn" href={primaryHref}>{primaryLabel}</a>
            <a className="mc-btn" href={secondaryHref}>{secondaryLabel}</a>
          </div>
        </div>
      </section>
    </main>
  )
}

export default ErrorPage
