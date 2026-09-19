import {
  Copy,
  FileCode,
  Maximize2,
  Moon,
  Sun,
  Trash,
} from 'lucide-react'
import { cn } from '../lib/cn'
import type { EditorMode } from '../lib/storage'
import { ToolbarButton } from './ToolbarButton'

type HeaderProps = {
  title: string
  onTitleChange: (value: string) => void
  mode: EditorMode
  onModeChange: (mode: EditorMode) => void
  theme: 'light' | 'dark'
  onToggleTheme: () => void
  onCopyMarkdown: () => void
  onExportHtml: () => void
  onClear: () => void
  onFocusMode: () => void
}

export function Header({
  title,
  onTitleChange,
  mode,
  onModeChange,
  theme,
  onToggleTheme,
  onCopyMarkdown,
  onExportHtml,
  onClear,
  onFocusMode,
}: HeaderProps) {
  return (
    <header className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <img
          src="/logo.png"
          alt="SharpQuill"
          className="h-10 w-10 shrink-0 rounded-xl object-cover ring-1 ring-line"
        />
        <div className="min-w-0">
          <p className="text-[11px] font-semibold tracking-[0.16em] text-muted uppercase">
            SharpQuill
          </p>
          <input
            value={title}
            onChange={(event) => onTitleChange(event.target.value)}
            placeholder="Untitled"
            aria-label="Document title"
            className="w-full max-w-[18rem] truncate bg-transparent text-lg font-semibold tracking-tight text-ink outline-none placeholder:text-muted/70"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-xl bg-paper/80 p-1 ring-1 ring-line paper-shadow">
          <ModeButton active={mode === 'visual'} onClick={() => onModeChange('visual')}>
            Visual
          </ModeButton>
          <ModeButton active={mode === 'markdown'} onClick={() => onModeChange('markdown')}>
            Markdown
          </ModeButton>
        </div>

        <div className="inline-flex items-center rounded-xl bg-paper/80 p-1 ring-1 ring-line paper-shadow">
          <ToolbarButton label="Copy as Markdown" onClick={onCopyMarkdown}>
            <Copy size={16} />
          </ToolbarButton>
          <ToolbarButton label="Export as HTML" onClick={onExportHtml}>
            <FileCode size={16} />
          </ToolbarButton>
          <ToolbarButton label="Clear document" onClick={onClear}>
            <Trash size={16} />
          </ToolbarButton>
          <ToolbarButton label="Focus mode" shortcut="Esc to exit" onClick={onFocusMode}>
            <Maximize2 size={16} />
          </ToolbarButton>
          <ToolbarButton
            label={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            onClick={onToggleTheme}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </ToolbarButton>
        </div>
      </div>
    </header>
  )
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
        active ? 'bg-ink text-paper' : 'text-muted hover:text-ink',
      )}
    >
      {children}
    </button>
  )
}
