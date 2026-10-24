import { useState } from 'react'
import { revealRef } from '../common/reveal.js'
import { useSite } from '../common/siteContext.js'
import { copyText } from '../common/toastBus.js'
import { fillSitePlaceholders } from '../content/site.js'

// Steps from the site document, next to a replica of Minecraft's own
// "Edit Server Info" screen (the one place the pixel font belongs).
function JoinSection({ section }) {
  const { settings } = useSite()
  const [edition, setEdition] = useState('java')
  const fill = (text) => fillSitePlaceholders(text, settings)

  return (
    <section className="section join" id="join">
      <div className="container join-grid">
        <div data-reveal ref={revealRef}>
          {section.kicker && <p className="label">{section.kicker}</p>}
          <h2 className="head">{section.title}</h2>
          {section.lead && <p className="join-intro">{fill(section.lead)}</p>}
          <ol className="steps">
            {section.steps.map((step, i) => (
              <li key={i}>
                <span className="num">{i + 1}</span>
                <div><b>{fill(step.title)}</b><p>{fill(step.text)}</p></div>
              </li>
            ))}
          </ol>
        </div>
        <div className="mc-screen" data-edition={edition} data-reveal data-delay="1" ref={revealRef}>
          <div className="mc-tabs" role="group" aria-label="Edition">
            <button className="mc-btn" type="button" aria-pressed={edition === 'java'} onClick={() => setEdition('java')}>Java</button>
            <button className="mc-btn" type="button" aria-pressed={edition === 'bedrock'} onClick={() => setEdition('bedrock')}>Bedrock</button>
          </div>
          <p className="mc-title">{edition === 'java' ? 'Edit Server Info' : 'Add Server'}</p>
          <p className="mc-label">Server Name</p>
          <div className="mc-field"><span>AlwiNation</span></div>
          <p className="mc-label">Server Address</p>
          <div className="mc-field">
            <span>{settings.serverAddress}</span>
            <button type="button" onClick={() => copyText(settings.serverAddress)}>Copy</button>
          </div>
          {edition === 'bedrock' && (
            <>
              <p className="mc-label">Port</p>
              <div className="mc-field">
                <span>{settings.bedrockPort}</span>
                <button type="button" onClick={() => copyText(String(settings.bedrockPort))}>Copy</button>
              </div>
            </>
          )}
          <div className="mc-row">
            <button className="mc-btn" type="button" onClick={() => copyText(settings.serverAddress)}>Done</button>
            <a className="mc-btn" href={settings.discordUrl} target="_blank" rel="noreferrer">Need help?</a>
          </div>
        </div>
      </div>
    </section>
  )
}

export default JoinSection
