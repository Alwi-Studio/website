import { useEffect, useMemo, useState } from 'react'
import MarkdownBody from '../common/MarkdownBody.jsx'
import { resetAdminWiki, saveAdminWiki } from '../content/wikiStore.js'

// Same look as the AdminPanel helpers; the styles live in admin.css.
const inputClass = 'adm-input w-full'
const textareaClass = 'adm-input'
const labelClass = 'adm-label'
const primaryButtonClass = 'btn btn-primary btn-sm'
const secondaryButtonClass = 'btn btn-stone btn-sm'
const iconButtonClass = 'adm-icon-btn'
const dangerIconButtonClass = 'adm-icon-btn danger'

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function uid(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`
}

// Deep-clone into a known shape, dropping any unknown fields so the saved payload
// stays clean.
function cloneWiki(wiki) {
  return {
    eyebrow: wiki?.eyebrow ?? '',
    title: wiki?.title ?? '',
    intro: wiki?.intro ?? '',
    updated: wiki?.updated ?? '',
    categories: (wiki?.categories ?? []).map((category) => ({
      id: category.id || uid('cat'),
      name: category.name ?? '',
      icon: category.icon ?? '',
      description: category.description ?? '',
      articles: (category.articles ?? []).map((article) => ({
        slug: article.slug ?? '',
        title: article.title ?? '',
        excerpt: article.excerpt ?? '',
        updated: article.updated ?? '',
        body: article.body ?? '',
      })),
    })),
  }
}

function todayLabel() {
  return new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

// Trim, ensure ids + unique slugs, and drop empty entries before saving.
function normalizeWiki(draft) {
  const usedSlugs = new Set()
  const categories = (draft.categories ?? [])
    .map((category) => {
      const name = category.name.trim()
      if (!name) {
        return null
      }
      const articles = (category.articles ?? [])
        .map((article) => {
          const title = article.title.trim()
          if (!title) {
            return null
          }
          const base = slugify(article.slug || title) || 'page'
          let slug = base
          let counter = 2
          while (usedSlugs.has(slug)) {
            slug = `${base}-${counter}`
            counter += 1
          }
          usedSlugs.add(slug)
          return {
            slug,
            title,
            ...(article.excerpt.trim() ? { excerpt: article.excerpt.trim() } : {}),
            ...(article.updated.trim() ? { updated: article.updated.trim() } : {}),
            body: article.body ?? '',
          }
        })
        .filter(Boolean)
      return {
        id: category.id || uid('cat'),
        name,
        icon: category.icon.trim() || '\uD83D\uDCC4',
        ...(category.description.trim() ? { description: category.description.trim() } : {}),
        articles,
      }
    })
    .filter(Boolean)

  return {
    eyebrow: draft.eyebrow.trim() || 'Server Wiki',
    title: draft.title.trim(),
    intro: draft.intro.trim(),
    updated: draft.updated.trim() || todayLabel(),
    categories,
  }
}

function WikiManager({ wiki, onWikiChange, onStatus }) {
  const [draft, setDraft] = useState(() => cloneWiki(wiki))
  // Serialized copy of what the draft was loaded from, for the "Unsaved changes" status.
  const [baseline, setBaseline] = useState(() => JSON.stringify(draft))
  const [catIndex, setCatIndex] = useState(0)
  const [artIndex, setArtIndex] = useState(-1)
  const [message, setMessage] = useState('')
  const [saveState, setSaveState] = useState('idle')
  const [isSaving, setIsSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(true)

  useEffect(() => {
    const next = cloneWiki(wiki)
    setDraft(next)
    setBaseline(JSON.stringify(next))
    setCatIndex(0)
    setArtIndex(-1)
    setMessage('')
  }, [wiki])

  const status = saveState === 'saving' ? 'saving' : saveState === 'saved' ? 'saved' : JSON.stringify(draft) !== baseline ? 'dirty' : ''
  useEffect(() => {
    onStatus('wiki', status)
    return () => onStatus('wiki', '')
  }, [onStatus, status])

  const categories = draft.categories
  const activeCategory = categories[catIndex] ?? null
  const articles = activeCategory?.articles ?? []
  const activeArticle = artIndex >= 0 ? articles[artIndex] ?? null : null
  const totalArticles = useMemo(
    () => categories.reduce((sum, category) => sum + category.articles.length, 0),
    [categories],
  )

  function mutate(fn) {
    setDraft((current) => {
      const next = cloneWiki(current)
      fn(next)
      return next
    })
  }

  function setMeta(field, value) {
    mutate((next) => {
      next[field] = value
    })
  }

  function addCategory() {
    const newIndex = categories.length
    mutate((next) => {
      next.categories.push({ id: uid('cat'), name: 'New Realm', icon: '\uD83C\uDF0D', description: '', articles: [] })
    })
    setCatIndex(newIndex)
    setArtIndex(-1)
    setMessage('')
  }

  function deleteCategory(index) {
    mutate((next) => {
      next.categories.splice(index, 1)
    })
    setCatIndex((current) => {
      if (current > index) return current - 1
      if (current === index) return 0
      return current
    })
    setArtIndex(-1)
  }

  function moveCategory(index, direction) {
    const target = index + direction
    if (target < 0 || target >= categories.length) {
      return
    }
    mutate((next) => {
      const list = next.categories
      const temp = list[index]
      list[index] = list[target]
      list[target] = temp
    })
    setCatIndex(target)
  }

  function selectCategory(index) {
    setCatIndex(index)
    setArtIndex(-1)
  }

  function setCategoryField(field, value) {
    mutate((next) => {
      next.categories[catIndex][field] = value
    })
  }

  function addArticle() {
    if (!activeCategory) {
      return
    }
    const newIndex = articles.length
    mutate((next) => {
      next.categories[catIndex].articles.push({ slug: '', title: 'New Article', excerpt: '', updated: '', body: '' })
    })
    setArtIndex(newIndex)
    setMessage('')
  }

  function deleteArticle(index) {
    mutate((next) => {
      next.categories[catIndex].articles.splice(index, 1)
    })
    setArtIndex(-1)
  }

  function moveArticle(index, direction) {
    const target = index + direction
    if (target < 0 || target >= articles.length) {
      return
    }
    mutate((next) => {
      const list = next.categories[catIndex].articles
      const temp = list[index]
      list[index] = list[target]
      list[target] = temp
    })
    setArtIndex(target)
  }

  function setArticleField(field, value) {
    mutate((next) => {
      const article = next.categories[catIndex].articles[artIndex]
      if (field === 'title') {
        const shouldAutofillSlug = !article.slug || article.slug === slugify(article.title)
        article.title = value
        if (shouldAutofillSlug) {
          article.slug = slugify(value)
        }
      } else {
        article[field] = value
      }
    })
  }

  async function handleSave() {
    const normalized = normalizeWiki(draft)
    if (!normalized.title.trim()) {
      setMessage('A wiki page title is required.')
      return
    }
    if (normalized.categories.length === 0) {
      setMessage('Add at least one category that has a named article.')
      return
    }
    try {
      setIsSaving(true)
      setSaveState('saving')
      const saved = await saveAdminWiki(normalized)
      onWikiChange(saved)
      setDraft(cloneWiki(saved))
      setMessage('Saved the wiki. Changes are live on /wiki.')
      setSaveState('saved')
      window.setTimeout(() => setSaveState('idle'), 1800)
    } catch (error) {
      setMessage(error.message)
      setSaveState('idle')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleReset() {
    try {
      const saved = await resetAdminWiki()
      onWikiChange(saved)
      setDraft(cloneWiki(saved))
      setCatIndex(0)
      setArtIndex(-1)
      setMessage('Restored the default wiki content.')
    } catch (error) {
      setMessage(error.message)
    }
  }

  const saveButtonLabel = saveState === 'saving' ? 'Saving...' : saveState === 'saved' ? 'Saved' : 'Save wiki'

  return (
    <div className="grid gap-6">
      {/* Page meta */}
      <div className="panel adm-pane">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-ink">Wiki page details</h2>
          <span className="adm-chip">
            {categories.length} categories · {totalArticles} articles
          </span>
        </div>
        <div className="adm-grid2 mt-5">
          <label className={labelClass}>
            Eyebrow
            <input className={inputClass} value={draft.eyebrow} placeholder="Server Wiki" onChange={(event) => setMeta('eyebrow', event.target.value)} />
          </label>
          <label className={labelClass}>
            Last updated
            <input className={inputClass} value={draft.updated} placeholder={todayLabel()} onChange={(event) => setMeta('updated', event.target.value)} />
          </label>
          <label className={labelClass}>
            Page title
            <input className={inputClass} value={draft.title} onChange={(event) => setMeta('title', event.target.value)} />
          </label>
          <label className={labelClass}>
            Intro
            <input className={inputClass} value={draft.intro} onChange={(event) => setMeta('intro', event.target.value)} />
          </label>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)] lg:items-start">
        {/* Category rail */}
        <aside className="panel adm-pane adm-sticky" aria-label="Categories">
          <h3 className="label px-1">Categories</h3>
          <div className="mt-3 grid grid-cols-[minmax(0,1fr)] gap-1.5">
            {categories.length === 0 ? (
              <p className="rounded border border-[var(--adm-line)] bg-surface-2 p-3 text-xs text-muted">No categories yet.</p>
            ) : (
              categories.map((category, index) => {
                const isActive = index === catIndex
                return (
                  <div
                    key={category.id}
                    className={`flex items-center gap-1 rounded border px-2 py-1.5 transition ${
                      isActive ? 'border-brand/40 bg-brand/12' : 'border-[var(--adm-line)] bg-surface-2 hover:border-[var(--muted)]'
                    }`}
                  >
                    <button type="button" onClick={() => selectCategory(index)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                      <span className="text-base">{category.icon || '\uD83D\uDCC4'}</span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-ink">{category.name || 'Untitled'}</span>
                        <span className="block text-[11px] text-muted">{category.articles.length} articles</span>
                      </span>
                    </button>
                    <div className="flex items-center gap-0.5">
                      <button type="button" className={iconButtonClass} onClick={() => moveCategory(index, -1)} disabled={index === 0} aria-label={`Move ${category.name || 'category'} up`}>↑</button>
                      <button type="button" className={iconButtonClass} onClick={() => moveCategory(index, 1)} disabled={index === categories.length - 1} aria-label={`Move ${category.name || 'category'} down`}>↓</button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
          <button type="button" onClick={addCategory} className={`${secondaryButtonClass} mt-3 w-full`}>
            + New category
          </button>
        </aside>

        {/* Editor */}
        <div className="grid gap-6">
          {activeCategory ? (
            <>
              <div className="panel adm-pane">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-lg font-bold text-ink">Category</h3>
                  <button
                    type="button"
                    onClick={() => deleteCategory(catIndex)}
                    className="btn btn-sm btn-danger"
                  >
                    Delete category
                  </button>
                </div>
                <div className="mt-5 grid gap-5 md:grid-cols-[120px_1fr]">
                  <label className={labelClass}>
                    Icon
                    <input className={`${inputClass} text-center text-lg`} value={activeCategory.icon} maxLength={4} placeholder="🌍" onChange={(event) => setCategoryField('icon', event.target.value)} />
                  </label>
                  <label className={labelClass}>
                    Name
                    <input className={inputClass} value={activeCategory.name} onChange={(event) => setCategoryField('name', event.target.value)} />
                  </label>
                  <label className={`${labelClass} md:col-span-2`}>
                    Description
                    <textarea className={`${textareaClass} min-h-20`} value={activeCategory.description} onChange={(event) => setCategoryField('description', event.target.value)} />
                  </label>
                </div>
              </div>

              {/* Articles list */}
              <div className="panel adm-pane">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-lg font-bold text-ink">Articles in {activeCategory.name || 'this category'}</h3>
                  <button type="button" onClick={addArticle} className={secondaryButtonClass}>+ New article</button>
                </div>
                <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-2">
                  {articles.length === 0 ? (
                    <p className="rounded border border-[var(--adm-line)] bg-surface-2 p-4 text-sm text-muted">No articles yet. Add one to get started.</p>
                  ) : (
                    articles.map((article, index) => {
                      const isActive = index === artIndex
                      return (
                        <div
                          key={index}
                          className={`flex items-center gap-2 rounded border px-3 py-2 transition ${
                            isActive ? 'border-brand/40 bg-brand/12' : 'border-[var(--adm-line)] bg-surface-2 hover:border-[var(--muted)]'
                          }`}
                        >
                          <button type="button" onClick={() => setArtIndex(index)} className="min-w-0 flex-1 text-left">
                            <span className="block truncate text-sm font-semibold text-ink">{article.title || 'Untitled article'}</span>
                            <span className="block truncate text-[11px] text-muted">/wiki/{slugify(article.slug || article.title) || '\u2026'}</span>
                          </button>
                          <button type="button" className={iconButtonClass} onClick={() => moveArticle(index, -1)} disabled={index === 0} aria-label={`Move ${article.title || 'article'} up`}>↑</button>
                          <button type="button" className={iconButtonClass} onClick={() => moveArticle(index, 1)} disabled={index === articles.length - 1} aria-label={`Move ${article.title || 'article'} down`}>↓</button>
                          <button type="button" className={dangerIconButtonClass} onClick={() => deleteArticle(index)} aria-label={`Delete ${article.title || 'article'}`}>✕</button>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

              {/* Article editor */}
              {activeArticle && (
                <div className="panel adm-pane">
                  <h3 className="text-lg font-bold text-ink">Edit article</h3>
                  <div className="mt-5 grid gap-5">
                    <div className="adm-grid2">
                      <label className={labelClass}>
                        Title
                        <input className={inputClass} value={activeArticle.title} onChange={(event) => setArticleField('title', event.target.value)} />
                      </label>
                      <label className={labelClass}>
                        Slug
                        <input className={inputClass} value={activeArticle.slug} onChange={(event) => setArticleField('slug', event.target.value)} />
                      </label>
                    </div>
                    <label className={labelClass}>
                      Excerpt
                      <textarea className={`${textareaClass} min-h-16`} value={activeArticle.excerpt} onChange={(event) => setArticleField('excerpt', event.target.value)} />
                    </label>
                    <label className={labelClass}>
                      Last updated
                      <input className={inputClass} value={activeArticle.updated} placeholder={todayLabel()} onChange={(event) => setArticleField('updated', event.target.value)} />
                    </label>
                    <div className="grid gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-[var(--ink-2)]">Body</span>
                        <button type="button" onClick={() => setShowPreview((value) => !value)} className="text-xs font-semibold adm-accent hover:underline">
                          {showPreview ? 'Hide preview' : 'Show preview'}
                        </button>
                      </div>
                      <textarea
                        className={`${textareaClass} min-h-[320px] font-mono text-[13px] leading-6`}
                        value={activeArticle.body}
                        placeholder={'Use Discord-style formatting:\n# Heading\n- bullet point\n\n:::collapse Title\nDescription hidden until opened.\n:::\n\n**bold**, *italic*, [links](https://...)'}
                        onChange={(event) => setArticleField('body', event.target.value)}
                      />
                      {showPreview && (
                        <div className="mt-2 rounded border border-[var(--adm-line)] bg-bg-2 p-5">
                          <p className="label mb-3">Live preview</p>
                          {activeArticle.body.trim() ? (
                            <MarkdownBody text={activeArticle.body} />
                          ) : (
                            <p className="text-sm text-muted">Start typing to see a preview.</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="panel adm-pane text-center">
              <p className="text-sm text-muted">Create a category to start building your wiki.</p>
              <button type="button" onClick={addCategory} className={`${primaryButtonClass} mt-5`}>+ New category</button>
            </div>
          )}
        </div>
      </div>

      {/* Action bar */}
      <div className="panel adm-pane flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className={`btn btn-primary${saveState === 'saved' ? ' is-saved' : ''}`}
        >
          {saveButtonLabel}
        </button>
        <a className="btn btn-stone" href="/wiki" target="_blank" rel="noreferrer">Preview wiki</a>
        <a className="btn btn-stone" href="/admin/docs">Formatting docs</a>
        <button
          type="button"
          onClick={handleReset}
          className="btn btn-danger"
        >
          Reset to default
        </button>
        {message && <p className="adm-msg" role="status">{message}</p>}
      </div>
    </div>
  )
}

export default WikiManager
