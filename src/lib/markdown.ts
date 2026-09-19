import { marked } from 'marked'
import TurndownService from 'turndown'

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
  return {
    characters: text.length,
    words: plain ? plain.split(' ').length : 0,
  }
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
