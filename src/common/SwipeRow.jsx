import { useCallback, useEffect, useRef, useState } from 'react'
import { reducedMotion } from './reveal.js'

// A .seg.scroll row: it wraps for a mouse and swipes sideways on touch. When a swipe row hides chips,
// a ‹ › pair sits beside it (never over the chips) and pages it along; an arrow dims at its end.
// Chips fade only where one is actually cut: the right while more follow, the left only at the very end.
// The buttons are a visual shortcut only: every chip stays reachable by swipe and by keyboard.
function SwipeRow({ ref, className = '', children, ...props }) {
  const rowRef = useRef(null)
  const [edges, setEdges] = useState({ start: false, end: false, cut: false })
  const overflows = edges.start || edges.end

  const update = useCallback(() => {
    const row = rowRef.current
    if (!row) return
    const hidden = row.scrollWidth - row.clientWidth
    const start = row.scrollLeft > 1
    const end = row.scrollLeft < hidden - 1
    // At the very end the row cannot scroll far enough to start on a whole chip, so the left can be cut too.
    const left = row.getBoundingClientRect().left
    const cut = start && [...row.children].some((chip) => { const box = chip.getBoundingClientRect(); return box.left < left - 1 && box.right > left + 1 })
    setEdges((current) => (current.start === start && current.end === end && current.cut === cut ? current : { start, end, cut }))
  }, [])

  const setRow = useCallback((node) => {
    rowRef.current = node
    if (typeof ref === 'function') ref(node)
    else if (ref) ref.current = node
  }, [ref])

  // Chips change with data and filters (every render), the row with the viewport, chip widths with the web fonts.
  useEffect(update)
  useEffect(() => {
    const observer = new ResizeObserver(update)
    observer.observe(rowRef.current)
    document.fonts?.ready.then(update)
    return () => observer.disconnect()
  }, [update])

  // Next shows the chip that was cut off as the first one; back goes about a row width. The row's
  // scroll snap (theme.css) settles both on a whole chip.
  function page(direction) {
    const row = rowRef.current
    const box = row.getBoundingClientRect()
    const padding = parseFloat(getComputedStyle(row).scrollPaddingLeft) || 0
    const cut = direction > 0 && [...row.children].find((chip) => chip.getBoundingClientRect().right > box.right - 1)
    const left = cut ? cut.getBoundingClientRect().left - box.left - padding : direction * (row.clientWidth - 48)
    row.scrollBy({ left, behavior: reducedMotion() ? 'auto' : 'smooth' })
  }

  return (
    <div className="swipe" data-cut={edges.cut || undefined} data-end={edges.end || undefined}>
      <div ref={setRow} className={`seg scroll ${className}`.trim()} onScroll={update} {...props}>{children}</div>
      {overflows && (
        <div className="swipe-nav" aria-hidden="true">
          <button className="swipe-btn" type="button" tabIndex={-1} disabled={!edges.start} onClick={() => page(-1)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l-7 7 7 7" /></svg>
          </button>
          <button className="swipe-btn" type="button" tabIndex={-1} disabled={!edges.end} onClick={() => page(1)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      )}
    </div>
  )
}

export default SwipeRow
