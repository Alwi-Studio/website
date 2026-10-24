import { useEffect, useMemo, useState } from 'react'
import { formatCount, useDiscordCounts } from '../common/liveData.js'
import { SaveBar, TextField } from './SiteForm.jsx'
import { checkSite, useSiteDraft } from './siteDraft.js'

const invitePattern = /^[A-Za-z0-9-]{2,32}$/

const groups = [
  {
    legend: 'Server',
    fields: [
      { key: 'serverAddress', label: 'Server address', hint: 'The hostname players add in Minecraft.' },
      { key: 'bedrockPort', label: 'Bedrock port', type: 'number', min: 1, max: 65535 },
      { key: 'javaVersion', label: 'Java version', maxLength: 60, hint: 'Shown as the recommended version.' },
    ],
  },
  {
    legend: 'Links',
    fields: [
      { key: 'discordUrl', label: 'Discord URL' },
      { key: 'discordInviteCode', label: 'Discord invite code', hint: 'The code after discord.gg/, used for the live member count.' },
      { key: 'storeUrl', label: 'Store URL' },
      { key: 'statusUrl', label: 'Status page URL' },
      { key: 'youtubeUrl', label: 'YouTube URL' },
      { key: 'tiktokUrl', label: 'TikTok URL' },
    ],
  },
  {
    legend: 'Text',
    fields: [
      { key: 'tagline', label: 'Tagline', maxLength: 120, hint: 'Footer brand line.' },
      { key: 'footerBlurb', label: 'Footer blurb', maxLength: 400, multiline: true },
    ],
  },
]

// Keyed by invite code so a code that fails never shows the previous code's numbers.
function DiscordCount({ code }) {
  const { members, online } = useDiscordCounts(code)
  if (members === null && online === null) {
    return <p className="adm-hint">No numbers for <b>{code}</b> yet. If this stays empty, the invite code is probably wrong or expired.</p>
  }
  return (
    <p className="text-[15px] font-semibold">
      <span className="adm-live">{formatCount(online)} online</span>
      <span className="text-muted"> · {formatCount(members)} members</span>
    </p>
  )
}

function SettingsEditor({ ready, onStatus }) {
  const editor = useSiteDraft('settings', onStatus)
  const settings = editor.draft
  const stored = editor.site
  const code = settings.discordInviteCode
  const [previewCode, setPreviewCode] = useState(code)

  // Each field is checked against the stored document on its own, so every
  // field shows its own message rather than only the first error found.
  const errors = useMemo(() => {
    const result = {}
    for (const { fields } of groups) {
      for (const { key, label } of fields) {
        const check = checkSite({ ...stored, settings: { ...stored.settings, [key]: settings[key] } })
        // The schema names the key ("bedrockPort"); the field shows its label.
        if (!check.broken) result[key] = check.error.replace(key, label)
      }
    }
    return result
  }, [stored, settings])

  // Wait for typing to stop before asking Discord, which rate-limits per address.
  useEffect(() => {
    const timer = window.setTimeout(() => setPreviewCode(code), 600)
    return () => window.clearTimeout(timer)
  }, [code])

  if (!ready) return <p className="panel adm-pane text-muted">Loading the current site document…</p>

  const update = (key, value) => editor.setDraft((current) => ({ ...current, [key]: value }))

  return (
    <>
      <SaveBar editor={editor} ready={ready} viewHref="/" viewLabel="View site" />
      <div className="adm-panes two settings">
        <section className="panel adm-pane grid gap-5" aria-label="Site settings">
          {groups.map((group) => (
            <fieldset className="adm-fieldset" key={group.legend}>
              <legend>{group.legend}</legend>
              <div className="adm-grid2">
                {group.fields.map(({ key, ...field }) => (
                  <TextField
                    key={key}
                    className={field.multiline ? 'col-span-full' : ''}
                    value={settings[key]}
                    error={errors[key]}
                    spellCheck={key === 'tagline' || key === 'footerBlurb'}
                    onChange={(value) => update(key, value)}
                    {...field}
                  />
                ))}
              </div>
            </fieldset>
          ))}
        </section>
        <section className="panel adm-pane adm-preview adm-sticky grid gap-5" aria-label="Settings preview">
          <p className="label">Live preview</p>
          <div className="grid gap-2">
            <h2 className="text-[16px]">Discord</h2>
            {invitePattern.test(previewCode)
              ? <DiscordCount key={previewCode} code={previewCode} />
              : <p className="adm-hint">Enter a valid invite code to see the member count.</p>}
          </div>
          <div className="grid gap-2">
            <h2 className="text-[16px]">How players join</h2>
            <p className="text-[15px] text-[var(--ink-2)]">Java: <b>{settings.serverAddress}</b></p>
            <p className="text-[15px] text-[var(--ink-2)]">Bedrock: <b>{settings.serverAddress}</b>, port <b>{settings.bedrockPort}</b></p>
            <p className="text-[15px] text-[var(--ink-2)]">Recommended Java version: <b>{settings.javaVersion}</b></p>
          </div>
          <div className="grid gap-2">
            <h2 className="text-[16px]">Footer</h2>
            <p className="text-[15px] font-semibold">{settings.tagline}</p>
            <p className="text-[14px] text-muted">{settings.footerBlurb}</p>
          </div>
        </section>
      </div>
    </>
  )
}

export default SettingsEditor
