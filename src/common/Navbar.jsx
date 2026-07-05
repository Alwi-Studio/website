import { useState } from 'react'
import logoLong from '../assets/LONG--FOR-BG-HITAM.webp'
import logoMark from '../assets/MAIN--FOR-BG-HITAM.webp'

const links = [
  { label: 'Home', href: '/#home' },
  { label: 'News', href: '/news' },
  { label: 'About', href: '/#about' },
  { label: 'Work', href: '/#work' },
  { label: 'Contact', href: '/#contact' },
  { label: 'Rules', href: '/rules'},
  { label: 'Terms', href: '/terms'},
]

const storeHref = 'https://store.alwination.id'

function Navbar({ activeSection = 'home' }) {
  const [isOpen, setIsOpen] = useState(false)

  function isActive(link) {
    return (
      (link.href === `/#${activeSection}`) ||
      (activeSection === 'news' && link.href === '/news') ||
      (activeSection === 'rules' && link.href === '/rules') ||
      (activeSection === 'terms' && link.href === '/terms')
    )
  }

  function handleNavClick(event, link) {
    setIsOpen(false)
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-bg/60 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-4 px-6 py-3.5">
        <a href="/#home" className="flex h-[38px] items-center">
          <img className="hidden h-[30px] w-auto object-contain sm:block" src={logoLong} alt="AlwiNation" />
          <img className="h-9 w-auto object-contain sm:hidden" src={logoMark} alt="AlwiNation" />
        </a>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
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
          isOpen ? 'max-h-[420px] pb-4 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <ul className="flex flex-col gap-1 rounded-2xl border border-white/10 bg-surface-2/95 p-2 shadow-[0_18px_40px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          {links.map((link) => (
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
