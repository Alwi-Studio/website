import { useState } from 'react'

// index.html sets data-theme before first paint (saved choice, else the device
// setting); this button flips it and remembers the choice when storage allows.
function ThemeToggle() {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme === 'light' ? 'light' : 'dark')

  function toggle() {
    const next = theme === 'light' ? 'dark' : 'light'
    document.documentElement.dataset.theme = next
    try {
      window.localStorage.setItem('alwi-theme', next)
    } catch {
      // Private mode or blocked storage: the switch still applies for this visit.
    }
    setTheme(next)
  }

  return (
    <button
      className="icon-btn theme-btn"
      type="button"
      onClick={toggle}
      aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
    >
      <svg className="sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <circle cx="12" cy="12" r="4.5" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
      <svg className="moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
        <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11Z" />
      </svg>
    </button>
  )
}

export default ThemeToggle
