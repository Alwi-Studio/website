import { Icon } from '../common/Icons.jsx'
import { formatCount, useDiscordCounts } from '../common/liveData.js'
import { revealRef } from '../common/reveal.js'
import { useSite } from '../common/siteContext.js'

function CommunityBand({ section }) {
  const { settings } = useSite()
  const counts = useDiscordCounts(settings.discordInviteCode)

  return (
    <section className="section" id="community" style={{ paddingTop: 0 }}>
      <div className="container">
        <div className="discord" data-reveal ref={revealRef}>
          {section.image && <img src={section.image} width="1400" height="788" alt="" loading="lazy" />}
          {section.kicker && <p className="label">{section.kicker}</p>}
          <h2 className="head">{section.title}</h2>
          {section.lead && <p className="lead">{section.lead}</p>}
          <div className="discord-stats">
            <div><b>{formatCount(counts.members)}</b><span>Members</span></div>
            <div><b className="on">{formatCount(counts.online)}</b><span>Online now</span></div>
          </div>
          <a className="btn btn-discord" href={settings.discordUrl} target="_blank" rel="noreferrer">
            <Icon name="discord" />
            {section.buttonLabel}
          </a>
        </div>
      </div>
    </section>
  )
}

export default CommunityBand
