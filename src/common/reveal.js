// Reveal-on-scroll from the approved mockups. Under prefers-reduced-motion content simply shows.

export const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

let observer = null
function getObserver() {
  if (observer || typeof window === 'undefined' || !('IntersectionObserver' in window)) return observer
  observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-in')
        observer.unobserve(entry.target)
      }
    }
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' })
  return observer
}

// Use as ref={revealRef} on an element that has data-reveal.
export function revealRef(element) {
  if (!element || element.classList.contains('is-in')) return
  const io = reducedMotion() ? null : getObserver()
  if (io) io.observe(element)
  else element.classList.add('is-in')
}

