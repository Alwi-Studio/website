import { useEffect, useMemo, useState } from 'react'
import {
  deleteAdminNewsItem,
  isAdminSessionActive,
  loginAdmin,
  logoutAdmin,
  saveAdminNewsItem,
} from '../news/adminNewsStore.js'
import { RichInline, parseMarkdownBlocks } from '../common/RichText.jsx'
import { isSafeImageUrl } from '../common/safeUrls.js'
import { isPolicyCustomized, resetAdminPolicy, saveAdminPolicy } from '../content/policyStore.js'
import { isStaffCustomized, resetAdminStaff, saveAdminStaff } from '../content/staffStore.js'
import { isWikiCustomized } from '../content/wikiStore.js'
import WikiManager from './WikiManager.jsx'

const defaultForm = {
  title: '',
  slug: '',
  description: '',
  category: 'Announcement',
  date: '',
  author: 'AlwiNation Team',
  readingTime: '2 min read',
  imageUrl: '',
  bodyText: '',
  highlightsText: '',
}

const emptyPolicyForm = { eyebrow: '', title: '', updated: '', intro: '', sectionsText: '' }

const emptyStaffForm = { eyebrow: '', title: '', updated: '', intro: '', groupsText: '' }

const policyMeta = {
  rules: { label: 'Rules', heading: 'Server Rules', path: '/rules', fallbackEyebrow: 'Community Rules' },
  terms: { label: 'Terms', heading: 'Terms of Service', path: '/terms', fallbackEyebrow: 'Terms of Service' },
}

const staffMeta = { label: 'Staff', heading: 'Staff', path: '/staff', fallbackEyebrow: 'Meet the Team' }

const sharedArticleExamples = [
  {
    title: 'Inline text',
    description: 'Works inside rich text fields such as news body, wiki body, rules descriptions, terms descriptions, and staff notes.',
    code: '**bold**\n*italic*\n__underline__\n~~strike~~\n`inline code`\n[link text](https://alwination.id)\n||spoiler text||',
  },
  {
    title: 'Headings',
    description: 'Use headings to split news and wiki articles into readable sections.',
    code: '# Main section\n## Subsection\n### Small heading',
  },
  {
    title: 'Lists',
    description: 'Use one list item per line. Both dash and asterisk bullets are supported.',
    code: '- First point\n- Second point\n* Third point',
  },
  {
    title: 'Quotes',
    description: 'Use quote blocks for important notes or quoted statements.',
    code: '> The server update is planned for this weekend.\n> Keep an eye on Discord for the exact time.\n> -- AlwiNation Team',
  },
  {
    title: 'Code blocks',
    description: 'Use fenced code blocks for commands, config snippets, or examples that should keep spacing.',
    code: '```yaml\nserver: alwination\nmode: survival\n```',
  },
  {
    title: 'Callouts',
    description: 'Use callouts for highlighted article notes. Supported in news and wiki article bodies.',
    code: ':::callout Database note\nThis structure is ready to connect to a database later.\n:::',
  },
  {
    title: 'Stats',
    description: 'Use stats for short label/value cards. Each stat line must use Label: Value. Supported in news and wiki article bodies.',
    code: ':::stats\nNews pages: 3\nPost fields: 10+\nDatabase-ready: Yes\n:::',
  },
  {
    title: 'Article images',
    description: 'Put an image on its own line in a news or wiki article body. Add optional caption text after the URL.',
    code: '![Spawn preview](https://example.com/spawn.webp) Optional caption text',
  },
]

const formattingExamples = [
  {
    title: 'News body',
    description: 'Use the shared article syntax in the Body field. Highlights are separate: one highlight per line.',
    code: '# Update title\nShort intro paragraph with **bold** text.\n\n![Update preview](https://example.com/news-image.webp) Preview caption\n\n:::callout Important\nRestart your launcher before joining.\n:::\n\n:::stats\nPlayers online: 120\nVersion: 1.21.11\n:::\n\n- Added new rewards\n- Fixed spawn protection',
  },
  {
    title: 'News highlights',
    description: 'Highlights are not markdown blocks. Put each short highlight on its own line.',
    code: 'Dedicated article page\nCustom image and metadata\nReady for database content',
  },
  {
    title: 'News image URL',
    description: 'Use a direct image URL that starts with http:// or https://. Direct .avif or .webp images are preferred.',
    code: 'https://example.com/news-image.webp',
  },
]

const wikiFormattingExamples = [
  {
    title: 'Wiki page details',
    description: 'The page title, intro, and updated fields are plain text fields. Categories group articles on /wiki.',
    code: 'Eyebrow: Server Wiki\nTitle: AlwiNation Wiki\nIntro: Guides for every realm, command, and feature.\nUpdated: July 7, 2026',
  },
  {
    title: 'Wiki categories',
    description: 'Each category needs a name. Icon is optional and can be an emoji. Category descriptions support plain text.',
    code: 'Icon: 🌍\nName: Survival\nDescription: Land claiming, economy, homes, and server basics.',
  },
  {
    title: 'Wiki article body',
    description: 'Use the shared article syntax. Callouts and stats work here too because wiki uses the same MarkdownBody renderer.',
    code: '# Claiming land\nUse `/claim` to protect your base.\n\n![Claim example](https://example.com/claim-guide.webp) Claim area example\n\n:::callout Tip\nStand inside your build before creating a claim.\n:::\n\n:::stats\nClaim blocks: Earned by playtime\nProtection: Enabled\n:::',
  },
]

const policyFormattingExamples = [
  {
    title: 'Rules sections',
    description: 'Rules use sections and subsections so the public page can build the table of contents. Use # for sections and ## for subsections.',
    code: '# General rules\nFollow staff instructions and keep the server fair.\n- No cheating or unfair clients\n- No harassment or hate speech\n\n## Chat rules\nKeep chat readable and respectful.\n- No spam\n- No impersonation',
  },
  {
    title: 'Terms sections',
    description: 'Terms use the same structure as rules. Inline formatting works in titles, descriptions, and bullet items.',
    code: '# Account responsibility\nYou are responsible for activity on your account.\n- Keep your login secure\n- Report unauthorized access quickly\n\n## Purchases\nStore purchases are subject to the posted store terms.\n- Chargebacks may restrict access',
  },
  {
    title: 'Policy inline formatting',
    description: 'Rules and terms do not support callout or stats blocks. Use inline formatting inside section text and bullets.',
    code: '# Appeals\nSubmit appeals through [Discord](https://discord.alwination.id).\n- Include your username\n- Explain what happened with **clear details**',
  },
]

const staffFormattingExamples = [
  {
    title: 'Staff groups',
    description: 'Staff uses groups and pipe-separated members instead of article markdown.',
    code: '# Admins\nJessen | Owner | Handles server direction\nAlex | Moderator | Helps with player reports\n\n# Builders\nSam | Builder',
  },
  {
    title: 'Staff member notes',
    description: 'The note field supports inline formatting. Role and note are optional, but keep the pipe separators when adding a note.',
    code: '# Moderators\nAlya | Senior Mod | Handles **appeals** and chat reports\nRafi | Helper\nNina',
  },
]

