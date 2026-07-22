import { useMemo } from 'react'
import Changelog from './Changelog.jsx'
import { changeTypeOrder, getChangeTypeLabel } from './changelogData.js'
import { getOptimizedImageUrl } from '../common/imageOptimizer.js'
import { isSafeImageUrl } from '../common/safeUrls.js'

function ChangeGroup({ group }) {
  return (
    <section>
      <div className="flex items-center gap-4">
        <h3 className="whitespace-nowrap text-xs font-bold uppercase tracking-[0.2em] text-[#ff7a59]">
          {getChangeTypeLabel(group.type)}
        </h3>
        <span className="h-px flex-1 bg-white/10" aria-hidden="true" />
        <span className="text-xs font-semibold tabular-nums text-zinc-500">{group.items.length}</span>
      </div>
      <ul className="mt-4 grid gap-2.5 p-0">
        {group.items.map((item, index) => (
          <li className="flex items-start gap-3 text-base leading-7 text-zinc-300" key={`${group.type}-${index}`}>
            <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-600" aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

function ChangelogDetail({ entry, entries = [] }) {
  const orderedGroups = useMemo(() => {
    const groups = Array.isArray(entry.changes) ? entry.changes : []

    return [...groups].sort((a, b) => changeTypeOrder.indexOf(a.type) - changeTypeOrder.indexOf(b.type))
  }, [entry.changes])

  const heroImage = useMemo(
    () => (isSafeImageUrl(entry.img) ? getOptimizedImageUrl(entry.img, 1920) || entry.img : ''),
    [entry.img],
  )

  const related = useMemo(() => {
    const others = entries.filter((item) => item.slug !== entry.slug)
    const sameRealm = others.filter((item) => (item.realm || 'General') === (entry.realm || 'General'))
    const rest = others.filter((item) => (item.realm || 'General') !== (entry.realm || 'General'))

    return [...sameRealm, ...rest].slice(0, 3)
  }, [entries, entry.realm, entry.slug])

  return (
    <main className="bg-[#171717] text-white">
      <article>
        <section className="relative overflow-hidden px-5 pb-14 pt-32 sm:px-8 lg:px-12">
          {heroImage ? (
            <>
              <img
                className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center blur-[4px]"
                src={heroImage}
                alt=""
                loading="eager"
                fetchPriority="high"
                decoding="async"
              />
              <div className="absolute inset-0 bg-black/70 shadow-[inset_0_0_140px_80px_rgba(0,0,0,0.88)]" />
              <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-b from-transparent to-[#171717]" />
            </>
          ) : (
            <>
              <div className="hero-grid-overlay pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#171717]" />
            </>
          )}

          <div className="relative z-10 mx-auto max-w-5xl">
            <a
              className="mb-8 inline-flex min-h-10 w-fit items-center rounded-md border border-white/15 px-4 text-sm font-semibold text-zinc-200 no-underline transition hover:border-[#ff7a59] hover:bg-white/8 hover:text-white"
              href="/changelog"
            >
              ← Back to changelog
            </a>
            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#ff7a59]">
              <span>{entry.realm}</span>
              {entry.tag ? (
                <>
                  <span className="h-1 w-1 rounded-full bg-zinc-500" />
                  <span>{entry.tag}</span>
                </>
              ) : null}
              <span className="h-1 w-1 rounded-full bg-zinc-500" />
              <time>{entry.date}</time>
            </div>
            <div className="mt-5 flex flex-wrap items-baseline gap-4">
              <h1 className="font-mono text-4xl font-bold leading-none tracking-tight text-white sm:text-5xl lg:text-6xl">
                {entry.version}
              </h1>
              {entry.title ? (
                <p className="text-xl font-semibold text-zinc-200 sm:text-2xl">{entry.title}</p>
              ) : null}
            </div>
            {entry.summary ? (
              <p className="mt-5 max-w-3xl text-lg leading-8 text-zinc-200">{entry.summary}</p>
            ) : null}
            <p className="mt-5 text-sm font-semibold text-zinc-300">By {entry.author}</p>
          </div>
        </section>

        <section className="px-5 pb-16 sm:px-8 lg:px-12">
          <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[1fr_280px] lg:items-start">
            <div className="grid gap-6">
              {orderedGroups.length > 0 ? (
                orderedGroups.map((group, index) => <ChangeGroup group={group} key={`${group.type}-${index}`} />)
              ) : (
                <p className="text-zinc-400">No changes were listed for this entry.</p>
              )}
            </div>

            <aside className="rounded-lg border border-[#ff5732]/50 bg-[#202020] p-5 lg:sticky lg:top-28">
              <h2 className="text-lg font-bold text-white">Update details</h2>
              <dl className="mt-5 grid gap-4 text-sm">
                <div>
                  <dt className="font-semibold text-zinc-500">Realm</dt>
                  <dd className="mt-1 text-white">{entry.realm}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-zinc-500">Version</dt>
                  <dd className="mt-1 font-mono text-white">{entry.version}</dd>
                </div>
                {entry.tag ? (
                  <div>
                    <dt className="font-semibold text-zinc-500">Type</dt>
                    <dd className="mt-1 text-white">{entry.tag}</dd>
                  </div>
                ) : null}
                <div>
                  <dt className="font-semibold text-zinc-500">Date</dt>
                  <dd className="mt-1 text-white">{entry.date}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-zinc-500">Author</dt>
                  <dd className="mt-1 text-white">{entry.author}</dd>
                </div>
              </dl>
            </aside>
          </div>
        </section>
      </article>

      {related.length > 0 && (
        <section className="border-t border-white/10 bg-[#141414] px-5 py-16 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#ff7a59]">More updates</p>
              <h2 className="mt-3 text-3xl font-bold text-white">Related changes</h2>
            </div>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {related.map((relatedEntry) => (
                <Changelog key={relatedEntry.id || relatedEntry.slug} {...relatedEntry} />
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  )
}

export default ChangelogDetail
