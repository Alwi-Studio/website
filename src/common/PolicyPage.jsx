import { useEffect, useMemo, useState } from 'react'

function slugifySection(value, index) {
  const base = String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return base || `section-${index + 1}`
}

function easeOutCubic(progress) {
  return 1 - Math.pow(1 - progress, 3)
}

function PolicyPage({ eyebrow, title, intro, updated, sections = [], activeKey = 'rules' }) {
  const withIds = useMemo(
    () =>
      sections.map((section, index) => ({
        ...section,
        _id: slugifySection(section.title, index),
      })),
    [sections],
  )
  const [activeSectionId, setActiveSectionId] = useState(withIds[0]?._id ?? '')

  const otherKey = activeKey === 'rules' ? 'terms' : 'rules'
  const otherLabel = otherKey === 'rules' ? 'Server Rules' : 'Terms of Service'
  const otherHref = `/${otherKey}`

  useEffect(() => {
    if (withIds.length === 0) {
      setActiveSectionId('')
      return undefined
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)

        if (visibleEntries[0]) {
          setActiveSectionId(visibleEntries[0].target.id)
        }
      },
      {
        root: null,
        rootMargin: '-120px 0px -55% 0px',
        threshold: 0.01,
      },
    )

    const observedElements = withIds
      .map((section) => document.getElementById(section._id))
      .filter(Boolean)

    observedElements.forEach((element) => observer.observe(element))

    if (observedElements[0]) {
      setActiveSectionId(observedElements[0].id)
    }

    return () => {
      observer.disconnect()
    }
  }, [withIds])

  function handleSectionClick(event, sectionId) {
    event.preventDefault()

    const section = document.getElementById(sectionId)
    if (!section) {
      return
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.history.pushState(null, '', `#${sectionId}`)

    const targetY = section.getBoundingClientRect().top + window.scrollY - 112

    if (prefersReducedMotion) {
      window.scrollTo(0, targetY)
      return
    }

    const startY = window.scrollY
    const distance = targetY - startY
    const duration = 650
    const startTime = performance.now()

    function step(currentTime) {
      const progress = Math.min((currentTime - startTime) / duration, 1)
      window.scrollTo(0, startY + distance * easeOutCubic(progress))

      if (progress < 1) {
        window.requestAnimationFrame(step)
      }
    }

    window.requestAnimationFrame(step)
  }

  return (
    <main className="min-h-svh bg-bg pb-24 pt-32 text-white">
      {/* Header */}
      <section className="mx-auto max-w-[1080px] px-6">
        <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-surface p-7 shadow-[0_24px_70px_rgba(0,0,0,0.28)] sm:p-10">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(255,90,48,0.18),transparent_65%)] blur-2xl" />
          <div className="relative">
            <div className="flex flex-wrap items-center gap-2">
              <span className="eyebrow">{eyebrow}</span>
              <span className="rounded-full border border-white/10 bg-bg-2 px-3 py-1 text-xs font-semibold text-muted">
                {withIds.length} sections
              </span>
            </div>
            <h1 className="mt-4 text-[clamp(34px,5vw,56px)] font-bold leading-[1.04] tracking-[-0.03em] text-white">
              {title}
            </h1>
            <p className="mt-5 max-w-[70ch] text-[16.5px] leading-8 text-muted">{intro}</p>

            <div className="mt-7 flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-bg-2 px-3.5 py-2 text-sm font-semibold text-muted">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="3" /><path d="M3 10h18M8 2v4M16 2v4" /></svg>
                Last updated {updated}
              </span>
              <a
                href={otherHref}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-bg-2 px-3.5 py-2 text-sm font-semibold text-muted transition hover:border-white/25 hover:text-white"
              >
                Read the {otherLabel}
                <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Body + sticky table of contents */}
      <section className="mx-auto mt-8 max-w-[1080px] px-6">
        <div className="grid gap-6 lg:grid-cols-[260px_1fr] lg:items-start">
          <aside className="top-28 hidden lg:sticky lg:block">
            <nav className="rounded-[18px] border border-white/10 bg-surface p-5">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-2">On this page</p>
              <ul className="mt-4 grid gap-1 p-0">
                {withIds.map((section, index) => (
                  <li key={section._id}>
                    <a
                      href={`#${section._id}`}
                      onClick={(event) => handleSectionClick(event, section._id)}
                      className={`flex items-start gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                        activeSectionId === section._id
                          ? 'bg-brand/12 text-white shadow-[inset_0_0_0_1px_rgba(255,90,48,0.28)]'
                          : 'text-muted hover:bg-white/[0.05] hover:text-white'
                      }`}
                    >
                      <span
                        className={`text-xs font-bold ${
                          activeSectionId === section._id ? 'text-brand-2' : 'text-brand-2/80'
                        }`}
                      >
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span className="leading-5">{section.title}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          <div className="grid gap-5">
            {withIds.map((section, index) => (
              <article
                id={section._id}
                className="scroll-mt-28 rounded-[18px] border border-white/10 bg-surface p-6 transition hover:border-white/20 sm:p-7"
                key={section._id}
              >
                <div className="flex items-start gap-4">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand/12 text-sm font-bold text-brand-2">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-xl font-bold leading-tight text-white">{section.title}</h2>
                    {section.description && (
                      <p className="mt-3 text-sm leading-7 text-muted">{section.description}</p>
                    )}
                    {section.items && section.items.length > 0 && (
                      <ul className="mt-4 grid gap-3 p-0">
                        {section.items.map((item) => (
                          <li className="flex items-start gap-3 text-sm leading-6 text-muted" key={item}>
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-2" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </article>
            ))}

            {/* Cross-link + actions */}
            <div className="rounded-[18px] border border-brand/25 bg-brand/[0.06] p-6 sm:p-7">
              <h2 className="text-lg font-bold text-white">Questions about the {activeKey === 'rules' ? 'rules' : 'terms'}?</h2>
              <p className="mt-2 max-w-[60ch] text-sm leading-7 text-muted">
                Reach out to the staff team for clarifications, appeals, or reports. You can also review the {otherLabel.toLowerCase()}.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <a
                  className="inline-flex min-h-[46px] items-center rounded-xl bg-gradient-to-b from-brand-2 to-brand px-[22px] text-[15px] font-bold text-[#1a0d07] no-underline transition hover:brightness-105"
                  href="https://discord.alwination.id"
                  target="_blank"
                  rel="noreferrer"
                >
                  Contact staff on Discord
                </a>
                <a
                  className="inline-flex min-h-[46px] items-center rounded-xl border border-white/15 bg-white/[0.04] px-[22px] text-[15px] font-semibold text-white no-underline transition hover:border-white/25 hover:bg-white/[0.08]"
                  href={otherHref}
                >
                  {otherLabel}
                </a>
                <a
                  className="inline-flex min-h-[46px] items-center rounded-xl border border-white/15 bg-white/[0.04] px-[22px] text-[15px] font-semibold text-white no-underline transition hover:border-white/25 hover:bg-white/[0.08]"
                  href="/#home"
                >
                  Back home
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default PolicyPage
