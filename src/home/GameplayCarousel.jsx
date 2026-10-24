import { useCallback, useEffect, useRef, useState } from 'react'
import { revealRef } from '../common/reveal.js'
import RealmCard from './RealmCard.jsx'

// Endless loop by page, ported from the approved mockup. A full copy of the
// cards sits on each side of the real ones (rendered by React, hidden from
// assistive tech and focus); after a slide lands on a copy, the track jumps to
// the matching real card with no transition, so the loop never visibly rewinds.
// Slide state lives in refs and the DOM: React only re-renders for the dots.
function GameplayCarousel({ realms, autoplaySeconds = 6 }) {
  const rootRef = useRef(null)
  const viewportRef = useRef(null)
  const trackRef = useRef(null)
  const barRef = useRef(null)
  const api = useRef({ next() {}, prev() {}, goTo() {} })
  const [pages, setPages] = useState({ count: 1, active: 0 })
  const n = realms.length
  const looping = n > 1
  const autoplay = looping && autoplaySeconds > 0
  const setRoot = useCallback((element) => { rootRef.current = element; revealRef(element) }, [])

  useEffect(() => {
    const root = rootRef.current
    const viewport = viewportRef.current
    const track = trackRef.current
    const bar = barRef.current
    if (!looping || !root || !viewport || !track) return undefined
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let per = 1
    let starts = [0]
    let page = 0
    let index = 0 // first real card in view; leaves 0..n-1 only while a wrap slide runs
    let shown = { count: -1, active: -1 } // last dots state sent to React; drags re-render nothing
    const readPer = () => Math.min(n, Math.max(1, Math.round(Number(getComputedStyle(root).getPropertyValue('--per')) || 1)))
    const step = () => track.children[1].offsetLeft - track.children[0].offsetLeft

    function render(animate, dragOffset = 0) {
      track.style.transition = animate && !reduced ? 'transform 760ms cubic-bezier(.65, 0, .25, 1)' : 'none'
      track.style.transform = `translate3d(${-(index + n) * step() + dragOffset}px, 0, 0)`
      const first = index + n
      Array.from(track.children).forEach((card, i) => card.classList.toggle('is-out', i < first || i >= first + per))
      if (starts.length !== shown.count || page !== shown.active) {
        shown = { count: starts.length, active: page }
        setPages(shown)
      }
    }

    function layout() {
      per = readPer()
      starts = []
      for (let start = 0; start < n - per; start += per) starts.push(start)
      starts.push(n - per)
      page = Math.min(page, starts.length - 1)
      index = starts[page]
      render(false)
    }

    // Finish any wrap before moving again, so rapid clicks never run past the copies.
    function settle() {
      if (index === starts[page]) return
      index = starts[page]
      render(false)
      void track.offsetWidth
    }

    function restartTimer() {
      if (!autoplay || reduced || !bar) return
      root.classList.remove('is-playing')
      void bar.offsetWidth
      root.classList.add('is-playing')
    }

    function goTo(target) { settle(); page = target; index = starts[target]; render(true); restartTimer() }
    function next() {
      settle()
      if (page === starts.length - 1) { page = 0; index = n } else { page += 1; index = starts[page] }
      render(true)
      restartTimer()
    }
    function prev() {
      settle()
      if (page === 0) { page = starts.length - 1; index = -per } else { page -= 1; index = starts[page] }
      render(true)
      restartTimer()
    }
    api.current = { next, prev, goTo }

    function onTransitionEnd(event) {
      if (event.target !== track || event.propertyName !== 'transform') return
      if (index !== starts[page]) { index = starts[page]; render(false) }
    }

    function onKey(event) {
      if (event.key === 'ArrowRight') { event.preventDefault(); next() }
      if (event.key === 'ArrowLeft') { event.preventDefault(); prev() }
    }

    // Autoplay: the progress bar's own animation is the timer; it pauses on hover, focus or off-screen.
    let hovered = false
    let focused = false
    let onScreen = true
    const syncPause = () => root.classList.toggle('is-paused', hovered || focused || !onScreen)
    const onEnter = (event) => { if (event.pointerType === 'mouse') { hovered = true; syncPause() } }
    const onLeave = () => { hovered = false; syncPause() }
    const onFocusIn = () => { focused = true; syncPause() }
    const onFocusOut = () => { window.setTimeout(() => { focused = root.contains(document.activeElement); syncPause() }) }
    const visibility = 'IntersectionObserver' in window
      ? new IntersectionObserver(([entry]) => { onScreen = entry.isIntersecting; syncPause() }, { threshold: 0.3 })
      : null
    visibility?.observe(root)

    // Drag or swipe: follow the finger, then turn the page if it moved far enough.
    let startX = 0
    let dx = 0
    let dragging = false
    let moved = false
    const onDown = (event) => {
      if (event.button !== 0) return
      settle()
      dragging = true
      moved = false
      startX = event.clientX
      dx = 0
    }
    const onMove = (event) => {
      if (!dragging) return
      dx = event.clientX - startX
      if (!moved && Math.abs(dx) > 6) {
        moved = true
        viewport.setPointerCapture(event.pointerId)
        track.classList.add('is-dragging')
      }
      if (moved) render(false, dx)
    }
    const onUp = () => {
      if (!dragging) return
      dragging = false
      track.classList.remove('is-dragging')
      if (!moved) return
      const threshold = Math.min(90, step() * 0.18)
      if (dx < -threshold) next()
      else if (dx > threshold) prev()
      else { render(true); restartTimer() }
    }
    // A drag must not also follow the card's link.
    const onClickCapture = (event) => { if (moved) { event.preventDefault(); moved = false } }

    let lastPer = readPer()
    const onResize = () => {
      const current = readPer()
      if (current !== lastPer) { lastPer = current; layout() } else render(false)
    }

    track.addEventListener('transitionend', onTransitionEnd)
    root.addEventListener('keydown', onKey)
    root.addEventListener('pointerenter', onEnter)
    root.addEventListener('pointerleave', onLeave)
    root.addEventListener('focusin', onFocusIn)
    root.addEventListener('focusout', onFocusOut)
    viewport.addEventListener('pointerdown', onDown)
    viewport.addEventListener('pointermove', onMove)
    viewport.addEventListener('pointerup', onUp)
    viewport.addEventListener('pointercancel', onUp)
    viewport.addEventListener('click', onClickCapture, true)
    bar?.addEventListener('animationend', next)
    window.addEventListener('resize', onResize)

    root.style.setProperty('--car-delay', `${autoplaySeconds * 1000}ms`)
    layout()
    syncPause()
    restartTimer()

    return () => {
      track.removeEventListener('transitionend', onTransitionEnd)
      root.removeEventListener('keydown', onKey)
      root.removeEventListener('pointerenter', onEnter)
      root.removeEventListener('pointerleave', onLeave)
      root.removeEventListener('focusin', onFocusIn)
      root.removeEventListener('focusout', onFocusOut)
      viewport.removeEventListener('pointerdown', onDown)
      viewport.removeEventListener('pointermove', onMove)
      viewport.removeEventListener('pointerup', onUp)
      viewport.removeEventListener('pointercancel', onUp)
      viewport.removeEventListener('click', onClickCapture, true)
      bar?.removeEventListener('animationend', next)
      window.removeEventListener('resize', onResize)
      visibility?.disconnect()
      root.classList.remove('is-playing', 'is-paused')
      track.style.transform = ''
      track.style.transition = ''
    }
  }, [n, looping, autoplay, autoplaySeconds, realms])

  const cards = looping
    ? [
        ...realms.map((realm) => <RealmCard key={`before-${realm.id}`} realm={realm} clone />),
        ...realms.map((realm) => <RealmCard key={realm.id} realm={realm} />),
        ...realms.map((realm) => <RealmCard key={`after-${realm.id}`} realm={realm} clone />),
      ]
    : realms.map((realm) => <RealmCard key={realm.id} realm={realm} />)

  return (
    <div className="carousel" ref={setRoot} role="region" aria-roledescription="carousel" aria-label="Gameplay modes" data-reveal>
      <div className="car-viewport" ref={viewportRef}>
        <div className="car-track" ref={trackRef}>{cards}</div>
      </div>
      {looping && (
        <div className="car-ui">
          <button className="car-arrow prev" type="button" aria-label="Previous gameplay modes" onClick={() => api.current.prev()}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
          </button>
          <div className="car-foot">
            <div className="car-dots" role="group" aria-label="Choose a page">
              {Array.from({ length: pages.count }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Page ${i + 1} of ${pages.count}`}
                  aria-current={i === pages.active ? 'true' : 'false'}
                  onClick={() => api.current.goTo(i)}
                />
              ))}
            </div>
            {autoplay && <div className="car-progress" aria-hidden="true"><span ref={barRef} /></div>}
          </div>
          <button className="car-arrow next" type="button" aria-label="Next gameplay modes" onClick={() => api.current.next()}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      )}
    </div>
  )
}

export default GameplayCarousel
