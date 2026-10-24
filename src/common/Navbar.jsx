import { useEffect, useRef, useState } from 'react'
import { Icon } from './Icons.jsx'
import { formatCount, useServerStatus } from './liveData.js'
import { useSite } from './siteContext.js'
import ThemeToggle from './ThemeToggle.jsx'
import { copyText } from './toastBus.js'

const mainLinks = [
  { key: 'home', label: 'Home', href: '/' },
  { key: 'realms', label: 'Realms', href: '/#realms' },
  { key: 'leaderboard', label: 'Leaderboard', href: '/leaderboard' },
  { key: 'news', label: 'News', href: '/news' },
  { key: 'wiki', label: 'Wiki', href: '/wiki' },
]

// Pages without their own spot in the bar; the phone menu lists them too.
const extraLinks = [
  { key: 'changelog', label: 'Changelog', href: '/changelog' },
  { key: 'staff', label: 'Staff', href: '/staff' },
  { key: 'rules', label: 'Rules', href: '/rules' },
]

const external = { target: '_blank', rel: 'noreferrer' }

// overHero: the page starts with a dark picture band, so the bar stays clear
// (white text) until the page scrolls. Every other page gets a solid bar.
function Navbar({ activeSection = '', overHero = false }) {
  const { settings } = useSite()
  const status = useServerStatus(settings.serverAddress)
  const menuRef = useRef(null)
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (!overHero) return undefined
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [overHero])

  const solid = !overHero || scrolled || menuOpen
  const current = (key) => (key === activeSection ? 'page' : undefined)
  const closeMenu = () => { if (menuRef.current) menuRef.current.open = false }

  return (
    <header className={`nav${solid ? ' is-solid' : ''}`} id="nav">
      <div className="container nav-in">
        <a className="nav-logo" href="/" aria-label="AlwiNation home">
          <span className="logo-long">
            <img className="logo-on-dark" src="/img/logo-long.webp" width="1200" height="91" alt="AlwiNation" />
            <img className="logo-on-light" src="/img/logo-long-dark.webp" width="1200" height="91" alt="AlwiNation" />
          </span>
          <img className="logo-mark" src="/img/logo-mark.webp" width="34" height="34" alt="AlwiNation" />
        </a>

        <nav className="nav-links" aria-label="Main">
          {mainLinks.map((link) => (
            <a key={link.key} href={link.href} aria-current={current(link.key)}>{link.label}</a>
          ))}
          <a href={settings.storeUrl} {...external}>Store</a>
        </nav>

        <div className="nav-right">
          <ThemeToggle />
          <a className="icon-btn discord-btn" href={settings.discordUrl} {...external} aria-label="Join the AlwiNation Discord">
            <Icon name="discord" />
          </a>
          <button
            className="ip-btn"
            type="button"
            onClick={() => copyText(settings.serverAddress)}
            aria-label={`Copy server IP ${settings.serverAddress}`}
          >
            <Icon name="copy" />
            <span className="ip-text">{settings.serverAddress}</span>
            <span className="ip-count">{formatCount(status.players)}</span>
          </button>
          <details className="menu" ref={menuRef} onToggle={(event) => setMenuOpen(event.currentTarget.open)}>
            <summary className="icon-btn" aria-label="Open menu">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </summary>
            <div className="menu-panel">
              {[...mainLinks, ...extraLinks].map((link) => (
                <a key={link.key} href={link.href} aria-current={current(link.key)} onClick={closeMenu}>{link.label}</a>
              ))}
              <a href={settings.storeUrl} {...external} onClick={closeMenu}>Store</a>
              <a href={settings.discordUrl} {...external} onClick={closeMenu}><Icon name="discord" />Discord</a>
            </div>
          </details>
        </div>
      </div>
    </header>
  )
}

export default Navbar
