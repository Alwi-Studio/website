import { useEffect, useMemo, useState } from 'react'
import { RichInline } from './RichText.jsx'

function quickScrollTo(targetY) {
  const startY = window.scrollY
  const distance = targetY - startY
  const duration = 220
  const startTime = performance.now()

  function step(currentTime) {
    const progress = Math.min((currentTime - startTime) / duration, 1)
    window.scrollTo(0, startY + distance * progress)

    if (progress < 1) {
      window.requestAnimationFrame(step)
    }
  }

  window.requestAnimationFrame(step)
}

function slugifySection(value, index) {
  const base = String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return base || `section-${index + 1}`
}

function PolicyPage({ eyebrow, title, intro, updated, sections = [], activeKey = 'rules' }) {
  const withIds = useMemo(
    () =>
      sections.map((section, index) => ({
        ...section,
        _id: slugifySection(section.title, index),
        subsections: Array.isArray(section.subsections)
          ? section.subsections.map((subsection, subsectionIndex) => ({
              ...subsection,
              _id: `${slugifySection(section.title, index)}-${slugifySection(
                subsection.title,
                subsectionIndex,
              )}`,
            }))
          : [],
      })),
    [sections],
  )
  const contentTargets = useMemo(
    () =>
      withIds.flatMap((section) => [
        section._id,
        ...section.subsections.map((subsection) => subsection._id),
      ]),
    [withIds],
  )
  const [activeSectionId, setActiveSectionId] = useState(withIds[0]?._id ?? '')

  const otherKey = activeKey === 'rules' ? 'terms' : 'rules'
  const otherLabel = otherKey === 'rules' ? 'Server Rules' : 'Terms of Service'
  const otherHref = `/${otherKey}`

  function handleTocClick(event, targetId) {
    const target = document.getElementById(targetId)
    if (!target) {
      return
    }

    event.preventDefault()
    window.history.pushState(null, '', `#${targetId}`)
    quickScrollTo(target.getBoundingClientRect().top + window.scrollY - 112)
  }

  useEffect(() => {
    if (contentTargets.length === 0) {
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

    const observedElements = contentTargets
      .map((targetId) => document.getElementById(targetId))
      .filter(Boolean)

    observedElements.forEach((element) => observer.observe(element))

    if (observedElements[0]) {
      setActiveSectionId(observedElements[0].id)
    }

    return () => {
      observer.disconnect()
    }
  }, [contentTargets])

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
            <p className="mt-5 max-w-[70ch] text-[16.5px] leading-8 text-muted">
              <RichInline text={intro} />
            </p>

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
                {withIds.map((section, index) => {
                  const isParentActive =
                    activeSectionId === section._id ||
                    section.subsections.some((subsection) => activeSectionId === subsection._id)

                  return (
                    <li key={section._id}>
                      <a
                        href={`#${section._id}`}
                        onClick={(event) => handleTocClick(event, section._id)}
                        className={`flex items-start gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                          isParentActive
                            ? 'bg-brand/12 text-white shadow-[inset_0_0_0_1px_rgba(255,90,48,0.28)]'
                            : 'text-muted hover:bg-white/[0.05] hover:text-white'
                        }`}
                      >
                        <span
                          className={`text-xs font-bold ${isParentActive ? 'text-brand-2' : 'text-brand-2/80'}`}
                        >
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <span className="leading-5">{section.title}</span>
                      </a>
                      {section.subsections.length > 0 && (
                        <ul className="ml-8 mt-1 grid gap-1 p-0">
                          {section.subsections.map((subsection) => (
                            <li key={subsection._id}>
                              <a
                                href={`#${subsection._id}`}
                                onClick={(event) => handleTocClick(event, subsection._id)}
                                className={`block rounded-lg px-3 py-1.5 text-xs font-medium leading-5 transition ${
                                  activeSectionId === subsection._id
                                    ? 'bg-brand/10 text-white'
                                    : 'text-muted hover:bg-white/[0.05] hover:text-white'
                                }`}
                              >
                                {subsection.title}
                              </a>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  )
                })}
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
                    <h2 className="text-xl font-bold leading-tight text-white"><RichInline text={section.title} /></h2>
                    {section.description && (
                      <p className="mt-3 text-sm leading-7 text-muted"><RichInline text={section.description} /></p>
                    )}
                    {section.items && section.items.length > 0 && (
                      <ul className="mt-3 grid gap-2 p-0">
                        {section.items.map((item, itemIndex) => (
                          item === '---' ? (
                            <li className="list-none py-1" key={`divider-${itemIndex}`}>
                              <hr className="border-0 border-t border-white/10" />
                            </li>
                          ) : (
                            <li className="flex items-start gap-3 text-sm leading-6 text-muted" key={item}>
                              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-2" />
                              <span><RichInline text={item} /></span>
                            </li>
                          )
                        ))}
                      </ul>
                    )}
                    {section.subsections.length > 0 && (
                      <div className="mt-5 grid gap-3">
                        {section.subsections.map((subsection) => (
                          <section
                            id={subsection._id}
                            className="scroll-mt-28 rounded-xl border border-white/10 bg-bg-2/45 p-5"
                            key={subsection._id}
                          >
                            <h3 className="text-base font-bold leading-tight text-white"><RichInline text={subsection.title} /></h3>
                            {subsection.description && (
                              <p className="mt-2 text-sm leading-7 text-muted"><RichInline text={subsection.description} /></p>
                            )}
                            {subsection.items && subsection.items.length > 0 && (
                              <ul className="mt-3 grid gap-2 p-0">
                                {subsection.items.map((item, itemIndex) => (
                                  item === '---' ? (
                                    <li className="list-none py-1" key={`divider-${itemIndex}`}>
                                      <hr className="border-0 border-t border-white/10" />
                                    </li>
                                  ) : (
                                    <li className="flex items-start gap-3 text-sm leading-6 text-muted" key={item}>
                                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-2" />
                                      <span><RichInline text={item} /></span>
                                    </li>
                                  )
                                ))}
                              </ul>
                            )}
                          </section>
                        ))}
                      </div>
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
