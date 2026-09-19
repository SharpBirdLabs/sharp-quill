import {
  Command,
  Copy,
  FileDown,
  Maximize2,
  Menu,
  Moon,
  PanelLeft,
  Settings,
  Sun,
} from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '../lib/cn'
import { shortcut } from '../lib/keys'
import type { EditorMode } from '../lib/storage'
import { ToolbarButton } from './ToolbarButton'

type HeaderProps = {
  title: string
  onTitleChange: (value: string) => void
  mode: EditorMode
  onModeChange: (mode: EditorMode) => void
  theme: 'light' | 'dark'
  onToggleTheme: () => void
  onFocusMode: () => void
  onToggleSidebar: () => void
  onOpenPalette: () => void
  onOpenSettings: () => void
  onExportMarkdown: () => void
  onExportHtml: () => void
  onExportPdf: () => void
  onImportMarkdown: () => void
  onBackup: () => void
  onRestore: () => void
  onCopyMarkdown: () => void
  onCopyText: () => void
  onCopyHtml: () => void
}

export function Header({
  title,
  onTitleChange,
  mode,
  onModeChange,
  theme,
  onToggleTheme,
  onFocusMode,
  onToggleSidebar,
  onOpenPalette,
  onOpenSettings,
  onExportMarkdown,
  onExportHtml,
  onExportPdf,
  onImportMarkdown,
  onBackup,
  onRestore,
  onCopyMarkdown,
  onCopyText,
  onCopyHtml,
}: HeaderProps) {
  return (
    <header className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label="Toggle documents"
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-paper/80 text-ink ring-1 ring-line lg:hidden"
        >
          <PanelLeft size={16} />
        </button>
        <img
          src={theme === 'dark' ? '/logo-dark.png' : '/logo-light.png'}
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
          <ToolbarButton label="Command palette" shortcut={shortcut('Mod+K')} onClick={onOpenPalette}>
            <Command size={16} />
          </ToolbarButton>
          <FileMenu
            onExportMarkdown={onExportMarkdown}
            onExportHtml={onExportHtml}
            onExportPdf={onExportPdf}
            onImportMarkdown={onImportMarkdown}
            onBackup={onBackup}
            onRestore={onRestore}
            onCopyMarkdown={onCopyMarkdown}
            onCopyText={onCopyText}
            onCopyHtml={onCopyHtml}
          />
          <ToolbarButton label="Settings" onClick={onOpenSettings}>
            <Settings size={16} />
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

function FileMenu({
  onExportMarkdown,
  onExportHtml,
  onExportPdf,
  onImportMarkdown,
  onBackup,
  onRestore,
  onCopyMarkdown,
  onCopyText,
  onCopyHtml,
}: {
  onExportMarkdown: () => void
  onExportHtml: () => void
  onExportPdf: () => void
  onImportMarkdown: () => void
  onBackup: () => void
  onRestore: () => void
  onCopyMarkdown: () => void
  onCopyText: () => void
  onCopyHtml: () => void
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    window.addEventListener('mousedown', onClick)
    return () => window.removeEventListener('mousedown', onClick)
  }, [open])

  const run = (action: () => void) => {
    setOpen(false)
    action()
  }

  return (
    <div ref={rootRef} className="relative">
      <ToolbarButton label="File and export" onClick={() => setOpen((value) => !value)}>
        {open ? <Menu size={16} /> : <FileDown size={16} />}
      </ToolbarButton>
      {open && (
        <div className="absolute top-[calc(100%+8px)] right-0 z-30 w-56 rounded-xl bg-paper p-1 text-sm ring-1 ring-line paper-shadow">
          <MenuItem onClick={() => run(onImportMarkdown)}>Import Markdown</MenuItem>
          <MenuItem onClick={() => run(onExportMarkdown)}>Export as Markdown</MenuItem>
          <MenuItem onClick={() => run(onExportHtml)}>Export as HTML</MenuItem>
          <MenuItem onClick={() => run(onExportPdf)}>Export as PDF</MenuItem>
          <div className="my-1 h-px bg-line" />
          <MenuItem onClick={() => run(onBackup)}>Backup all (.json)</MenuItem>
          <MenuItem onClick={() => run(onRestore)}>Restore backup</MenuItem>
          <div className="my-1 h-px bg-line" />
          <MenuItem onClick={() => run(onCopyMarkdown)}>
            <Copy size={13} /> Copy Markdown
          </MenuItem>
          <MenuItem onClick={() => run(onCopyText)}>Copy plain text</MenuItem>
          <MenuItem onClick={() => run(onCopyHtml)}>Copy HTML</MenuItem>
        </div>
      )}
    </div>
  )
}

function MenuItem({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-ink hover:bg-black/5 dark:hover:bg-white/10"
    >
      {children}
    </button>
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
