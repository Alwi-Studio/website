import { useEffect, useMemo, useState } from 'react'
import { SiteValidationError, normalizeSite, validateSite } from '../../api/_site.js'
import { useSite } from '../common/siteContext.js'
import { resetAdminSite, saveAdminSite } from '../content/siteStore.js'

// The server's own schema, run in the browser so the editor shows the exact
// message the API would answer with. `broken` means the check itself failed
// (not bad input): saving stays blocked rather than sending an unchecked document.
export function checkSite(site) {
  try {
    const normalized = normalizeSite(site)
    validateSite(normalized)
    return { site: normalized, error: '', broken: false }
  } catch (error) {
    const invalid = error instanceof SiteValidationError
    return { site: null, error: invalid ? error.message : `The site document could not be checked: ${error.message}`, broken: !invalid }
  }
}

// Colours reach CSS custom properties, so only the validated hex form is used.
export const safeColor = (value, fallback = 'transparent') => (/^#[0-9a-f]{6}$/i.test(value) ? value : fallback)

export function moveItem(list, from, to) {
  const next = [...list]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

// Draft of one part of the site document ('home' or 'settings'). Saving sends
// the whole document with this part replaced, so the other part is kept as stored.
export function useSiteDraft(part, onStatus) {
  const { site, setSite } = useSite()
  const base = site[part]
  const [draft, setDraft] = useState(base)
  const [seen, setSeen] = useState(base)
  const [phase, setPhase] = useState('idle')
  const [serverError, setServerError] = useState('')

  // A newer stored document (the fresh admin load, or the other editor saving)
  // replaces the draft only when the draft has no unsaved edits.
  if (base !== seen) {
    setSeen(base)
    if (JSON.stringify(draft) === JSON.stringify(seen)) setDraft(base)
  }

  const next = useMemo(() => ({ ...site, [part]: draft }), [site, part, draft])
  const check = useMemo(() => checkSite(next), [next])
  // Compare what would be stored: number inputs hold "6" for 6, and trimming
  // or coercion alone is not an unsaved change.
  const dirty = JSON.stringify(check.site ? check.site[part] : draft) !== JSON.stringify(base)
  const status = phase === 'saving' ? 'saving' : phase === 'saved' ? 'saved' : dirty ? 'dirty' : ''

  useEffect(() => {
    onStatus(part, status)
  }, [onStatus, part, status])

  async function apply(request) {
    setPhase('saving')
    setServerError('')
    try {
      const saved = await request()
      setSite(saved)
      setDraft(saved[part])
      setSeen(saved[part])
      setPhase('saved')
      window.setTimeout(() => setPhase((current) => (current === 'saved' ? 'idle' : current)), 1800)
    } catch (error) {
      setServerError(error.message)
      setPhase('idle')
    }
  }

  return {
    site,
    draft,
    setDraft,
    dirty,
    status,
    error: check.error,
    serverError,
    save: () => (check.site ? apply(() => saveAdminSite(check.site)) : undefined),
    reset: () => apply(resetAdminSite),
  }
}
