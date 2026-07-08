import { useEffect, useRef, useState } from 'react'
import logoLongAvif from '../assets/LONG--FOR-BG-HITAM.avif'
import logoLong from '../assets/LONG--FOR-BG-HITAM.webp'
import logoMarkAvif from '../assets/MAIN--FOR-BG-HITAM.avif'
import logoMark from '../assets/MAIN--FOR-BG-HITAM.webp'

// Primary in-page sections stay in the bar; secondary standalone pages move into
// a compact "More" menu so the navbar does not get crowded as pages are added.
const sectionLinks = [
  { label: 'Home', href: '/#home' },
  { label: 'News', href: '/#news' },
  { label: 'About', href: '/#about' },
  { label: 'Work', href: '/#work' },
  { label: 'Contact', href: '/#contact' },
]

const pageLinks = [
  { label: 'Wiki', href: '/wiki' },
  { label: 'Staff', href: '/staff' },
  { label: 'Rules', href: '/rules' },
  { label: 'Terms', href: '/terms' },
  { label: 'Status', href: 'https://status.alwination.id/status/dashboard', target: '_blank'},
]

const storeHref = 'https://store.alwination.id'

function quickScrollTo(targetY) {
  const startY = window.scrollY
  const distance = targetY - startY
  const duration = 220
  const startTime = performance.now()

  function step(currentTime) {
    const progress = Math.min((currentTime - startTime) / duration, 1)
    window.scrollTo(0, startY + distance * progress)

    if (progress < 1) {
      window.requestAnimationFrame(step)
    }
  }

  window.requestAnimationFrame(step)
}

