import { Icon } from '../common/Icons.jsx'
import { formatCount, useServerStatus } from '../common/liveData.js'
import Particles from '../common/Particles.jsx'
import { revealRef } from '../common/reveal.js'
import { useSite } from '../common/siteContext.js'
import { copyText } from '../common/toastBus.js'

const defaultHeroImage = '/img/hero-hub.webp'

function Hero() {
  const { settings, home } = useSite()
  const { hero } = home
  const status = useServerStatus(settings.serverAddress)
  // The shipped picture has a phone-sized copy; an admin-supplied image is used as is.
  const srcSet = hero.image === defaultHeroImage ? '/img/hero-hub-sm.webp 1000w, /img/hero-hub.webp 2400w' : undefined

  return (
    <section className="hero" id="home">
      <div className="hero-bg">
        <img src={hero.image} srcSet={srcSet} sizes="100vw" width="2400" height="1352" alt="" fetchPriority="high" />
      </div>
      <Particles kind="embers" />
      <div className="container hero-in">
        <h1 className="hero-logo" data-reveal ref={revealRef}>
          <img src="/img/logo-long.webp" width="1200" height="91" alt="AlwiNation" />
        </h1>
        {hero.subtitle && <p className="hero-sub" data-reveal data-delay="1" ref={revealRef}>{hero.subtitle}</p>}
        <div className="plaque" data-reveal data-delay="2" ref={revealRef}>
          <img src={status.icon ?? '/img/server-icon.png'} width="64" height="64" alt="" />
          <button className="addr" type="button" onClick={() => copyText(settings.serverAddress)} aria-label={`Copy server IP ${settings.serverAddress}`}>
            {settings.serverAddress}
            <Icon name="copy" />
          </button>
          <span className="sep" aria-hidden="true" />
          <span className="online">{formatCount(status.players)}&nbsp;online</span>
          <span className="sep" aria-hidden="true" />
          <span className="ver">Java &amp; Bedrock {settings.javaVersion}</span>
        </div>
        <div className="hero-cta" data-reveal data-delay="3" ref={revealRef}>
          <button className="btn btn-primary" type="button" onClick={() => copyText(settings.serverAddress)}>{hero.primaryLabel}</button>
          <a className="btn btn-dark" href={settings.discordUrl} target="_blank" rel="noreferrer">
            <Icon name="discord" />
            {hero.secondaryLabel}
          </a>
        </div>
      </div>
    </section>
  )
}

export default Hero
