import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import News from './News.jsx'
import { RichInline } from '../common/RichText.jsx'
import { isSafeImageUrl } from '../common/safeUrls.js'
import { getOptimizedImageUrl } from '../common/imageOptimizer.js'

function HeroImage({ src, avifSrc = '' }) {
  const imageRef = useRef(null)
  const optimizedSrc = useMemo(() => avifSrc || getOptimizedImageUrl(src, 1920), [avifSrc, src])
  const primarySrc = optimizedSrc || src
  const [currentSrc, setCurrentSrc] = useState(primarySrc)
  const [status, setStatus] = useState('loading')

  useLayoutEffect(() => {
    const image = imageRef.current

    if (image?.complete) {
      setStatus(image.naturalWidth > 0 ? 'loaded' : 'error')
      return
    }

    setStatus(currentSrc ? 'loading' : 'error')
  }, [currentSrc])

  useEffect(() => {
    setCurrentSrc(primarySrc)
    setStatus(primarySrc ? 'loading' : 'error')
  }, [primarySrc])

  function handleError() {
    setStatus('error')
  }

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
      {currentSrc && (
        <img
          ref={imageRef}
          className={`pointer-events-none absolute inset-0 h-full w-full object-cover object-center blur-[4px] transition duration-500 ${
            status === 'loaded' ? 'opacity-100' : 'opacity-0'
          }`}
          key={currentSrc}
          src={currentSrc}
          alt=""
          width="1920"
          height="1080"
          loading="eager"
          fetchPriority="high"
          decoding="async"
          onLoad={() => setStatus('loaded')}
          onError={handleError}
        />
      )}
    </>
  )
}

function columnClass(columns = 2) {
  if (columns >= 4) {
    return 'md:grid-cols-2 xl:grid-cols-4'
  }
  if (columns === 3) {
    return 'md:grid-cols-3'
  }
  return 'md:grid-cols-2'
}

