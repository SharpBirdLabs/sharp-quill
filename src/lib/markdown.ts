import { marked } from 'marked'
import TurndownService from 'turndown'
import { dataUrlToStoredImage, imageToDataUrl } from './images'

const turndown = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-',
  emDelimiter: '*',
  hr: '---',
})

// Standard Markdown has no underline; keep it as HTML so the round-trip survives.
turndown.addRule('underline', {
  filter: ['u'],
  replacement: (content) => `<u>${content}</u>`,
})

turndown.addRule('strikethrough', {
  filter: ['s', 'del'],
  replacement: (content) => `~~${content}~~`,
})

turndown.addRule('taskItem', {
  filter: (node) => {
    if (node.nodeName !== 'LI') return false
    const el = node as HTMLElement
    return (
      el.getAttribute('data-type') === 'taskItem' ||
      Boolean(el.querySelector(':scope > input[type=checkbox], :scope > label input[type=checkbox]'))
    )
  },
  replacement: (content, node) => {
    const el = node as HTMLElement
    const checkbox = el.querySelector('input[type=checkbox]') as HTMLInputElement | null
    const checked = el.getAttribute('data-checked') === 'true' || Boolean(checkbox?.checked)
    const text = content.replace(/^\s+/, '').replace(/\n+$/, '').trim()
    return `- [${checked ? 'x' : ' '}] ${text}\n`
  },
})

turndown.addRule('table', {
  filter: 'table',
  replacement: (_content, node) => {
    const table = node as HTMLTableElement
    const rows = [...table.querySelectorAll('tr')].map((row) =>
      [...row.children]
        .filter((cell) => cell.nodeName === 'TH' || cell.nodeName === 'TD')
        .map((cell) => (cell.textContent ?? '').replaceAll('|', '\\|').replace(/\s+/g, ' ').trim()),
    )
    if (!rows.length) return ''
    const cols = Math.max(...rows.map((row) => row.length), 1)
    const padded = rows.map((row) => {
      const next = [...row]
      while (next.length < cols) next.push('')
      return next
    })
    const line = (cells: string[]) => `| ${cells.join(' | ')} |`
    const [header, ...body] = padded
    const separator = header.map(() => '---')
    return `\n\n${line(header)}\n${line(separator)}\n${body.map(line).join('\n')}\n\n`
  },
})

marked.setOptions({
  gfm: true,
  breaks: false,
})

export function htmlToMarkdown(html: string) {
  if (!html || html === '<p></p>') return ''
  return turndown.turndown(html).trim()
}

export function markdownToHtml(markdown: string) {
  if (!markdown.trim()) return '<p></p>'
  return marked.parse(markdown, { async: false }) as string
}

export function countStats(text: string) {
  const plain = text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[#>*_`~[\]()!]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  const words = plain ? plain.split(' ').length : 0
  return {
    characters: text.length,
    words,
    readingMinutes: words === 0 ? 0 : Math.max(1, Math.round(words / 200)),
  }
}

export async function htmlWithResolvedImages(html: string) {
  const holder = document.createElement('div')
  holder.innerHTML = html
  for (const img of holder.querySelectorAll('img')) {
    const src = img.getAttribute('src') ?? ''
    try {
      img.setAttribute('src', await imageToDataUrl(src))
    } catch {
      // Leave the original src if it cannot be resolved.
    }
  }
  return holder.innerHTML
}

export async function htmlWithStoredImages(html: string) {
  const holder = document.createElement('div')
  holder.innerHTML = html
  for (const img of holder.querySelectorAll('img')) {
    const src = img.getAttribute('src') ?? ''
    if (!src.startsWith('data:')) continue
    try {
      const stored = await dataUrlToStoredImage(src)
      img.setAttribute('src', stored.src)
    } catch {
      // Keep the data URL if IndexedDB write fails.
    }
  }
  return holder.innerHTML
}

export async function htmlToMarkdownExport(html: string) {
  return htmlToMarkdown(await htmlWithResolvedImages(html))
}

export function slugify(title: string) {
  const slug = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return slug || 'untitled'
}

export function downloadFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export function wrapHtmlDocument(title: string, body: string) {
  const safeTitle = title.trim() || 'Untitled'
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(safeTitle)}</title>
  <style>
    body { font-family: Georgia, "Times New Roman", serif; max-width: 42rem; margin: 2.5rem auto; padding: 0 1.25rem; line-height: 1.7; color: #1c1917; }
    h1, h2, h3 { line-height: 1.25; }
    code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; background: #f4f4f5; padding: 0.1em 0.35em; border-radius: 4px; }
    pre { background: #18181b; color: #fafafa; padding: 1rem; border-radius: 8px; overflow-x: auto; }
    pre code { background: none; padding: 0; color: inherit; }
    blockquote { border-left: 3px solid #d6d3d1; margin: 0; padding: 0.2rem 0 0.2rem 1rem; color: #57534e; }
    a { color: #1d4ed8; }
    img { max-width: 100%; height: auto; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #d6d3d1; padding: 0.4rem 0.6rem; text-align: left; }
    th { background: #f5f5f4; }
    input[type=checkbox] { margin-right: 0.4rem; }
  </style>
</head>
<body>
${body}
</body>
</html>
`
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}
