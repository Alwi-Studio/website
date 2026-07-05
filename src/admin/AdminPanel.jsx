import { useEffect, useMemo, useState } from 'react'
import {
  deleteAdminNewsItem,
  isAdminSessionActive,
  loginAdmin,
  logoutAdmin,
  saveAdminNewsItem,
} from '../news/adminNewsStore.js'
import { isPolicyCustomized, resetAdminPolicy, saveAdminPolicy } from '../content/policyStore.js'

const defaultForm = {
  title: '',
  slug: '',
  description: '',
  category: 'Announcement',
  date: '',
  author: 'AlwiNation Team',
  readingTime: '2 min read',
  imageUrl: '',
  bodyText: '',
  highlightsText: '',
}

const emptyPolicyForm = { eyebrow: '', title: '', updated: '', intro: '', sectionsText: '' }

const policyMeta = {
  rules: { label: 'Rules', heading: 'Server Rules', path: '/rules', fallbackEyebrow: 'Community Rules' },
  terms: { label: 'Terms', heading: 'Terms of Service', path: '/terms', fallbackEyebrow: 'Terms of Service' },
}

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function createBodyBlocks(bodyText) {
  return bodyText
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((text, index) => ({
      type: index === 0 ? 'lead' : 'paragraph',
      text,
    }))
}

function getBlockText(block) {
  if (typeof block === 'string') {
    return block
  }

  if (block.type === 'list') {
    return block.items.join('\n')
  }

  if (block.type === 'quote') {
    return block.cite ? `${block.text}\n${block.cite}` : block.text
  }

  if (block.type === 'callout') {
    return [block.title, block.text].filter(Boolean).join('\n')
  }

  if (block.type === 'stats') {
    return block.items.map((item) => `${item.label}: ${item.value}`).join('\n')
  }

  return block.text ?? ''
}

function getBodyText(body) {
  return body.map(getBlockText).filter(Boolean).join('\n\n')
}

function getDateInputValue(item) {
  if (item.dateValue) {
    return item.dateValue
  }

  const date = new Date(item.date)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return date.toISOString().slice(0, 10)
}

