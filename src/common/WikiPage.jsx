import { useMemo, useState } from 'react'

function ChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  )
}

function ArticleCard({ slug, title, excerpt, categoryLabel }) {
  return (
    <a
      href={`/wiki/${slug}`}
      className="group flex h-full flex-col rounded-[18px] border border-white/10 bg-surface p-5 transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-surface-2"
    >
      {categoryLabel && (
        <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-brand-2">{categoryLabel}</span>
      )}
      <h3 className="mt-1 text-[17px] font-bold leading-snug text-white">{title}</h3>
      {excerpt && <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted">{excerpt}</p>}
      <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-2">
        Read article
        <span className="transition group-hover:translate-x-0.5">
          <ChevronRight />
        </span>
      </span>
    </a>
  )
}

function WikiPage({ eyebrow, title, intro, updated, categories = [] }) {
  const [query, setQuery] = useState('')
  const trimmed = query.trim().toLowerCase()
  const totalArticles = categories.reduce((sum, category) => sum + (category.articles?.length ?? 0), 0)

  const searchResults = useMemo(() => {
    if (!trimmed) {
      return []
    }
    const results = []
    categories.forEach((category) => {
      const list = category.articles ?? []
      list.forEach((article) => {
        const haystack = `${article.title} ${article.excerpt ?? ''} ${article.body ?? ''}`.toLowerCase()
        if (haystack.includes(trimmed)) {
          results.push({ ...article, categoryLabel: category.name })
        }
      })
    })
    return results
  }, [trimmed, categories])

  return (
    <main className="min-h-svh bg-bg pb-24 pt-32 text-white">
      {/* Header */}
      <section className="mx-auto max-w-[1080px] px-6">
        <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-surface p-7 shadow-[0_24px_70px_rgba(0,0,0,0.28)] sm:p-10">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(255,90,48,0.18),transparent_65%)] blur-2xl" />
          <div className="relative">
            <div className="flex flex-wrap items-center gap-2">
              <span className="eyebrow">{eyebrow}</span>
              <span className="rounded-full border border-white/10 bg-bg-2 px-3 py-1 text-xs font-semibold text-muted">
                {categories.length} categories · {totalArticles} articles
              </span>
            </div>
            <h1 className="mt-4 text-[clamp(34px,5vw,56px)] font-bold leading-[1.04] tracking-[-0.03em] text-white">
              {title}
            </h1>
            {intro && <p className="mt-5 max-w-[70ch] text-[16.5px] leading-8 text-muted">{intro}</p>}

            {/* Search */}
            <div className="mt-7 flex items-center gap-3 rounded-xl border border-white/10 bg-bg-2 px-4 py-3 transition focus-within:border-brand">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted">
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.3-4.3" />
              </svg>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search the wiki…"
                className="w-full bg-transparent text-[15px] text-white outline-none placeholder:text-muted-2"
              />
              {query && (
                <button type="button" onClick={() => setQuery('')} className="text-muted transition hover:text-white" aria-label="Clear search">
                  ✕
                </button>
              )}
            </div>

            {!trimmed && categories.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {categories.map((category) => (
                  <a
                    key={category.id}
                    href={`#cat-${category.id}`}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-bg-2 px-3.5 py-1.5 text-sm font-semibold text-muted transition hover:border-white/25 hover:text-white"
                  >
                    <span>{category.icon || '\uD83D\uDCC4'}</span>
                    {category.name}
                    <span className="text-xs text-muted-2">{category.articles?.length ?? 0}</span>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Body */}
      <section className="mx-auto mt-8 max-w-[1080px] px-6">
        {trimmed ? (
          <div>
            <p className="mb-5 text-sm text-muted">
              {searchResults.length} result{searchResults.length === 1 ? '' : 's'} for “{query.trim()}”
            </p>
            {searchResults.length === 0 ? (
              <div className="rounded-[18px] border border-white/10 bg-surface p-8 text-center text-muted">
                No articles matched your search.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {searchResults.map((article) => (
                  <ArticleCard key={article.slug} {...article} />
                ))}
              </div>
            )}
          </div>
        ) : categories.length === 0 ? (
          <div className="rounded-[18px] border border-white/10 bg-surface p-8 text-center text-muted">
            The wiki is being written. Check back soon.
          </div>
        ) : (
          <div className="grid gap-10">
            {categories.map((category) => (
              <div id={`cat-${category.id}`} key={category.id} className="scroll-mt-28">
                <div className="flex items-start gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand/12 text-xl">
                    {category.icon || '\uD83D\uDCC4'}
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-xl font-bold tracking-tight text-white">{category.name}</h2>
                      <span className="rounded-full border border-white/10 bg-bg-2 px-2.5 py-0.5 text-xs font-semibold text-muted">
                        {category.articles?.length ?? 0}
                      </span>
                    </div>
                    {category.description && (
                      <p className="mt-1 text-sm leading-6 text-muted">{category.description}</p>
                    )}
                  </div>
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {(category.articles ?? []).length === 0 ? (
                    <p className="rounded-[18px] border border-white/10 bg-surface p-5 text-sm text-muted">
                      No articles in this category yet.
                    </p>
                  ) : (
                    (category.articles ?? []).map((article) => (
                      <ArticleCard key={article.slug} {...article} />
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

export default WikiPage
