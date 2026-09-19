import type { Editor } from '@tiptap/react'
import { useEditorState } from '@tiptap/react'
import {
  Bold,
  CheckSquare,
  Code,
  ImagePlus,
  Italic,
  Link,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  SquareCode,
  Strikethrough,
  Table,
  Table2,
  Underline,
  Undo2,
} from 'lucide-react'
import { shortcut } from '../lib/keys'
import { ToolbarButton, ToolbarDivider } from './ToolbarButton'

type ToolbarProps = {
  editor: Editor
  onLink: () => void
  onImage: () => void
}

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
