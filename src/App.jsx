import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import backgroundAvif from './assets/background.avif'
import backgroundImg from './assets/background.webp'
import AdminPanel from './admin/AdminPanel.jsx'
import ErrorPage from './common/ErrorPage.jsx'
import Footer from './common/Footer.jsx'
import Navbar from './common/Navbar.jsx'
import NewsDetail from './news/NewsDetail.jsx'
import NewsList from './news/NewsList.jsx'
import News from './news/News.jsx'
import PolicyPage from './common/PolicyPage.jsx'
import { getPolicies, loadPolicies } from './content/policyStore.js'
import { getNewsItemBySlug, loadNewsItems } from './news/adminNewsStore.js'

const SERVER_ADDRESS = 'play.alwination.id'

const workItems = [
  {
    title: 'Minecraft Servers',
    description: 'We build and manage Minecraft server experiences for community play.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="3" /><path d="M3 9h18M9 21V9" /></svg>
    ),
  },
  {
    title: 'Events',
    description: 'We create in-game events, competitions, and activities for players.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 21h8M12 17v4M6 4h12v5a6 6 0 0 1-12 0z" /></svg>
    ),
  },
  {
    title: 'Content',
    description: 'We make server-related content, updates, announcements, and community highlights.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 10l4.5-2.5v9L15 14M3 6h12v12H3z" /></svg>
    ),
  },
  {
    title: 'Commissions',
    description: 'We handle commissioned work such as server setup, configuration, and related services.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 3v18M3 12h18" /></svg>
    ),
  },
]

const aboutFeatures = [
  {
    title: 'Survival & land claiming',
    description: 'Custom survival gameplay with claim protection.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z" /></svg>
    ),
  },
  {
    title: 'Events & competitions',
    description: 'Build contests and community activities.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 21h8M12 17v4M6 4h12v5a6 6 0 0 1-12 0z" /></svg>
    ),
  },
  {
    title: 'Java & Bedrock support',
    description: 'Play from any device, cross-platform.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18" /></svg>
    ),
  },
]

const contactItems = [
  {
    label: 'Server IP',
    value: 'play.alwination.id',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M6 9h6M6 13h3" /></svg>
    ),
  },
  {
    label: 'Discord',
    value: 'discord.alwination.id',
    icon: (
      <svg width="18" height="18" viewBox="-1 -1 26 26" fill="currentColor" aria-hidden="true"><path d="M19.3 5.3A16 16 0 0 0 15.4 4l-.2.4c1.4.4 2 .9 2 1s-.7-.4-1.9-.8a13 13 0 0 0-6.6 0c-1.2.4-1.9.8-1.9.8s.6-.6 2-1L8.6 4c-1.4.3-2.7.7-3.9 1.3C2.2 9 1.5 12.6 1.8 16.1A15.8 15.8 0 0 0 6.7 18.6l.9-1.4c-.5-.2-1-.4-1.4-.7l.3-.2c2.7 1.3 5.5 1.3 8.2 0l.3.2c-.4.3-.9.5-1.4.7l.9 1.4c1.7-.5 3.3-1.3 4.9-2.5.4-4.1-.6-7.6-2.1-10.8ZM8.5 14.1c-.8 0-1.5-.8-1.5-1.8s.7-1.8 1.5-1.8 1.5.8 1.5 1.8-.7 1.8-1.5 1.8Zm7 0c-.8 0-1.5-.8-1.5-1.8s.7-1.8 1.5-1.8 1.5.8 1.5 1.8-.7 1.8-1.5 1.8Z" /></svg>
    ),
  },
  {
    label: 'Store',
    value: 'store.alwination.id',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2h12l2 5H4z" /><path d="M5 7v13h14V7" /></svg>
    ),
  },
  {
    label: 'Support',
    value: 'Contact staff in-game',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></svg>
    ),
  },
]

const newsToShow = 3
const pageSectionIds = ['home', 'news', 'about', 'work', 'contact']

function getInitialActiveSection() {
  const requestedSection = window.location.hash.slice(1)

  return pageSectionIds.includes(requestedSection) ? requestedSection : 'home'
}

