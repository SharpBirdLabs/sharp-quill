import type { Editor } from '@tiptap/react'
import { useEditorState } from '@tiptap/react'
import { Minimize2 } from 'lucide-react'
import { countStats } from '../lib/markdown'
import type { EditorMode } from '../lib/storage'
import { ToolbarButton } from './ToolbarButton'

type StatusBarProps = {
  editor: Editor | null
  mode: EditorMode
  markdown: string
  saved: boolean
  focusMode: boolean
  onToggleFocus: () => void
}

export function StatusBar({
  editor,
  mode,
  markdown,
  saved,
  focusMode,
  onToggleFocus,
}: StatusBarProps) {
  const visualStats = useEditorState({
    editor,
    selector: ({ editor: current }) => countStats(current?.getText() ?? ''),
  })

  const stats = mode === 'markdown' ? countStats(markdown) : (visualStats ?? countStats(''))

  return (
    <div className="flex items-center justify-between gap-3 rounded-b-2xl border-t border-line px-4 py-2.5 text-xs text-muted sm:px-6">
      <p>
        <span className="font-medium text-ink">{stats.words}</span> {stats.words === 1 ? 'word' : 'words'}
        <span className="mx-2 text-line">·</span>
        <span className="font-medium text-ink">{stats.characters}</span>{' '}
        {stats.characters === 1 ? 'character' : 'characters'}
      </p>
      <div className="flex items-center gap-2">
        <span className="hidden sm:inline">{saved ? 'Saved' : 'Saving…'}</span>
        {focusMode && (
          <ToolbarButton label="Exit focus mode" shortcut="Esc" onClick={onToggleFocus}>
            <Minimize2 size={15} />
          </ToolbarButton>
        )}
      </div>
    </div>
  )
}
