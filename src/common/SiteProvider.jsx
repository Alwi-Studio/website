import { useEffect, useMemo, useState } from 'react'
import { getSite, loadSite } from '../content/siteStore.js'
import { SiteContext } from './siteContext.js'

// Seed on first paint, server document once it arrives. A failed request keeps
// the seed: the public site must render even when /api/site is down.
function SiteProvider({ children }) {
  const [site, setSite] = useState(getSite)

  useEffect(() => {
    let cancelled = false
    loadSite()
      .then((loaded) => { if (!cancelled) setSite(loaded) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  const value = useMemo(() => ({ site, setSite }), [site])
  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>
}

export default SiteProvider
