import { createContext, useContext } from 'react'
import { getSite } from '../content/siteStore.js'

export const SiteContext = createContext({ site: getSite(), setSite: () => {} })

// { site, settings, home, setSite }. setSite lets the admin show a saved
// document everywhere without a reload.
export function useSite() {
  const { site, setSite } = useContext(SiteContext)
  return { site, settings: site.settings, home: site.home, setSite }
}