function StableImage({ src, avifSrc = '', alt = '', className = '', eager = false }) {
  const imageRef = useRef(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useLayoutEffect(() => {
    const image = imageRef.current

    if (image?.complete && image.naturalWidth > 0) {
      setIsLoaded(true)
      return
    }

    setIsLoaded(false)
  }, [src])

  return (
    <>
      {!isLoaded && <div className="absolute inset-0 bg-surface-2" />}
      <picture className="contents">
        {avifSrc && <source srcSet={avifSrc} type="image/avif" />}
        <img
          ref={imageRef}
          src={src}
          alt={alt}
          width="1920"
          height="1080"
          loading={eager ? 'eager' : 'lazy'}
          fetchPriority={eager ? 'high' : 'auto'}
          decoding="async"
          className={`${className} transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setIsLoaded(true)}
          onError={() => setIsLoaded(false)}
        />
      </picture>
    </>
  )
}

function useServerStatus() {
  const [serverStatus, setServerStatus] = useState({
    loading: true,
    online: false,
    players: 0,
    maxPlayers: 0,
  })

  useEffect(() => {
    const controller = new AbortController()

    async function loadServerStatus() {
      try {
        const response = await fetch(`https://api.mcsrvstat.us/3/${SERVER_ADDRESS}`, {
          signal: controller.signal,
        })
        const data = await response.json()

        setServerStatus({
          loading: false,
          online: Boolean(data.online),
          players: data.players?.online ?? 0,
          maxPlayers: data.players?.max ?? 0,
        })
      } catch {
        if (!controller.signal.aborted) {
          setServerStatus({ loading: false, online: false, players: 0, maxPlayers: 0 })
        }
      }
    }

    loadServerStatus()
    return () => controller.abort()
  }, [])

  return serverStatus
}

function StatusPill({ serverStatus }) {
  const online = serverStatus.online && !serverStatus.loading
  return (
    <span
      className={`inline-flex items-center gap-2.5 rounded-xl border px-4 py-[11px] text-sm font-semibold ${
        serverStatus.loading
          ? 'border-white/15 bg-white/[0.04] text-muted'
          : online
            ? 'border-positive/30 bg-positive/10 text-white'
            : 'border-[#e56458]/30 bg-[#e56458]/10 text-white'
      }`}
    >
      <span
        className={`h-2.5 w-2.5 rounded-full ${
          serverStatus.loading
            ? 'animate-pulse bg-zinc-400'
            : online
              ? 'bg-positive shadow-[0_0_12px_rgba(63,208,127,0.9)]'
              : 'bg-[#e56458] shadow-[0_0_12px_rgba(229,100,88,0.9)]'
        }`}
      />
      <span>{serverStatus.loading ? 'Checking…' : online ? 'Online' : 'Offline'}</span>
      <span className="font-medium text-muted">
        {serverStatus.loading
          ? ''
          : online
            ? `${serverStatus.players}/${serverStatus.maxPlayers || '?'} players`
            : '0 players'}
      </span>
    </span>
  )
}

function CopyIpCard() {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(SERVER_ADDRESS)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="flex items-center gap-3.5 rounded-2xl border border-white/15 bg-white/[0.04] py-2 pl-[18px] pr-2 backdrop-blur">
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-2">Server IP</div>
        <div className="text-base font-bold tracking-tight text-white">{SERVER_ADDRESS}</div>
      </div>
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex items-center gap-2 rounded-[10px] bg-gradient-to-b from-brand-2 to-brand px-4 py-2.5 text-sm font-semibold text-[#1a0d07] transition hover:brightness-105 focus:outline-none focus:ring-2 focus:ring-brand/70"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" />
        </svg>
        {copied ? 'Copied!' : 'Copy IP'}
      </button>
    </div>
  )
}

