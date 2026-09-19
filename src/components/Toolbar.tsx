import type { Editor } from '@tiptap/react'
import { useEditorState } from '@tiptap/react'
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Baseline,
  Bold,
  CheckSquare,
  Code,
  Eraser,
  Highlighter,
  ImagePlus,
  IndentDecrease,
  IndentIncrease,
  Italic,
  Link,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  SquareCode,
  Strikethrough,
  Subscript,
  Superscript,
  Table,
  Table2,
  Underline,
  Undo2,
} from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { shortcut } from '../lib/keys'
import { ToolbarButton, ToolbarDivider } from './ToolbarButton'

type ToolbarProps = {
  editor: Editor
  onLink: () => void
  onImage: () => void
}

const TEXT_COLORS = [
  { label: 'Default', value: '' },
  { label: 'Red', value: '#dc2626' },
  { label: 'Orange', value: '#ea580c' },
  { label: 'Green', value: '#16a34a' },
  { label: 'Blue', value: '#2563eb' },
  { label: 'Purple', value: '#7c3aed' },
]

const HIGHLIGHTS = [
  { label: 'None', value: '' },
  { label: 'Yellow', value: '#fde68a' },
  { label: 'Green', value: '#bbf7d0' },
  { label: 'Blue', value: '#bfdbfe' },
  { label: 'Pink', value: '#fbcfe8' },
]