function formatDisplayDate(value) {
  if (!value) {
    return new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const date = new Date(`${value}T00:00:00`)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// Convert stored policy sections into the editable mini-syntax used in the textarea.
function sectionsToText(sections = []) {
  return sections
    .map((section) => {
      const lines = [`# ${section.title}`]
      if (section.description) {
        lines.push(section.description)
      }
      if (Array.isArray(section.items)) {
        section.items.forEach((item) => lines.push(`- ${item}`))
      }
      if (Array.isArray(section.subsections)) {
        section.subsections.forEach((subsection) => {
          lines.push(`## ${subsection.title}`)
          if (subsection.description) {
            lines.push(subsection.description)
          }
          if (Array.isArray(subsection.items)) {
            subsection.items.forEach((item) => lines.push(`- ${item}`))
          }
        })
      }
      return lines.join('\n')
    })
    .join('\n\n')
}

// Parse the editable mini-syntax back into structured policy sections.
// "# Title" starts a section, "## Title" starts a subsection, "- item" adds a bullet.
function parseSections(text) {
  const sections = []
  let current = null
  let currentSubsection = null

  function ensureSection() {
    if (!current) {
      current = { title: 'Section', description: '', items: [], subsections: [] }
      sections.push(current)
    }
  }

  function currentTarget() {
    ensureSection()
    return currentSubsection ?? current
  }

  for (const rawLine of text.split('\n')) {
    const trimmed = rawLine.trim()
    if (!trimmed) {
      continue
    }

    if (trimmed.startsWith('# ')) {
      current = { title: trimmed.slice(2).trim() || 'Section', description: '', items: [], subsections: [] }
      sections.push(current)
      currentSubsection = null
    } else if (trimmed.startsWith('## ')) {
      ensureSection()
      currentSubsection = { title: trimmed.slice(3).trim() || 'Subsection', description: '', items: [] }
      current.subsections.push(currentSubsection)
    } else if (trimmed.startsWith('- ')) {
      currentTarget().items.push(trimmed.slice(2).trim())
    } else {
      const target = currentTarget()
      target.description = target.description ? `${target.description} ${trimmed}` : trimmed
    }
  }

  return sections
    .map((section) => ({
      title: section.title,
      ...(section.description ? { description: section.description } : {}),
      ...(section.items.length ? { items: section.items } : {}),
      ...(section.subsections.length
        ? {
            subsections: section.subsections
              .map((subsection) => ({
                title: subsection.title,
                ...(subsection.description ? { description: subsection.description } : {}),
                ...(subsection.items.length ? { items: subsection.items } : {}),
              }))
              .filter((subsection) => subsection.description || (subsection.items && subsection.items.length)),
          }
        : {}),
    }))
    .filter(
      (section) =>
        section.description ||
        (section.items && section.items.length) ||
        (section.subsections && section.subsections.length),
    )
}

function policyToForm(policy) {
  if (!policy) {
    return emptyPolicyForm
  }
  return {
    eyebrow: policy.eyebrow ?? '',
    title: policy.title ?? '',
    updated: policy.updated ?? '',
    intro: policy.intro ?? '',
    sectionsText: sectionsToText(policy.sections),
  }
}

const inputClass =
  'min-h-11 rounded-xl border border-white/10 bg-surface-2 px-3 text-white outline-none transition focus:border-brand'
const textareaClass =
  'rounded-xl border border-white/10 bg-surface-2 px-3 py-3 text-white outline-none transition focus:border-brand'
const labelClass = 'grid gap-2 text-sm font-semibold text-zinc-300'
const primaryButtonClass =
  'inline-flex items-center justify-center rounded-xl bg-gradient-to-b from-brand-2 to-brand px-5 text-sm font-bold text-[#1a0d07] transition hover:brightness-105'
const secondaryButtonClass =
  'inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/[0.04] px-5 text-sm font-semibold text-zinc-200 transition hover:border-white/25 hover:text-white'

function AdminPanel({ newsItems, onNewsChange, policies, onPoliciesChange }) {
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loginForm, setLoginForm] = useState({ username: '', password: '' })
  const [loginError, setLoginError] = useState('')
  const [activeTab, setActiveTab] = useState('news')
  const [form, setForm] = useState(defaultForm)
  const [saveMessage, setSaveMessage] = useState('')
  const [isSavingNews, setIsSavingNews] = useState(false)
  const [newsSaveState, setNewsSaveState] = useState('idle')
  const [editingSlug, setEditingSlug] = useState('')
  const [policyForm, setPolicyForm] = useState(emptyPolicyForm)
  const [policyMessage, setPolicyMessage] = useState('')
  const [isSavingPolicy, setIsSavingPolicy] = useState(false)
  const [policySaveState, setPolicySaveState] = useState('idle')

  const editablePosts = useMemo(() => newsItems, [newsItems])
  const isPolicyTab = activeTab === 'rules' || activeTab === 'terms'
  const parsedSectionCount = useMemo(
    () => (isPolicyTab ? parseSections(policyForm.sectionsText).length : 0),
    [isPolicyTab, policyForm.sectionsText],
  )

  useEffect(() => {
    let isCurrent = true

    async function checkSession() {
      const active = await isAdminSessionActive()

      if (isCurrent) {
        setIsLoggedIn(active)
        setIsCheckingSession(false)
      }
    }

    checkSession()

    return () => {
      isCurrent = false
    }
  }, [])

  // Load the selected policy into the editor whenever the tab or source data changes.
  useEffect(() => {
    if (!isPolicyTab) {
      return
    }
    setPolicyForm(policyToForm(policies?.[activeTab]))
    setPolicyMessage('')
  }, [activeTab, isPolicyTab, policies])

  function updateField(field, value) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
      slug: field === 'title' && !editingSlug ? slugify(value) : currentForm.slug,
    }))
  }

  function updatePolicyField(field, value) {
    setPolicyForm((currentForm) => ({ ...currentForm, [field]: value }))
  }

  async function handleLogin(event) {
    event.preventDefault()
    setLoginError('')

    try {
      await loginAdmin(loginForm.username, loginForm.password)
      setLoginForm({ username: '', password: '' })
      setIsLoggedIn(true)
    } catch (error) {
      setLoginError(error.message)
    }
  }

  async function handleLogout() {
    await logoutAdmin()
    setIsLoggedIn(false)
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const slug = editingSlug || slugify(form.title)
    const body = createBodyBlocks(form.bodyText)

    if (!form.title.trim() || !slug || !form.description.trim() || body.length === 0) {
      setSaveMessage('Title, slug, description, and body are required.')
      return
    }

    const item = {
      id: `admin-${slug}`,
      slug,
      img: form.imageUrl.trim(),
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category.trim() || 'Announcement',
      date: formatDisplayDate(form.date),
      dateValue: form.date,
      author: form.author.trim() || 'AlwiNation Team',
      readingTime: form.readingTime.trim() || '2 min read',
      featured: false,
      body,
      highlights: form.highlightsText
        .split('\n')
        .map((highlight) => highlight.trim())
        .filter(Boolean),
      source: 'admin',
    }

    try {
      setIsSavingNews(true)
      setNewsSaveState('saving')
      const nextNewsItems = await saveAdminNewsItem(item)
      onNewsChange(nextNewsItems)
      setForm(defaultForm)
      setEditingSlug('')
      setSaveMessage(`Saved "${item.title}".`)
      setNewsSaveState('saved')
      window.setTimeout(() => setNewsSaveState('idle'), 1800)
    } catch (error) {
      setSaveMessage(error.message)
      setNewsSaveState('idle')
    } finally {
      setIsSavingNews(false)
    }
  }

  function handleEdit(item) {
    if (item.deleted) {
      setSaveMessage('Deleted posts cannot be edited. Create a new post with a different title.')
      return
    }

    setForm({
      title: item.title,
      slug: item.slug,
      description: item.description,
      category: item.category,
      date: getDateInputValue(item),
      author: item.author,
      readingTime: item.readingTime,
      imageUrl: typeof item.img === 'string' && item.img.startsWith('http') ? item.img : '',
      bodyText: getBodyText(item.body),
      highlightsText: item.highlights.join('\n'),
    })
    setEditingSlug(item.slug)
    setSaveMessage(`Editing "${item.title}". Saving creates a local override.`)
  }

  function handleCancelEdit() {
    setForm(defaultForm)
    setEditingSlug('')
    setSaveMessage('')
  }

  async function handleDelete(slug) {
    try {
      const nextNewsItems = await deleteAdminNewsItem(slug)
      onNewsChange(nextNewsItems)
      if (editingSlug === slug) {
        handleCancelEdit()
      }
      setSaveMessage('Deleted or hidden news post.')
    } catch (error) {
      setSaveMessage(error.message)
    }
  }

  async function handlePolicySubmit(event) {
    event.preventDefault()

    const meta = policyMeta[activeTab]
    const sections = parseSections(policyForm.sectionsText)

    if (!policyForm.title.trim() || !policyForm.intro.trim() || sections.length === 0) {
      setPolicyMessage('Title, intro, and at least one section are required.')
      return
    }

    const policy = {
      eyebrow: policyForm.eyebrow.trim() || meta.fallbackEyebrow,
      title: policyForm.title.trim(),
      intro: policyForm.intro.trim(),
      updated: policyForm.updated.trim() || formatDisplayDate(''),
      sections,
    }

    try {
      setIsSavingPolicy(true)
      setPolicySaveState('saving')
      const nextPolicies = await saveAdminPolicy(activeTab, policy)
      onPoliciesChange(nextPolicies)
      setPolicyForm(policyToForm(nextPolicies[activeTab]))
      setPolicyMessage(`Saved the ${meta.label} page.`)
      setPolicySaveState('saved')
      window.setTimeout(() => setPolicySaveState('idle'), 1800)
    } catch (error) {
      setPolicyMessage(error.message)
      setPolicySaveState('idle')
    } finally {
      setIsSavingPolicy(false)
    }
  }

  async function handlePolicyReset() {
    const meta = policyMeta[activeTab]
    try {
      const nextPolicies = await resetAdminPolicy(activeTab)
      onPoliciesChange(nextPolicies)
      setPolicyForm(policyToForm(nextPolicies[activeTab]))
      setPolicyMessage(`Restored the default ${meta.label} content.`)
    } catch (error) {
      setPolicyMessage(error.message)
    }
  }

  if (isCheckingSession) {
    return (
      <main className="min-h-svh bg-bg px-5 pb-16 pt-36 text-white sm:px-8 lg:px-12">
        <section className="mx-auto max-w-md rounded-2xl border border-white/10 bg-surface p-6">
          <p className="text-sm font-semibold text-zinc-300">Checking admin session...</p>
        </section>
      </main>
    )
  }

  if (!isLoggedIn) {
    return (
      <main className="min-h-svh bg-bg px-5 pb-16 pt-36 text-white sm:px-8 lg:px-12">
        <section className="mx-auto max-w-md rounded-2xl border border-white/10 bg-surface p-6 shadow-[0_18px_45px_rgba(0,0,0,0.35)]">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-2">Admin</p>
          <h1 className="mt-3 text-3xl font-bold leading-tight text-white">Admin Login</h1>
          <p className="mt-3 text-sm leading-6 text-muted">
            Credentials are verified by the server and stored in an HttpOnly session cookie.
          </p>

          <form className="mt-6 grid gap-4" onSubmit={handleLogin}>
            <label className={labelClass}>
              Username
              <input
                className={inputClass}
                value={loginForm.username}
                onChange={(event) =>
                  setLoginForm((currentForm) => ({ ...currentForm, username: event.target.value }))
                }
              />
            </label>
            <label className={labelClass}>
              Password
              <input
                className={inputClass}
                type="password"
                value={loginForm.password}
                onChange={(event) =>
                  setLoginForm((currentForm) => ({ ...currentForm, password: event.target.value }))
                }
              />
            </label>
            {loginError && <p className="text-sm font-semibold text-red-400">{loginError}</p>}
            <button className={`${primaryButtonClass} min-h-11`} type="submit">
              Log in
            </button>
          </form>
        </section>
      </main>
    )
  }

  const tabs = [
    { id: 'news', label: 'News' },
    { id: 'rules', label: 'Rules' },
    { id: 'terms', label: 'Terms' },
  ]

  const activeMeta = isPolicyTab ? policyMeta[activeTab] : null
  const heading = activeTab === 'news' ? (editingSlug ? 'Edit News' : 'Create News') : `Edit ${activeMeta.heading}`
  const newsSaveButtonLabel = newsSaveState === 'saving'
    ? 'Saving...'
    : newsSaveState === 'saved'
      ? 'Saved'
      : editingSlug
        ? 'Save changes'
        : 'Save news post'
  const policySaveButtonLabel = policySaveState === 'saving'
    ? 'Saving...'
    : policySaveState === 'saved'
      ? 'Saved'
      : `Save ${activeMeta?.label ?? 'Policy'} page`

  return (
    <main className="min-h-svh bg-bg px-5 pb-16 pt-36 text-white sm:px-8 lg:px-12">
      <section className="mx-auto max-w-6xl">
        {/* Top bar */}
        <div className="flex flex-col gap-5 rounded-2xl border border-white/10 bg-surface p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-2">Admin</p>
              <h1 className="mt-3 text-3xl font-bold leading-tight text-white">{heading}</h1>
            </div>
            <button className={`${secondaryButtonClass} min-h-10`} type="button" onClick={handleLogout}>
              Log out
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5 rounded-xl border border-white/10 bg-bg-2 p-1.5">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id
              const customized = tab.id !== 'news' && isPolicyCustomized(tab.id)
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                    isActive ? 'bg-brand text-white' : 'text-muted hover:bg-white/[0.06] hover:text-white'
                  }`}
                >
                  {tab.label}
                  {customized && (
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-white' : 'bg-brand-2'}`}
                      title="Customized"
                    />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* News manager */}
        {activeTab === 'news' && (
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
            <div className="rounded-2xl border border-white/10 bg-surface p-6">
              <form className="grid gap-5" onSubmit={handleSubmit}>
                <div className="grid gap-5 md:grid-cols-2">
                  <label className={labelClass}>
                    Title
                    <input className={inputClass} value={form.title} onChange={(event) => updateField('title', event.target.value)} />
                  </label>
                  <label className={labelClass}>
                    Slug preview
                    <input className={`${inputClass} bg-bg-2 text-zinc-400`} readOnly value={form.slug} />
                  </label>
                </div>

                <label className={labelClass}>
                  Description
                  <textarea className={`${textareaClass} min-h-24`} value={form.description} onChange={(event) => updateField('description', event.target.value)} />
                </label>

                <div className="grid gap-5 md:grid-cols-2">
                  <label className={labelClass}>
                    Category
                    <input className={inputClass} value={form.category} onChange={(event) => updateField('category', event.target.value)} />
                  </label>
                  <label className={labelClass}>
                    Date
                    <input type="date" className={inputClass} value={form.date} onChange={(event) => updateField('date', event.target.value)} />
                  </label>
                  <label className={labelClass}>
                    Author
                    <input className={inputClass} value={form.author} onChange={(event) => updateField('author', event.target.value)} />
                  </label>
                  <label className={labelClass}>
                    Reading Time
                    <input className={inputClass} value={form.readingTime} onChange={(event) => updateField('readingTime', event.target.value)} />
                  </label>
                </div>

                <label className={labelClass}>
                  Image URL
                  <input className={inputClass} placeholder="https://example.com/image.png" value={form.imageUrl} onChange={(event) => updateField('imageUrl', event.target.value)} />
                </label>

                <label className={labelClass}>
                  Body
                  <textarea className={`${textareaClass} min-h-48`} placeholder="Separate paragraphs with a blank line." value={form.bodyText} onChange={(event) => updateField('bodyText', event.target.value)} />
                </label>

                <label className={labelClass}>
                  Highlights
                  <textarea className={`${textareaClass} min-h-28`} placeholder="One highlight per line." value={form.highlightsText} onChange={(event) => updateField('highlightsText', event.target.value)} />
                </label>

                {saveMessage && <p className="text-sm font-semibold text-brand-2">{saveMessage}</p>}

                <div className="flex flex-wrap gap-3">
                  <button
                    className={`${primaryButtonClass} min-h-12 min-w-[150px] ${
                      newsSaveState === 'saved' ? 'from-positive to-positive text-[#062412]' : ''
                    } active:translate-y-0.5 active:scale-[0.98] disabled:cursor-wait disabled:opacity-80`}
                    type="submit"
                    disabled={isSavingNews}
                  >
                    {newsSaveButtonLabel}
                  </button>
                  {editingSlug && (
                    <button className={`${secondaryButtonClass} min-h-12`} type="button" onClick={handleCancelEdit}>
                      Cancel edit
                    </button>
                  )}
                </div>
              </form>
            </div>

            <aside className="rounded-2xl border border-white/10 bg-surface p-6 lg:sticky lg:top-28">
              <h2 className="text-xl font-bold text-white">News Posts</h2>
              <p className="mt-3 text-sm leading-6 text-muted">
                Existing news appears here too. Deleting a seed post hides it through a stored override.
              </p>

              <div className="mt-6 grid gap-4">
                {editablePosts.length === 0 ? (
                  <p className="rounded-xl border border-white/10 bg-surface-2 p-4 text-sm text-muted">
                    No news posts available.
                  </p>
                ) : (
                  editablePosts.map((item) => (
                    <article className="rounded-xl border border-white/10 bg-surface-2 p-4" key={item.id}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-bold text-white">{item.title}</h3>
                          <p className="mt-1 text-sm text-muted">/news/{item.slug}</p>
                        </div>
                        <span className="rounded-md border border-white/10 px-2 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                          {item.deleted ? 'Hidden' : item.source === 'admin' ? 'Local' : 'Seed'}
                        </span>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {!item.deleted && (
                          <>
                            <button className="inline-flex min-h-9 items-center rounded-lg bg-gradient-to-b from-brand-2 to-brand px-3 text-sm font-semibold text-[#1a0d07] transition hover:brightness-105" type="button" onClick={() => handleEdit(item)}>
                              Edit
                            </button>
                            <a className="inline-flex min-h-9 items-center rounded-lg border border-white/15 px-3 text-sm font-semibold text-zinc-200 no-underline transition hover:border-white/25 hover:text-white" href={`/news/${item.slug}`}>
                              View
                            </a>
                          </>
                        )}
                        <button className="inline-flex min-h-9 items-center rounded-lg border border-red-400/40 px-3 text-sm font-semibold text-red-300 transition hover:bg-red-500/10" type="button" onClick={() => handleDelete(item.slug)}>
                          {item.deleted ? 'Keep hidden' : 'Delete'}
                        </button>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </aside>
          </div>
        )}

        {/* Policy editor (Rules / Terms) */}
        {isPolicyTab && (
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
            <div className="rounded-2xl border border-white/10 bg-surface p-6">
              <form className="grid gap-5" onSubmit={handlePolicySubmit}>
                <div className="grid gap-5 md:grid-cols-2">
                  <label className={labelClass}>
                    Eyebrow
                    <input className={inputClass} placeholder={activeMeta.fallbackEyebrow} value={policyForm.eyebrow} onChange={(event) => updatePolicyField('eyebrow', event.target.value)} />
                  </label>
                  <label className={labelClass}>
                    Last updated
                    <input className={inputClass} placeholder="July 5, 2026" value={policyForm.updated} onChange={(event) => updatePolicyField('updated', event.target.value)} />
                  </label>
                </div>

                <label className={labelClass}>
                  Page title
                  <input className={inputClass} value={policyForm.title} onChange={(event) => updatePolicyField('title', event.target.value)} />
                </label>

                <label className={labelClass}>
                  Intro
                  <textarea className={`${textareaClass} min-h-24`} value={policyForm.intro} onChange={(event) => updatePolicyField('intro', event.target.value)} />
                </label>

                <label className={labelClass}>
                  Sections
                  <textarea
                    className={`${textareaClass} min-h-[360px] font-mono text-[13px] leading-6`}
                    value={policyForm.sectionsText}
                    onChange={(event) => updatePolicyField('sectionsText', event.target.value)}
                  />
                </label>

                {policyMessage && <p className="text-sm font-semibold text-brand-2">{policyMessage}</p>}

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    className={`${primaryButtonClass} min-h-12 min-w-[150px] ${
                      policySaveState === 'saved' ? 'from-positive to-positive text-[#062412]' : ''
                    } active:translate-y-0.5 active:scale-[0.98] disabled:cursor-wait disabled:opacity-80`}
                    type="submit"
                    disabled={isSavingPolicy}
                  >
                    {policySaveButtonLabel}
                  </button>
                  <a className={`${secondaryButtonClass} min-h-12`} href={activeMeta.path} target="_blank" rel="noreferrer">
                    Preview page
                  </a>
                  <button className="inline-flex min-h-12 items-center justify-center rounded-xl border border-red-400/40 px-5 text-sm font-semibold text-red-300 transition hover:bg-red-500/10" type="button" onClick={handlePolicyReset}>
                    Reset to default
                  </button>
                </div>
              </form>
            </div>

            <aside className="rounded-2xl border border-white/10 bg-surface p-6 lg:sticky lg:top-28">
              <h2 className="text-xl font-bold text-white">Formatting guide</h2>
              <p className="mt-3 text-sm leading-6 text-muted">
                Structure the {activeMeta.label} content with this simple syntax:
              </p>
              <ul className="mt-4 grid gap-3 p-0">
                <li className="flex items-start gap-3 text-sm text-muted">
                  <code className="rounded-md bg-surface-2 px-2 py-0.5 text-brand-2"># Title</code>
                  <span>starts a new section</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-muted">
                  <code className="rounded-md bg-surface-2 px-2 py-0.5 text-brand-2">## Title</code>
                  <span>starts a subsection</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-muted">
                  <code className="rounded-md bg-surface-2 px-2 py-0.5 text-brand-2">- item</code>
                  <span>adds a bullet point</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-muted">
                  <span className="rounded-md bg-surface-2 px-2 py-0.5 text-zinc-300">plain text</span>
                  <span>becomes a section description</span>
                </li>
              </ul>
              <div className="mt-6 rounded-xl border border-white/10 bg-surface-2 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-2">Detected</p>
                <p className="mt-2 text-sm font-semibold text-white">{parsedSectionCount} section{parsedSectionCount === 1 ? '' : 's'}</p>
                <p className="mt-3 text-xs leading-5 text-muted">
                  Changes apply to the live {activeMeta.path} page after saving.
                </p>
              </div>
            </aside>
          </div>
        )}
      </section>
    </main>
  )
}

export default AdminPanel
