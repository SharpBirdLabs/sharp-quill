const SETTINGS_KEY = 'sharpquill:settings'

export type EditorFont = 'serif' | 'sans' | 'mono'
export type EditorWidth = 'narrow' | 'normal' | 'wide'

export type AppearanceSettings = {
  width: EditorWidth
  font: EditorFont
  fontSize: number
  lineHeight: number
}

export const defaultSettings: AppearanceSettings = {
  width: 'wide',
  font: 'serif',
  fontSize: 18,
  lineHeight: 1.8,
}

export function loadSettings(): AppearanceSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return defaultSettings
    const parsed = JSON.parse(raw) as Partial<AppearanceSettings>
    return { ...defaultSettings, ...parsed }
  } catch {
    return defaultSettings
  }
}

export function saveSettings(settings: AppearanceSettings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  } catch {
    // Ignore.
  }
  applySettings(settings)
}

export function applySettings(settings: AppearanceSettings) {
  const root = document.documentElement
  const widths = { narrow: '56rem', normal: '72rem', wide: '90rem' }
  const fonts = {
    serif: 'var(--font-serif)',
    sans: 'var(--font-sans)',
    mono: 'var(--font-mono)',
  }
  root.style.setProperty('--editor-max', widths[settings.width])
  root.style.setProperty('--editor-font', fonts[settings.font])
  root.style.setProperty('--editor-size', `${settings.fontSize}px`)
  root.style.setProperty('--editor-leading', String(settings.lineHeight))
}