function Navbar({ activeSection = 'home' }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMoreOpen, setIsMoreOpen] = useState(false)
  const moreRef = useRef(null)

  function isActive(link) {
    if (link.href.startsWith('/#')) {
      return link.href === `/#${activeSection}`
    }
    return link.href === `/${activeSection}`
  }

  const isAnyPageActive = pageLinks.some(isActive)

  // Close the "More" menu on outside click or Escape.
  useEffect(() => {
    if (!isMoreOpen) {
      return undefined
    }

    function handlePointer(event) {
      if (moreRef.current && !moreRef.current.contains(event.target)) {
        setIsMoreOpen(false)
      }
    }

    function handleKey(event) {
      if (event.key === 'Escape') {
        setIsMoreOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointer)
    document.addEventListener('keydown', handleKey)

    return () => {
      document.removeEventListener('mousedown', handlePointer)
      document.removeEventListener('keydown', handleKey)
    }
  }, [isMoreOpen])

  function handleNavClick(event, link) {
    setIsOpen(false)
    setIsMoreOpen(false)

    if (!link.href.startsWith('/#') || window.location.pathname !== '/') {
      return
    }

    const sectionId = link.href.slice(2)
    const section = document.getElementById(sectionId)
    if (!section) {
      return
    }

    event.preventDefault()
    const navOffset = sectionId === 'home' ? 0 : 88
    window.history.pushState(null, '', `/#${sectionId}`)
    quickScrollTo(section.getBoundingClientRect().top + window.scrollY - navOffset)
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-bg/60 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-4 px-6 py-2.5">
        <a href="/#home" className="flex h-[38px] items-center">
          <picture className="hidden sm:contents">
            <source srcSet={logoLongAvif} type="image/avif" />
            <img className="hidden h-[25px] w-auto object-contain sm:block" src={logoLong} alt="AlwiNation" width="556" height="110" />
          </picture>
          <picture className="contents sm:hidden">
            <source srcSet={logoMarkAvif} type="image/avif" />
            <img className="h-9 w-auto object-contain sm:hidden" src={logoMark} alt="AlwiNation" width="110" height="110" />
          </picture>
        </a>

        <nav className="hidden items-center gap-2 md:flex">
          {sectionLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(event) => handleNavClick(event, link)}
              className={`relative overflow-hidden rounded-[10px] px-[15px] py-[9px] text-[14.5px] font-medium transition duration-300 ${
                isActive(link)
                  ? 'text-white shadow-[inset_0_0_0_1px_rgba(255,90,48,0.4)]'
                  : 'text-muted hover:bg-white/[0.06] hover:text-white'
              }`}
            >
              <span
                className={`absolute inset-0 rounded-[10px] bg-brand/12 transition duration-300 ${
                  isActive(link) ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
                }`}
                aria-hidden="true"
              />
              <span className="relative">{link.label}</span>
            </a>
          ))}

          {/* More dropdown for standalone pages */}
          <div className="relative" ref={moreRef}>
            <button
              type="button"
              onClick={() => setIsMoreOpen((open) => !open)}
              aria-haspopup="true"
              aria-expanded={isMoreOpen}
              className={`inline-flex items-center gap-1.5 rounded-[10px] px-[15px] py-[9px] text-[14.5px] font-medium transition duration-300 ${
                isAnyPageActive || isMoreOpen
                  ? 'text-white shadow-[inset_0_0_0_1px_rgba(255,90,48,0.4)]'
                  : 'text-muted hover:bg-white/[0.06] hover:text-white'
              }`}
            >
              More
              <svg
                className={`transition duration-300 ${isMoreOpen ? 'rotate-180' : ''}`}
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>

            {isMoreOpen && (
              <div className="absolute right-0 top-[calc(100%+10px)] w-48 overflow-hidden rounded-xl border border-white/10 bg-surface-2/95 p-1.5 shadow-[0_18px_40px_rgba(0,0,0,0.34)] backdrop-blur-xl">
                {pageLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    target={link.target}
                    onClick={() => setIsMoreOpen(false)}
                    className={`flex items-center rounded-lg px-3 py-2 text-sm font-medium transition ${
                      isActive(link)
                        ? 'bg-brand/12 text-white shadow-[inset_0_0_0_1px_rgba(255,90,48,0.28)]'
                        : 'text-muted hover:bg-white/[0.06] hover:text-white'
                    }`}
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            )}
          </div>
        </nav>

        <div className="hidden md:block">
          <a
            href={storeHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center rounded-[10px] bg-gradient-to-b from-brand-2 to-brand px-[18px] py-[9px] text-[14.5px] font-semibold text-[#1a0d07] shadow-[0_6px_18px_rgba(255,90,48,0.3)] transition hover:brightness-105"
          >
            Store
          </a>
        </div>

        <button
          type="button"
          className="flex h-11 w-11 flex-col items-center justify-center gap-[5px] rounded-[11px] border border-white/15 bg-white/[0.06] transition hover:border-brand/70 hover:bg-brand/15 focus:outline-none focus:ring-2 focus:ring-brand/70 md:hidden"
          aria-label="Toggle navigation menu"
          aria-expanded={isOpen}
          aria-controls="navbar-menu"
          onClick={() => setIsOpen((open) => !open)}
        >
          <span className={`block h-0.5 w-5 rounded-full bg-white transition ${isOpen ? 'translate-y-[7px] rotate-45' : ''}`} />
          <span className={`block h-0.5 w-5 rounded-full bg-white transition ${isOpen ? 'opacity-0' : ''}`} />
          <span className={`block h-0.5 w-5 rounded-full bg-white transition ${isOpen ? '-translate-y-[7px] -rotate-45' : ''}`} />
        </button>
      </div>

      {/* Mobile menu */}
      <div
        id="navbar-menu"
        className={`origin-top overflow-hidden px-4 transition-all duration-200 ease-out md:hidden ${
          isOpen ? 'max-h-[560px] pb-4 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <ul className="flex flex-col gap-1 rounded-2xl border border-white/10 bg-surface-2/95 p-2 shadow-[0_18px_40px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          {sectionLinks.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                onClick={(event) => handleNavClick(event, link)}
                className={`relative flex min-h-11 items-center overflow-hidden rounded-lg px-4 text-sm font-semibold transition duration-300 ${
                  isActive(link) ? 'text-white' : 'text-muted hover:bg-white/[0.06] hover:text-white'
                }`}
              >
                <span
                  className={`absolute inset-0 bg-brand transition duration-300 ${
                    isActive(link) ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0'
                  }`}
                  aria-hidden="true"
                />
                <span className="relative">{link.label}</span>
              </a>
            </li>
          ))}

          <li className="mx-2 my-1.5 border-t border-white/10" aria-hidden="true" />
          <li className="px-4 pb-1 pt-0.5 text-[11px] font-bold uppercase tracking-[0.16em] text-muted-2">Pages</li>

          {pageLinks.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                onClick={(event) => handleNavClick(event, link)}
                className={`relative flex min-h-11 items-center overflow-hidden rounded-lg px-4 text-sm font-semibold transition duration-300 ${
                  isActive(link) ? 'text-white' : 'text-muted hover:bg-white/[0.06] hover:text-white'
                }`}
              >
                <span
                  className={`absolute inset-0 bg-brand transition duration-300 ${
                    isActive(link) ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0'
                  }`}
                  aria-hidden="true"
                />
                <span className="relative">{link.label}</span>
              </a>
            </li>
          ))}

          <li>
            <a
              href={storeHref}
              target="_blank"
              rel="noreferrer"
              onClick={() => setIsOpen(false)}
              className="mt-1 flex min-h-11 items-center justify-center rounded-lg bg-gradient-to-b from-brand-2 to-brand px-4 text-sm font-semibold text-[#1a0d07]"
            >
              Store
            </a>
          </li>
        </ul>
      </div>
    </header>
  )
}

export default Navbar