const editingNotes = [
  {
    title: 'Editing existing news posts',
    description: 'When you click Edit on a saved news post, the editor should restore structured blocks back into editable syntax.',
    code: '# Heading stays a heading\n\n- List item stays a list item\n\n> Quote text\n> -- Quote author\n\n:::callout Title\nCallout text\n:::\n\n:::stats\nLabel: Value\n:::',
  },
  {
    title: 'If formatting disappears',
    description: 'If a block comes back as plain text, re-add the marker before saving: # for headings, - for lists, > for quotes, or the ::: fenced block for callouts/stats.',
    code: '# Heading\n- List item\n> Quote\n:::callout Title\nText\n:::',
  },
]

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function createBodyBlocks(bodyText) {
  return parseMarkdownBlocks(bodyText)
}

function getBlockText(block) {
  if (typeof block === 'string') {
    return block
  }

  if (block.type === 'heading') {
    return `${'#'.repeat(Math.min(Math.max(block.level ?? 2, 1), 3))} ${block.text ?? ''}`.trim()
  }

  if (block.type === 'list') {
    return block.items.map((item) => `- ${item}`).join('\n')
  }

  if (block.type === 'quote') {
    const quoteLines = String(block.text ?? '')
      .split('\n')
      .map((line) => `> ${line}`)
    if (block.cite) {
      quoteLines.push(`> -- ${block.cite}`)
    }
    return quoteLines.join('\n')
  }

  if (block.type === 'callout') {
    return [`:::callout ${block.title ?? ''}`.trim(), block.text, ':::'].filter(Boolean).join('\n')
  }

  if (block.type === 'stats') {
    return [':::stats', ...block.items.map((item) => `${item.label}: ${item.value}`), ':::'].join('\n')
  }

  if (block.type === 'image') {
    const alt = block.alt ?? ''
    const src = block.src ?? ''
    const caption = block.caption ? ` ${block.caption}` : ''
    return src ? `![${alt}](${src})${caption}` : ''
  }

  return block.text ?? ''
}

function getBodyText(body) {
  return body.map(getBlockText).filter(Boolean).join('\n\n')
}

function getDateInputValue(item) {
  if (item.dateValue) {
    return item.dateValue
  }

  const date = new Date(item.date)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return date.toISOString().slice(0, 10)
}

