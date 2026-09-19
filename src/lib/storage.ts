const DOC_KEY = 'sharpquill:document'
const THEME_KEY = 'sharpquill:theme'

export type Theme = 'light' | 'dark'
export type EditorMode = 'visual' | 'markdown'

export type SavedDocument = {
  title: string
  html: string
  markdown: string
  updatedAt: number
}

export function loadDocument(): SavedDocument | null {
  try {
    const raw = localStorage.getItem(DOC_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as SavedDocument
    if (typeof parsed.html !== 'string') return null
    return parsed
  } catch {
    return null
  }
}

export function saveDocument(doc: SavedDocument) {
  try {
    localStorage.setItem(DOC_KEY, JSON.stringify(doc))
  } catch {
    // Quota or private-mode failures should not break editing.
  }
}

export function clearDocument() {
  try {
    localStorage.removeItem(DOC_KEY)
  } catch {
    // Ignore storage errors.
  }
}

export function loadTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    // Fall through to system preference.
  }
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }
  return 'light'
}

export function saveTheme(theme: Theme) {
  try {
    localStorage.setItem(THEME_KEY, theme)
  } catch {
    // Ignore storage errors.
  }
}