function TitledItemsGrid({ block, card = false }) {
  return (
    <div className={`grid gap-3 ${columnClass(block.columns)}`}>
      {block.items.map((item, index) => (
        <div
          className={`${card ? 'rounded-lg border border-white/10 bg-[#202020] p-4' : 'border-l border-white/10 pl-4'}`}
          key={`${item.title}-${index}`}
        >
          <h3 className="font-bold text-white"><RichInline text={item.title} /></h3>
          {item.text && <p className="mt-2 text-sm leading-6 text-zinc-400"><RichInline text={item.text} /></p>}
          {item.meta && <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-[#ff7a59]"><RichInline text={item.meta} /></p>}
        </div>
      ))}
    </div>
  )
}

function ArticleTabs({ items }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const activeItem = items[activeIndex] ?? items[0]

  return (
    <div className="rounded-lg border border-white/10 bg-[#202020]">
      <div className="flex gap-1 overflow-x-auto border-b border-white/10 p-2">
        {items.map((item, index) => (
          <button
            className={`min-h-9 shrink-0 rounded-md px-3 text-sm font-semibold transition ${
              index === activeIndex ? 'bg-[#ff5732] text-[#1a0d07]' : 'text-zinc-400 hover:bg-white/[0.06] hover:text-white'
            }`}
            key={`${item.title}-${index}`}
            type="button"
            onClick={() => setActiveIndex(index)}
          >
            <RichInline text={item.title} />
          </button>
        ))}
      </div>
      <div className="p-4 text-sm leading-7 text-zinc-300">
        <RichInline text={activeItem?.text ?? ''} />
      </div>
    </div>
  )
}

function ArticleBlock({ block }) {
  if (typeof block === 'string') {
    return <p className="whitespace-pre-line"><RichInline text={block} /></p>
  }

  if (block.type === 'lead') {
    return <p className="whitespace-pre-line text-xl font-semibold leading-8 text-zinc-100"><RichInline text={block.text} /></p>
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

  if (block.type === 'ordered-list') {
    return (
      <ol className="list-decimal space-y-2 pl-5">
        {block.items.map((item, index) => (
          <li className="pl-1" key={index}>
            <RichInline text={item} />
          </li>
        ))}
      </ol>
    )
  }

  if (block.type === 'divider') {
    return <hr className="my-2 border-0 border-t border-white/10" />
  }

  if (block.type === 'checklist') {
    return (
      <ul className="grid gap-3 p-0">
        {block.items.map((item, index) => (
          <li className="flex items-start gap-3" key={index}>
            <span
              className={`mt-1.5 grid h-5 w-5 shrink-0 place-items-center rounded border text-[11px] font-bold ${
                item.checked ? 'border-[#ff7a59] bg-[#ff5732] text-[#1a0d07]' : 'border-white/20 bg-[#202020] text-transparent'
              }`}
            >
              x
            </span>
            <span><RichInline text={item.text} /></span>
          </li>
        ))}
      </ul>
    )
  }

  if (block.type === 'table') {
    return (
      <div className="overflow-x-auto rounded-lg border border-white/10 bg-[#202020]">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead className="bg-white/[0.04] text-xs font-bold uppercase text-zinc-300">
            <tr>
              {block.headers.map((header, headerIndex) => (
                <th
                  className="border-b border-white/10 px-4 py-3"
                  key={`${header}-${headerIndex}`}
                  style={{ textAlign: block.alignments?.[headerIndex] ?? 'left' }}
                >
                  <RichInline text={header} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row, rowIndex) => (
              <tr className="border-b border-white/5 last:border-b-0" key={rowIndex}>
                {block.headers.map((header, cellIndex) => (
                  <td
                    className="px-4 py-3 text-zinc-300"
                    key={`${header}-${cellIndex}`}
                    style={{ textAlign: block.alignments?.[cellIndex] ?? 'left' }}
                  >
                    <RichInline text={row[cellIndex] ?? ''} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (block.type === 'columns' || block.type === 'grid') {
    return <TitledItemsGrid block={block} />
  }

  if (block.type === 'cards') {
    return <TitledItemsGrid block={{ ...block, columns: 3 }} card />
  }

  if (block.type === 'tabs') {
    return <ArticleTabs items={block.items} />
  }

  if (block.type === 'accordion') {
    return (
      <div className="grid gap-2">
        {block.items.map((item, index) => (
          <details className="rounded-lg border border-white/10 bg-[#202020] p-4" key={`${item.title}-${index}`}>
            <summary className="cursor-pointer font-bold text-white"><RichInline text={item.title} /></summary>
            <p className="mt-3 text-sm leading-7 text-zinc-300"><RichInline text={item.text} /></p>
          </details>
        ))}
      </div>
    )
  }

  if (block.type === 'section' || block.type === 'container') {
    const isContainer = block.type === 'container'
    return (
      <section className={`${isContainer ? 'rounded-lg border border-white/10 bg-[#202020] p-5' : 'border-t border-white/10 pt-5'}`}>
        {block.title && <h2 className="text-xl font-bold text-white"><RichInline text={block.title} /></h2>}
        {block.text && <p className="mt-2 text-sm leading-7 text-zinc-300"><RichInline text={block.text} /></p>}
      </section>
    )
  }

  if (block.type === 'sidebar') {
    return (
      <aside className="grid gap-4 rounded-lg border border-white/10 bg-[#202020] p-5 md:grid-cols-[1fr_240px]">
        <div>
          {block.title && <h2 className="text-xl font-bold text-white"><RichInline text={block.title} /></h2>}
          {block.text && <p className="mt-2 text-sm leading-7 text-zinc-300"><RichInline text={block.text} /></p>}
        </div>
        {block.sidebar && (
          <div className="rounded-md border border-[#ff5732]/40 bg-[#2a1d19] p-4 text-sm leading-6 text-zinc-200">
            <RichInline text={block.sidebar} />
          </div>
        )}
      </aside>
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

  if (block.type === 'image') {
    if (!isSafeImageUrl(block.src)) {
      return null
    }

    const imageSrc = getOptimizedImageUrl(block.src, 1400) || block.src

    return (
      <figure className="overflow-hidden rounded-lg border border-white/10 bg-[#202020]">
        <img
          className="h-auto max-h-[620px] w-full object-cover"
          src={imageSrc}
          alt={block.alt}
          loading="lazy"
          decoding="async"
        />
        {block.caption && (
          <figcaption className="border-t border-white/10 px-4 py-3 text-sm leading-6 text-zinc-400">
            <RichInline text={block.caption} />
          </figcaption>
        )}
      </figure>
    )
  }

  return <p className="whitespace-pre-line"><RichInline text={block.text} /></p>
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
            <div className="space-y-4 text-base leading-7 text-zinc-300">
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
