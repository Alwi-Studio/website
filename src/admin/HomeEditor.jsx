import { useEffect, useState } from 'react'
import { isSafeSiteUrl } from '../common/safeUrls.js'
import { fillSitePlaceholders } from '../content/site.js'
import RealmCard from '../home/RealmCard.jsx'
import { loadLeaderboard } from '../leaderboard/leaderboardApi.js'
import { EffectField, ImageField, ReorderList, RowsEditor, SaveBar, TextField } from './SiteForm.jsx'
import { moveItem, safeColor, useSiteDraft } from './siteDraft.js'

const sectionNames = {
  gameplay: 'Pick your Gameplay',
  feature: 'Feature band',
  players: 'Top players',
  join: 'How to join',
  news: 'Latest news',
  community: 'Community band',
}
const maxRealms = 30
const modePattern = /^[a-z0-9-]{1,32}$/

function slugify(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

// Realm ids must be unique; a taken id gets -2, -3 and so on.
function uniqueId(name, realms, self) {
  const base = slugify(name) || 'realm'
  const taken = new Set(realms.filter((_, index) => index !== self).map((realm) => realm.id))
  let id = base
  for (let n = 2; taken.has(id); n += 1) id = `${base}-${n}`
  return id
}

function RealmForm({ realm, realms, index, update, onDuplicate, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const autoId = !realm.id || realm.id === uniqueId(realm.name, realms, index)
  // A typed id can break the pattern or collide; say so at the field, not only in the save bar.
  const idError = !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(realm.id)
    ? 'Use lowercase letters and digits joined by single hyphens, such as sky-wars.'
    : realms.some((other, i) => i !== index && other.id === realm.id) ? 'Another realm already uses this id.' : ''

  return (
    <div className="grid gap-4">
      <div className="adm-grid2">
        <TextField
          label="Name"
          value={realm.name}
          maxLength={40}
          onChange={(name) => update(autoId ? { name, id: uniqueId(name, realms, index) } : { name })}
        />
        <TextField
          label="Id"
          value={realm.id}
          spellCheck={false}
          hint={autoId ? 'Follows the name until you change it.' : 'Lowercase letters, digits and single hyphens.'}
          error={idError}
          onChange={(id) => update({ id: id.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
        />
        <TextField label="Label" value={realm.label} maxLength={60} hint="Small line above the name." onChange={(label) => update({ label })} />
        <TextField label="Badge" value={realm.badge} maxLength={60} hint="Optional corner tag." onChange={(badge) => update({ badge })} />
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <label className="adm-label">
          Colour
          <input className="adm-color" type="color" value={safeColor(realm.color, '#000000').toLowerCase()} onChange={(event) => update({ color: event.target.value })} />
        </label>
        <TextField
          className="min-w-[160px] flex-1"
          label="Hex colour"
          value={realm.color}
          maxLength={7}
          spellCheck={false}
          error={safeColor(realm.color, '') ? '' : 'Use a six-digit hex colour such as #ff5a30.'}
          onChange={(color) => update({ color })}
        />
      </div>
      <ImageField label="Card image" value={realm.image} hint="A tall picture works best (3:4)." onChange={(image) => update({ image })} />
      <TextField label="Description" multiline value={realm.description} maxLength={300} onChange={(description) => update({ description })} />
      <div className="adm-grid2">
        <TextField label="Link label" value={realm.linkLabel} maxLength={40} onChange={(linkLabel) => update({ linkLabel })} />
        <TextField
          label="Link"
          value={realm.href}
          spellCheck={false}
          error={isSafeSiteUrl(realm.href) ? '' : 'Use a site path such as /wiki, or an https:// URL.'}
          onChange={(href) => update({ href })}
        />
      </div>
      <div className="flex flex-wrap gap-3">
        <button className="btn btn-stone btn-sm" type="button" disabled={realms.length >= maxRealms} onClick={onDuplicate}>Duplicate</button>
        {confirmDelete ? (
          <div className="adm-confirm basis-full">
            <p>Delete {realm.name || 'this realm'}? It disappears from the carousel when you save.</p>
            <button className="btn btn-sm btn-danger" type="button" onClick={() => { setConfirmDelete(false); onDelete() }}>Delete realm</button>
            <button className="btn btn-stone btn-sm" type="button" onClick={() => setConfirmDelete(false)}>Cancel</button>
          </div>
        ) : (
          <button className="btn btn-sm btn-danger" type="button" disabled={realms.length <= 1} onClick={() => setConfirmDelete(true)}>Delete</button>
        )}
      </div>
    </div>
  )
}

function SectionFields({ section, update, settings, modes }) {
  const placeholders = (
    <>Placeholders: <code>{'{serverAddress}'}</code> = {settings.serverAddress}, <code>{'{bedrockPort}'}</code> = {settings.bedrockPort}, <code>{'{javaVersion}'}</code> = {settings.javaVersion}.</>
  )
  return (
    <div className="grid gap-4">
      <div className="adm-grid2">
        <TextField label="Kicker" value={section.kicker} maxLength={60} onChange={(kicker) => update({ kicker })} />
        <TextField label="Title" value={section.title} maxLength={120} onChange={(title) => update({ title })} />
        {section.id === 'feature' && (
          <TextField label="Accent word" value={section.titleAccent} maxLength={120} hint="Shown after the title in the accent colour." onChange={(titleAccent) => update({ titleAccent })} />
        )}
      </div>
      <TextField label="Lead" multiline value={section.lead} maxLength={400} hint={section.id === 'join' ? placeholders : undefined} onChange={(lead) => update({ lead })} />

      {section.id === 'gameplay' && (
        <TextField
          className="max-w-[240px]"
          label="Autoplay (seconds)"
          type="number"
          min={0}
          max={20}
          value={section.autoplaySeconds}
          hint="0 turns autoplay off; otherwise 3 to 20."
          onChange={(autoplaySeconds) => update({ autoplaySeconds })}
        />
      )}

      {section.id === 'feature' && (
        <>
          <ImageField label="Background image" value={section.image} onChange={(image) => update({ image })} />
          <EffectField value={section.effect} onChange={(effect) => update({ effect })} />
          <div className="adm-grid2">
            <TextField label="Button label" value={section.buttonLabel} maxLength={40} onChange={(buttonLabel) => update({ buttonLabel })} />
            <TextField
              label="Button link"
              value={section.buttonHref}
              spellCheck={false}
              error={isSafeSiteUrl(section.buttonHref) ? '' : 'Use a site path such as /news/season-5, or an https:// URL.'}
              onChange={(buttonHref) => update({ buttonHref })}
            />
          </div>
          <fieldset className="adm-fieldset">
            <legend>Minecraft tooltip</legend>
            <div className="adm-grid2">
              <TextField label="Title" value={section.tooltip.title} maxLength={120} onChange={(title) => update({ tooltip: { ...section.tooltip, title } })} />
              <TextField label="Subtitle" value={section.tooltip.subtitle} maxLength={60} onChange={(subtitle) => update({ tooltip: { ...section.tooltip, subtitle } })} />
              <TextField label="Footer" value={section.tooltip.footer} maxLength={120} onChange={(footer) => update({ tooltip: { ...section.tooltip, footer } })} />
            </div>
            <RowsEditor
              rows={section.tooltip.lines}
              onChange={(lines) => update({ tooltip: { ...section.tooltip, lines } })}
              min={0}
              max={12}
              makeRow={() => ({ name: 'New line', text: '' })}
              addLabel="Add line"
              itemLabel="line"
              renderRow={(line, change) => (
                <>
                  <TextField label="Name" value={line.name} maxLength={40} onChange={(name) => change({ name })} />
                  <TextField label="Text" value={line.text} maxLength={300} onChange={(text) => change({ text })} />
                </>
              )}
            />
          </fieldset>
        </>
      )}

      {section.id === 'players' && (
        <fieldset className="adm-fieldset">
          <legend>Podiums</legend>
          <RowsEditor
            rows={section.boards}
            onChange={(boards) => update({ boards })}
            min={1}
            max={3}
            makeRow={() => ({ mode: 'overall', label: 'Overall · Points', unit: 'pts' })}
            addLabel="Add podium"
            itemLabel="podium"
            hint={modes === null ? 'Loading leaderboard modes…' : modes.length === 0 ? 'Leaderboard modes could not be loaded; only saved modes are listed.' : 'The first podium is shown raised in the middle.'}
            renderRow={(board, change) => {
              const options = [{ id: 'overall', label: 'Overall' }, ...(modes ?? [])]
              if (board.mode && !options.some((option) => option.id === board.mode)) options.push({ id: board.mode, label: `${board.mode} (saved)` })
              return (
                <>
                  <label className="adm-label">
                    Mode
                    <select className="adm-input" value={board.mode} onChange={(event) => change({ mode: event.target.value })}>
                      {options.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
                    </select>
                  </label>
                  <TextField label="Label" value={board.label} maxLength={60} onChange={(label) => change({ label })} />
                  <TextField label="Unit" value={board.unit} maxLength={60} onChange={(unit) => change({ unit })} />
                </>
              )
            }}
          />
        </fieldset>
      )}

      {section.id === 'join' && (
        <fieldset className="adm-fieldset">
          <legend>Steps</legend>
          <p className="adm-hint">{placeholders}</p>
          <RowsEditor
            rows={section.steps}
            onChange={(steps) => update({ steps })}
            min={1}
            max={6}
            makeRow={() => ({ title: 'New step', text: '' })}
            addLabel="Add step"
            itemLabel="step"
            renderRow={(step, change) => (
              <>
                <TextField label="Title" value={step.title} maxLength={120} onChange={(title) => change({ title })} />
                <TextField
                  label="Text"
                  value={step.text}
                  maxLength={300}
                  hint={step.text.includes('{') ? `Shows as: ${fillSitePlaceholders(step.text, settings)}` : undefined}
                  onChange={(text) => change({ text })}
                />
              </>
            )}
          />
        </fieldset>
      )}

      {section.id === 'news' && (
        <TextField className="max-w-[240px]" label="Posts shown" type="number" min={1} max={6} value={section.count} hint="1 to 6." onChange={(count) => update({ count })} />
      )}

      {section.id === 'community' && (
        <>
          <ImageField label="Background image" value={section.image} onChange={(image) => update({ image })} />
          <TextField className="max-w-[360px]" label="Button label" value={section.buttonLabel} maxLength={40} hint="The button opens the Discord link from Site settings." onChange={(buttonLabel) => update({ buttonLabel })} />
        </>
      )}
    </div>
  )
}

function HomeEditor({ ready, onStatus }) {
  const editor = useSiteDraft('home', onStatus)
  const home = editor.draft
  const setHome = editor.setDraft
  const [view, setView] = useState('realms')
  const [realmIndex, setRealmIndex] = useState(0)
  const [sectionIndex, setSectionIndex] = useState(0)
  const [modes, setModes] = useState(null)

  useEffect(() => {
    let active = true
    loadLeaderboard()
      .then((data) => {
        if (!active) return
        // Third-party shape: keep only modes whose id the site schema accepts.
        const list = (Array.isArray(data?.modes) ? data.modes : [])
          .filter((mode) => typeof mode?.id === 'string' && modePattern.test(mode.id))
          .map((mode) => ({ id: mode.id, label: typeof mode.label === 'string' && mode.label ? mode.label.slice(0, 40) : mode.id }))
        setModes(list)
      })
      .catch(() => { if (active) setModes([]) })
    return () => { active = false }
  }, [])

  const realms = home.realms
  const ri = Math.min(realmIndex, realms.length - 1)
  const realm = realms[ri]
  const si = Math.min(sectionIndex, home.sections.length - 1)
  const section = home.sections[si]

  const setRealms = (update) => setHome((current) => ({ ...current, realms: update(current.realms) }))
  const setSections = (update) => setHome((current) => ({ ...current, sections: update(current.sections) }))
  const followMove = (selected, from, to) => (selected === from ? to : selected === to ? from : selected)

  function addRealm() {
    setRealms((list) => [...list, {
      id: uniqueId('New realm', list, -1), enabled: true, name: 'New realm', label: '', color: '#ff5a30',
      image: '/img/hub-wide.webp', badge: '', description: '', linkLabel: 'Learn more', href: '/wiki',
    }])
    setRealmIndex(realms.length)
  }

  function duplicateRealm() {
    setRealms((list) => {
      const name = `${list[ri].name} copy`.slice(0, 40)
      const next = [...list]
      next.splice(ri + 1, 0, { ...list[ri], name, id: uniqueId(name, list, -1) })
      return next
    })
    setRealmIndex(ri + 1)
  }

  const previewRealm = realm && {
    ...realm,
    color: safeColor(realm.color, '#888888'),
    image: isSafeSiteUrl(realm.image) ? realm.image : undefined,
    href: isSafeSiteUrl(realm.href) ? realm.href : '/',
  }

  if (!ready) return <p className="panel adm-pane text-muted">Loading the current site document…</p>

  return (
    <>
      <SaveBar editor={editor} ready={ready} viewHref="/" viewLabel="View home page">
        <div className="seg" role="group" aria-label="Home page part">
          {[['hero', 'Hero'], ['realms', 'Realms', realms.length], ['sections', 'Sections', home.sections.length]].map(([id, label, count]) => (
            <button key={id} type="button" aria-pressed={view === id} onClick={() => setView(id)}>
              {label}{count !== undefined && <span className="count">{count}</span>}
            </button>
          ))}
        </div>
      </SaveBar>

      {view === 'hero' && (
        <section className="panel adm-pane max-w-[820px]" aria-labelledby="home-hero-title">
          <h2 id="home-hero-title" className="mb-4">Hero</h2>
          <div className="grid gap-4">
            <ImageField label="Background image" value={home.hero.image} onChange={(image) => setHome((current) => ({ ...current, hero: { ...current.hero, image } }))} />
            <EffectField value={home.hero.effect} onChange={(effect) => setHome((current) => ({ ...current, hero: { ...current.hero, effect } }))} />
            <TextField label="Subtitle" multiline value={home.hero.subtitle} maxLength={400} hint="Type the realm count yourself; it is not counted automatically." onChange={(subtitle) => setHome((current) => ({ ...current, hero: { ...current.hero, subtitle } }))} />
            <div className="adm-grid2">
              <TextField label="Primary button" value={home.hero.primaryLabel} maxLength={40} hint="Copies the server address." onChange={(primaryLabel) => setHome((current) => ({ ...current, hero: { ...current.hero, primaryLabel } }))} />
              <TextField label="Secondary button" value={home.hero.secondaryLabel} maxLength={40} hint="Opens the Discord link." onChange={(secondaryLabel) => setHome((current) => ({ ...current, hero: { ...current.hero, secondaryLabel } }))} />
            </div>
          </div>
        </section>
      )}

      {view === 'realms' && (
        <div className="adm-panes realms">
          <section className="panel adm-pane adm-sticky" aria-labelledby="home-realms-title">
            <div className="adm-pane-head">
              <h2 id="home-realms-title">Realms</h2>
              <button className="btn btn-stone btn-sm" type="button" disabled={realms.length >= maxRealms} onClick={addRealm}>Add realm</button>
            </div>
            <p className="adm-hint mb-3">Carousel order, {realms.filter((item) => item.enabled).length} of {realms.length} shown.</p>
            <ReorderList
              items={realms}
              selected={ri}
              onSelect={setRealmIndex}
              onMove={(from, to) => { setRealms((list) => moveItem(list, from, to)); setRealmIndex((current) => followMove(current, from, to)) }}
              onToggle={(index, enabled) => setRealms((list) => list.map((item, i) => (i === index ? { ...item, enabled } : item)))}
              describe={(item) => ({ name: item.name || 'Untitled realm', meta: item.id, swatch: item.color, enabled: item.enabled })}
              toggleLabel={(name) => `Show ${name} in the carousel`}
            />
          </section>
          <section className="panel adm-pane" aria-labelledby="home-realm-form">
            <h2 id="home-realm-form" className="mb-4">Edit {realm.name || 'realm'}</h2>
            <RealmForm
              key={ri}
              realm={realm}
              realms={realms}
              index={ri}
              update={(patch) => setRealms((list) => list.map((item, i) => (i === ri ? { ...item, ...patch } : item)))}
              onDuplicate={duplicateRealm}
              onDelete={() => { setRealms((list) => list.filter((_, i) => i !== ri)); setRealmIndex(Math.max(0, ri - 1)) }}
            />
          </section>
          <section className="panel adm-pane adm-preview adm-sticky" aria-label="Realm card preview">
            <p className="label">Live preview</p>
            {/* The real carousel card; inert so the preview link cannot be followed. */}
            <div className="adm-realm-preview" inert>
              <RealmCard realm={previewRealm} />
            </div>
            {!realm.enabled && <p className="adm-hint mt-3 text-center">Hidden: this realm is not shown in the carousel.</p>}
          </section>
        </div>
      )}

      {view === 'sections' && (
        <div className="adm-panes two">
          <section className="panel adm-pane adm-sticky" aria-labelledby="home-sections-title">
            <h2 id="home-sections-title" className="mb-2">Sections</h2>
            <p className="adm-hint mb-3">Render order below the hero.</p>
            <ReorderList
              items={home.sections}
              selected={si}
              onSelect={setSectionIndex}
              onMove={(from, to) => { setSections((list) => moveItem(list, from, to)); setSectionIndex((current) => followMove(current, from, to)) }}
              onToggle={(index, enabled) => setSections((list) => list.map((item, i) => (i === index ? { ...item, enabled } : item)))}
              describe={(item) => ({ name: sectionNames[item.id] ?? item.id, meta: item.title, enabled: item.enabled })}
              toggleLabel={(name) => `Show the ${name} section`}
            />
          </section>
          <section className="panel adm-pane" aria-labelledby="home-section-form">
            <h2 id="home-section-form" className="mb-4">{sectionNames[section.id] ?? section.id}{section.enabled ? '' : ' (hidden)'}</h2>
            <SectionFields
              key={section.id}
              section={section}
              settings={editor.site.settings}
              modes={modes}
              update={(patch) => setSections((list) => list.map((item, i) => (i === si ? { ...item, ...patch } : item)))}
            />
          </section>
        </div>
      )}
    </>
  )
}

export default HomeEditor
