import { isSafeUrl } from './safeUrls.js'

function parseInline(text) {
  const pattern =
    /(\|\|(.+?)\|\||\*\*(.+?)\*\*|__(.+?)__|~~(.+?)~~|`([^`]+?)`|\[([^\]]+?)\]\(([^)]+?)\)|\*(.+?)\*)/g
  const parts = []
  let lastIndex = 0
  let match

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', text: text.slice(lastIndex, match.index) })
    }

    if (match[2]) {
      parts.push({ type: 'spoiler', text: match[2] })
    } else if (match[3]) {
      parts.push({ type: 'bold', text: match[3] })
    } else if (match[4]) {
      parts.push({ type: 'underline', text: match[4] })
    } else if (match[5]) {
      parts.push({ type: 'strike', text: match[5] })
    } else if (match[6]) {
      parts.push({ type: 'code', text: match[6] })
    } else if (match[7] && match[8]) {
      parts.push({ type: 'link', text: match[7], href: match[8] })
    } else if (match[9]) {
      parts.push({ type: 'italic', text: match[9] })
    }

    lastIndex = pattern.lastIndex
  }

  if (lastIndex < text.length) {
    parts.push({ type: 'text', text: text.slice(lastIndex) })
  }

  return parts
}

function isTableRow(line) {
  return /^\|.+\|$/.test(line.trim())
}

function isTableSeparator(line) {
  const cells = splitTableRow(line)

  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell))
}

function getTableAlignments(line) {
  return splitTableRow(line).map((cell) => {
    if (cell.startsWith(':') && cell.endsWith(':')) {
      return 'center'
    }
    if (cell.endsWith(':')) {
      return 'right'
    }
    return 'left'
  })
}

function splitTableRow(line) {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim())
}

function readFencedBlock(lines, startIndex) {
  const blockLines = []
  let index = startIndex + 1

  while (index < lines.length && lines[index].trim() !== ':::') {
    blockLines.push(lines[index].trim())
    index += 1
  }

  return { blockLines, nextIndex: index + 1 }
}

function parsePipeItems(lines, expectedParts = 2) {
  return lines
    .filter(Boolean)
    .map((line) => line.split('|').map((part) => part.trim()))
    .filter((parts) => parts.length >= expectedParts && parts[0])
}

function parseTitledItems(lines) {
  return parsePipeItems(lines).map(([title, ...textParts]) => ({
    title,
    text: textParts.join(' | '),
  }))
}

function parseColumnsCount(value, fallback = 2) {
  const count = Number(value)

  if (!Number.isInteger(count)) {
    return fallback
  }

  return Math.min(Math.max(count, 2), 4)
}

export function RichInline({ text }) {
  return parseInline(String(text ?? '')).map((part, index) => {
    const key = `${part.type}-${index}`

    if (part.type === 'bold') {
      return <strong key={key} className="font-bold text-white">{part.text}</strong>
    }

    if (part.type === 'italic') {
      return <em key={key}>{part.text}</em>
    }

    if (part.type === 'underline') {
      return <span key={key} className="underline decoration-brand-2/70 underline-offset-4">{part.text}</span>
    }

    if (part.type === 'strike') {
      return <span key={key} className="line-through decoration-white/50">{part.text}</span>
    }

    if (part.type === 'code') {
      return (
        <code key={key} className="rounded-md border border-white/10 bg-black/30 px-1.5 py-0.5 font-mono text-[0.92em] text-brand-2">
          {part.text}
        </code>
      )
    }

    if (part.type === 'link' && isSafeUrl(part.href)) {
      return (
        <a key={key} className="font-semibold text-brand-2 underline underline-offset-4 hover:text-brand" href={part.href} target={part.href.startsWith('http') ? '_blank' : undefined} rel={part.href.startsWith('http') ? 'noreferrer' : undefined}>
          {part.text}
        </a>
      )
    }

    if (part.type === 'spoiler') {
      return (
        <span key={key} className="rounded bg-white/12 px-1 text-transparent transition hover:text-white focus:text-white" tabIndex={0}>
          {part.text}
        </span>
      )
    }

    return <span key={key}>{part.text}</span>
  })
}

export function parseMarkdownBlocks(text) {
  const lines = String(text ?? '').replace(/\r\n/g, '\n').split('\n')
  const blocks = []
  let index = 0

  while (index < lines.length) {
    const line = lines[index]
    const trimmed = line.trim()

    if (!trimmed) {
      index += 1
      continue
    }

    if (trimmed.startsWith('```')) {
      const language = trimmed.slice(3).trim()
      const codeLines = []
      index += 1
      while (index < lines.length && !lines[index].trim().startsWith('```')) {
        codeLines.push(lines[index])
        index += 1
      }
      blocks.push({ type: 'code', language, text: codeLines.join('\n') })
      index += 1
      continue
    }

    if (/^-{3,}$/.test(trimmed)) {
      blocks.push({ type: 'divider' })
      index += 1
      continue
    }

    if (trimmed.startsWith(':::callout')) {
      const title = trimmed.slice(':::callout'.length).trim()
      const { blockLines, nextIndex } = readFencedBlock(lines, index)
      blocks.push({ type: 'callout', title: title || 'Note', text: blockLines.filter(Boolean).join(' ') })
      index = nextIndex
      continue
    }

    if (trimmed.startsWith(':::section')) {
      const title = trimmed.slice(':::section'.length).trim()
      const { blockLines, nextIndex } = readFencedBlock(lines, index)
      blocks.push({ type: 'section', title, text: blockLines.filter(Boolean).join(' ') })
      index = nextIndex
      continue
    }

    if (trimmed.startsWith(':::container')) {
      const title = trimmed.slice(':::container'.length).trim()
      const { blockLines, nextIndex } = readFencedBlock(lines, index)
      blocks.push({ type: 'container', title, text: blockLines.filter(Boolean).join(' ') })
      index = nextIndex
      continue
    }

    if (trimmed.startsWith(':::sidebar')) {
      const title = trimmed.slice(':::sidebar'.length).trim()
      const { blockLines, nextIndex } = readFencedBlock(lines, index)
      const separatorIndex = blockLines.findIndex((blockLine) => blockLine === '---')
      const textLines = separatorIndex === -1 ? blockLines : blockLines.slice(0, separatorIndex)
      const sidebarLines = separatorIndex === -1 ? [] : blockLines.slice(separatorIndex + 1)

      blocks.push({
        type: 'sidebar',
        title,
        text: textLines.filter(Boolean).join(' '),
        sidebar: sidebarLines.filter(Boolean).join(' '),
      })
      index = nextIndex
      continue
    }

    if (trimmed.startsWith(':::columns') || trimmed.startsWith(':::grid')) {
      const [type, columnsText] = trimmed.slice(3).split(/\s+/, 2)
      const { blockLines, nextIndex } = readFencedBlock(lines, index)
      const items = parseTitledItems(blockLines)

      if (items.length > 0) {
        blocks.push({ type: type === 'grid' ? 'grid' : 'columns', columns: parseColumnsCount(columnsText), items })
      }
      index = nextIndex
      continue
    }

    if (trimmed.startsWith(':::cards')) {
      const { blockLines, nextIndex } = readFencedBlock(lines, index)
      const items = parsePipeItems(blockLines).map(([title, text, meta]) => ({ title, text, meta }))

      if (items.length > 0) {
        blocks.push({ type: 'cards', items })
      }
      index = nextIndex
      continue
    }

    if (trimmed.startsWith(':::tabs')) {
      const { blockLines, nextIndex } = readFencedBlock(lines, index)
      const items = parseTitledItems(blockLines)

      if (items.length > 0) {
        blocks.push({ type: 'tabs', items })
      }
      index = nextIndex
      continue
    }

    if (trimmed.startsWith(':::accordion') || trimmed.startsWith(':::collapse')) {
      const { blockLines, nextIndex } = readFencedBlock(lines, index)
      const items = parseTitledItems(blockLines)

      if (items.length > 0) {
        blocks.push({ type: 'accordion', items })
      }
      index = nextIndex
      continue
    }

    if (trimmed.startsWith(':::stats')) {
      const items = []
      index += 1
      while (index < lines.length && lines[index].trim() !== ':::') {
        const statLine = lines[index].trim()
        const separatorIndex = statLine.indexOf(':')
        if (separatorIndex > 0) {
          items.push({
            label: statLine.slice(0, separatorIndex).trim(),
            value: statLine.slice(separatorIndex + 1).trim(),
          })
        }
        index += 1
      }
      if (items.length > 0) {
        blocks.push({ type: 'stats', items })
      }
      index += 1
      continue
    }

    if (isTableRow(trimmed) && isTableSeparator(lines[index + 1] ?? '')) {
      const headers = splitTableRow(trimmed)
      const alignments = getTableAlignments(lines[index + 1])
      const rows = []
      index += 2

      while (index < lines.length && isTableRow(lines[index])) {
        const cells = splitTableRow(lines[index])
        rows.push(headers.map((_, cellIndex) => cells[cellIndex] ?? ''))
        index += 1
      }

      if (headers.length > 0 && rows.length > 0) {
        blocks.push({ type: 'table', headers, alignments, rows })
      }
      continue
    }

    const heading = trimmed.match(/^(#{1,3})\s+(.+)$/)
    if (heading) {
      blocks.push({ type: 'heading', level: heading[1].length, text: heading[2].trim() })
      index += 1
      continue
    }

    const image = trimmed.match(/^!\[([^\]]*)\]\(([^)\s]+)\)(?:\s+(.+))?$/)
    if (image) {
      blocks.push({
        type: 'image',
        alt: image[1].trim(),
        src: image[2].trim(),
        caption: (image[3] ?? '').trim(),
      })
      index += 1
      continue
    }

    if (trimmed.startsWith('> ')) {
      const quoteLines = []
      while (index < lines.length && lines[index].trim().startsWith('> ')) {
        quoteLines.push(lines[index].trim().slice(2).trim())
        index += 1
      }
      const lastLine = quoteLines.at(-1) ?? ''
      const citeMatch = lastLine.match(/^(?:--|—)\s*(.+)$/)
      if (citeMatch) {
        blocks.push({ type: 'quote', text: quoteLines.slice(0, -1).join('\n'), cite: citeMatch[1].trim() })
      } else {
        blocks.push({ type: 'quote', text: quoteLines.join('\n') })
      }
      continue
    }

    if (/^[-*]\s+\[[ xX]\]\s+/.test(trimmed)) {
      const items = []
      while (index < lines.length && /^[-*]\s+\[[ xX]\]\s+/.test(lines[index].trim())) {
        const item = lines[index].trim().match(/^[-*]\s+\[([ xX])\]\s+(.+)$/)
        if (item) {
          items.push({ checked: item[1].toLowerCase() === 'x', text: item[2].trim() })
        }
        index += 1
      }
      blocks.push({ type: 'checklist', items })
      continue
    }

    if (/^[-*]\s+/.test(trimmed)) {
      const items = []
      while (index < lines.length && /^[-*]\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().slice(2).trim())
        index += 1
      }
      blocks.push({ type: 'list', items })
      continue
    }

    const paragraphLines = []
    while (
      index < lines.length &&
      lines[index].trim() &&
      !lines[index].trim().startsWith('```') &&
      !/^-{3,}$/.test(lines[index].trim()) &&
      !lines[index].trim().startsWith(':::callout') &&
      !lines[index].trim().startsWith(':::stats') &&
      !lines[index].trim().startsWith(':::section') &&
      !lines[index].trim().startsWith(':::container') &&
      !lines[index].trim().startsWith(':::sidebar') &&
      !lines[index].trim().startsWith(':::columns') &&
      !lines[index].trim().startsWith(':::grid') &&
      !lines[index].trim().startsWith(':::cards') &&
      !lines[index].trim().startsWith(':::tabs') &&
      !lines[index].trim().startsWith(':::accordion') &&
      !lines[index].trim().startsWith(':::collapse') &&
      !(isTableRow(lines[index].trim()) && isTableSeparator(lines[index + 1] ?? '')) &&
      !/^(#{1,3})\s+/.test(lines[index].trim()) &&
      !/^!\[[^\]]*\]\([^)]+\)(?:\s+.+)?$/.test(lines[index].trim()) &&
      !lines[index].trim().startsWith('> ') &&
      !/^[-*]\s+\[[ xX]\]\s+/.test(lines[index].trim()) &&
      !/^[-*]\s+/.test(lines[index].trim())
    ) {
      paragraphLines.push(lines[index].trim())
      index += 1
    }
    blocks.push({ type: blocks.length === 0 ? 'lead' : 'paragraph', text: paragraphLines.join(' ') })
  }

  return blocks
}
