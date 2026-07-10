import { useState } from 'react'
import { isSafeImageUrl } from './safeUrls.js'
import { getOptimizedImageUrl } from './imageOptimizer.js'
import { RichInline, parseMarkdownBlocks } from './RichText.jsx'

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
          className={`${card ? 'rounded-lg border border-white/10 bg-surface-2 p-4' : 'border-l border-white/10 pl-4'}`}
          key={`${item.title}-${index}`}
        >
          <h4 className="font-bold text-white"><RichInline text={item.title} /></h4>
          {item.text && <p className="mt-2 text-sm leading-6 text-muted"><RichInline text={item.text} /></p>}
          {item.meta && <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-brand-2"><RichInline text={item.meta} /></p>}
        </div>
      ))}
    </div>
  )
}

function ArticleTabs({ items }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const activeItem = items[activeIndex] ?? items[0]

  return (
    <div className="rounded-lg border border-white/10 bg-bg-2">
      <div className="flex gap-1 overflow-x-auto border-b border-white/10 p-2">
        {items.map((item, index) => (
          <button
            className={`min-h-9 shrink-0 rounded-md px-3 text-sm font-semibold transition ${
              index === activeIndex ? 'bg-brand text-white' : 'text-muted hover:bg-white/[0.06] hover:text-white'
            }`}
            key={`${item.title}-${index}`}
            type="button"
            onClick={() => setActiveIndex(index)}
          >
            <RichInline text={item.title} />
          </button>
        ))}
      </div>
      <div className="p-4 text-sm leading-7 text-muted">
        <RichInline text={activeItem?.text ?? ''} />
      </div>
    </div>
  )
}

