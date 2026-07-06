import { useEffect, useMemo, useState } from 'react'
import MarkdownBody from '../common/MarkdownBody.jsx'
import { resetAdminWiki, saveAdminWiki } from '../content/wikiStore.js'

const inputClass =
  'min-h-11 w-full rounded-xl border border-white/10 bg-surface-2 px-3 text-white outline-none transition focus:border-brand'
const textareaClass =
  'w-full rounded-xl border border-white/10 bg-surface-2 px-3 py-3 text-white outline-none transition focus:border-brand'
const labelClass = 'grid gap-2 text-sm font-semibold text-zinc-300'
const primaryButtonClass =
  'inline-flex items-center justify-center rounded-xl bg-gradient-to-b from-brand-2 to-brand px-5 text-sm font-bold text-[#1a0d07] transition hover:brightness-105'
const secondaryButtonClass =
  'inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/[0.04] px-5 text-sm font-semibold text-zinc-200 transition hover:border-white/25 hover:text-white'
const iconButtonClass =
  'grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-muted transition hover:border-white/25 hover:text-white disabled:opacity-30 disabled:hover:border-white/10 disabled:hover:text-muted'
const dangerIconButtonClass =
  'grid h-8 w-8 place-items-center rounded-lg border border-red-400/40 text-red-300 transition hover:bg-red-500/10'

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

