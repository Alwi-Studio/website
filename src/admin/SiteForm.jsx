import { useEffect, useId, useRef, useState } from 'react'
import { isSafeSiteUrl } from '../common/safeUrls.js'
import { moveItem, safeColor } from './siteDraft.js'

export function TextField({ label, value, onChange, hint, error, multiline = false, className = '', ...rest }) {
  const id = useId()
  const Tag = multiline ? 'textarea' : 'input'
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined
  return (
    <label className={`adm-label ${className}`}>
      {label}
      <Tag
        className="adm-input"
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...rest}
      />
      {hint && <span className="hint" id={`${id}-hint`}>{hint}</span>}
      {error && <span className="adm-error" id={`${id}-error`}>{error}</span>}
    </label>
  )
}

// Image URL with a thumbnail. Only the site contract (single-/ path or https)
// is accepted; the thumbnail is the check for links that are not images.
export function ImageField({ label, value, onChange, hint }) {
  const [failed, setFailed] = useState('')
  const safe = isSafeSiteUrl(value)
  const error = !value ? 'An image is required.' : safe ? '' : 'Use a site path such as /img/hero-hub.webp, or an https:// URL.'
  return (
    <div className="flex min-w-0 flex-wrap items-start gap-3">
      <TextField className="min-w-[200px] flex-1" label={label} value={value} onChange={onChange} hint={hint} error={error} spellCheck={false} />
      <div className="adm-thumb" aria-hidden="true">
        {safe && failed !== value ? <img src={value} alt="" onError={() => setFailed(value)} /> : <span>{safe ? 'Image did not load' : 'No preview'}</span>}
      </div>
    </div>
  )
}

export function Toggle({ checked, onChange, label }) {
  return (
    <span className="adm-switch">
      <input type="checkbox" role="switch" checked={checked} onChange={(event) => onChange(event.target.checked)} aria-label={label} />
      <span />
    </span>
  )
}

// Ordered list with an on/off switch and Move up / Move down buttons. Keyboard
// focus follows the moved item, so repeated presses keep moving the same row.
export function ReorderList({ items, selected, onSelect, onMove, onToggle, describe, toggleLabel }) {
  const listRef = useRef(null)
  const pendingFocus = useRef(null)

  useEffect(() => {
    const pending = pendingFocus.current
    if (!pending) return
    pendingFocus.current = null
    const [up, down] = listRef.current?.querySelectorAll(`[data-row="${pending.index}"] .adm-icon-btn`) ?? []
    const preferred = pending.delta < 0 ? up : down
    ;(preferred && !preferred.disabled ? preferred : pending.delta < 0 ? down : up)?.focus()
  })

  function move(index, delta) {
    pendingFocus.current = { index: index + delta, delta }
    onMove(index, index + delta)
  }

  return (
    <ol className="adm-order" ref={listRef}>
      {items.map((item, index) => {
        const { name, meta, swatch, enabled } = describe(item)
        const active = index === selected
        return (
          // Index keys: ids are editable and may collide while typing.
          <li key={index} data-row={index} className={`adm-card${active ? ' is-active' : ''}${enabled ? '' : ' is-off'}`}>
            {swatch && <span className="adm-swatch" style={{ background: safeColor(swatch) }} aria-hidden="true" />}
            <button className="pick" type="button" onClick={() => onSelect(index)} aria-current={active ? 'true' : undefined}>
              <span className="min-w-0"><b>{name}</b>{meta && <small>{meta}</small>}</span>
            </button>
            {!enabled && <span className="adm-chip">Hidden</span>}
            <Toggle checked={enabled} onChange={(value) => onToggle(index, value)} label={toggleLabel(name)} />
            <button className="adm-icon-btn" type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label={`Move ${name} up`}>↑</button>
            <button className="adm-icon-btn" type="button" onClick={() => move(index, 1)} disabled={index === items.length - 1} aria-label={`Move ${name} down`}>↓</button>
          </li>
        )
      })}
    </ol>
  )
}

// Small repeated rows (tooltip lines, podium boards, join steps).
export function RowsEditor({ rows, onChange, min, max, makeRow, addLabel, itemLabel, renderRow, hint }) {
  const update = (index, patch) => onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)))
  return (
    <div className="adm-rows">
      {rows.map((row, index) => (
        <div className="adm-row adm-card" key={index}>
          <div className="adm-grid2">{renderRow(row, (patch) => update(index, patch), index)}</div>
          <div className="adm-row-tools">
            <button className="adm-icon-btn" type="button" disabled={index === 0} onClick={() => onChange(moveItem(rows, index, index - 1))} aria-label={`Move ${itemLabel} ${index + 1} up`}>↑</button>
            <button className="adm-icon-btn" type="button" disabled={index === rows.length - 1} onClick={() => onChange(moveItem(rows, index, index + 1))} aria-label={`Move ${itemLabel} ${index + 1} down`}>↓</button>
            <button className="adm-icon-btn danger" type="button" disabled={rows.length <= min} onClick={() => onChange(rows.filter((_, i) => i !== index))} aria-label={`Remove ${itemLabel} ${index + 1}`}>✕</button>
          </div>
        </div>
      ))}
      <div className="flex flex-wrap items-center gap-3">
        <button className="btn btn-stone btn-sm" type="button" disabled={rows.length >= max} onClick={() => onChange([...rows, makeRow()])}>{addLabel}</button>
        <span className="adm-hint">{rows.length} of {max}{min > 0 ? `, at least ${min}` : ''}.{hint ? ` ${hint}` : ''}</span>
      </div>
    </div>
  )
}

// Sticky bar with Save, Reset (confirmed in place), the view link and the
// validation or server message, so the reason a save is blocked is always visible.
export function SaveBar({ editor, viewHref, viewLabel, ready, children }) {
  const [confirmReset, setConfirmReset] = useState(false)
  const saving = editor.status === 'saving'
  return (
    <div className="adm-toolbar">
      {children}
      <a className="btn btn-stone btn-sm" href={viewHref} target="_blank" rel="noreferrer">{viewLabel}</a>
      {!confirmReset && (
        <button className="btn btn-sm btn-danger" type="button" disabled={!ready || saving} onClick={() => setConfirmReset(true)}>Reset to defaults</button>
      )}
      <button
        className={`btn btn-primary btn-sm${editor.status === 'saved' ? ' is-saved' : ''}`}
        type="button"
        disabled={!ready || saving || !editor.dirty || Boolean(editor.error)}
        onClick={editor.save}
      >
        {saving ? 'Saving…' : editor.status === 'saved' ? 'Saved' : 'Save changes'}
      </button>
      {confirmReset && (
        <div className="adm-confirm basis-full">
          <p>Reset the whole site document to the defaults? This replaces the home page and the site settings.</p>
          <button className="btn btn-sm btn-danger" type="button" onClick={() => { setConfirmReset(false); editor.reset() }}>Reset everything</button>
          <button className="btn btn-stone btn-sm" type="button" onClick={() => setConfirmReset(false)}>Cancel</button>
        </div>
      )}
      {editor.dirty && editor.error && <p className="adm-error basis-full" aria-live="polite">Cannot save yet: {editor.error}</p>}
      {editor.serverError && <p className="adm-error basis-full" role="alert">Save failed: {editor.serverError}</p>}
    </div>
  )
}