// Renders Discord-style markdown (the same mini-syntax used across the site) into
// styled article content. Shared by the public wiki article page and the admin
// live preview so both always look identical.
export function MarkdownBody({ text, className = '' }) {
  const blocks = parseMarkdownBlocks(text)

  if (blocks.length === 0) {
    return null
  }

  return (
    <div className={`grid gap-2.5 ${className}`}>
      {blocks.map((block, index) => {
        const key = `${block.type}-${index}`

        if (block.type === 'heading') {
          if (block.level === 1) {
            return (
              <h2 key={key} className={`text-2xl font-bold tracking-tight text-white ${index > 0 ? 'mt-3' : ''}`}>
                <RichInline text={block.text} />
              </h2>
            )
          }
          if (block.level === 2) {
            return (
              <h3 key={key} className={`text-xl font-bold tracking-tight text-white ${index > 0 ? 'mt-2' : ''}`}>
                <RichInline text={block.text} />
              </h3>
            )
          }
          return (
            <h4 key={key} className="text-lg font-bold tracking-tight text-white">
              <RichInline text={block.text} />
            </h4>
          )
        }

        if (block.type === 'divider') {
          return <hr key={key} className="my-2 border-0 border-t border-white/10" />
        }

        if (block.type === 'list') {
          return (
            <ul key={key} className="grid gap-2 p-0">
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex} className="flex items-start gap-3 text-[15px] leading-7 text-muted">
                  <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-2" />
                  <span>
                    <RichInline text={item} />
                  </span>
                </li>
              ))}
            </ul>
          )
        }

        if (block.type === 'checklist') {
          return (
            <ul key={key} className="grid gap-2 p-0">
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex} className="flex items-start gap-3 text-[15px] leading-7 text-muted">
                  <span
                    className={`mt-1.5 grid h-5 w-5 shrink-0 place-items-center rounded border text-[11px] font-bold ${
                      item.checked
                        ? 'border-brand-2 bg-brand-2 text-[#1a0d07]'
                        : 'border-white/20 bg-surface-2 text-transparent'
                    }`}
                  >
                    x
                  </span>
                  <span className={item.checked ? 'text-zinc-300' : ''}>
                    <RichInline text={item.text} />
                  </span>
                </li>
              ))}
            </ul>
          )
        }

        if (block.type === 'table') {
          return (
            <div key={key} className="overflow-x-auto rounded-lg border border-white/10 bg-bg-2">
              <table className="min-w-full border-collapse text-left text-sm">
                <thead className="bg-white/[0.04] text-xs font-bold uppercase text-zinc-300">
                  <tr>
                    {block.headers.map((header, headerIndex) => (
                      <th
                        key={`${header}-${headerIndex}`}
                        className="border-b border-white/10 px-4 py-3"
                        style={{ textAlign: block.alignments?.[headerIndex] ?? 'left' }}
                      >
                        <RichInline text={header} />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {block.rows.map((row, rowIndex) => (
                    <tr key={rowIndex} className="border-b border-white/5 last:border-b-0">
                      {block.headers.map((header, cellIndex) => (
                        <td
                          key={`${header}-${cellIndex}`}
                          className="px-4 py-3 text-muted"
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
          return <TitledItemsGrid key={key} block={block} />
        }

        if (block.type === 'cards') {
          return <TitledItemsGrid key={key} block={{ ...block, columns: 3 }} card />
        }

        if (block.type === 'tabs') {
          return <ArticleTabs key={key} items={block.items} />
        }

        if (block.type === 'accordion') {
          return (
            <div key={key} className="grid gap-2">
              {block.items.map((item, itemIndex) => (
                <details className="rounded-lg border border-white/10 bg-bg-2 p-4" key={`${item.title}-${itemIndex}`}>
                  <summary className="cursor-pointer font-bold text-white"><RichInline text={item.title} /></summary>
                  <p className="mt-3 text-sm leading-7 text-muted"><RichInline text={item.text} /></p>
                </details>
              ))}
            </div>
          )
        }

        if (block.type === 'section' || block.type === 'container') {
          const isContainer = block.type === 'container'
          return (
            <section
              key={key}
              className={`${isContainer ? 'rounded-lg border border-white/10 bg-bg-2 p-5' : 'border-t border-white/10 pt-5'}`}
            >
              {block.title && <h3 className="font-bold text-white"><RichInline text={block.title} /></h3>}
              {block.text && <p className="mt-2 text-sm leading-7 text-muted"><RichInline text={block.text} /></p>}
            </section>
          )
        }

        if (block.type === 'sidebar') {
          return (
            <aside key={key} className="grid gap-4 rounded-lg border border-white/10 bg-bg-2 p-5 md:grid-cols-[1fr_240px]">
              <div>
                {block.title && <h3 className="font-bold text-white"><RichInline text={block.title} /></h3>}
                {block.text && <p className="mt-2 text-sm leading-7 text-muted"><RichInline text={block.text} /></p>}
              </div>
              {block.sidebar && (
                <div className="rounded-md border border-brand/30 bg-brand/[0.08] p-4 text-sm leading-6 text-zinc-200">
                  <RichInline text={block.sidebar} />
                </div>
              )}
            </aside>
          )
        }

        if (block.type === 'quote') {
          return (
            <blockquote key={key} className="rounded-r-lg border-l-2 border-brand/60 bg-surface-2/50 py-2 pl-4 pr-3 text-[15px] italic leading-7 text-muted">
              <RichInline text={block.text} />
            </blockquote>
          )
        }

        if (block.type === 'code') {
          return (
            <pre key={key} className="overflow-x-auto rounded-xl border border-white/10 bg-black/40 p-4 text-[13px] leading-6 text-brand-2">
              <code>{block.text}</code>
            </pre>
          )
        }

        if (block.type === 'stats') {
          return (
            <div key={key} className="grid gap-3 sm:grid-cols-3">
              {block.items.map((item) => (
                <div className="rounded-lg border border-white/10 bg-surface-2 p-4" key={item.label}>
                  <p className="text-xl font-bold leading-tight text-white">{item.value}</p>
                  <p className="mt-1 text-xs font-semibold text-muted">{item.label}</p>
                </div>
              ))}
            </div>
          )
        }

        if (block.type === 'callout') {
          return (
            <div key={key} className="rounded-lg border border-brand/50 bg-brand/[0.08] p-4">
              <h3 className="font-bold text-white"><RichInline text={block.title} /></h3>
              <p className="mt-2 text-sm leading-6 text-muted"><RichInline text={block.text} /></p>
            </div>
          )
        }

        if (block.type === 'image') {
          if (!isSafeImageUrl(block.src)) {
            return null
          }

          const imageSrc = getOptimizedImageUrl(block.src, 1200) || block.src

          return (
            <figure key={key} className="overflow-hidden rounded-xl border border-white/10 bg-bg-2">
              <img
                className="h-auto max-h-[560px] w-full object-cover"
                src={imageSrc}
                alt={block.alt}
                loading="lazy"
                decoding="async"
              />
              {block.caption && (
                <figcaption className="border-t border-white/10 px-4 py-3 text-xs leading-5 text-muted">
                  <RichInline text={block.caption} />
                </figcaption>
              )}
            </figure>
          )
        }

        const isLead = block.type === 'lead'
        return (
          <p key={key} className={`${isLead ? 'text-[17px] text-zinc-200' : 'text-[15px] text-muted'} leading-7`}>
            <RichInline text={block.text} />
          </p>
        )
      })}
    </div>
  )
}

export default MarkdownBody