function WikiManager({ wiki, onWikiChange }) {
  const [draft, setDraft] = useState(() => cloneWiki(wiki))
  const [catIndex, setCatIndex] = useState(0)
  const [artIndex, setArtIndex] = useState(-1)
  const [message, setMessage] = useState('')
  const [saveState, setSaveState] = useState('idle')
  const [isSaving, setIsSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(true)

  useEffect(() => {
    setDraft(cloneWiki(wiki))
    setCatIndex(0)
    setArtIndex(-1)
    setMessage('')
  }, [wiki])

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
      <div className="rounded-2xl border border-white/10 bg-surface p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-white">Wiki page details</h2>
          <span className="rounded-full border border-white/10 bg-bg-2 px-3 py-1 text-xs font-semibold text-muted">
            {categories.length} categories · {totalArticles} articles
          </span>
        </div>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
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

      <div className="grid gap-6 lg:grid-cols-[260px_1fr] lg:items-start">
        {/* Category rail */}
        <aside className="rounded-2xl border border-white/10 bg-surface p-4 lg:sticky lg:top-28">
          <h3 className="px-1 text-sm font-bold uppercase tracking-[0.14em] text-muted-2">Categories</h3>
          <div className="mt-3 grid gap-1.5">
            {categories.length === 0 ? (
              <p className="rounded-lg border border-white/10 bg-surface-2 p-3 text-xs text-muted">No categories yet.</p>
            ) : (
              categories.map((category, index) => {
                const isActive = index === catIndex
                return (
                  <div
                    key={category.id}
                    className={`flex items-center gap-1 rounded-xl border px-2 py-1.5 transition ${
                      isActive ? 'border-brand/40 bg-brand/12' : 'border-white/10 bg-surface-2 hover:border-white/20'
                    }`}
                  >
                    <button type="button" onClick={() => selectCategory(index)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                      <span className="text-base">{category.icon || '\uD83D\uDCC4'}</span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-white">{category.name || 'Untitled'}</span>
                        <span className="block text-[11px] text-muted">{category.articles.length} articles</span>
                      </span>
                    </button>
                    <div className="flex items-center gap-0.5">
                      <button type="button" className={iconButtonClass} onClick={() => moveCategory(index, -1)} disabled={index === 0} aria-label="Move up">↑</button>
                      <button type="button" className={iconButtonClass} onClick={() => moveCategory(index, 1)} disabled={index === categories.length - 1} aria-label="Move down">↓</button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
          <button type="button" onClick={addCategory} className={`${secondaryButtonClass} mt-3 min-h-10 w-full`}>
            + New category
          </button>
        </aside>

        {/* Editor */}
        <div className="grid gap-6">
          {activeCategory ? (
            <>
              <div className="rounded-2xl border border-white/10 bg-surface p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-lg font-bold text-white">Category</h3>
                  <button
                    type="button"
                    onClick={() => deleteCategory(catIndex)}
                    className="inline-flex min-h-9 items-center rounded-lg border border-red-400/40 px-3 text-sm font-semibold text-red-300 transition hover:bg-red-500/10"
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
              <div className="rounded-2xl border border-white/10 bg-surface p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-lg font-bold text-white">Articles in {activeCategory.name || 'this category'}</h3>
                  <button type="button" onClick={addArticle} className={`${secondaryButtonClass} min-h-9`}>+ New article</button>
                </div>
                <div className="mt-4 grid gap-2">
                  {articles.length === 0 ? (
                    <p className="rounded-xl border border-white/10 bg-surface-2 p-4 text-sm text-muted">No articles yet. Add one to get started.</p>
                  ) : (
                    articles.map((article, index) => {
                      const isActive = index === artIndex
                      return (
                        <div
                          key={index}
                          className={`flex items-center gap-2 rounded-xl border px-3 py-2 transition ${
                            isActive ? 'border-brand/40 bg-brand/12' : 'border-white/10 bg-surface-2 hover:border-white/20'
                          }`}
                        >
                          <button type="button" onClick={() => setArtIndex(index)} className="min-w-0 flex-1 text-left">
                            <span className="block truncate text-sm font-semibold text-white">{article.title || 'Untitled article'}</span>
                            <span className="block truncate text-[11px] text-muted">/wiki/{slugify(article.slug || article.title) || '\u2026'}</span>
                          </button>
                          <button type="button" className={iconButtonClass} onClick={() => moveArticle(index, -1)} disabled={index === 0} aria-label="Move up">↑</button>
                          <button type="button" className={iconButtonClass} onClick={() => moveArticle(index, 1)} disabled={index === articles.length - 1} aria-label="Move down">↓</button>
                          <button type="button" className={dangerIconButtonClass} onClick={() => deleteArticle(index)} aria-label="Delete article">✕</button>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

              {/* Article editor */}
              {activeArticle && (
                <div className="rounded-2xl border border-white/10 bg-surface p-6">
                  <h3 className="text-lg font-bold text-white">Edit article</h3>
                  <div className="mt-5 grid gap-5">
                    <div className="grid gap-5 md:grid-cols-2">
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
                        <span className="text-sm font-semibold text-zinc-300">Body</span>
                        <button type="button" onClick={() => setShowPreview((value) => !value)} className="text-xs font-semibold text-brand-2 hover:text-brand">
                          {showPreview ? 'Hide preview' : 'Show preview'}
                        </button>
                      </div>
                      <textarea
                        className={`${textareaClass} min-h-[320px] font-mono text-[13px] leading-6`}
                        value={activeArticle.body}
                        placeholder={'Use Discord-style formatting:\n# Heading\n## Subheading\n- bullet point\n> quote\n`inline code`\n**bold**, *italic*, [links](https://...)'}
                        onChange={(event) => setArticleField('body', event.target.value)}
                      />
                      {showPreview && (
                        <div className="mt-2 rounded-xl border border-white/10 bg-bg-2/50 p-5">
                          <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-muted-2">Live preview</p>
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
            <div className="rounded-2xl border border-white/10 bg-surface p-10 text-center">
              <p className="text-sm text-muted">Create a category to start building your wiki.</p>
              <button type="button" onClick={addCategory} className={`${primaryButtonClass} mt-5 min-h-11`}>+ New category</button>
            </div>
          )}
        </div>
      </div>

      {/* Action bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-surface p-5">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className={`${primaryButtonClass} min-h-12 min-w-[150px] ${
            saveState === 'saved' ? 'from-positive to-positive text-[#062412]' : ''
          } active:translate-y-0.5 active:scale-[0.98] disabled:cursor-wait disabled:opacity-80`}
        >
          {saveButtonLabel}
        </button>
        <a className={`${secondaryButtonClass} min-h-12`} href="/wiki" target="_blank" rel="noreferrer">Preview wiki</a>
        <a className={`${secondaryButtonClass} min-h-12`} href="/admin/docs">Formatting docs</a>
        <button
          type="button"
          onClick={handleReset}
          className="inline-flex min-h-12 items-center justify-center rounded-xl border border-red-400/40 px-5 text-sm font-semibold text-red-300 transition hover:bg-red-500/10"
        >
          Reset to default
        </button>
        {message && <p className="text-sm font-semibold text-brand-2">{message}</p>}
      </div>
    </div>
  )
}

export default WikiManager