function Hero({ serverStatus }) {
  const stats = [
    {
      value: serverStatus.loading ? '—' : serverStatus.online ? String(serverStatus.players) : '0',
      label: 'Players online',
    },
    { value: '100k+', label: 'Members' },
    { value: '10', label: 'Unique Realms' },
    { value: '1.21.11', label: 'Recommended Version' },
  ]

  return (
    <section id="home" className="relative flex min-h-[92svh] scroll-mt-24 items-center overflow-hidden pb-24 pt-36">
      <div className="absolute inset-0 z-0">
        <StableImage
          src={backgroundImg}
          avifSrc={backgroundAvif}
          alt=""
          className="h-full w-full object-cover object-[center_42%]"
          eager
        />
        <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_20%_30%,rgba(11,11,14,0.55),rgba(11,11,14,0.86)_60%,var(--color-bg)_100%)]" />
      </div>
      <div className="pointer-events-none absolute -left-40 -top-28 z-[1] h-[620px] w-[620px] rounded-full bg-[radial-gradient(circle,rgba(255,90,48,0.28),transparent_62%)] blur-2xl" />
      <div className="hero-grid-overlay pointer-events-none absolute inset-0 z-[1] opacity-50" />

      <div className="relative z-[2] mx-auto w-full max-w-[1180px] px-6">
        <div className="max-w-[760px]">
          <span className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white/[0.05] px-3.5 py-[7px] text-[13px] text-muted">
            <span className="h-2 w-2 rounded-full bg-positive shadow-[0_0_0_4px_rgba(63,208,127,0.18)]" />
            Java &amp; Bedrock · Indonesian Community
          </span>
          <h1 className="text-[clamp(40px,6.4vw,74px)] font-bold leading-[1.03] tracking-[-0.03em] text-white">
            Your adventure <br />
            <span className="text-gradient">starts here.</span>
          </h1>
          <p className="mt-5 max-w-[52ch] text-[18.5px] text-muted">
            AlwiNation is a growing Indonesian Minecraft community built for survival, events, and creativity.
            Jump in and play with us today.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3.5">
            <CopyIpCard />
            <StatusPill serverStatus={serverStatus} />
          </div>

          <div className="mt-16 grid max-w-[640px] grid-cols-2 gap-4 sm:grid-cols-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-white/10 bg-gradient-to-b from-surface to-bg-2 px-6 py-[22px]"
              >
                <div className="text-[30px] font-extrabold tracking-tight">
                  <span className="text-gradient">{stat.value}</span>
                </div>
                <div className="mt-1 text-sm text-muted">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function SectionHeading({ eyebrow, title, subtitle, className = '' }) {
  return (
    <div className={`max-w-[640px] ${className}`}>
      <span className="eyebrow">{eyebrow}</span>
      <h2 className="mt-3.5 text-[clamp(28px,4vw,42px)] font-bold leading-[1.1] tracking-[-0.02em] text-white">
        {title}
      </h2>
      {subtitle ? <p className="mt-4 max-w-[56ch] text-[16.5px] text-muted">{subtitle}</p> : null}
    </div>
  )
}

function NewsLoadingCards({ count = 3 }) {
  return Array.from({ length: count }, (_, index) => (
    <article
      className="min-h-[390px] overflow-hidden rounded-2xl border border-white/10 bg-surface"
      key={`news-loading-${index}`}
    >
      <div className="grid aspect-[16/10] place-items-center bg-surface-2">
        <div className="h-11 w-11 animate-spin rounded-full border-2 border-white/15 border-t-brand-2" />
      </div>
      <div className="space-y-4 p-[22px]">
        <div className="h-3 w-28 animate-pulse rounded-full bg-white/10" />
        <div className="h-6 w-4/5 animate-pulse rounded-full bg-white/10" />
        <div className="h-4 w-full animate-pulse rounded-full bg-white/10" />
        <div className="h-4 w-2/3 animate-pulse rounded-full bg-white/10" />
      </div>
    </article>
  ))
}

function NewsPageLoading() {
  return (
    <main className="min-h-svh bg-bg px-6 pb-24 pt-36">
      <section className="mx-auto max-w-[1180px]">
        <div className="grid min-h-[360px] place-items-center rounded-2xl border border-white/10 bg-surface">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-white/15 border-t-brand-2" />
        </div>
      </section>
    </main>
  )
}

