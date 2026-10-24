import { useId, useRef, useState, useSyncExternalStore } from 'react'
import '../news/rich.css'
import { plainText } from '../news/postInfo.js'
import { isSafeImageUrl } from './safeUrls.js'
import { getOptimizedImageUrl } from './imageOptimizer.js'
import { reducedMotion } from './reveal.js'
import { RichInline, parseMarkdownBlocks } from './RichText.jsx'

const pad = (n) => String(n).padStart(2, '0')

// Below 720px the tab stack becomes one sideways row (rich.css), so the arrow axis flips with it.
const narrowQuery = '(max-width: 720px)'
function subscribeNarrow(onChange) {
  const query = window.matchMedia(narrowQuery)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}
const isNarrow = () => window.matchMedia(narrowQuery).matches

// ":::tabs" as ARIA tabs: arrows on either axis, Home and End move focus and select.
function RichTabs({ items, name }) {
  const id = useId()
  const listRef = useRef(null)
  const [chosen, setActive] = useState(0)
  const narrow = useSyncExternalStore(subscribeNarrow, isNarrow)
  const count = items.length
  // Admin previews re-render as tabs are deleted; never point past the last one.
  const active = Math.min(chosen, count - 1)

  function select(index, focus = false) {
    setActive(index)
    const list = listRef.current
    const button = list?.children[index]
    if (!button) return
    if (focus) button.focus({ preventScroll: true })
    // On phones the row scrolls sideways; keep the chosen tab in sight without moving the page.
    if (list.scrollWidth > list.clientWidth) {
      list.scrollTo({ left: button.offsetLeft - 16, behavior: reducedMotion() ? 'auto' : 'smooth' })
    }
  }

  function onKeyDown(event) {
    const { key } = event
    const next = key === 'ArrowDown' || key === 'ArrowRight' ? (active + 1) % count
      : key === 'ArrowUp' || key === 'ArrowLeft' ? (active - 1 + count) % count
        : key === 'Home' ? 0 : key === 'End' ? count - 1 : -1
    if (next < 0) return
    event.preventDefault()
    select(next, true)
  }

  return (
    <div className="tabs">
      <div className="seg tab-list" role="tablist" aria-label={name} aria-orientation={narrow ? 'horizontal' : 'vertical'} ref={listRef} onKeyDown={onKeyDown}>
        {items.map((item, index) => (
          <button
            key={`${item.title}-${index}`}
            type="button"
            role="tab"
            id={`${id}t${index}`}
            aria-controls={`${id}p${index}`}
            aria-selected={index === active}
            tabIndex={index === active ? 0 : -1}
            onClick={() => select(index)}
          >
            <span className="n">{pad(index + 1)}</span>
            <span><RichInline text={item.title} /></span>
          </button>
        ))}
      </div>
      <div className="tab-view panel">
        {items.map((item, index) => (
          <div key={`${item.title}-${index}`} role="tabpanel" id={`${id}p${index}`} aria-labelledby={`${id}t${index}`} tabIndex={0} hidden={index !== active}>
            <p className="label">{name}</p>
            <h4><RichInline text={item.title} /></h4>
            {item.text && <p className="txt"><RichInline text={item.text} /></p>}
          </div>
        ))}
        {count > 1 && (
          <div className="seg tab-nav">
            <button type="button" onClick={() => select((active - 1 + count) % count)}><span aria-hidden="true">←</span> Previous</button>
            <span className="count">{pad(active + 1)} / {pad(count)}</span>
            <button type="button" onClick={() => select((active + 1) % count)}>Next <span aria-hidden="true">→</span></button>
          </div>
        )}
      </div>
    </div>
  )
}

