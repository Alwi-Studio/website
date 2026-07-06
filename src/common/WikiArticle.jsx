import MarkdownBody from './MarkdownBody.jsx'

function WikiArticle({ article, category, wiki }) {
  const categories = wiki?.categories ?? []
  const siblingArticles = category.articles ?? []
  const otherCategories = categories.filter((cat) => cat.id !== category.id)
  const hasBody = Boolean(String(article.body || '').trim())

  return (
    <main className="min-h-svh bg-bg pb-24 pt-32 text-white">
      {/* Header */}
      <section className="mx-auto max-w-[1080px] px-6">
        <nav aria-label="Breadcrumb" className="text-sm text-muted">
          <ol className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <li className="flex items-center">
              <a href="/wiki" className="transition hover:text-white">
                Wiki
              </a>
            </li>
            <li aria-hidden="true" className="text-muted-2">/</li>
            <li className="flex min-w-0 items-center">
              <a href={`/wiki#cat-${category.id}`} className="inline-flex min-w-0 items-center gap-1.5 transition hover:text-white">
                <span className="shrink-0">{category.icon || '\uD83D\uDCC4'}</span>
                <span className="truncate">{category.name}</span>
              </a>
            </li>
            <li aria-hidden="true" className="text-muted-2">/</li>
            <li className="min-w-0 max-w-full text-white" aria-current="page">
              <span className="block truncate">{article.title}</span>
            </li>
          </ol>
        </nav>

        <div className="relative mt-4 overflow-hidden rounded-[24px] border border-white/10 bg-surface p-7 shadow-[0_24px_70px_rgba(0,0,0,0.28)] sm:p-10">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(255,90,48,0.18),transparent_65%)] blur-2xl" />
          <div className="relative">
            <span className="eyebrow">{category.name}</span>
            <h1 className="mt-4 text-[clamp(30px,4.5vw,50px)] font-bold leading-[1.05] tracking-[-0.03em] text-white">
              {article.title}
            </h1>
            {article.excerpt && (
              <p className="mt-5 max-w-[70ch] text-[16.5px] leading-8 text-muted">{article.excerpt}</p>
            )}
            {article.updated && (
              <div className="mt-7">
                <span className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-bg-2 px-3.5 py-2 text-sm font-semibold text-muted">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="3" /><path d="M3 10h18M8 2v4M16 2v4" /></svg>
                  Last updated {article.updated}
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Body + sidebar */}
      <section className="mx-auto mt-8 max-w-[1080px] px-6">
        <div className="grid gap-6 lg:grid-cols-[260px_1fr] lg:items-start">
          <aside className="top-28 hidden lg:sticky lg:block">
            <nav className="rounded-[18px] border border-white/10 bg-surface p-4">
              <p className="flex items-center gap-2 px-1 text-xs font-bold uppercase tracking-[0.16em] text-muted-2">
                <span className="text-sm">{category.icon || '\uD83D\uDCC4'}</span>
                {category.name}
              </p>
              <ul className="mt-3 grid gap-0.5 p-0">
                {siblingArticles.map((item) => {
                  const isActive = item.slug === article.slug
                  return (
                    <li key={item.slug}>
                      <a
                        href={`/wiki/${item.slug}`}
                        className={`block rounded-lg px-3 py-1.5 text-sm leading-5 transition ${
                          isActive
                            ? 'bg-brand/12 font-semibold text-white shadow-[inset_0_0_0_1px_rgba(255,90,48,0.28)]'
                            : 'text-muted hover:bg-white/[0.05] hover:text-white'
                        }`}
                      >
                        {item.title}
                      </a>
                    </li>
                  )
                })}
              </ul>

              {otherCategories.length > 0 && (
                <>
                  <p className="mt-6 px-1 text-xs font-bold uppercase tracking-[0.16em] text-muted-2">Other wiki</p>
                  <ul className="mt-3 grid gap-0.5 p-0">
                    {otherCategories.map((cat) => (
                      <li key={cat.id}>
                        <a
                          href={`/wiki#cat-${cat.id}`}
                          className="flex items-center justify-between gap-2 rounded-lg px-3 py-1.5 text-sm text-muted transition hover:bg-white/[0.05] hover:text-white"
                        >
                          <span className="flex min-w-0 items-center gap-2">
                            <span>{cat.icon || '\uD83D\uDCC4'}</span>
                            <span className="truncate">{cat.name}</span>
                          </span>
                          <span className="text-xs text-muted-2">{cat.articles?.length ?? 0}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </nav>
          </aside>

          <div className="grid gap-6">
            <article className="rounded-[18px] border border-white/10 bg-surface p-6 sm:p-8">
              {hasBody ? (
                <MarkdownBody text={article.body} />
              ) : (
                <p className="text-muted">This article does not have any content yet.</p>
              )}
            </article>

            <div className="rounded-[18px] border border-brand/25 bg-brand/[0.06] p-6 sm:p-7">
              <h2 className="text-lg font-bold text-white">Need more help?</h2>
              <p className="mt-2 max-w-[60ch] text-sm leading-7 text-muted">
                Can't find what you're looking for? Ask the community or staff on Discord.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <a
                  className="inline-flex min-h-[46px] items-center rounded-xl bg-gradient-to-b from-brand-2 to-brand px-[22px] text-[15px] font-bold text-[#1a0d07] no-underline transition hover:brightness-105"
                  href="https://discord.alwination.id"
                  target="_blank"
                  rel="noreferrer"
                >
                  Join our Discord
                </a>
                <a
                  className="inline-flex min-h-[46px] items-center rounded-xl border border-white/15 bg-white/[0.04] px-[22px] text-[15px] font-semibold text-white no-underline transition hover:border-white/25 hover:bg-white/[0.08]"
                  href="/wiki"
                >
                  Back to wiki
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default WikiArticle