function PolicyPageLoading() {
  return (
    <main className="min-h-svh bg-bg pb-24 pt-32 text-white">
      <section className="mx-auto max-w-[1080px] px-6">
        <div className="rounded-[24px] border border-white/10 bg-surface p-7 sm:p-10">
          <div className="h-4 w-36 animate-pulse rounded-full bg-white/10" />
          <div className="mt-5 h-12 max-w-[620px] animate-pulse rounded-full bg-white/10" />
          <div className="mt-6 space-y-3">
            <div className="h-4 max-w-[720px] animate-pulse rounded-full bg-white/10" />
            <div className="h-4 max-w-[560px] animate-pulse rounded-full bg-white/10" />
          </div>
          <div className="mt-7 h-10 w-48 animate-pulse rounded-xl bg-white/10" />
        </div>
      </section>

      <section className="mx-auto mt-8 max-w-[1080px] px-6">
        <div className="grid gap-6 lg:grid-cols-[260px_1fr] lg:items-start">
          <aside className="hidden lg:block">
            <div className="rounded-[18px] border border-white/10 bg-surface p-5">
              <div className="h-3 w-24 animate-pulse rounded-full bg-white/10" />
              <div className="mt-5 grid gap-3">
                {Array.from({ length: 6 }, (_, index) => (
                  <div className="h-8 animate-pulse rounded-lg bg-white/10" key={`policy-toc-${index}`} />
                ))}
              </div>
            </div>
          </aside>
          <div className="grid gap-5">
            {Array.from({ length: 4 }, (_, index) => (
              <article
                className="rounded-[18px] border border-white/10 bg-surface p-6 sm:p-7"
                key={`policy-loading-${index}`}
              >
                <div className="flex gap-4">
                  <div className="h-9 w-9 shrink-0 animate-pulse rounded-xl bg-white/10" />
                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="h-5 w-1/2 animate-pulse rounded-full bg-white/10" />
                    <div className="h-4 w-full animate-pulse rounded-full bg-white/10" />
                    <div className="h-4 w-4/5 animate-pulse rounded-full bg-white/10" />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}

function AdminPageLoading() {
  return (
    <main className="min-h-svh bg-bg px-5 pb-16 pt-36 text-white sm:px-8 lg:px-12">
      <section className="mx-auto max-w-6xl">
        <div className="rounded-2xl border border-white/10 bg-surface p-6">
          <div className="h-4 w-24 animate-pulse rounded-full bg-white/10" />
          <div className="mt-4 h-9 w-56 animate-pulse rounded-full bg-white/10" />
          <div className="mt-6 h-12 max-w-md animate-pulse rounded-xl bg-white/10" />
        </div>
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="rounded-2xl border border-white/10 bg-surface p-6">
            <div className="grid gap-5">
              {Array.from({ length: 7 }, (_, index) => (
                <div className="h-12 animate-pulse rounded-xl bg-white/10" key={`admin-form-${index}`} />
              ))}
            </div>
          </div>
          <aside className="rounded-2xl border border-white/10 bg-surface p-6">
            <div className="h-6 w-36 animate-pulse rounded-full bg-white/10" />
            <div className="mt-6 grid gap-4">
              {Array.from({ length: 3 }, (_, index) => (
                <div className="h-28 animate-pulse rounded-xl bg-white/10" key={`admin-list-${index}`} />
              ))}
            </div>
          </aside>
        </div>
      </section>
    </main>
  )
}

function App() {
  const [activeSection, setActiveSection] = useState(getInitialActiveSection)
  const [newsItems, setNewsItems] = useState([])
  const [isLoadingNews, setIsLoadingNews] = useState(true)
  const [policies, setPolicies] = useState(getPolicies)
  const [isLoadingPolicies, setIsLoadingPolicies] = useState(true)
  const serverStatus = useServerStatus()
  const visibleNewsItems = newsItems.slice(0, newsToShow)
  const isAdminPage = window.location.pathname === '/admin'
  const isNewsListPage = window.location.pathname === '/news'
  const isRulesPage = window.location.pathname === '/rules'
  const isTermsPage = window.location.pathname === '/terms'
  const isHomePage = window.location.pathname === '/'
  const newsSlug = window.location.pathname.match(/^\/news\/([^/]+)\/?$/)?.[1]
  const selectedNewsItem = newsSlug ? getNewsItemBySlug(newsItems, decodeURIComponent(newsSlug)) : null
  const isKnownPath =
    isHomePage || isAdminPage || isNewsListPage || isRulesPage || isTermsPage || Boolean(newsSlug)

  useEffect(() => {
    let isCurrent = true

    async function loadNews() {
      setIsLoadingNews(true)
      const loadedNewsItems = await loadNewsItems({ includeDeleted: isAdminPage })
      if (isCurrent) {
        setNewsItems(loadedNewsItems)
        setIsLoadingNews(false)
      }
    }

    loadNews()
    return () => {
      isCurrent = false
    }
  }, [isAdminPage])

  useEffect(() => {
    let isCurrent = true

    async function loadPolicyContent() {
      setIsLoadingPolicies(true)
      const loaded = await loadPolicies()
      if (isCurrent) {
        setPolicies(loaded)
        setIsLoadingPolicies(false)
      }
    }

    loadPolicyContent()
    return () => {
      isCurrent = false
    }
  }, [isRulesPage, isTermsPage, isAdminPage])

  useLayoutEffect(() => {
    if (newsSlug || isNewsListPage || isAdminPage || isRulesPage || isTermsPage || !isKnownPath) {
      setActiveSection('news')
      return undefined
    }

    function updateActiveSection() {
      const bottomOffset = 12
      const isAtPageBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - bottomOffset

      let currentSection = 'home'

      if (isAtPageBottom) {
        currentSection = pageSectionIds.at(-1) ?? 'home'
      } else {
        const activationLine = window.innerHeight * 0.38

        for (const sectionId of pageSectionIds) {
          const section = document.getElementById(sectionId)
          if (!section) {
            continue
          }
          const sectionTop = section.getBoundingClientRect().top
          if (sectionTop <= activationLine) {
            currentSection = sectionId
          }
        }
      }

      setActiveSection(currentSection)

      const nextHash = `#${currentSection}`
      if (window.location.hash !== nextHash) {
        window.history.replaceState(null, '', nextHash)
      }
    }

    window.addEventListener('scroll', updateActiveSection, { passive: true })
    window.addEventListener('resize', updateActiveSection)

    const requestedSection = window.location.hash.slice(1)
    const requestedElement = pageSectionIds.includes(requestedSection)
      ? document.getElementById(requestedSection)
      : null

    if (requestedElement) {
      setActiveSection(requestedSection)
      requestedElement.scrollIntoView({ block: 'start' })
      updateActiveSection()
    } else {
      updateActiveSection()
    }

    return () => {
      window.removeEventListener('scroll', updateActiveSection)
      window.removeEventListener('resize', updateActiveSection)
    }
  }, [newsSlug, isNewsListPage, isAdminPage, isRulesPage, isTermsPage, isKnownPath])

  if (!isKnownPath) {
    return (
      <div className="min-h-svh overflow-x-hidden bg-bg">
        <Navbar activeSection="" />
        <ErrorPage />
        <Footer />
      </div>
    )
  }

  if (isAdminPage) {
    return (
      <div className="min-h-svh overflow-x-hidden bg-bg">
        <Navbar activeSection="admin" />
        {isLoadingNews || isLoadingPolicies ? (
          <AdminPageLoading />
        ) : (
          <AdminPanel
            newsItems={newsItems}
            onNewsChange={setNewsItems}
            policies={policies}
            onPoliciesChange={setPolicies}
          />
        )}
        <Footer />
      </div>
    )
  }

  if (newsSlug) {
    return (
      <div className="min-h-svh overflow-x-hidden bg-bg">
        <Navbar activeSection="news" />
        {isLoadingNews ? (
          <NewsPageLoading />
        ) : selectedNewsItem ? (
          <NewsDetail item={selectedNewsItem} newsItems={newsItems} />
        ) : (
          <ErrorPage
            code="404"
            eyebrow="News not found"
            title="This news post does not exist."
            description="The article may have been deleted, hidden, or moved to another URL."
            primaryHref="/news"
            primaryLabel="View all news"
            secondaryHref="/"
            secondaryLabel="Go home"
          />
        )}
        <Footer />
      </div>
    )
  }

  if (isNewsListPage) {
    return (
      <div className="min-h-svh overflow-x-hidden bg-bg">
        <Navbar activeSection="news" />
        <NewsList newsItems={newsItems} isLoading={isLoadingNews} />
        <Footer />
      </div>
    )
  }

  if (isRulesPage || isTermsPage) {
    return (
      <div className="min-h-svh bg-bg">
        <Navbar activeSection={isRulesPage ? 'rules' : 'terms'} />
        {isLoadingPolicies ? (
          <PolicyPageLoading />
        ) : (
          <PolicyPage
            {...(isRulesPage ? policies.rules : policies.terms)}
            activeKey={isRulesPage ? 'rules' : 'terms'}
          />
        )}
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-svh overflow-x-hidden bg-bg">
      <Navbar activeSection={activeSection} />

      <main>
        <Hero serverStatus={serverStatus} />

        {/* NEWS */}
        <section id="news" className="scroll-mt-24 py-24">
          <div className="mx-auto max-w-[1180px] px-6">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <SectionHeading
                eyebrow="Latest News"
                title="Updates from AlwiNation"
                subtitle="Announcements, development notes, and community highlights — all in one place."
              />
              <a
                href="/news"
                className="inline-flex min-h-[46px] items-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-[22px] text-[15px] font-semibold text-white transition hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/[0.08]"
              >
                View all news
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </a>
            </div>

            <div className="mt-11 grid gap-[22px] md:grid-cols-2 xl:grid-cols-3">
              {isLoadingNews ? (
                <NewsLoadingCards count={newsToShow} />
              ) : (
                visibleNewsItems.map((item) => (
                  <News key={item.id} {...item} />
                ))
              )}
            </div>
          </div>
        </section>

        {/* ABOUT */}
        <section id="about" className="scroll-mt-24 border-t border-white/10 bg-bg-2 py-24">
          <div className="mx-auto grid max-w-[1180px] items-center gap-14 px-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[20px] border border-white/10">
              <StableImage src={backgroundImg} avifSrc={backgroundAvif} alt="" className="h-full w-full object-cover" />
              <div className="absolute inset-x-[18px] bottom-[18px] flex gap-[18px] rounded-2xl border border-white/15 bg-bg/60 px-[18px] py-4 backdrop-blur-md">
                <div>
                  <b className="text-lg text-white">12k+</b>
                  <small className="block text-xs text-muted">Players joined</small>
                </div>
                <div>
                  <b className="text-lg text-white">Since 2025</b>
                  <small className="block text-xs text-muted">Community</small>
                </div>
              </div>
            </div>

            <div>
              <SectionHeading
                eyebrow="About"
                title="A popular Indonesian Minecraft community."
                subtitle="AlwiNation is an Indonesian multiplayer server owned by gaming content creator and YouTuber Alwisusilo, grown into one of the liveliest communities in the local gaming scene."
              />
              <div className="mt-7 grid gap-3.5">
                {aboutFeatures.map((feature) => (
                  <div key={feature.title} className="flex items-start gap-3.5 rounded-2xl border border-white/10 bg-surface px-[18px] py-4">
                    <span className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-brand/12 text-brand-2 shadow-[inset_0_0_0_1px_rgba(255,90,48,0.3)]">
                      {feature.icon}
                    </span>
                    <div>
                      <b className="block text-[15.5px] text-white">{feature.title}</b>
                      <span className="text-sm text-muted">{feature.description}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* WORK */}
        <section id="work" className="scroll-mt-24 py-24">
          <div className="mx-auto max-w-[1180px] px-6">
            <SectionHeading
              eyebrow="Work"
              title="What we are building."
              subtitle="From servers to content, here is what the AlwiNation team focuses on."
            />
            <div className="mt-11 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {workItems.map((item) => (
                <article
                  key={item.title}
                  className="rounded-2xl border border-white/10 bg-surface p-[26px] transition hover:-translate-y-1 hover:border-white/15 hover:bg-surface-2"
                >
                  <span className="mb-[18px] grid h-[46px] w-[46px] place-items-center rounded-xl bg-brand/12 text-brand-2 shadow-[inset_0_0_0_1px_rgba(255,90,48,0.3)]">
                    {item.icon}
                  </span>
                  <h3 className="text-lg font-bold text-white">{item.title}</h3>
                  <p className="mt-2.5 text-sm leading-6 text-muted">{item.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* CONTACT */}
        <section id="contact" className="scroll-mt-24 border-t border-white/10 bg-bg-2 py-24">
          <div className="mx-auto grid max-w-[1180px] items-start gap-12 px-6 lg:grid-cols-2">
            <div>
              <SectionHeading
                eyebrow="Contact"
                title="Need help or want to join?"
                subtitle="Use the server IP to hop in, or reach the team through our community channels."
              />
              <div className="relative mt-6 overflow-hidden rounded-[20px] border border-brand/30 bg-gradient-to-br from-brand/[0.16] to-brand-2/[0.06] p-7">
                <h3 className="text-[22px] font-bold text-white">Ready to play?</h3>
                <p className="mt-2.5 text-muted">Copy the IP, launch Minecraft, and join the world.</p>
                <div className="mt-5 flex flex-wrap items-center gap-3.5">
                  <CopyIpCard />
                  <a
                    href="https://discord.alwination.id"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-[46px] items-center rounded-xl border border-white/15 bg-white/[0.04] px-[22px] text-[15px] font-semibold text-white transition hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/[0.08]"
                  >
                    Join Discord
                  </a>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-[20px] border border-white/10 bg-surface">
              {contactItems.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between gap-4 border-b border-white/10 px-6 py-5 last:border-b-0"
                >
                  <span className="flex items-center gap-3.5 text-sm font-medium text-muted">
                    <span className="grid h-[38px] w-[38px] place-items-center rounded-[10px] bg-brand/12 text-brand-2">
                      {item.icon}
                    </span>
                    {item.label}
                  </span>
                  <span className="text-[15px] font-bold text-white">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default App
