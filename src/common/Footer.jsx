import { Icon } from './Icons.jsx'
import { formatCount, useServerStatus } from './liveData.js'
import { useSite } from './siteContext.js'
import { copyText } from './toastBus.js'

const external = { target: '_blank', rel: 'noreferrer' }

function Footer({ activeSection = '' }) {
  const { settings } = useSite()
  const status = useServerStatus(settings.serverAddress)
  const current = (key) => (key === activeSection ? 'page' : undefined)

  const socials = [
    { label: 'Discord', href: settings.discordUrl, icon: 'discord' },
    { label: 'YouTube', href: settings.youtubeUrl, icon: 'youtube' },
    { label: 'TikTok', href: settings.tiktokUrl, icon: 'tiktok' },
  ].filter((social) => social.href)

  return (
    <footer className="footer">
      <div className="container">
        <div className="foot-top">
          <div className="foot-brand">
            <img src="/img/logo-mark.webp" width="52" height="52" alt="" />
            <div><b>AlwiNation</b><span>{settings.tagline}</span></div>
          </div>
          <button
            className="ip-btn foot-ip"
            type="button"
            onClick={() => copyText(settings.serverAddress)}
            aria-label={`Copy server IP ${settings.serverAddress}`}
          >
            <Icon name="copy" />
            <span className="ip-text">{settings.serverAddress}</span>
            <span className="ip-count">{formatCount(status.players)}</span>
          </button>
          <div className="socials">
            {socials.map((social) => (
              <a key={social.label} href={social.href} {...external} aria-label={social.label}><Icon name={social.icon} /></a>
            ))}
          </div>
        </div>

        <div className="foot-links">
          <div><p>{settings.footerBlurb}</p></div>
          <div>
            <h3>Explore</h3>
            <ul>
              <li><a href="/news" aria-current={current('news')}>News</a></li>
              <li><a href="/changelog" aria-current={current('changelog')}>Changelog</a></li>
              <li><a href="/wiki" aria-current={current('wiki')}>Wiki</a></li>
              <li><a href="/leaderboard" aria-current={current('leaderboard')}>Leaderboard</a></li>
            </ul>
          </div>
          <div>
            <h3>Community</h3>
            <ul>
              <li><a href={settings.discordUrl} {...external}>Discord</a></li>
              <li><a href={settings.storeUrl} {...external}>Store</a></li>
              <li><a href="/staff" aria-current={current('staff')}>Staff</a></li>
              {settings.statusUrl && <li><a href={settings.statusUrl} {...external}>Server status</a></li>}
            </ul>
          </div>
          <div>
            <h3>Rules</h3>
            <ul>
              <li><a href="/rules" aria-current={current('rules')}>Server rules</a></li>
              <li><a href="/terms" aria-current={current('terms')}>Terms</a></li>
            </ul>
          </div>
        </div>

        <div className="legal">
          <p>© {new Date().getFullYear()} AlwiNation. All rights reserved.</p>
          <p>Not an official Minecraft product. Not approved by or associated with Mojang or Microsoft.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
