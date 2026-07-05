import { useLayoutEffect, useRef, useState } from 'react'
import News from './News.jsx'
import { RichInline } from '../common/RichText.jsx'

function HeroImage({ src, avifSrc = '' }) {
  const imageRef = useRef(null)
  const [status, setStatus] = useState('loading')

  useLayoutEffect(() => {
    const image = imageRef.current

    if (image?.complete) {
      setStatus(image.naturalWidth > 0 ? 'loaded' : 'error')
      return
    }

    setStatus(src ? 'loading' : 'error')
  }, [src])

  return (
    <>
      {status === 'loading' && (
        <div className="absolute inset-0 grid place-items-center bg-[#202020]">
          <div className="h-14 w-14 animate-spin rounded-full border-2 border-white/15 border-t-[#ff7a59]" />
        </div>
      )}
      {status === 'error' && (
        <div className="absolute inset-0 grid place-items-center bg-[#202020] px-5 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-500">Image unavailable</p>
        </div>
      )}
      {src && (
        <picture className="contents">
          {avifSrc && <source srcSet={avifSrc} type="image/avif" />}
          <img
            ref={imageRef}
            className={`pointer-events-none absolute inset-0 h-full w-full object-cover object-center blur-[4px] transition duration-500 ${
              status === 'loaded' ? 'opacity-100' : 'opacity-0'
            }`}
            key={src}
            src={src}
            alt=""
            onLoad={() => setStatus('loaded')}
            onError={() => setStatus('error')}
          />
        </picture>
      )}
    </>
  )
}

function ArticleBlock({ block }) {
  if (typeof block === 'string') {
    return <p><RichInline text={block} /></p>
  }

  if (block.type === 'lead') {
    return <p className="text-xl font-semibold leading-9 text-zinc-100"><RichInline text={block.text} /></p>
  }

  if (block.type === 'heading') {
    const HeadingTag = block.level === 3 ? 'h3' : block.level === 1 ? 'h1' : 'h2'
    const className =
      block.level === 1
        ? 'pt-4 text-3xl font-bold leading-tight text-white'
        : block.level === 3
          ? 'pt-3 text-xl font-bold leading-tight text-white'
          : 'pt-4 text-2xl font-bold leading-tight text-white'
    return <HeadingTag className={className}><RichInline text={block.text} /></HeadingTag>
  }

  if (block.type === 'list') {
    return (
      <ul className="grid gap-3 p-0">
        {block.items.map((item) => (
          <li className="flex items-start gap-3" key={item}>
            <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-[#ff5732]" />
            <span><RichInline text={item} /></span>
          </li>
        ))}
      </ul>
    )
  }

  if (block.type === 'quote') {
    return (
      <figure className="border-l-4 border-[#ff5732] bg-[#202020] px-5 py-4">
        <blockquote className="whitespace-pre-line text-lg font-semibold leading-8 text-white">
          <RichInline text={block.text} />
        </blockquote>
        {block.cite && <figcaption className="mt-3 text-sm text-zinc-400">{block.cite}</figcaption>}
      </figure>
    )
  }

  if (block.type === 'code') {
    return (
      <pre className="overflow-x-auto rounded-lg border border-white/10 bg-black/35 p-4 text-sm leading-6 text-zinc-200">
        <code>{block.text}</code>
      </pre>
    )
  }

  if (block.type === 'stats') {
    return (
      <div className="grid gap-3 sm:grid-cols-3">
        {block.items.map((item) => (
          <div className="rounded-lg border border-white/10 bg-[#202020] p-4" key={item.label}>
            <p className="text-2xl font-bold leading-tight text-white">{item.value}</p>
            <p className="mt-2 text-sm font-semibold text-zinc-400">{item.label}</p>
          </div>
        ))}
      </div>
    )
  }

  if (block.type === 'callout') {
    return (
      <div className="rounded-lg border border-[#ff5732]/60 bg-[#2a1d19] p-5">
        <h3 className="text-lg font-bold text-white"><RichInline text={block.title} /></h3>
        <p className="mt-3 text-sm leading-7 text-zinc-200"><RichInline text={block.text} /></p>
      </div>
    )
  }

  return <p><RichInline text={block.text} /></p>
}

function NewsDetail({ item, newsItems = [] }) {
  const relatedNews = newsItems.filter((newsItem) => newsItem.slug !== item.slug).slice(0, 2)

  return (
    <main className="bg-[#171717] text-white">
      <article>
        <section className="relative min-h-[620px] overflow-hidden px-5 pb-16 pt-32 sm:px-8 lg:px-12">
          <HeroImage src={item.img} avifSrc={item.imgAvif} />
          <div className="absolute inset-0 bg-black/65 shadow-[inset_0_0_140px_80px_rgba(0,0,0,0.88)]" />
          <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-b from-transparent to-[#171717]" />

          <div className="relative z-10 mx-auto flex min-h-[460px] max-w-5xl flex-col justify-end">
            <a
              className="mb-8 inline-flex w-fit min-h-10 items-center rounded-md border border-white/15 px-4 text-sm font-semibold text-zinc-200 no-underline transition hover:border-[#ff7a59] hover:bg-white/8 hover:text-white"
              href="/#news"
            >
              Back to news
            </a>
            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#ff7a59]">
              <span>{item.category}</span>
              <span className="h-1 w-1 rounded-full bg-zinc-500" />
              <time>{item.date}</time>
              <span className="h-1 w-1 rounded-full bg-zinc-500" />
              <span>{item.readingTime}</span>
            </div>
            <h1 className="mt-5 max-w-4xl text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
              {item.title}
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-zinc-200"><RichInline text={item.description} /></p>
            <p className="mt-5 text-sm font-semibold text-zinc-300">By {item.author}</p>
          </div>
        </section>

        <section className="px-5 pb-16 sm:px-8 lg:px-12">
          <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[1fr_280px] lg:items-start">
            <div className="space-y-6 text-base leading-8 text-zinc-300">
              {item.body.map((block, index) => (
                <ArticleBlock block={block} key={`${typeof block === 'string' ? block : block.type}-${index}`} />
              ))}
            </div>

            <aside className="rounded-lg border border-[#ff5732]/50 bg-[#202020] p-5">
              <h2 className="text-lg font-bold text-white">Post details</h2>
              <dl className="mt-5 grid gap-4 text-sm">
                <div>
                  <dt className="font-semibold text-zinc-500">Category</dt>
                  <dd className="mt-1 text-white">{item.category}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-zinc-500">Date</dt>
                  <dd className="mt-1 text-white">{item.date}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-zinc-500">Author</dt>
                  <dd className="mt-1 text-white">{item.author}</dd>
                </div>
              </dl>

              <div className="mt-6 border-t border-white/10 pt-5">
                <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-[#ff7a59]">
                  Highlights
                </h3>
                <ul className="mt-4 grid gap-3 p-0">
                  {item.highlights.map((highlight) => (
                    <li className="flex items-start gap-3 text-sm text-zinc-300" key={highlight}>
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#ff5732]" />
                      <span><RichInline text={highlight} /></span>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          </div>
        </section>
      </article>

      {relatedNews.length > 0 && (
        <section className="border-t border-white/10 bg-[#141414] px-5 py-16 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#ff7a59]">
                More News
              </p>
              <h2 className="mt-3 text-3xl font-bold text-white">Related updates</h2>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {relatedNews.map((relatedItem) => (
                <News key={relatedItem.id} {...relatedItem} />
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  )
}

export default NewsDetail
