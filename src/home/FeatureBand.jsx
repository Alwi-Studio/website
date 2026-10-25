import Particles from '../common/Particles.jsx'
import { revealRef } from '../common/reveal.js'

// The dark feature band (Season 5 by default) with its Minecraft item tooltip.
function FeatureBand({ section }) {
  const { tooltip } = section
  const internal = section.buttonHref?.startsWith('/')
  return (
    <section className="season" id="season">
      {section.image && <img className="season-bg" src={section.image} width="2000" height="1127" alt="" loading="lazy" />}
      {section.effect.kind !== 'none' && <Particles {...section.effect} />}
      <div className="container season-in">
        <div className="season-copy" data-reveal ref={revealRef}>
          {section.kicker && <p className="label">{section.kicker}</p>}
          <h2 className="head">
            {section.title}
            {section.titleAccent && <> <em>{section.titleAccent}</em></>}
          </h2>
          {section.lead && <p className="lead">{section.lead}</p>}
          {section.buttonLabel && section.buttonHref && (
            <a className="btn btn-primary" href={section.buttonHref} target={internal ? undefined : '_blank'} rel={internal ? undefined : 'noreferrer'}>
              {section.buttonLabel}
            </a>
          )}
        </div>
        {tooltip && tooltip.lines.length > 0 && (
          <div className="mc-tooltip" data-reveal data-delay="1" ref={revealRef} role="note" aria-label={tooltip.title || 'Highlights'}>
            {tooltip.title && <p className="t-title">{tooltip.title}</p>}
            {tooltip.subtitle && <p className="t-sub">{tooltip.subtitle}</p>}
            <ul>
              {tooltip.lines.map((line, i) => (
                <li key={i}><p><b>{line.name}</b><span>{line.text}</span></p></li>
              ))}
            </ul>
            {tooltip.footer && <p className="t-foot">{tooltip.footer}</p>}
          </div>
        )}
      </div>
    </section>
  )
}

export default FeatureBand
