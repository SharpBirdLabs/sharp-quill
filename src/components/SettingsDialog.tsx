import { useEffect, useState } from 'react'
import {
  applySettings,
  defaultSettings,
  saveSettings,
  type AppearanceSettings,
  type EditorFont,
  type EditorWidth,
} from '../lib/settings'

type SettingsDialogProps = {
  settings: AppearanceSettings
  theme: 'light' | 'dark'
  onThemeChange: (theme: 'light' | 'dark') => void
  onChange: (settings: AppearanceSettings) => void
  onClose: () => void
}

export function SettingsDialog({
  settings,
  theme,
  onThemeChange,
  onChange,
  onClose,
}: SettingsDialogProps) {
  const [draft, setDraft] = useState(settings)

  useEffect(() => {
    applySettings(draft)
  }, [draft])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        applySettings(settings)
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, settings])

  const update = (partial: Partial<AppearanceSettings>) => {
    setDraft((current) => ({ ...current, ...partial }))
  }

  const revert = () => {
    applySettings(settings)
    onClose()
  }

  const apply = () => {
    saveSettings(draft)
    onChange(draft)
    onClose()
  }

  const reset = () => {
    setDraft(defaultSettings)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]"
      onClick={revert}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
        className="w-full max-w-md rounded-2xl bg-paper p-5 text-ink ring-1 ring-line paper-shadow"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="mb-4 text-lg font-semibold tracking-tight">Appearance</h2>
        <div className="space-y-4 text-sm">
          <label className="block">
            <span className="mb-1.5 block font-medium text-muted">Theme</span>
            <select
              value={theme}
              onChange={(event) => onThemeChange(event.target.value as 'light' | 'dark')}
              className="w-full rounded-xl border border-line bg-desk/40 px-3 py-2.5 outline-none focus:border-accent"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block font-medium text-muted">Content width</span>
            <select
              value={draft.width}
              onChange={(event) => update({ width: event.target.value as EditorWidth })}
              className="w-full rounded-xl border border-line bg-desk/40 px-3 py-2.5 outline-none focus:border-accent"
            >
              <option value="narrow">Narrow</option>
              <option value="normal">Normal</option>
              <option value="wide">Wide</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block font-medium text-muted">Font family</span>
            <select
              value={draft.font}
              onChange={(event) => update({ font: event.target.value as EditorFont })}
              className="w-full rounded-xl border border-line bg-desk/40 px-3 py-2.5 outline-none focus:border-accent"
            >
              <option value="serif">Serif</option>
              <option value="sans">Sans</option>
              <option value="mono">Mono</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block font-medium text-muted">Font size · {draft.fontSize}px</span>
            <input
              type="range"
              min={14}
              max={24}
              value={draft.fontSize}
              onChange={(event) => update({ fontSize: Number(event.target.value) })}
              className="w-full"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block font-medium text-muted">
              Line height · {draft.lineHeight.toFixed(1)}
            </span>
            <input
              type="range"
              min={14}
              max={22}
              value={Math.round(draft.lineHeight * 10)}
              onChange={(event) => update({ lineHeight: Number(event.target.value) / 10 })}
              className="w-full"
            />
          </label>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={reset}
            className="mr-auto rounded-xl px-3 py-2 text-sm font-medium text-muted hover:bg-black/5 dark:hover:bg-white/10"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={revert}
            className="rounded-xl px-3 py-2 text-sm font-medium text-muted hover:bg-black/5 dark:hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={apply}
            className="rounded-xl bg-ink px-4 py-2 text-sm font-medium text-paper hover:opacity-90"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
