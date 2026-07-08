import { isSafeImageUrl } from './safeUrls.js'
import { getOptimizedImageUrl } from './imageOptimizer.js'
import { RichInline, parseMarkdownBlocks } from './RichText.jsx'

// Renders Discord-style markdown (the same mini-syntax used across the site) into
// styled article content. Shared by the public wiki article page and the admin
// live preview so both always look identical.
export function MarkdownBody({ text, className = '' }) {
  const blocks = parseMarkdownBlocks(text)

  if (blocks.length === 0) {
    return null
  }

  return (
    <div className={`grid gap-4 ${className}`}>
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
          <p key={key} className={`${isLead ? 'text-[17px] text-zinc-200' : 'text-[15px] text-muted'} leading-8`}>
            <RichInline text={block.text} />
          </p>
        )
      })}
    </div>
  )
}

export default MarkdownBody