// Every block shape parseMarkdownBlocks produces, plus the legacy news shapes (plain
// strings, headings without a level). One renderer for news, wiki, rules and the admin
// previews; style comes from .prose (theme.css) and .rich (news/rich.css) on the parent.
// anchors: optional ids by block index, so a contents panel can link to headings.
// nested: content inside an accordion; its headings start at h3, so they never join the
// page's h2 outline (the wiki builds its contents list from every h2).
export function RichBlocks({ blocks, anchors, nested = false }) {
  // The shallowest heading level present becomes h2 (the page owns h1), so a post written
  // with "##" sections reads the same as one written with "#".
  const top = Math.min(3, ...blocks.filter((block) => block?.type === 'heading').map((block) => block.level ?? 2))
  const base = nested ? 3 : 2
  let featureNumber = 0
  let lastHeading = ''

  return blocks.map((raw, index) => {
    const block = typeof raw === 'string' ? { type: 'paragraph', text: raw } : raw
    const key = `${block.type}-${index}`

    if (block.type === 'heading') {
      lastHeading = plainText(block.text)
      const Heading = `h${Math.min(4, base + (block.level ?? 2) - top)}`
      return <Heading key={key} id={anchors?.[index]}><RichInline text={block.text} /></Heading>
    }

    if (block.type === 'divider') {
      // Rows of feature cards already read as one grid; a rule between two of them is noise.
      const betweenCards = blocks[index - 1]?.type === 'columns' && blocks[index + 1]?.type === 'columns'
      return betweenCards ? null : <hr key={key} />
    }

    if (block.type === 'list') {
      return <ul key={key}>{block.items.map((item, i) => <li key={i}><RichInline text={item} /></li>)}</ul>
    }

    if (block.type === 'ordered-list') {
      return <ol key={key}>{block.items.map((item, i) => <li key={i}><RichInline text={item} /></li>)}</ol>
    }

    if (block.type === 'checklist') {
      return (
        <ul key={key} className="checklist">
          {block.items.map((item, i) => (
            <li key={i} className={item.checked ? 'is-done' : undefined}>
              <span className="sr-only">{item.checked ? 'Done: ' : 'To do: '}</span>
              <span><RichInline text={item.text} /></span>
            </li>
          ))}
        </ul>
      )
    }

    if (block.type === 'table') {
      return (
        <div key={key} className="rich-table" tabIndex={0}>
          <table>
            <thead>
              <tr>
                {block.headers.map((header, i) => (
                  <th key={`${header}-${i}`} style={{ textAlign: block.alignments?.[i] ?? 'left' }}><RichInline text={header} /></th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {block.headers.map((header, i) => (
                    <td key={`${header}-${i}`} style={{ textAlign: block.alignments?.[i] ?? 'left' }}><RichInline text={row[i] ?? ''} /></td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    }

    // ":::columns" are the numbered feature cards (numbered across the whole post);
    // ":::grid" and ":::cards" use the same cards without numbers.
    if (block.type === 'columns' || block.type === 'grid' || block.type === 'cards') {
      const numbered = block.type === 'columns'
      return (
        <div key={key} className="feats" style={{ '--cols': block.type === 'cards' ? 3 : block.columns }}>
          {block.items.map((item, i) => (
            <div className={`feat panel${numbered ? ' has-n' : ''}`} key={`${item.title}-${i}`}>
              {numbered && <span className="feat-n">{pad(++featureNumber)}</span>}
              <h3><RichInline text={item.title} /></h3>
              {item.text && <p><RichInline text={item.text} /></p>}
              {item.meta && <p className="label"><RichInline text={item.meta} /></p>}
            </div>
          ))}
        </div>
      )
    }

    if (block.type === 'tabs') {
      return <RichTabs key={key} items={block.items} name={lastHeading || 'Details'} />
    }

    if (block.type === 'accordion') {
      return (
        <div key={key} className="rich-acc">
          {block.items.map((item, i) => (
            <details className="panel" key={`${item.title}-${i}`}>
              <summary><RichInline text={item.title} /></summary>
              {item.text && <div className="rich-acc-body"><RichBlocks blocks={parseMarkdownBlocks(item.text)} nested /></div>}
            </details>
          ))}
        </div>
      )
    }

    if (block.type === 'section' || block.type === 'container') {
      return (
        <section key={key} className={block.type === 'container' ? 'rich-box panel' : 'rich-section'}>
          {block.title && <h3><RichInline text={block.title} /></h3>}
          {block.text && <p><RichInline text={block.text} /></p>}
        </section>
      )
    }

    if (block.type === 'sidebar') {
      return (
        <aside key={key} className="rich-box rich-sidebar panel">
          <div>
            {block.title && <h3><RichInline text={block.title} /></h3>}
            {block.text && <p><RichInline text={block.text} /></p>}
          </div>
          {block.sidebar && <p className="rich-note"><RichInline text={block.sidebar} /></p>}
        </aside>
      )
    }

    if (block.type === 'quote') {
      return (
        <figure key={key} className="quote">
          <blockquote><RichInline text={block.text} /></blockquote>
          {block.cite && <figcaption>— {block.cite}</figcaption>}
        </figure>
      )
    }

    if (block.type === 'code') {
      return <pre key={key} tabIndex={0}><code>{block.text}</code></pre>
    }

    if (block.type === 'stats') {
      return (
        <div key={key} className="stats">
          {block.items.map((item, i) => (
            <div className="stat panel" key={`${item.label}-${i}`}><b>{item.value}</b><span>{item.label}</span></div>
          ))}
        </div>
      )
    }

    if (block.type === 'callout') {
      return (
        <aside key={key} className="callout panel">
          <p className="label"><RichInline text={block.title} /></p>
          <p><RichInline text={block.text} /></p>
        </aside>
      )
    }

    if (block.type === 'image') {
      if (!isSafeImageUrl(block.src)) {
        return null
      }

      return (
        <figure key={key} className="rich-figure">
          <img src={getOptimizedImageUrl(block.src, 1400) || block.src} alt={block.alt} loading="lazy" decoding="async" />
          {block.caption && <figcaption><RichInline text={block.caption} /></figcaption>}
        </figure>
      )
    }

    return (
      <p key={key} className={block.type === 'lead' ? 'rich-lead' : undefined}>
        <RichInline text={block.text} />
      </p>
    )
  })
}

// Renders the site's Discord-style markdown (the same mini-syntax used across the
// site) as styled article content. Shared by the public wiki and rules pages and the
// admin live previews so they always look identical.
export function MarkdownBody({ text, className = '' }) {
  const blocks = parseMarkdownBlocks(text)

  if (blocks.length === 0) {
    return null
  }

  return (
    <div className={`prose rich ${className}`}>
      <RichBlocks blocks={blocks} />
    </div>
  )
}

export default MarkdownBody
