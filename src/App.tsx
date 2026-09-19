import { EditorContent, useEditor } from '@tiptap/react'
import Placeholder from '@tiptap/extension-placeholder'
import StarterKit from '@tiptap/starter-kit'
import { Minimize2 } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ConfirmDialog, LinkDialog, Toast } from './components/Dialogs'
import { Header } from './components/Header'
import { MarkdownSource } from './components/MarkdownSource'
import { StatusBar } from './components/StatusBar'
import { Toolbar } from './components/Toolbar'
import { NotepadKeymap } from './extensions/keymap'
import { useTheme } from './hooks/useTheme'
import {
  downloadFile,
  htmlToMarkdown,
  markdownToHtml,
  slugify,
  wrapHtmlDocument,
} from './lib/markdown'
import {
  clearDocument,
  loadDocument,
  saveDocument,
  type EditorMode,
} from './lib/storage'

const initialDocument = loadDocument()

function normalizeUrl(url: string) {
  const trimmed = url.trim()
  if (!trimmed || /^(javascript|data):/i.test(trimmed)) return ''
  if (/^(https?:|mailto:|tel:|#|\/)/i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

function escapeAttr(value: string) {
  return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;')
}

export default function App() {
  const { theme, toggleTheme } = useTheme()
  const [title, setTitle] = useState(initialDocument?.title ?? '')
  const [mode, setMode] = useState<EditorMode>('visual')
  const [markdown, setMarkdown] = useState(initialDocument?.markdown ?? '')
  const [focusMode, setFocusMode] = useState(false)
  const [isSaved, setIsSaved] = useState(true)
  const [toast, setToast] = useState<string | null>(null)
  const [linkOpen, setLinkOpen] = useState(false)
  const [clearOpen, setClearOpen] = useState(false)

  const editor = useEditor(
    {
      immediatelyRender: false,
      extensions: [
        StarterKit.configure({
          heading: { levels: [1, 2, 3] },
          link: {
            openOnClick: false,
            autolink: true,
            defaultProtocol: 'https',
            HTMLAttributes: {
              rel: 'noopener noreferrer nofollow',
              target: '_blank',
            },
          },
        }),
        Placeholder.configure({
          placeholder: 'Start writing...',
        }),
        NotepadKeymap.configure({
          onLink: () => window.dispatchEvent(new Event('notepad:link')),
        }),
      ],
      content: initialDocument?.html || '',
      editorProps: {
        attributes: {
          class: 'tiptap px-6 py-8 sm:px-10 sm:py-10',
          spellcheck: 'true',
          'aria-label': 'Document',
        },
      },
    },
    [],
  )

  const persistTimer = useRef<number>(0)

  const persistNow = useCallback(() => {
    if (!editor) return
    const html = editor.getHTML()
    const md = mode === 'markdown' ? markdown : htmlToMarkdown(html)
    saveDocument({
      title,
      html: mode === 'markdown' ? markdownToHtml(md) : html,
      markdown: md,
      updatedAt: Date.now(),
    })
    setIsSaved(true)
  }, [editor, markdown, mode, title])

  const persistDebounced = useCallback(() => {
    window.clearTimeout(persistTimer.current)
    persistTimer.current = window.setTimeout(persistNow, 400)
  }, [persistNow])

  const showToast = useCallback((message: string) => {
    setToast(message)
  }, [])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 1800)
    return () => window.clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    if (!editor) return
    const onUpdate = () => {
      setIsSaved(false)
      persistDebounced()
    }
    editor.on('update', onUpdate)
    return () => {
      editor.off('update', onUpdate)
    }
  }, [editor, persistDebounced])

  const skipInitialPersist = useRef(true)
  useEffect(() => {
    if (skipInitialPersist.current) {
      skipInitialPersist.current = false
      return
    }
    setIsSaved(false)
    persistDebounced()
  }, [title, markdown, persistDebounced])

  const openLinkDialog = useCallback(() => {
    if (!editor) return
    setLinkOpen(true)
  }, [editor])

  useEffect(() => {
    const onLinkShortcut = () => openLinkDialog()
    window.addEventListener('notepad:link', onLinkShortcut)
    return () => window.removeEventListener('notepad:link', onLinkShortcut)
  }, [openLinkDialog])

  const switchMode = (next: EditorMode) => {
    if (!editor || next === mode) return
    if (next === 'markdown') {
      setMarkdown(htmlToMarkdown(editor.getHTML()))
    } else {
      editor.commands.setContent(markdownToHtml(markdown), { emitUpdate: false })
    }
    setMode(next)
  }

  const currentMarkdown = () => {
    if (!editor) return markdown
    return mode === 'markdown' ? markdown : htmlToMarkdown(editor.getHTML())
  }

  const currentHtml = () => {
    if (!editor) return markdownToHtml(markdown)
    return mode === 'visual' ? editor.getHTML() : markdownToHtml(markdown)
  }

  const copyMarkdown = async () => {
    await navigator.clipboard.writeText(currentMarkdown())
    showToast('Markdown copied')
  }

  const exportHtml = () => {
    downloadFile(
      `${slugify(title)}.html`,
      wrapHtmlDocument(title, currentHtml()),
      'text/html;charset=utf-8',
    )
    showToast('HTML downloaded')
  }

  const applyLink = (url: string) => {
    if (!editor) return
    const href = normalizeUrl(url)
    if (!href) return
    if (editor.state.selection.empty) {
      editor.chain().focus().insertContent(`<a href="${escapeAttr(href)}">${escapeAttr(href)}</a>`).run()
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href }).run()
    }
    setLinkOpen(false)
  }

  const removeLink = () => {
    editor?.chain().focus().unsetLink().run()
    setLinkOpen(false)
  }

  const confirmClear = () => {
    editor?.commands.setContent('', { emitUpdate: true })
    setTitle('')
    setMarkdown('')
    clearDocument()
    setClearOpen(false)
    setIsSaved(true)
    showToast('Document cleared')
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && focusMode && !linkOpen && !clearOpen) {
        setFocusMode(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [clearOpen, focusMode, linkOpen])

  if (!editor) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-desk font-sans text-muted">
        Opening notepad…
      </div>
    )
  }

  const linkHref = String(editor.getAttributes('link').href ?? '')

  return (
    <div className="min-h-svh bg-desk font-sans text-ink">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:py-10">
        {!focusMode && (
          <Header
            title={title}
            onTitleChange={setTitle}
            mode={mode}
            onModeChange={switchMode}
            theme={theme}
            onToggleTheme={toggleTheme}
            onCopyMarkdown={copyMarkdown}
            onExportHtml={exportHtml}
            onClear={() => setClearOpen(true)}
            onFocusMode={() => setFocusMode(true)}
          />
        )}

        <div className="rounded-2xl bg-paper ring-1 ring-line paper-shadow">
          {!focusMode && mode === 'visual' && (
            <Toolbar editor={editor} onLink={openLinkDialog} />
          )}
          {mode === 'visual' ? (
            <EditorContent editor={editor} />
          ) : (
            <MarkdownSource value={markdown} onChange={setMarkdown} />
          )}
          <StatusBar
            editor={editor}
            mode={mode}
            markdown={markdown}
            saved={isSaved}
            focusMode={focusMode}
            onToggleFocus={() => setFocusMode((value) => !value)}
          />
        </div>

        {!focusMode && (
          <p className="mt-4 text-center text-[11px] font-medium tracking-[0.14em] text-muted uppercase">
            A SharpBird Labs product
          </p>
        )}
      </div>

      {focusMode && (
        <button
          type="button"
          onClick={() => setFocusMode(false)}
          className="fixed top-4 left-1/2 z-20 inline-flex -translate-x-1/2 items-center gap-2 rounded-full bg-paper/95 px-3 py-1.5 text-xs font-medium text-muted ring-1 ring-line paper-shadow hover:text-ink"
        >
          <Minimize2 size={14} />
          Exit focus
        </button>
      )}

      {linkOpen && (
        <LinkDialog
          initialUrl={linkHref}
          canRemove={editor.isActive('link')}
          onClose={() => setLinkOpen(false)}
          onApply={applyLink}
          onRemove={removeLink}
        />
      )}

      {clearOpen && (
        <ConfirmDialog
          title="Clear document?"
          message="This removes the current note from the editor and from local storage. This cannot be undone."
          confirmLabel="Clear"
          onClose={() => setClearOpen(false)}
          onConfirm={confirmClear}
        />
      )}

      {toast && <Toast message={toast} />}
    </div>
  )
}
