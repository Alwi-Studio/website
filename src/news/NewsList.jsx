import News from './News.jsx'

function NewsListLoadingCards() {
  return Array.from({ length: 6 }, (_, index) => (
    <article
      className="min-h-[390px] overflow-hidden rounded-2xl border border-white/10 bg-surface"
      key={`news-list-loading-${index}`}
    >
      <div className="grid aspect-[16/10] place-items-center bg-surface-2">
        <div className="h-11 w-11 animate-spin rounded-full border-2 border-white/15 border-t-brand-2" />
      </div>
      <div className="space-y-4 p-[22px]">
        <div className="h-3 w-28 animate-pulse rounded-full bg-white/10" />
        <div className="h-6 w-4/5 animate-pulse rounded-full bg-white/10" />
        <div className="h-4 w-full animate-pulse rounded-full bg-white/10" />
        <div className="h-4 w-2/3 animate-pulse rounded-full bg-white/10" />
      </div>
    </article>
  ))
}

function NewsList({ newsItems, isLoading = false }) {
  return (
    <main className="min-h-svh bg-bg px-6 pb-24 pt-36">
      <section className="mx-auto max-w-[1180px]">
        <div className="flex flex-col gap-6 border-b border-white/10 pb-9 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <span className="eyebrow">News</span>
            <h1 className="mt-3.5 text-[clamp(32px,5vw,52px)] font-bold leading-[1.05] tracking-[-0.02em] text-white">
              All AlwiNation updates
            </h1>
            <p className="mt-4 text-[16.5px] leading-7 text-muted">
              Browse announcements, community posts, development notes, and event updates.
            </p>
          </div>

          <a
            className="inline-flex min-h-[46px] w-fit items-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-[22px] text-[15px] font-semibold text-white transition hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/[0.08]"
            href="/#news"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
            Back home
          </a>
        </div>

        {isLoading ? (
          <div className="mt-11 grid gap-[22px] md:grid-cols-2 xl:grid-cols-3">
            <NewsListLoadingCards />
          </div>
        ) : newsItems.length > 0 ? (
          <div className="mt-11 grid gap-[22px] md:grid-cols-2 xl:grid-cols-3">
            {newsItems.map((item) => (
              <News key={item.id} {...item} />
            ))}
          </div>
        ) : (
          <div className="mt-11 rounded-2xl border border-white/10 bg-surface p-10 text-center text-muted">
            No news posts yet. Check back soon.
          </div>
        )}
      </section>
    </main>
  )
}

export default NewsList
