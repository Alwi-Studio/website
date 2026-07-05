import { useEffect, useState } from 'react'
import { RichInline } from '../common/RichText.jsx'

function NewsImage({ src }) {
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    setStatus(src ? 'loading' : 'error')
  }, [src])

  return (
    <>
      {status === 'loading' && (
        <div className="absolute inset-0 grid place-items-center bg-surface-2">
          <div className="h-11 w-11 animate-spin rounded-full border-2 border-white/15 border-t-brand-2" />
        </div>
      )}
      {status === 'error' && (
        <div className="absolute inset-0 grid place-items-center bg-surface-2 px-5 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Image unavailable</p>
        </div>
      )}
      {src && (
        <img
          className={`h-full w-full object-cover transition duration-500 group-hover:scale-[1.06] ${
            status === 'loaded' ? 'opacity-100' : 'opacity-0'
          }`}
          src={src}
          alt=""
          onLoad={() => setStatus('loaded')}
          onError={() => setStatus('error')}
        />
      )}
    </>
  )
}

function News({ img, title, description, category, date, readingTime, slug }) {
  return (
    <article className="group flex min-h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-surface transition duration-200 hover:-translate-y-1.5 hover:border-brand/40 hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
      <div className="relative aspect-[16/10] overflow-hidden">
        <NewsImage src={img} />
        <div className="absolute inset-0 bg-gradient-to-t from-bg/55 to-transparent" />
        {category ? (
          <span className="absolute left-3.5 top-3.5 z-[2] rounded-full border border-white/15 bg-bg/60 px-3 py-1.5 text-[11.5px] font-bold uppercase tracking-[0.08em] text-brand-2 backdrop-blur">
            {category}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-[22px]">
        <div className="text-[12.5px] font-medium text-muted-2">
          {date}
          {readingTime ? ` · ${readingTime}` : ''}
        </div>
        <h3 className="text-xl font-bold leading-tight text-white">{title}</h3>
        <p className="flex-1 text-[14.5px] leading-6 text-muted"><RichInline text={description} /></p>
        <a
          className="mt-1 inline-flex w-fit items-center gap-2 text-sm font-semibold text-brand-2 transition"
          href={`/news/${slug}`}
        >
          Read more
          <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
        </a>
      </div>
    </article>
  )
}

export default News