function formatDisplayDate(value) {
  if (!value) {
    return new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const date = new Date(`${value}T00:00:00`)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function getImageUrlError(value) {
  const imageUrl = value.trim()

  if (!imageUrl) {
    return ''
  }

  let url

  try {
    url = new URL(imageUrl)
  } catch {
    return 'Image URL must be a valid URL.'
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return 'Image URL must start with http:// or https://.'
  }

  const host = url.hostname.toLowerCase()
  const path = url.pathname.toLowerCase()

  if (host === 'imgur.com' || host.endsWith('.imgur.com')) {
    const isDirectImgurImage =
      host === 'i.imgur.com' && /\.(avif|gif|jpe?g|png|webp)$/i.test(url.pathname)

    if (!isDirectImgurImage) {
      return 'Imgur album/page links cannot be used as images. Use the direct i.imgur.com image URL that ends in .jpg, .png, .gif, or .webp.'
    }
  }

  if (path.includes('/a/') || path.includes('/gallery/')) {
    return 'Album/gallery links cannot be used as images. Use a direct image file URL instead.'
  }

  return ''
}

// Convert stored policy sections into the editable mini-syntax used in the textarea.
function sectionsToText(sections = []) {
  return sections
    .map((section) => {
      const lines = [`# ${section.title}`]
      if (section.description) {
        lines.push(section.description)
      }
      if (Array.isArray(section.items)) {
        section.items.forEach((item) => lines.push(`- ${item}`))
      }
      if (Array.isArray(section.subsections)) {
        section.subsections.forEach((subsection) => {
          lines.push(`## ${subsection.title}`)
          if (subsection.description) {
            lines.push(subsection.description)
          }
          if (Array.isArray(subsection.items)) {
            subsection.items.forEach((item) => lines.push(`- ${item}`))
          }
        })
      }
      return lines.join('\n')
    })
    .join('\n\n')
}

// Parse the editable mini-syntax back into structured policy sections.
// "# Title" starts a section, "## Title" starts a subsection, "- item" adds a bullet.
function parseSections(text) {
  const sections = []
  let current = null
  let currentSubsection = null

  function ensureSection() {
    if (!current) {
      current = { title: 'Section', description: '', items: [], subsections: [] }
      sections.push(current)
    }
  }

  function currentTarget() {
    ensureSection()
    return currentSubsection ?? current
  }

  for (const rawLine of text.split('\n')) {
    const trimmed = rawLine.trim()
    if (!trimmed) {
      continue
    }

    if (trimmed.startsWith('# ')) {
      current = { title: trimmed.slice(2).trim() || 'Section', description: '', items: [], subsections: [] }
      sections.push(current)
      currentSubsection = null
    } else if (trimmed.startsWith('## ')) {
      ensureSection()
      currentSubsection = { title: trimmed.slice(3).trim() || 'Subsection', description: '', items: [] }
      current.subsections.push(currentSubsection)
    } else if (trimmed.startsWith('- ')) {
      currentTarget().items.push(trimmed.slice(2).trim())
    } else {
      const target = currentTarget()
      target.description = target.description ? `${target.description} ${trimmed}` : trimmed
    }
  }

  return sections
    .map((section) => ({
      title: section.title,
      ...(section.description ? { description: section.description } : {}),
      ...(section.items.length ? { items: section.items } : {}),
      ...(section.subsections.length
        ? {
            subsections: section.subsections
              .map((subsection) => ({
                title: subsection.title,
                ...(subsection.description ? { description: subsection.description } : {}),
                ...(subsection.items.length ? { items: subsection.items } : {}),
              }))
              .filter((subsection) => subsection.description || (subsection.items && subsection.items.length)),
          }
        : {}),
    }))
    .filter(
      (section) =>
        section.description ||
        (section.items && section.items.length) ||
        (section.subsections && section.subsections.length),
    )
}

function policyToForm(policy) {
  if (!policy) {
    return emptyPolicyForm
  }
  return {
    eyebrow: policy.eyebrow ?? '',
    title: policy.title ?? '',
    updated: policy.updated ?? '',
    intro: policy.intro ?? '',
    sectionsText: sectionsToText(policy.sections),
  }
}

// Convert stored staff groups into the editable mini-syntax used in the textarea.
function groupsToText(groups = []) {
  return groups
    .map((group) => {
      const lines = [`# ${group.name}`]
      const members = group.members ?? []
      members.forEach((member) => {
        const parts = [member.name]
        if (member.role || member.note) {
          parts.push(member.role ?? '')
        }
        if (member.note) {
          parts.push(member.note)
        }
        lines.push(parts.join(' | '))
      })
      return lines.join('\n')
    })
    .join('\n\n')
}

// Parse the editable mini-syntax back into structured staff groups.
// "# Group" starts a group; each other line is "Name | Role | note".
function parseGroups(text) {
  const groups = []
  let current = null

  function ensureGroup() {
    if (!current) {
      current = { name: 'Team', members: [] }
      groups.push(current)
    }
  }

  for (const rawLine of text.split('\n')) {
    const trimmed = rawLine.trim()
    if (!trimmed) {
      continue
    }

    if (trimmed.startsWith('# ')) {
      current = { name: trimmed.slice(2).trim() || 'Team', members: [] }
      groups.push(current)
    } else {
      ensureGroup()
      const parts = trimmed.split('|').map((part) => part.trim())
      const name = parts[0]
      if (!name) {
        continue
      }
      const member = { name }
      if (parts[1]) {
        member.role = parts[1]
      }
      const note = parts.slice(2).join(' | ')
      if (note) {
        member.note = note
      }
      current.members.push(member)
    }
  }

  return groups
    .map((group) => ({ name: group.name, members: group.members }))
    .filter((group) => group.members.length > 0)
}

function staffToForm(staff) {
  if (!staff) {
    return emptyStaffForm
  }
  return {
    eyebrow: staff.eyebrow ?? '',
    title: staff.title ?? '',
    updated: staff.updated ?? '',
    intro: staff.intro ?? '',
    groupsText: groupsToText(staff.groups),
  }
}

const inputClass =
  'min-h-11 rounded-xl border border-white/10 bg-surface-2 px-3 text-white outline-none transition focus:border-brand'
const textareaClass =
  'rounded-xl border border-white/10 bg-surface-2 px-3 py-3 text-white outline-none transition focus:border-brand'
const labelClass = 'grid gap-2 text-sm font-semibold text-zinc-300'
const primaryButtonClass =
  'inline-flex items-center justify-center rounded-xl bg-gradient-to-b from-brand-2 to-brand px-5 text-sm font-bold text-[#1a0d07] transition hover:brightness-105'
const secondaryButtonClass =
  'inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/[0.04] px-5 text-sm font-semibold text-zinc-200 transition hover:border-white/25 hover:text-white'

function PreviewShell({ children }) {
  return (
    <div className="mt-6 rounded-xl border border-white/10 bg-bg-2/50 p-5">
      <p className="mb-4 text-xs font-bold uppercase tracking-[0.14em] text-muted-2">Live preview</p>
      {children}
    </div>
  )
}

function PreviewEmpty({ children = 'Start typing to see a preview.' }) {
  return <p className="text-sm text-muted">{children}</p>
}

function PreviewArticleBlock({ block }) {
  if (typeof block === 'string') {
    return <p><RichInline text={block} /></p>
  }

  if (block.type === 'lead') {
    return <p className="text-base font-semibold leading-7 text-zinc-100"><RichInline text={block.text} /></p>
  }

  if (block.type === 'heading') {
    const HeadingTag = block.level === 3 ? 'h4' : 'h3'
    return (
      <HeadingTag className={`${block.level === 3 ? 'text-base' : 'text-lg'} pt-2 font-bold leading-tight text-white`}>
        <RichInline text={block.text} />
      </HeadingTag>
    )
  }

  if (block.type === 'list') {
    return (
      <ul className="grid gap-2 p-0">
        {block.items.map((item) => (
          <li className="flex items-start gap-3 text-sm leading-6 text-muted" key={item}>
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-2" />
            <span><RichInline text={item} /></span>
          </li>
        ))}
      </ul>
    )
  }

  if (block.type === 'quote') {
    return (
      <figure className="border-l-4 border-[#ff5732] bg-[#202020] px-5 py-4">
        <blockquote className="whitespace-pre-line text-lg font-semibold leading-8 text-white">
          <RichInline text={block.text} />
        </blockquote>
        {block.cite && <figcaption className="mt-3 text-sm text-zinc-400">{block.cite}</figcaption>}
      </figure>
    )
  }

  if (block.type === 'code') {
    return (
      <pre className="overflow-x-auto rounded-lg border border-white/10 bg-black/35 p-4 text-xs leading-6 text-zinc-200">
        <code>{block.text}</code>
      </pre>
    )
  }

  if (block.type === 'stats') {
    return (
      <div className="grid gap-3 sm:grid-cols-3">
        {block.items.map((item) => (
          <div className="rounded-lg border border-white/10 bg-surface-2 p-4" key={item.label}>
            <p className="text-xl font-bold leading-tight text-white">{item.value}</p>
            <p className="mt-1 text-xs font-semibold text-muted">{item.label}</p>
          </div>
        ))}
      </div>
    )
  }

  if (block.type === 'callout') {
    return (
      <div className="rounded-lg border border-[#ff5732]/60 bg-[#2a1d19] p-5">
        <h4 className="text-lg font-bold text-white"><RichInline text={block.title} /></h4>
        <p className="mt-3 text-sm leading-7 text-zinc-200"><RichInline text={block.text} /></p>
      </div>
    )
  }

  if (block.type === 'image') {
    if (!isSafeImageUrl(block.src)) {
      return null
    }

    return (
      <figure className="overflow-hidden rounded-lg border border-white/10 bg-bg-2">
        <img className="h-auto max-h-[360px] w-full object-cover" src={block.src} alt={block.alt} loading="lazy" decoding="async" />
        {block.caption && (
          <figcaption className="border-t border-white/10 px-4 py-3 text-xs leading-5 text-muted">
            <RichInline text={block.caption} />
          </figcaption>
        )}
      </figure>
    )
  }

  return <p><RichInline text={block.text} /></p>
}

function NewsLivePreview({ item }) {
  const hasContent = item.title || item.description || item.body.length > 0 || item.highlights.length > 0

  return (
    <PreviewShell>
      {!hasContent ? (
        <PreviewEmpty />
      ) : (
        <article className="overflow-hidden rounded-xl border border-white/10 bg-surface">
          {item.img ? (
            <div className="relative aspect-video bg-bg">
              <img className="h-full w-full object-cover" src={item.img} alt="" loading="lazy" />
            </div>
          ) : null}
          <div className="p-5">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-brand-2">
              <span>{item.category || 'Announcement'}</span>
              <span className="h-1 w-1 rounded-full bg-muted-2" />
              <span>{item.date}</span>
              <span className="h-1 w-1 rounded-full bg-muted-2" />
              <span>{item.readingTime || '2 min read'}</span>
            </div>
            <h3 className="mt-3 text-2xl font-bold leading-tight text-white">{item.title || 'Untitled news post'}</h3>
            {item.description && (
              <p className="mt-3 text-sm leading-7 text-muted"><RichInline text={item.description} /></p>
            )}
            <p className="mt-3 text-xs font-semibold text-muted">By {item.author || 'AlwiNation Team'}</p>

            {item.body.length > 0 && (
              <div className="mt-5 grid gap-4 text-sm leading-7 text-muted">
                {item.body.map((block, index) => (
                  <PreviewArticleBlock block={block} key={`${typeof block === 'string' ? block : block.type}-${index}`} />
                ))}
              </div>
            )}

            {item.highlights.length > 0 && (
              <div className="mt-5 rounded-lg border border-white/10 bg-bg-2 p-4">
                <h4 className="text-xs font-bold uppercase tracking-[0.14em] text-brand-2">Highlights</h4>
                <ul className="mt-3 grid gap-2 p-0">
                  {item.highlights.map((highlight) => (
                    <li className="flex items-start gap-3 text-sm leading-6 text-muted" key={highlight}>
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-2" />
                      <span><RichInline text={highlight} /></span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </article>
      )}
    </PreviewShell>
  )
}

function PolicyLivePreview({ policy, activeKey }) {
  return (
    <PreviewShell>
      {!policy.title && !policy.intro && policy.sections.length === 0 ? (
        <PreviewEmpty />
      ) : (
        <article className="grid gap-4">
          <div className="rounded-xl border border-white/10 bg-surface p-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="eyebrow">{policy.eyebrow}</span>
              <span className="rounded-full border border-white/10 bg-bg-2 px-3 py-1 text-xs font-semibold text-muted">
                {policy.sections.length} sections
              </span>
            </div>
            <h3 className="mt-3 text-2xl font-bold leading-tight text-white">{policy.title || 'Untitled page'}</h3>
            {policy.intro && <p className="mt-3 text-sm leading-7 text-muted"><RichInline text={policy.intro} /></p>}
            <p className="mt-4 text-xs font-semibold text-muted">Last updated {policy.updated}</p>
          </div>

          {policy.sections.map((section, index) => (
            <section className="rounded-xl border border-white/10 bg-surface p-5" key={`${section.title}-${index}`}>
              <div className="flex items-start gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand/12 text-xs font-bold text-brand-2">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <h4 className="font-bold leading-tight text-white"><RichInline text={section.title} /></h4>
                  {section.description && <p className="mt-2 text-sm leading-7 text-muted"><RichInline text={section.description} /></p>}
                  {section.items?.length > 0 && (
                    <ul className="mt-3 grid gap-2 p-0">
                      {section.items.map((item) => (
                        <li className="flex items-start gap-3 text-sm leading-6 text-muted" key={item}>
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-2" />
                          <span><RichInline text={item} /></span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {section.subsections?.length > 0 && (
                    <div className="mt-4 grid gap-3">
                      {section.subsections.map((subsection) => (
                        <section className="rounded-lg border border-white/10 bg-bg-2/50 p-4" key={subsection.title}>
                          <h5 className="text-sm font-bold text-white"><RichInline text={subsection.title} /></h5>
                          {subsection.description && <p className="mt-2 text-sm leading-6 text-muted"><RichInline text={subsection.description} /></p>}
                          {subsection.items?.length > 0 && (
                            <ul className="mt-3 grid gap-2 p-0">
                              {subsection.items.map((item) => (
                                <li className="flex items-start gap-3 text-sm leading-6 text-muted" key={item}>
                                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-2" />
                                  <span><RichInline text={item} /></span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </section>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>
          ))}

          <div className="rounded-xl border border-brand/25 bg-brand/[0.06] p-5">
            <h4 className="font-bold text-white">Questions about the {activeKey === 'rules' ? 'rules' : 'terms'}?</h4>
            <p className="mt-2 text-sm leading-6 text-muted">Reach out to the staff team for clarifications, appeals, or reports.</p>
          </div>
        </article>
      )}
    </PreviewShell>
  )
}

function StaffLivePreview({ staff }) {
  const totalMembers = staff.groups.reduce((sum, group) => sum + group.members.length, 0)

  return (
    <PreviewShell>
      {!staff.title && !staff.intro && staff.groups.length === 0 ? (
        <PreviewEmpty />
      ) : (
        <article className="grid gap-4">
          <div className="rounded-xl border border-white/10 bg-surface p-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="eyebrow">{staff.eyebrow}</span>
              <span className="rounded-full border border-white/10 bg-bg-2 px-3 py-1 text-xs font-semibold text-muted">
                {totalMembers} member{totalMembers === 1 ? '' : 's'}
              </span>
            </div>
            <h3 className="mt-3 text-2xl font-bold leading-tight text-white">{staff.title || 'Untitled staff page'}</h3>
            {staff.intro && <p className="mt-3 text-sm leading-7 text-muted"><RichInline text={staff.intro} /></p>}
            <p className="mt-4 text-xs font-semibold text-muted">Last updated {staff.updated}</p>
          </div>

          {staff.groups.map((group) => (
            <section key={group.name}>
              <div className="flex items-center gap-3">
                <h4 className="font-bold tracking-tight text-white">{group.name}</h4>
                <span className="rounded-full border border-white/10 bg-bg-2 px-2.5 py-0.5 text-xs font-semibold text-muted">
                  {group.members.length}
                </span>
                <span className="h-px flex-1 bg-white/10" aria-hidden="true" />
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {group.members.map((member) => (
                  <article className="flex items-start gap-3 rounded-xl border border-white/10 bg-surface p-4" key={`${group.name}-${member.name}`}>
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-gradient-to-b from-brand-2 to-brand text-sm font-bold text-[#1a0d07]">
                      {String(member.name || '?').slice(0, 2).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <h5 className="truncate font-bold leading-tight text-white">{member.name}</h5>
                      {member.role && <p className="mt-0.5 text-sm font-semibold text-brand-2">{member.role}</p>}
                      {member.note && <p className="mt-2 text-sm leading-6 text-muted"><RichInline text={member.note} /></p>}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </article>
      )}
    </PreviewShell>
  )
}

function FormattingDocs() {
  const docsSections = [
    {
      id: 'shared-formatting',
      title: 'Shared rich text syntax',
      description: 'These blocks are used by news and wiki article bodies. Inline formatting also works in policy descriptions, policy bullets, and staff notes.',
      examples: sharedArticleExamples,
    },
    {
      id: 'news-formatting',
      title: 'News editor',
      description: 'News has article metadata, a body field using the shared rich text syntax, and a separate highlights field.',
      examples: formattingExamples,
    },
    {
      id: 'wiki-formatting',
      title: 'Wiki editor',
      description: 'Wiki content is organized as page details, categories, and articles. Article bodies use the shared rich text syntax.',
      examples: wikiFormattingExamples,
    },
    {
      id: 'policy-formatting',
      title: 'Rules and terms editors',
      description: 'Rules and terms use structured sections so the public pages can generate table of contents navigation.',
      examples: policyFormattingExamples,
    },
    {
      id: 'staff-formatting',
      title: 'Staff editor',
      description: 'Staff uses groups and pipe-separated member rows. Member notes support inline rich text.',
      examples: staffFormattingExamples,
    },
    {
      id: 'editing-notes',
      title: 'Editing existing content',
      description: 'These notes explain what should happen when saved content is opened again in an admin editor.',
      examples: editingNotes,
    },
  ]

  return (
    <div className="mt-8 grid gap-6">
      <section className="rounded-2xl border border-white/10 bg-surface p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-2">Formatting Docs</p>
        <h2 className="mt-3 text-2xl font-bold leading-tight text-white">Editor formatting guide</h2>
        <p className="mt-3 max-w-[74ch] text-sm leading-7 text-muted">
          These formats are used by the admin editors and live previews. Each editable page type has its own section below.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <a className={`${secondaryButtonClass} min-h-10`} href="/admin">
            Back to admin
          </a>
          {docsSections.map((section) => (
            <a className={`${secondaryButtonClass} min-h-10`} href={`#${section.id}`} key={section.id}>
              {section.title}
            </a>
          ))}
        </div>
      </section>

      {docsSections.map((section) => (
        <section id={section.id} className="scroll-mt-28 rounded-2xl border border-white/10 bg-surface p-6" key={section.id}>
          <h3 className="text-xl font-bold text-white">{section.title}</h3>
          <p className="mt-2 text-sm leading-7 text-muted">{section.description}</p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {section.examples.map((example) => (
              <article className="rounded-xl border border-white/10 bg-bg-2 p-4" key={example.title}>
                <h4 className="font-bold text-white">{example.title}</h4>
                <p className="mt-2 text-sm leading-6 text-muted">{example.description}</p>
                <pre className="mt-4 overflow-x-auto rounded-lg border border-white/10 bg-black/35 p-4 text-xs leading-6 text-brand-2">
                  <code>{example.code}</code>
                </pre>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

function AdminPanel({ newsItems, onNewsChange, policies, onPoliciesChange, staff, onStaffChange, wiki, onWikiChange, initialTab = 'news' }) {
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loginForm, setLoginForm] = useState({ username: '', password: '' })
  const [loginError, setLoginError] = useState('')
  const [activeTab, setActiveTab] = useState(initialTab)
  const [form, setForm] = useState(defaultForm)
  const [saveMessage, setSaveMessage] = useState('')
  const [isSavingNews, setIsSavingNews] = useState(false)
  const [newsSaveState, setNewsSaveState] = useState('idle')
  const [editingSlug, setEditingSlug] = useState('')
  const [policyForm, setPolicyForm] = useState(emptyPolicyForm)
  const [policyMessage, setPolicyMessage] = useState('')
  const [isSavingPolicy, setIsSavingPolicy] = useState(false)
  const [policySaveState, setPolicySaveState] = useState('idle')
  const [staffForm, setStaffForm] = useState(emptyStaffForm)
  const [staffMessage, setStaffMessage] = useState('')
  const [isSavingStaff, setIsSavingStaff] = useState(false)
  const [staffSaveState, setStaffSaveState] = useState('idle')

  const editablePosts = useMemo(() => newsItems, [newsItems])
  const isPolicyTab = activeTab === 'rules' || activeTab === 'terms'
  const parsedSectionCount = useMemo(
    () => (isPolicyTab ? parseSections(policyForm.sectionsText).length : 0),
    [isPolicyTab, policyForm.sectionsText],
  )
  const isStaffTab = activeTab === 'staff'
  const parsedMemberCount = useMemo(
    () =>
      isStaffTab
        ? parseGroups(staffForm.groupsText).reduce((sum, group) => sum + group.members.length, 0)
        : 0,
    [isStaffTab, staffForm.groupsText],
  )
  const newsPreview = useMemo(
    () => ({
      slug: editingSlug || slugify(form.title),
      img: form.imageUrl.trim(),
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category.trim() || 'Announcement',
      date: formatDisplayDate(form.date),
      author: form.author.trim() || 'AlwiNation Team',
      readingTime: form.readingTime.trim() || '2 min read',
      body: createBodyBlocks(form.bodyText),
      highlights: form.highlightsText
        .split('\n')
        .map((highlight) => highlight.trim())
        .filter(Boolean),
    }),
    [editingSlug, form],
  )
  const policyPreview = useMemo(() => {
    const meta = isPolicyTab ? policyMeta[activeTab] : policyMeta.rules
    return {
      eyebrow: policyForm.eyebrow.trim() || meta.fallbackEyebrow,
      title: policyForm.title.trim(),
      intro: policyForm.intro.trim(),
      updated: policyForm.updated.trim() || formatDisplayDate(''),
      sections: parseSections(policyForm.sectionsText),
    }
  }, [activeTab, isPolicyTab, policyForm])
  const staffPreview = useMemo(
    () => ({
      eyebrow: staffForm.eyebrow.trim() || staffMeta.fallbackEyebrow,
      title: staffForm.title.trim(),
      intro: staffForm.intro.trim(),
      updated: staffForm.updated.trim() || formatDisplayDate(''),
      groups: parseGroups(staffForm.groupsText),
    }),
    [staffForm],
  )

  useEffect(() => {
    let isCurrent = true

    async function checkSession() {
      const active = await isAdminSessionActive()

      if (isCurrent) {
        setIsLoggedIn(active)
        setIsCheckingSession(false)
      }
    }

    checkSession()

    return () => {
      isCurrent = false
    }
  }, [])

  // Load the selected policy into the editor whenever the tab or source data changes.
  useEffect(() => {
    if (!isPolicyTab) {
      return
    }
    setPolicyForm(policyToForm(policies?.[activeTab]))
    setPolicyMessage('')
  }, [activeTab, isPolicyTab, policies])

  useEffect(() => {
    if (!isStaffTab) {
      return
    }
    setStaffForm(staffToForm(staff))
    setStaffMessage('')
  }, [isStaffTab, staff])

  function updateField(field, value) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
      slug: field === 'title' && !editingSlug ? slugify(value) : currentForm.slug,
    }))
  }

  function updatePolicyField(field, value) {
    setPolicyForm((currentForm) => ({ ...currentForm, [field]: value }))
  }

  async function handleLogin(event) {
    event.preventDefault()
    setLoginError('')

    try {
      await loginAdmin(loginForm.username, loginForm.password)
      setLoginForm({ username: '', password: '' })
      setIsLoggedIn(true)
    } catch (error) {
      setLoginError(error.message)
    }
  }

  async function handleLogout() {
    await logoutAdmin()
    setIsLoggedIn(false)
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const slug = editingSlug || slugify(form.title)
    const body = createBodyBlocks(form.bodyText)

    if (!form.title.trim() || !slug || !form.description.trim() || body.length === 0) {
      setSaveMessage('Title, slug, description, and body are required.')
      return
    }

    const imageUrlError = getImageUrlError(form.imageUrl)

    if (imageUrlError) {
      setSaveMessage(imageUrlError)
      return
    }

    const item = {
      id: `admin-${slug}`,
      slug,
      img: form.imageUrl.trim(),
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category.trim() || 'Announcement',
      date: formatDisplayDate(form.date),
      dateValue: form.date,
      author: form.author.trim() || 'AlwiNation Team',
      readingTime: form.readingTime.trim() || '2 min read',
      featured: false,
      body,
      highlights: form.highlightsText
        .split('\n')
        .map((highlight) => highlight.trim())
        .filter(Boolean),
      source: 'admin',
    }

    try {
      setIsSavingNews(true)
      setNewsSaveState('saving')
      const nextNewsItems = await saveAdminNewsItem(item)
      onNewsChange(nextNewsItems)
      setForm(defaultForm)
      setEditingSlug('')
      setSaveMessage(`Saved "${item.title}".`)
      setNewsSaveState('saved')
      window.setTimeout(() => setNewsSaveState('idle'), 1800)
    } catch (error) {
      setSaveMessage(error.message)
      setNewsSaveState('idle')
    } finally {
      setIsSavingNews(false)
    }
  }

  function handleEdit(item) {
    if (item.deleted) {
      setSaveMessage('Deleted posts cannot be edited. Create a new post with a different title.')
      return
    }

    setForm({
      title: item.title,
      slug: item.slug,
      description: item.description,
      category: item.category,
      date: getDateInputValue(item),
      author: item.author,
      readingTime: item.readingTime,
      imageUrl: typeof item.img === 'string' && item.img.startsWith('http') ? item.img : '',
      bodyText: getBodyText(item.body),
      highlightsText: item.highlights.join('\n'),
    })
    setEditingSlug(item.slug)
    setSaveMessage(`Editing "${item.title}". Saving creates a local override.`)
  }

  function handleCancelEdit() {
    setForm(defaultForm)
    setEditingSlug('')
    setSaveMessage('')
  }

  async function handleDelete(slug) {
    try {
      const nextNewsItems = await deleteAdminNewsItem(slug)
      onNewsChange(nextNewsItems)
      if (editingSlug === slug) {
        handleCancelEdit()
      }
      setSaveMessage('Deleted or hidden news post.')
    } catch (error) {
      setSaveMessage(error.message)
    }
  }

  async function handlePolicySubmit(event) {
    event.preventDefault()

    const meta = policyMeta[activeTab]
    const sections = parseSections(policyForm.sectionsText)

    if (!policyForm.title.trim() || !policyForm.intro.trim() || sections.length === 0) {
      setPolicyMessage('Title, intro, and at least one section are required.')
      return
    }

    const policy = {
      eyebrow: policyForm.eyebrow.trim() || meta.fallbackEyebrow,
      title: policyForm.title.trim(),
      intro: policyForm.intro.trim(),
      updated: policyForm.updated.trim() || formatDisplayDate(''),
      sections,
    }

    try {
      setIsSavingPolicy(true)
      setPolicySaveState('saving')
      const nextPolicies = await saveAdminPolicy(activeTab, policy)
      onPoliciesChange(nextPolicies)
      setPolicyForm(policyToForm(nextPolicies[activeTab]))
      setPolicyMessage(`Saved the ${meta.label} page.`)
      setPolicySaveState('saved')
      window.setTimeout(() => setPolicySaveState('idle'), 1800)
    } catch (error) {
      setPolicyMessage(error.message)
      setPolicySaveState('idle')
    } finally {
      setIsSavingPolicy(false)
    }
  }

  async function handlePolicyReset() {
    const meta = policyMeta[activeTab]
    try {
      const nextPolicies = await resetAdminPolicy(activeTab)
      onPoliciesChange(nextPolicies)
      setPolicyForm(policyToForm(nextPolicies[activeTab]))
      setPolicyMessage(`Restored the default ${meta.label} content.`)
    } catch (error) {
      setPolicyMessage(error.message)
    }
  }

  if (isCheckingSession) {
    return (
      <main className="min-h-svh bg-bg px-5 pb-16 pt-36 text-white sm:px-8 lg:px-12">
        <section className="mx-auto max-w-md rounded-2xl border border-white/10 bg-surface p-6">
          <p className="text-sm font-semibold text-zinc-300">Checking admin session...</p>
        </section>
      </main>
    )
  }

  if (!isLoggedIn) {
    return (
      <main className="min-h-svh bg-bg px-5 pb-16 pt-36 text-white sm:px-8 lg:px-12">
        <section className="mx-auto max-w-md rounded-2xl border border-white/10 bg-surface p-6 shadow-[0_18px_45px_rgba(0,0,0,0.35)]">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-2">Admin</p>
          <h1 className="mt-3 text-3xl font-bold leading-tight text-white">Admin Login</h1>
          <p className="mt-3 text-sm leading-6 text-muted">
            Credentials are verified by the server and stored in an HttpOnly session cookie.
          </p>

          <form className="mt-6 grid gap-4" onSubmit={handleLogin}>
            <label className={labelClass}>
              Username
              <input
                className={inputClass}
                value={loginForm.username}
                onChange={(event) =>
                  setLoginForm((currentForm) => ({ ...currentForm, username: event.target.value }))
                }
              />
            </label>
            <label className={labelClass}>
              Password
              <input
                className={inputClass}
                type="password"
                value={loginForm.password}
                onChange={(event) =>
                  setLoginForm((currentForm) => ({ ...currentForm, password: event.target.value }))
                }
              />
            </label>
            {loginError && <p className="text-sm font-semibold text-red-400">{loginError}</p>}
            <button className={`${primaryButtonClass} min-h-11`} type="submit">
              Log in
            </button>
          </form>
        </section>
      </main>
    )
  }

  async function handleStaffSubmit(event) {
    event.preventDefault()

    const groups = parseGroups(staffForm.groupsText)

    if (!staffForm.title.trim() || groups.length === 0) {
      setStaffMessage('Title and at least one staff member are required.')
      return
    }

    const nextStaff = {
      eyebrow: staffForm.eyebrow.trim() || staffMeta.fallbackEyebrow,
      title: staffForm.title.trim(),
      intro: staffForm.intro.trim(),
      updated: staffForm.updated.trim() || formatDisplayDate(''),
      groups,
    }

    try {
      setIsSavingStaff(true)
      setStaffSaveState('saving')
      const saved = await saveAdminStaff(nextStaff)
      onStaffChange(saved)
      setStaffForm(staffToForm(saved))
      setStaffMessage('Saved the Staff page.')
      setStaffSaveState('saved')
      window.setTimeout(() => setStaffSaveState('idle'), 1800)
    } catch (error) {
      setStaffMessage(error.message)
      setStaffSaveState('idle')
    } finally {
      setIsSavingStaff(false)
    }
  }

  async function handleStaffReset() {
    try {
      const saved = await resetAdminStaff()
      onStaffChange(saved)
      setStaffForm(staffToForm(saved))
      setStaffMessage('Restored the default staff list.')
    } catch (error) {
      setStaffMessage(error.message)
    }
  }

  const tabs = [
    { id: 'news', label: 'News' },
    { id: 'staff', label: 'Staff' },
    { id: 'wiki', label: 'Wiki' },
    { id: 'rules', label: 'Rules' },
    { id: 'terms', label: 'Terms' },
    { id: 'docs', label: 'Docs' },
  ]

  const activeMeta = isPolicyTab ? policyMeta[activeTab] : null
  const heading =
    activeTab === 'news'
      ? editingSlug
        ? 'Edit News'
        : 'Create News'
      : activeTab === 'staff'
        ? 'Edit Staff'
        : activeTab === 'wiki'
          ? 'Edit Wiki'
          : activeTab === 'docs'
            ? 'Formatting Docs'
            : `Edit ${activeMeta.heading}`
  const newsSaveButtonLabel = newsSaveState === 'saving'
    ? 'Saving...'
    : newsSaveState === 'saved'
      ? 'Saved'
      : editingSlug
        ? 'Save changes'
        : 'Save news post'
  const policySaveButtonLabel = policySaveState === 'saving'
    ? 'Saving...'
    : policySaveState === 'saved'
      ? 'Saved'
      : `Save ${activeMeta?.label ?? 'Policy'} page`
  const staffSaveButtonLabel = staffSaveState === 'saving'
    ? 'Saving...'
    : staffSaveState === 'saved'
      ? 'Saved'
      : 'Save Staff page'

  return (
    <main className="min-h-svh bg-bg px-5 pb-16 pt-36 text-white sm:px-8 lg:px-12">
      <section className="mx-auto max-w-6xl">
        {/* Top bar */}
        <div className="flex flex-col gap-5 rounded-2xl border border-white/10 bg-surface p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-2">Admin</p>
              <h1 className="mt-3 text-3xl font-bold leading-tight text-white">{heading}</h1>
            </div>
            <button className={`${secondaryButtonClass} min-h-10`} type="button" onClick={handleLogout}>
              Log out
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5 rounded-xl border border-white/10 bg-bg-2 p-1.5">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id
              const customized =
                tab.id === 'staff'
                  ? isStaffCustomized()
                  : tab.id === 'wiki'
                    ? isWikiCustomized()
                    : (tab.id === 'rules' || tab.id === 'terms') && isPolicyCustomized(tab.id)
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id)
                    window.history.pushState(null, '', tab.id === 'docs' ? '/admin/docs' : '/admin')
                  }}
                  className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                    isActive ? 'bg-brand text-white' : 'text-muted hover:bg-white/[0.06] hover:text-white'
                  }`}
                >
                  {tab.label}
                  {customized && (
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-white' : 'bg-brand-2'}`}
                      title="Customized"
                    />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {activeTab === 'docs' && <FormattingDocs />}

        {/* News manager */}
        {activeTab === 'news' && (
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
            <div className="rounded-2xl border border-white/10 bg-surface p-6">
              <form className="grid gap-5" onSubmit={handleSubmit}>
                <div className="grid gap-5 md:grid-cols-2">
                  <label className={labelClass}>
                    Title
                    <input className={inputClass} value={form.title} onChange={(event) => updateField('title', event.target.value)} />
                  </label>
                  <label className={labelClass}>
                    Slug preview
                    <input className={`${inputClass} bg-bg-2 text-zinc-400`} readOnly value={form.slug} />
                  </label>
                </div>

                <label className={labelClass}>
                  Description
                  <textarea className={`${textareaClass} min-h-24`} value={form.description} onChange={(event) => updateField('description', event.target.value)} />
                </label>

                <div className="grid gap-5 md:grid-cols-2">
                  <label className={labelClass}>
                    Category
                    <input className={inputClass} value={form.category} onChange={(event) => updateField('category', event.target.value)} />
                  </label>
                  <label className={labelClass}>
                    Date
                    <input type="date" className={inputClass} value={form.date} onChange={(event) => updateField('date', event.target.value)} />
                  </label>
                  <label className={labelClass}>
                    Author
                    <input className={inputClass} value={form.author} onChange={(event) => updateField('author', event.target.value)} />
                  </label>
                  <label className={labelClass}>
                    Reading Time
                    <input className={inputClass} value={form.readingTime} onChange={(event) => updateField('readingTime', event.target.value)} />
                  </label>
                </div>

                <label className={labelClass}>
                  Image URL
                  <input className={inputClass} placeholder="https://example.com/news-image.avif" value={form.imageUrl} onChange={(event) => updateField('imageUrl', event.target.value)} />
                  <span className="text-xs font-medium leading-5 text-muted">
                    Use a direct optimized image URL, preferably .avif or .webp. Large .jpg/.png files can slow the news page even with lazy loading.
                  </span>
                </label>

                <label className={labelClass}>
                  Body
                  <textarea
                    className={`${textareaClass} min-h-48`}
                    placeholder={'Use Discord-style formatting:\n# title\n![Image alt](https://example.com/image.webp) Optional caption\n> quote\n> -- AlwiNation Team\n- list\n```code block```\n\n:::callout Title\nCallout text\n:::\n\n:::stats\nPlayers: 120\nUptime: 99%\n:::'}
                    value={form.bodyText}
                    onChange={(event) => updateField('bodyText', event.target.value)}
                  />
                  <span className="text-xs font-medium leading-5 text-muted">
                    Use ![alt](https://example.com/image.webp) for article images, plus :::callout Title and :::stats fenced blocks for special news sections.
                    {' '}
                    <a className="font-semibold text-brand-2 underline underline-offset-4 hover:text-brand" href="/admin/docs">
                      View formatting docs
                    </a>
                  </span>
                </label>

                <label className={labelClass}>
                  Highlights
                  <textarea className={`${textareaClass} min-h-28`} placeholder="One highlight per line." value={form.highlightsText} onChange={(event) => updateField('highlightsText', event.target.value)} />
                </label>

                <NewsLivePreview item={newsPreview} />

                {saveMessage && <p className="text-sm font-semibold text-brand-2">{saveMessage}</p>}

                <div className="flex flex-wrap gap-3">
                  <button
                    className={`${primaryButtonClass} min-h-12 min-w-[150px] ${
                      newsSaveState === 'saved' ? 'from-positive to-positive text-[#062412]' : ''
                    } active:translate-y-0.5 active:scale-[0.98] disabled:cursor-wait disabled:opacity-80`}
                    type="submit"
                    disabled={isSavingNews}
                  >
                    {newsSaveButtonLabel}
                  </button>
                  {editingSlug && (
                    <button className={`${secondaryButtonClass} min-h-12`} type="button" onClick={handleCancelEdit}>
                      Cancel edit
                    </button>
                  )}
                </div>
              </form>
            </div>

            <aside className="rounded-2xl border border-white/10 bg-surface p-6 lg:sticky lg:top-28">
              <h2 className="text-xl font-bold text-white">News Posts</h2>
              <p className="mt-3 text-sm leading-6 text-muted">
                Existing news appears here too. Deleting a seed post hides it through a stored override.
              </p>

              <div className="mt-6 grid gap-4">
                {editablePosts.length === 0 ? (
                  <p className="rounded-xl border border-white/10 bg-surface-2 p-4 text-sm text-muted">
                    No news posts available.
                  </p>
                ) : (
                  editablePosts.map((item) => (
                    <article className="rounded-xl border border-white/10 bg-surface-2 p-4" key={item.id}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-bold text-white">{item.title}</h3>
                          <p className="mt-1 text-sm text-muted">/news/{item.slug}</p>
                        </div>
                        <span className="rounded-md border border-white/10 px-2 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                          {item.deleted ? 'Hidden' : item.source === 'admin' ? 'Local' : 'Seed'}
                        </span>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {!item.deleted && (
                          <>
                            <button className="inline-flex min-h-9 items-center rounded-lg bg-gradient-to-b from-brand-2 to-brand px-3 text-sm font-semibold text-[#1a0d07] transition hover:brightness-105" type="button" onClick={() => handleEdit(item)}>
                              Edit
                            </button>
                            <a className="inline-flex min-h-9 items-center rounded-lg border border-white/15 px-3 text-sm font-semibold text-zinc-200 no-underline transition hover:border-white/25 hover:text-white" href={`/news/${item.slug}`}>
                              View
                            </a>
                          </>
                        )}
                        <button className="inline-flex min-h-9 items-center rounded-lg border border-red-400/40 px-3 text-sm font-semibold text-red-300 transition hover:bg-red-500/10" type="button" onClick={() => handleDelete(item.slug)}>
                          {item.deleted ? 'Keep hidden' : 'Delete'}
                        </button>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </aside>
          </div>
        )}

        {/* Policy editor (Rules / Terms) */}
        {isPolicyTab && (
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
            <div className="rounded-2xl border border-white/10 bg-surface p-6">
              <form className="grid gap-5" onSubmit={handlePolicySubmit}>
                <div className="grid gap-5 md:grid-cols-2">
                  <label className={labelClass}>
                    Eyebrow
                    <input className={inputClass} placeholder={activeMeta.fallbackEyebrow} value={policyForm.eyebrow} onChange={(event) => updatePolicyField('eyebrow', event.target.value)} />
                  </label>
                  <label className={labelClass}>
                    Last updated
                    <input className={inputClass} placeholder="July 5, 2026" value={policyForm.updated} onChange={(event) => updatePolicyField('updated', event.target.value)} />
                  </label>
                </div>

                <label className={labelClass}>
                  Page title
                  <input className={inputClass} value={policyForm.title} onChange={(event) => updatePolicyField('title', event.target.value)} />
                </label>

                <label className={labelClass}>
                  Intro
                  <textarea className={`${textareaClass} min-h-24`} value={policyForm.intro} onChange={(event) => updatePolicyField('intro', event.target.value)} />
                </label>

                <label className={labelClass}>
                  Sections
                  <textarea
                    className={`${textareaClass} min-h-[360px] font-mono text-[13px] leading-6`}
                    value={policyForm.sectionsText}
                    onChange={(event) => updatePolicyField('sectionsText', event.target.value)}
                  />
                </label>

                <PolicyLivePreview policy={policyPreview} activeKey={activeTab} />

                {policyMessage && <p className="text-sm font-semibold text-brand-2">{policyMessage}</p>}

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    className={`${primaryButtonClass} min-h-12 min-w-[150px] ${
                      policySaveState === 'saved' ? 'from-positive to-positive text-[#062412]' : ''
                    } active:translate-y-0.5 active:scale-[0.98] disabled:cursor-wait disabled:opacity-80`}
                    type="submit"
                    disabled={isSavingPolicy}
                  >
                    {policySaveButtonLabel}
                  </button>
                  <a className={`${secondaryButtonClass} min-h-12`} href={activeMeta.path} target="_blank" rel="noreferrer">
                    Preview page
                  </a>
                  <button className="inline-flex min-h-12 items-center justify-center rounded-xl border border-red-400/40 px-5 text-sm font-semibold text-red-300 transition hover:bg-red-500/10" type="button" onClick={handlePolicyReset}>
                    Reset to default
                  </button>
                </div>
              </form>
            </div>

            <aside className="rounded-2xl border border-white/10 bg-surface p-6 lg:sticky lg:top-28">
              <h2 className="text-xl font-bold text-white">Formatting guide</h2>
              <p className="mt-3 text-sm leading-6 text-muted">
                Structure the {activeMeta.label} content with this simple syntax:
              </p>
              <ul className="mt-4 grid gap-3 p-0">
                <li className="flex items-start gap-3 text-sm text-muted">
                  <code className="rounded-md bg-surface-2 px-2 py-0.5 text-brand-2"># Title</code>
                  <span>starts a new section</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-muted">
                  <code className="rounded-md bg-surface-2 px-2 py-0.5 text-brand-2">## Title</code>
                  <span>starts a subsection</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-muted">
                  <code className="rounded-md bg-surface-2 px-2 py-0.5 text-brand-2">- item</code>
                  <span>adds a bullet point</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-muted">
                  <span className="rounded-md bg-surface-2 px-2 py-0.5 text-zinc-300">plain text</span>
                  <span>becomes a section description</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-muted">
                  <code className="rounded-md bg-surface-2 px-2 py-0.5 text-brand-2">**bold**</code>
                  <span>also supports *italic*, __underline__, ~~strike~~, `code`, [links](https://...), and ||spoiler||</span>
                </li>
              </ul>
              <div className="mt-6 rounded-xl border border-white/10 bg-surface-2 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-2">Detected</p>
                <p className="mt-2 text-sm font-semibold text-white">{parsedSectionCount} section{parsedSectionCount === 1 ? '' : 's'}</p>
                <p className="mt-3 text-xs leading-5 text-muted">
                  Changes apply to the live {activeMeta.path} page after saving.
                </p>
              </div>
              <a className={`${secondaryButtonClass} mt-4 min-h-10 w-full`} href="/admin/docs">
                View formatting docs
              </a>
            </aside>
          </div>
        )}

        {isStaffTab && (
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
            <div className="rounded-2xl border border-white/10 bg-surface p-6">
              <form className="grid gap-5" onSubmit={handleStaffSubmit}>
                <div className="grid gap-5 md:grid-cols-2">
                  <label className={labelClass}>
                    Eyebrow
                    <input className={inputClass} placeholder={staffMeta.fallbackEyebrow} value={staffForm.eyebrow} onChange={(event) => setStaffForm((current) => ({ ...current, eyebrow: event.target.value }))} />
                  </label>
                  <label className={labelClass}>
                    Last updated
                    <input className={inputClass} placeholder="July 6, 2026" value={staffForm.updated} onChange={(event) => setStaffForm((current) => ({ ...current, updated: event.target.value }))} />
                  </label>
                </div>

                <label className={labelClass}>
                  Page title
                  <input className={inputClass} value={staffForm.title} onChange={(event) => setStaffForm((current) => ({ ...current, title: event.target.value }))} />
                </label>

                <label className={labelClass}>
                  Intro
                  <textarea className={`${textareaClass} min-h-24`} value={staffForm.intro} onChange={(event) => setStaffForm((current) => ({ ...current, intro: event.target.value }))} />
                </label>

                <label className={labelClass}>
                  Staff groups
                  <textarea
                    className={`${textareaClass} min-h-[360px] font-mono text-[13px] leading-6`}
                    value={staffForm.groupsText}
                    onChange={(event) => setStaffForm((current) => ({ ...current, groupsText: event.target.value }))}
                  />
                </label>

                <StaffLivePreview staff={staffPreview} />

                {staffMessage && <p className="text-sm font-semibold text-brand-2">{staffMessage}</p>}

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    className={`${primaryButtonClass} min-h-12 min-w-[150px] ${
                      staffSaveState === 'saved' ? 'from-positive to-positive text-[#062412]' : ''
                    } active:translate-y-0.5 active:scale-[0.98] disabled:cursor-wait disabled:opacity-80`}
                    type="submit"
                    disabled={isSavingStaff}
                  >
                    {staffSaveButtonLabel}
                  </button>
                  <a className={`${secondaryButtonClass} min-h-12`} href={staffMeta.path} target="_blank" rel="noreferrer">
                    Preview page
                  </a>
                  <button className="inline-flex min-h-12 items-center justify-center rounded-xl border border-red-400/40 px-5 text-sm font-semibold text-red-300 transition hover:bg-red-500/10" type="button" onClick={handleStaffReset}>
                    Reset to default
                  </button>
                </div>
              </form>
            </div>

            <aside className="rounded-2xl border border-white/10 bg-surface p-6 lg:sticky lg:top-28">
              <h2 className="text-xl font-bold text-white">Formatting guide</h2>
              <p className="mt-3 text-sm leading-6 text-muted">Structure the staff list with this simple syntax:</p>
              <ul className="mt-4 grid gap-3 p-0">
                <li className="flex items-start gap-3 text-sm text-muted">
                  <code className="rounded-md bg-surface-2 px-2 py-0.5 text-brand-2"># Group</code>
                  <span>starts a new group (e.g. Moderators)</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-muted">
                  <code className="rounded-md bg-surface-2 px-2 py-0.5 text-brand-2">Name | Role | note</code>
                  <span>adds a member (role and note optional)</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-muted">
                  <code className="rounded-md bg-surface-2 px-2 py-0.5 text-zinc-300">Name</code>
                  <span>a name alone is a member with no role</span>
                </li>
              </ul>
              <div className="mt-6 rounded-xl border border-white/10 bg-surface-2 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-2">Detected</p>
                <p className="mt-2 text-sm font-semibold text-white">{parsedMemberCount} member{parsedMemberCount === 1 ? '' : 's'}</p>
                <p className="mt-3 text-xs leading-5 text-muted">Changes apply to the live /staff page after saving.</p>
              </div>
              <a className={`${secondaryButtonClass} mt-4 min-h-10 w-full`} href="/admin/docs">
                View formatting docs
              </a>
            </aside>
          </div>
        )}
        {activeTab === 'wiki' && (
          <div className="mt-8">
            <WikiManager wiki={wiki} onWikiChange={onWikiChange} />
          </div>
        )}
      </section>
    </main>
  )
}

export default AdminPanel
