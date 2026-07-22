import { useMemo, useState } from 'react'
import Changelog from './Changelog.jsx'
import { getRealms } from './adminChangelogStore.js'

function ChangelogListLoadingCards() {
  return Array.from({ length: 6 }, (_, index) => (
    <article
      className="min-h-[390px] overflow-hidden rounded-2xl border border-white/10 bg-surface"
      key={`changelog-list-loading-${index}`}
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

function ChangelogList({ entries = [], isLoading = false }) {
  const [activeRealm, setActiveRealm] = useState('All')
  const realms = useMemo(() => getRealms(entries), [entries])
  const currentRealm = activeRealm === 'All' || realms.includes(activeRealm) ? activeRealm : 'All'
  const visibleEntries =
    currentRealm === 'All' ? entries : entries.filter((entry) => (entry.realm || 'General') === currentRealm)

  return (
    <main className="min-h-svh bg-bg px-6 pb-24 pt-36">
      <section className="mx-auto max-w-[1180px]">
        <div className="flex flex-col gap-6 border-b border-white/10 pb-9 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <span className="eyebrow">Changelog</span>
            <h1 className="mt-3.5 text-[clamp(32px,5vw,52px)] font-bold leading-[1.05] tracking-[-0.02em] text-white">
              Every AlwiNation update
            </h1>
            <p className="mt-4 text-[16.5px] leading-7 text-muted">
              Version updates across all realms. Open an entry to see everything that changed.
            </p>
          </div>

          <a
            className="inline-flex min-h-[46px] w-fit items-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-[22px] text-[15px] font-semibold text-white transition hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/[0.08]"
            href="/#home"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
            Back home
          </a>
        </div>

        {!isLoading && realms.length > 0 ? (
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <label className="text-sm font-semibold text-muted" htmlFor="changelog-realm-filter">
              Realm
            </label>
            <div className="relative">
              <select
                id="changelog-realm-filter"
                className="min-h-11 appearance-none rounded-xl border border-white/10 bg-surface-2 py-2 pl-4 pr-10 text-sm font-semibold text-white outline-none transition hover:border-white/25 focus:border-brand"
                value={currentRealm}
                onChange={(event) => setActiveRealm(event.target.value)}
              >
                <option value="All">All realms</option>
                {realms.map((realm) => (
                  <option key={realm} value={realm}>
                    {realm}
                  </option>
                ))}
              </select>
              <svg
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </div>
            <span className="text-sm text-muted-2">
              {visibleEntries.length} {visibleEntries.length === 1 ? 'entry' : 'entries'}
            </span>
          </div>
        ) : null}

        {isLoading ? (
          <div className="mt-11 grid gap-[22px] md:grid-cols-2 xl:grid-cols-3">
            <ChangelogListLoadingCards />
          </div>
        ) : visibleEntries.length > 0 ? (
          <div className="mt-8 grid gap-[22px] md:grid-cols-2 xl:grid-cols-3">
            {visibleEntries.map((entry) => (
              <Changelog key={entry.id || entry.slug} {...entry} />
            ))}
          </div>
        ) : (
          <div className="mt-11 rounded-2xl border border-white/10 bg-surface p-10 text-center text-muted">
            No changelog entries yet. Check back soon.
          </div>
        )}
      </section>
    </main>
  )
}

export default ChangelogList