export function Toolbar({ editor, onLink, onImage }: ToolbarProps) {
  const state = useEditorState({
    editor,
    selector: ({ editor: current }) => ({
      h1: current.isActive('heading', { level: 1 }),
      h2: current.isActive('heading', { level: 2 }),
      h3: current.isActive('heading', { level: 3 }),
      bold: current.isActive('bold'),
      italic: current.isActive('italic'),
      underline: current.isActive('underline'),
      strike: current.isActive('strike'),
      ordered: current.isActive('orderedList'),
      bullet: current.isActive('bulletList'),
      task: current.isActive('taskList'),
      table: current.isActive('table'),
      link: current.isActive('link'),
      code: current.isActive('code'),
      codeBlock: current.isActive('codeBlock'),
      quote: current.isActive('blockquote'),
      alignLeft: current.isActive({ textAlign: 'left' }) || (!current.isActive({ textAlign: 'center' }) && !current.isActive({ textAlign: 'right' }) && !current.isActive({ textAlign: 'justify' })),
      alignCenter: current.isActive({ textAlign: 'center' }),
      alignRight: current.isActive({ textAlign: 'right' }),
      alignJustify: current.isActive({ textAlign: 'justify' }),
      highlight: current.isActive('highlight'),
      subscript: current.isActive('subscript'),
      superscript: current.isActive('superscript'),
      color: String(current.getAttributes('textStyle').color ?? ''),
      canUndo: current.can().undo(),
      canRedo: current.can().redo(),
    }),
  })

  return (
    <div
      role="toolbar"
      aria-label="Formatting"
      className="flex flex-wrap items-center gap-0.5 overflow-visible rounded-t-2xl border-b border-line bg-toolbar px-2 py-2 sm:px-3"
    >
      <ToolbarButton
        label="Heading 1"
        shortcut={shortcut('Mod+1')}
        active={state.h1}
        wide
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      >
        H1
      </ToolbarButton>
      <ToolbarButton
        label="Heading 2"
        shortcut={shortcut('Mod+2')}
        active={state.h2}
        wide
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        H2
      </ToolbarButton>
      <ToolbarButton
        label="Heading 3"
        shortcut={shortcut('Mod+3')}
        active={state.h3}
        wide
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        H3
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton
        label="Bold"
        shortcut={shortcut('Mod+B')}
        active={state.bold}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold size={16} strokeWidth={2.2} />
      </ToolbarButton>
      <ToolbarButton
        label="Italic"
        shortcut={shortcut('Mod+I')}
        active={state.italic}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic size={16} strokeWidth={2.2} />
      </ToolbarButton>
      <ToolbarButton
        label="Underline"
        shortcut={shortcut('Mod+U')}
        active={state.underline}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <Underline size={16} strokeWidth={2.2} />
      </ToolbarButton>
      <ToolbarButton
        label="Strikethrough"
        shortcut={shortcut('Mod+Shift+S')}
        active={state.strike}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough size={16} strokeWidth={2.2} />
      </ToolbarButton>
      <SwatchMenu
        label="Text color"
        icon={<Baseline size={16} strokeWidth={2.2} />}
        colors={TEXT_COLORS}
        current={state.color}
        onPick={(value) => {
          if (!value) editor.chain().focus().unsetColor().run()
          else editor.chain().focus().setColor(value).run()
        }}
      />
      <SwatchMenu
        label="Highlight"
        icon={<Highlighter size={16} strokeWidth={2.2} />}
        colors={HIGHLIGHTS}
        current={state.highlight ? String(editor.getAttributes('highlight').color ?? '#fde68a') : ''}
        onPick={(value) => {
          if (!value) editor.chain().focus().unsetHighlight().run()
          else editor.chain().focus().toggleHighlight({ color: value }).run()
        }}
      />
      <ToolbarButton
        label="Superscript"
        active={state.superscript}
        onClick={() => editor.chain().focus().toggleSuperscript().run()}
      >
        <Superscript size={16} strokeWidth={2.2} />
      </ToolbarButton>
      <ToolbarButton
        label="Subscript"
        active={state.subscript}
        onClick={() => editor.chain().focus().toggleSubscript().run()}
      >
        <Subscript size={16} strokeWidth={2.2} />
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton
        label="Align left"
        shortcut={shortcut('Mod+Shift+L')}
        active={state.alignLeft}
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
      >
        <AlignLeft size={16} strokeWidth={2.2} />
      </ToolbarButton>
      <ToolbarButton
        label="Align center"
        shortcut={shortcut('Mod+Shift+E')}
        active={state.alignCenter}
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
      >
        <AlignCenter size={16} strokeWidth={2.2} />
      </ToolbarButton>
      <ToolbarButton
        label="Align right"
        shortcut={shortcut('Mod+Shift+R')}
        active={state.alignRight}
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
      >
        <AlignRight size={16} strokeWidth={2.2} />
      </ToolbarButton>
      <ToolbarButton
        label="Justify"
        shortcut={shortcut('Mod+Shift+J')}
        active={state.alignJustify}
        onClick={() => editor.chain().focus().setTextAlign('justify').run()}
      >
        <AlignJustify size={16} strokeWidth={2.2} />
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton
        label="Ordered list"
        shortcut={shortcut('Mod+Shift+7')}
        active={state.ordered}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered size={16} strokeWidth={2.2} />
      </ToolbarButton>
      <ToolbarButton
        label="Unordered list"
        shortcut={shortcut('Mod+Shift+8')}
        active={state.bullet}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List size={16} strokeWidth={2.2} />
      </ToolbarButton>
      <ToolbarButton
        label="Task list"
        shortcut={shortcut('Mod+Shift+9')}
        active={state.task}
        onClick={() => editor.chain().focus().toggleTaskList().run()}
      >
        <CheckSquare size={16} strokeWidth={2.2} />
      </ToolbarButton>
      <ToolbarButton
        label="Indent"
        onClick={() => {
          if (!editor.chain().focus().sinkListItem('listItem').run()) {
            editor.chain().focus().sinkListItem('taskItem').run()
          }
        }}
      >
        <IndentIncrease size={16} strokeWidth={2.2} />
      </ToolbarButton>
      <ToolbarButton
        label="Outdent"
        onClick={() => {
          if (!editor.chain().focus().liftListItem('listItem').run()) {
            editor.chain().focus().liftListItem('taskItem').run()
          }
        }}
      >
        <IndentDecrease size={16} strokeWidth={2.2} />
      </ToolbarButton>
      <ToolbarButton
        label={state.table ? 'Delete table' : 'Insert table'}
        active={state.table}
        onClick={() => {
          if (state.table) editor.chain().focus().deleteTable().run()
          else editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
        }}
      >
        <Table size={16} strokeWidth={2.2} />
      </ToolbarButton>
      {state.table && (
        <>
          <ToolbarButton label="Add row" onClick={() => editor.chain().focus().addRowAfter().run()}>
            <Table2 size={16} strokeWidth={2.2} />
          </ToolbarButton>
          <ToolbarButton
            label="Add column"
            wide
            onClick={() => editor.chain().focus().addColumnAfter().run()}
          >
            +Col
          </ToolbarButton>
        </>
      )}

      <ToolbarDivider />

      <ToolbarButton
        label="Link"
        shortcut={shortcut('Mod+Shift+K')}
        active={state.link}
        onClick={onLink}
      >
        <Link size={16} strokeWidth={2.2} />
      </ToolbarButton>
      <ToolbarButton
        label="Inline code"
        shortcut={shortcut('Mod+E')}
        active={state.code}
        onClick={() => editor.chain().focus().toggleCode().run()}
      >
        <Code size={16} strokeWidth={2.2} />
      </ToolbarButton>
      <ToolbarButton
        label="Code block"
        shortcut={shortcut('Mod+Alt+C')}
        active={state.codeBlock}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
      >
        <SquareCode size={16} strokeWidth={2.2} />
      </ToolbarButton>
      <ToolbarButton
        label="Blockquote"
        shortcut={shortcut('Mod+Shift+B')}
        active={state.quote}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quote size={16} strokeWidth={2.2} />
      </ToolbarButton>
      <ToolbarButton
        label="Horizontal rule"
        shortcut={shortcut('Mod+Shift+H')}
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      >
        <Minus size={16} strokeWidth={2.2} />
      </ToolbarButton>
      <ToolbarButton label="Insert image" onClick={onImage}>
        <ImagePlus size={16} strokeWidth={2.2} />
      </ToolbarButton>
      <ToolbarButton
        label="Clear formatting"
        onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
      >
        <Eraser size={16} strokeWidth={2.2} />
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton
        label="Undo"
        shortcut={shortcut('Mod+Z')}
        disabled={!state.canUndo}
        onClick={() => editor.chain().focus().undo().run()}
      >
        <Undo2 size={16} strokeWidth={2.2} />
      </ToolbarButton>
      <ToolbarButton
        label="Redo"
        shortcut={shortcut('Mod+Shift+Z')}
        disabled={!state.canRedo}
        onClick={() => editor.chain().focus().redo().run()}
      >
        <Redo2 size={16} strokeWidth={2.2} />
      </ToolbarButton>
    </div>
  )
}

function SwatchMenu({
  label,
  icon,
  colors,
  current,
  onPick,
}: {
  label: string
  icon: ReactNode
  colors: { label: string; value: string }[]
  current: string
  onPick: (value: string) => void
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

  return (
    <div ref={rootRef} className="relative">
      <ToolbarButton label={label} active={Boolean(current)} onClick={() => setOpen((value) => !value)}>
        {icon}
      </ToolbarButton>
      {open && (
        <div className="absolute top-[calc(100%+8px)] left-0 z-40 flex gap-1 rounded-xl bg-paper p-2 ring-1 ring-line paper-shadow">
          {colors.map((color) => (
            <button
              key={color.label}
              type="button"
              title={color.label}
              aria-label={color.label}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                onPick(color.value)
                setOpen(false)
              }}
              className="h-6 w-6 rounded-full ring-1 ring-line"
              style={{ background: color.value || 'var(--ink)' }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
