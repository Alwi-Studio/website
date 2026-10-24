import { revealRef } from '../common/reveal.js'
import { useSite } from '../common/siteContext.js'
import CommunityBand from './CommunityBand.jsx'
import FeatureBand from './FeatureBand.jsx'
import GameplayCarousel from './GameplayCarousel.jsx'
import Hero from './Hero.jsx'
import HomeNews from './HomeNews.jsx'
import JoinSection from './JoinSection.jsx'
import TopPlayers from './TopPlayers.jsx'

function GameplaySection({ section, realms }) {
  if (realms.length === 0) return null
  return (
    // id="realms" keeps the /#realms links working whatever the section is called.
    <section className="section" id="realms">
      <div className="container">
        <header className="sec-head" data-reveal ref={revealRef}>
          {section.kicker && <p className="label">{section.kicker}</p>}
          <h2 className="head">{section.title}</h2>
          {section.lead && <p>{section.lead}</p>}
        </header>
        <GameplayCarousel realms={realms} autoplaySeconds={section.autoplaySeconds} />
      </div>
    </section>
  )
}

// The hero is fixed; every section below it comes from the site document in
// its stored order, and a disabled section is skipped without losing its content.
function HomePage({ newsItems, isLoadingNews }) {
  const { home } = useSite()
  const realms = home.realms.filter((realm) => realm.enabled)

  return (
    <main>
      <Hero />
      {home.sections.filter((section) => section.enabled).map((section) => {
        switch (section.id) {
          case 'gameplay': return <GameplaySection key={section.id} section={section} realms={realms} />
          case 'feature': return <FeatureBand key={section.id} section={section} />
          case 'players': return <TopPlayers key={section.id} section={section} />
          case 'join': return <JoinSection key={section.id} section={section} />
          case 'news': return <HomeNews key={section.id} section={section} items={newsItems} isLoading={isLoadingNews} />
          case 'community': return <CommunityBand key={section.id} section={section} />
          default: return null
        }
      })}
    </main>
  )
}

export default HomePage
