import { useEffect, useLayoutEffect, useState } from 'react'
import AdminPanel, { AdminLoading } from './admin/AdminPanel.jsx'
import ErrorPage from './common/ErrorPage.jsx'
import Footer from './common/Footer.jsx'
import Navbar from './common/Navbar.jsx'
import NewsDetail, { NewsDetailLoading } from './news/NewsDetail.jsx'
import NewsList from './news/NewsList.jsx'
import ChangelogList from './changelog/ChangelogList.jsx'
import ChangelogDetail from './changelog/ChangelogDetail.jsx'
import { loadChangelogData, getChangelogEntryBySlug } from './changelog/adminChangelogStore.js'
import PolicyPage from './common/PolicyPage.jsx'
import { getPolicies, loadPolicies } from './content/policyStore.js'
import StaffPage from './common/StaffPage.jsx'
import { getStaff, loadStaff } from './content/staffStore.js'
import { getNewsItemBySlug, loadNewsItems } from './news/adminNewsStore.js'
import WikiPage, { WikiLoading } from './common/WikiPage.jsx'
import WikiArticle from './common/WikiArticle.jsx'
import { getWiki, loadWiki, getWikiArticle } from './content/wikiStore.js'
import LeaderboardPage from './leaderboard/LeaderboardPage.jsx'
import HomePage from './home/HomePage.jsx'

// Home sections the navbar links to; the scrollspy marks the one in view.
const pageSectionIds = ['home', 'realms']

function getInitialActiveSection() {
  const requestedSection = window.location.hash.slice(1)

  return pageSectionIds.includes(requestedSection) ? requestedSection : 'home'
}

// Every public route: the site navbar, the page, and the footer with the same link marked.
// Each page starts with a dark picture band, so the navbar stays clear over it.
// overflow-x-clip, not hidden: hidden makes this div a scroll box, which stops the sticky
// side panels on the news, wiki, changelog and rules pages from sticking.
function SitePage({ section, children }) {
  return (
    <div className="min-h-svh overflow-x-clip bg-bg">
      <Navbar activeSection={section} overHero />
      {children}
      <Footer activeSection={section} />
    </div>
  )
}

