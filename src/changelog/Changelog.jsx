import { useMemo } from 'react'
import { getChangeTypeLabel } from './changelogData.js'
import { RichInline } from '../common/RichText.jsx'
import { getOptimizedImageUrl } from '../common/imageOptimizer.js'
import { isSafeImageUrl } from '../common/safeUrls.js'

function changeCounts(changes) {
  return (Array.isArray(changes) ? changes : [])
    .map((group) => ({ type: group.type, count: Array.isArray(group.items) ? group.items.length : 0 }))
    .filter((group) => group.count > 0)
}

function Changelog({ realm, version, title, summary, tag, date, changes, slug, img }) {
  const counts = changeCounts(changes)
  const imageSrc = useMemo(() => (isSafeImageUrl(img) ? getOptimizedImageUrl(img, 900) || img : ''), [img])

  return (
    <article className="group flex min-h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-surface transition duration-200 hover:-translate-y-1.5 hover:border-brand/40 hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
      <div className="relative flex aspect-[16/10] flex-col justify-between overflow-hidden bg-gradient-to-br from-surface-2 to-bg p-5">
        {imageSrc ? (
          <>
            <img
              className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.06]"
              src={imageSrc}
              alt=""
              width="900"
              height="562"
              loading="lazy"
              decoding="async"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-bg/90 via-bg/45 to-bg/25" />
          </>
        ) : (
          <div className="hero-grid-overlay pointer-events-none absolute inset-0 opacity-70" aria-hidden="true" />
        )}

        <div className="relative flex items-start justify-between gap-2">
          <span className="rounded-full border border-brand/30 bg-brand/12 px-3 py-1.5 text-[11.5px] font-bold uppercase tracking-[0.08em] text-brand-2 backdrop-blur">
            {realm}
          </span>
          {tag ? (
            <span className="rounded-full border border-white/15 bg-bg/50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted backdrop-blur">
              {tag}
            </span>
          ) : null}
        </div>
        <div className="relative">
          <p className="font-mono text-[clamp(28px,4vw,38px)] font-bold leading-none tracking-tight text-white">
            {version}
          </p>
          {counts.length > 0 ? (
            <p className="mt-2.5 text-[12.5px] font-medium text-white/75">
              {counts.map((group) => `${group.count} ${getChangeTypeLabel(group.type).toLowerCase()}`).join('  ·  ')}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-[22px]">
        <div className="text-[12.5px] font-medium text-muted-2">{date}</div>
        <h3 className="text-xl font-bold leading-tight text-white">{title || version}</h3>
        {summary ? (
          <p className="flex-1 text-[14.5px] leading-6 text-muted"><RichInline text={summary} /></p>
        ) : (
          <div className="flex-1" />
        )}
        <a
          className="mt-1 inline-flex w-fit items-center gap-2 text-sm font-semibold text-brand-2 transition"
          href={`/changelog/${slug}`}
        >
          View changes
          <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
        </a>
      </div>
    </article>
  )
}

export default Changelog