function App() {
  const [activeSection, setActiveSection] = useState(getInitialActiveSection)
  const [newsItems, setNewsItems] = useState([])
  const [isLoadingNews, setIsLoadingNews] = useState(true)
  const [policies, setPolicies] = useState(getPolicies)
  const [isLoadingPolicies, setIsLoadingPolicies] = useState(true)
  const [staff, setStaff] = useState(getStaff)
  const [isLoadingStaff, setIsLoadingStaff] = useState(true)
  const [wiki, setWiki] = useState(getWiki)
  const [isLoadingWiki, setIsLoadingWiki] = useState(true)
  const [changelogEntries, setChangelogEntries] = useState([])
  const [changelogRealms, setChangelogRealms] = useState([])
  const [isLoadingChangelog, setIsLoadingChangelog] = useState(true)
  const isAdminPage = window.location.pathname === '/admin' || window.location.pathname === '/admin/docs'
  const isAdminDocsPage = window.location.pathname === '/admin/docs'
  const isNewsListPage = window.location.pathname === '/news'
  const isRulesPage = window.location.pathname === '/rules'
  const isTermsPage = window.location.pathname === '/terms'
  const isStaffPage = window.location.pathname === '/staff'
  const isWikiListPage = window.location.pathname === '/wiki'
  const isChangelogPage = window.location.pathname === '/changelog'
  const isLeaderboardPage = window.location.pathname === '/leaderboard'
  const changelogSlug = window.location.pathname.match(/^\/changelog\/([^/]+)\/?$/)?.[1]
  const selectedChangelogEntry = changelogSlug
    ? getChangelogEntryBySlug(changelogEntries, decodeURIComponent(changelogSlug))
    : null
  const isHomePage = window.location.pathname === '/'
  const newsSlug = window.location.pathname.match(/^\/news\/([^/]+)\/?$/)?.[1]
  const selectedNewsItem = newsSlug ? getNewsItemBySlug(newsItems, decodeURIComponent(newsSlug)) : null
  const wikiSlug = window.location.pathname.match(/^\/wiki\/([^/]+)\/?$/)?.[1]
  const selectedWikiArticle = wikiSlug ? getWikiArticle(wiki, decodeURIComponent(wikiSlug)) : null
  const isKnownPath =
    isHomePage ||
    isAdminPage ||
    isNewsListPage ||
    isRulesPage ||
    isTermsPage ||
    isStaffPage ||
    isWikiListPage ||
    isChangelogPage ||
    isLeaderboardPage ||
    Boolean(changelogSlug) ||
    Boolean(newsSlug) ||
    Boolean(wikiSlug)

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

  useEffect(() => {
    let isCurrent = true

    async function loadStaffContent() {
      setIsLoadingStaff(true)
      const loaded = await loadStaff()
      if (isCurrent) {
        setStaff(loaded)
        setIsLoadingStaff(false)
      }
    }

    loadStaffContent()
    return () => {
      isCurrent = false
    }
  }, [isStaffPage, isAdminPage])

  useEffect(() => {
    let isCurrent = true

    async function loadWikiContent() {
      setIsLoadingWiki(true)
      const loaded = await loadWiki()
      if (isCurrent) {
        setWiki(loaded)
        setIsLoadingWiki(false)
      }
    }

    loadWikiContent()
    return () => {
      isCurrent = false
    }
  }, [isWikiListPage, wikiSlug, isAdminPage])

  useEffect(() => {
    let isCurrent = true

    async function loadChangelogContent() {
      setIsLoadingChangelog(true)
      const { entries, realms } = await loadChangelogData({ includeDeleted: isAdminPage })
      if (isCurrent) {
        setChangelogEntries(entries)
        setChangelogRealms(realms)
        setIsLoadingChangelog(false)
      }
    }

    loadChangelogContent()
    return () => {
      isCurrent = false
    }
  }, [isChangelogPage, changelogSlug, isAdminPage])

  useLayoutEffect(() => {
    if (
      newsSlug ||
      isNewsListPage ||
      isAdminPage ||
      isRulesPage ||
      isTermsPage ||
      isStaffPage ||
      isWikiListPage ||
      isChangelogPage ||
      isLeaderboardPage ||
      changelogSlug ||
      wikiSlug ||
      !isKnownPath
    ) {
      setActiveSection('news')
      return undefined
    }

    // Only the hero and the gameplay section have nav links: highlight the one
    // under the activation line, and nothing once the page is past both.
    function updateActiveSection() {
      const activationLine = window.innerHeight * 0.38
      let currentSection = ''

      for (const sectionId of pageSectionIds) {
        const box = document.getElementById(sectionId)?.getBoundingClientRect()
        if (box && box.top <= activationLine && box.bottom > activationLine) {
          currentSection = sectionId
        }
      }

      setActiveSection(currentSection)

      const nextHash = currentSection ? `#${currentSection}` : ''
      if (window.location.hash !== nextHash) {
        window.history.replaceState(null, '', nextHash || window.location.pathname)
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
  }, [newsSlug, isNewsListPage, isAdminPage, isRulesPage, isTermsPage, isStaffPage, isWikiListPage, isChangelogPage, isLeaderboardPage, changelogSlug, wikiSlug, isKnownPath])

  if (!isKnownPath) {
    return (
      <SitePage section="">
        <ErrorPage />
      </SitePage>
    )
  }

  // The admin has its own shell (sidebar, top bar, theme toggle), so no site navbar or
  // footer, and no wrapper that would stop its sticky bars.
  if (isAdminPage) {
    return isLoadingNews || isLoadingPolicies || isLoadingStaff || isLoadingWiki || isLoadingChangelog ? (
      <AdminLoading />
    ) : (
      <AdminPanel
        newsItems={newsItems}
        onNewsChange={setNewsItems}
        policies={policies}
        onPoliciesChange={setPolicies}
        staff={staff}
        onStaffChange={setStaff}
        wiki={wiki}
        onWikiChange={setWiki}
        changelogEntries={changelogEntries}
        onChangelogChange={setChangelogEntries}
        changelogRealms={changelogRealms}
        onChangelogRealmsChange={setChangelogRealms}
        initialTab={isAdminDocsPage ? 'docs' : 'overview'}
      />
    )
  }

  if (newsSlug) {
    return (
      <SitePage section="news">
        {isLoadingNews ? (
          <NewsDetailLoading />
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
      </SitePage>
    )
  }

  if (isNewsListPage) {
    return (
      <SitePage section="news">
        <NewsList newsItems={newsItems} isLoading={isLoadingNews} />
      </SitePage>
    )
  }

  if (changelogSlug) {
    return (
      <SitePage section="changelog">
        {isLoadingChangelog ? (
          // Entries load with the list, so a cold load shows the list's loading state.
          <ChangelogList isLoading />
        ) : selectedChangelogEntry ? (
          <ChangelogDetail entry={selectedChangelogEntry} entries={changelogEntries} />
        ) : (
          <ErrorPage
            code="404"
            eyebrow="Entry not found"
            title="This changelog entry does not exist."
            description="The entry may have been deleted, hidden, or moved to another URL."
            primaryHref="/changelog"
            primaryLabel="View all changes"
            secondaryHref="/"
            secondaryLabel="Go home"
          />
        )}
      </SitePage>
    )
  }

  if (isChangelogPage) {
    return (
      <SitePage section="changelog">
        <ChangelogList entries={changelogEntries} isLoading={isLoadingChangelog} />
      </SitePage>
    )
  }

  if (isLeaderboardPage) {
    return (
      <SitePage section="leaderboard">
        <LeaderboardPage />
      </SitePage>
    )
  }

  if (isStaffPage) {
    return (
      <SitePage section="staff">
        <StaffPage {...staff} isLoading={isLoadingStaff} />
      </SitePage>
    )
  }

  if (isWikiListPage) {
    return (
      <SitePage section="wiki">
        {isLoadingWiki ? <WikiLoading /> : <WikiPage {...wiki} />}
      </SitePage>
    )
  }

  if (wikiSlug) {
    return (
      <SitePage section="wiki">
        {isLoadingWiki ? (
          <WikiLoading />
        ) : selectedWikiArticle ? (
          <WikiArticle
            article={selectedWikiArticle.article}
            category={selectedWikiArticle.category}
            wiki={wiki}
          />
        ) : (
          <ErrorPage
            code="404"
            eyebrow="Article not found"
            title="This wiki page does not exist."
            description="It may have been moved, renamed, or deleted."
            primaryHref="/wiki"
            primaryLabel="Browse the wiki"
            secondaryHref="/"
            secondaryLabel="Go home"
          />
        )}
      </SitePage>
    )
  }

  if (isRulesPage || isTermsPage) {
    const policyKey = isRulesPage ? 'rules' : 'terms'
    return (
      <SitePage section={policyKey}>
        <PolicyPage
          {...policies[policyKey]}
          activeKey={policyKey}
          counts={{ rules: policies.rules?.sections?.length ?? 0, terms: policies.terms?.sections?.length ?? 0 }}
          isLoading={isLoadingPolicies}
        />
      </SitePage>
    )
  }

  return (
    <SitePage section={activeSection}>
      <HomePage newsItems={newsItems} isLoadingNews={isLoadingNews} />
    </SitePage>
  )
}

export default App
