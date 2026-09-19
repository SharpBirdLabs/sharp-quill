import { EditorContent, useEditor } from '@tiptap/react'
import Placeholder from '@tiptap/extension-placeholder'
import StarterKit from '@tiptap/starter-kit'
import { TableKit } from '@tiptap/extension-table'
import { TaskItem } from '@tiptap/extension-task-item'
import { TaskList } from '@tiptap/extension-task-list'
import { Minimize2 } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { CommandPalette, type CommandItem } from './components/CommandPalette'
import {
  ChoiceDialog,
  ConfirmDialog,
  LinkDialog,
  PromptDialog,
  Toast,
} from './components/Dialogs'
import { FindBar } from './components/FindBar'
import { Header } from './components/Header'
import { MarkdownSource } from './components/MarkdownSource'
import { SettingsDialog } from './components/SettingsDialog'
import { Sidebar } from './components/Sidebar'
import { StatusBar } from './components/StatusBar'
import { Toolbar } from './components/Toolbar'
import { NotepadKeymap } from './extensions/keymap'
import { SearchHighlight } from './extensions/search-highlight'
import { StoredImage } from './extensions/stored-image'
import { useDocuments } from './hooks/useDocuments'
import { useTheme } from './hooks/useTheme'
import {
  buildBackup,
  downloadBackup,
  downloadMarkdown,
  parseBackup,
  pickFile,
  restoreBackupImages,
} from './lib/files'
import { saveImageBlob } from './lib/images'
import {
  downloadFile,
  htmlToMarkdown,
  htmlToMarkdownExport,
  htmlWithResolvedImages,
  htmlWithStoredImages,
  markdownToHtml,
  slugify,
  wrapHtmlDocument,
} from './lib/markdown'
import { exportPdf } from './lib/pdf'
import { applySettings, loadSettings, type AppearanceSettings } from './lib/settings'
import type { EditorMode } from './lib/storage'

function normalizeUrl(url: string) {
  const trimmed = url.trim()
  if (!trimmed || /^(javascript|data):/i.test(trimmed)) return ''
  if (/^(https?:|mailto:|tel:|#|\/)/i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

function escapeAttr(value: string) {
  return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;')
}

function collectImageFiles(data: DataTransfer | null) {
  if (!data) return []
  const fromFiles = [...data.files].filter((file) => file.type.startsWith('image/'))
  if (fromFiles.length) return fromFiles
  const fromItems: File[] = []
  for (const item of data.items) {
    if (item.kind === 'file' && item.type.startsWith('image/')) {
      const file = item.getAsFile()
      if (file) fromItems.push(file)
    }
  }
  return fromItems
}

export default function App() {
  const { theme, setTheme, toggleTheme } = useTheme()
  const documents = useDocuments()
  const [title, setTitle] = useState('')
  const [mode, setMode] = useState<EditorMode>('visual')
  const [markdown, setMarkdown] = useState('')
  const [focusMode, setFocusMode] = useState(false)
  const [isSaved, setIsSaved] = useState(true)
  const [toast, setToast] = useState<string | null>(null)
  const [linkOpen, setLinkOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [renameOpen, setRenameOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [findOpen, setFindOpen] = useState(false)
  const [findQuery, setFindQuery] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [restoreOpen, setRestoreOpen] = useState(false)
  const [pendingBackup, setPendingBackup] = useState<ReturnType<typeof parseBackup> | null>(null)
  const [settings, setSettings] = useState<AppearanceSettings>(() => loadSettings())

  const persistTimer = useRef<number>(0)
  const loadingDoc = useRef(true)
  const skipTitlePersist = useRef(true)
  const skipMarkdownPersist = useRef(true)
  const titleRef = useRef(title)
  const markdownRef = useRef(markdown)
  const modeRef = useRef(mode)
  const activeRef = useRef(documents.active)
  const saveRef = useRef(documents.save)
  const insertImagesRef = useRef<(files: File[], pos?: number) => Promise<void>>(async () => {})

  useEffect(() => {
    titleRef.current = title
    markdownRef.current = markdown
    modeRef.current = mode
    activeRef.current = documents.active
    saveRef.current = documents.save
  })

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
        TableKit.configure({
          table: { resizable: true },
        }),
        TaskList,
        TaskItem.configure({ nested: true }),
        StoredImage,
        SearchHighlight,
        NotepadKeymap.configure({
          onLink: () => window.dispatchEvent(new Event('notepad:link')),
          onPalette: () => window.dispatchEvent(new Event('notepad:palette')),
        }),
      ],
      content: '',
      editorProps: {
        attributes: {
          class: 'tiptap px-6 py-8 sm:px-10 sm:py-10',
          spellcheck: 'true',
          'aria-label': 'Document',
        },
        handlePaste: (_view, event) => {
          const files = collectImageFiles(event.clipboardData)
          if (!files.length) return false
          event.preventDefault()
          void insertImagesRef.current(files)
          return true
        },
        handleDrop: (view, event) => {
          const files = collectImageFiles(event.dataTransfer)
          if (!files.length) return false
          event.preventDefault()
          const coords = view.posAtCoords({ left: event.clientX, top: event.clientY })
          void insertImagesRef.current(files, coords?.pos)
          return true
        },
      },
    },
    [],
  )

  useEffect(() => {
    insertImagesRef.current = async (files: File[], pos?: number) => {
      if (!editor || files.length === 0) return
      for (const file of files) {
        const stored = await saveImageBlob(file)
        if (typeof pos === 'number') {
          editor
            .chain()
            .focus()
            .insertContentAt(pos, { type: 'image', attrs: { src: stored.src, alt: file.name } })
            .run()
          pos += 1
        } else {
          editor.chain().focus().setImage({ src: stored.src, alt: file.name }).run()
        }
      }
    }
  }, [editor])

  useEffect(() => {
    applySettings(settings)
  }, [settings])

  const showToast = useCallback((message: string) => {
    setToast(message)
  }, [])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 1800)
    return () => window.clearTimeout(timer)
  }, [toast])

  const persistNow = useCallback(async () => {
    if (!editor || !activeRef.current || loadingDoc.current) return
    setIsSaved(false)
    const html =
      modeRef.current === 'markdown'
        ? await htmlWithStoredImages(markdownToHtml(markdownRef.current))
        : editor.getHTML()
    const next = {
      ...activeRef.current,
      title: titleRef.current,
      content: html,
      updatedAt: Date.now(),
    }
    await saveRef.current(next)
    setIsSaved(true)
  }, [editor])

  const persistDebounced = useCallback(() => {
    if (loadingDoc.current) return
    setIsSaved(false)
    window.clearTimeout(persistTimer.current)
    persistTimer.current = window.setTimeout(() => {
      void persistNow()
    }, 400)
  }, [persistNow])

  useEffect(() => {
    if (!editor) return
    const onUpdate = () => persistDebounced()
    editor.on('update', onUpdate)
    return () => {
      editor.off('update', onUpdate)
    }
  }, [editor, persistDebounced])

  useEffect(() => {
    if (skipTitlePersist.current) {
      skipTitlePersist.current = false
      return
    }
    persistDebounced()
  }, [title, persistDebounced])

  useEffect(() => {
    if (skipMarkdownPersist.current) {
      skipMarkdownPersist.current = false
      return
    }
    persistDebounced()
  }, [markdown, persistDebounced])

  useEffect(() => {
    if (!editor || !documents.ready || !documents.active) return
    loadingDoc.current = true
    skipTitlePersist.current = true
    skipMarkdownPersist.current = true
    setTitle(documents.active.title)
    const html = documents.active.content || ''
    editor.commands.setContent(html || '', { emitUpdate: false })
    setMarkdown(htmlToMarkdown(html))
    setIsSaved(true)
    const timer = window.setTimeout(() => {
      loadingDoc.current = false
    }, 0)
    return () => window.clearTimeout(timer)
  }, [documents.activeId, documents.ready, editor])

  const openLinkDialog = useCallback(() => {
    if (!editor) return
    setLinkOpen(true)
  }, [editor])

  const openPalette = useCallback(() => setPaletteOpen(true), [])

  useEffect(() => {
    const onLinkShortcut = () => openLinkDialog()
    const onPaletteShortcut = () => openPalette()
    window.addEventListener('notepad:link', onLinkShortcut)
    window.addEventListener('notepad:palette', onPaletteShortcut)
    return () => {
      window.removeEventListener('notepad:link', onLinkShortcut)
      window.removeEventListener('notepad:palette', onPaletteShortcut)
    }
  }, [openLinkDialog, openPalette])

  const currentHtml = useCallback(() => {
    if (!editor) return markdownToHtml(markdown)
    return mode === 'visual' ? editor.getHTML() : markdownToHtml(markdown)
  }, [editor, markdown, mode])

  const currentText = useCallback(() => {
    if (mode === 'markdown') {
      return markdown.replace(/[#>*_`~\-[\]()!]/g, ' ').replace(/\s+/g, ' ').trim()
    }
    return editor?.getText() ?? ''
  }, [editor, markdown, mode])

  const switchMode = (next: EditorMode) => {
    if (!editor || next === mode) return
    if (next === 'markdown') {
      setMarkdown(htmlToMarkdown(editor.getHTML()))
    } else {
      editor.commands.setContent(markdownToHtml(markdown), { emitUpdate: false })
    }
    setMode(next)
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

  const pickAndInsertImage = async () => {
    const file = await pickFile('image/*')
    if (file) await insertImagesRef.current([file])
  }

  const copyMarkdown = async () => {
    await navigator.clipboard.writeText(await htmlToMarkdownExport(currentHtml()))
    showToast('Markdown copied')
  }

  const copyText = async () => {
    await navigator.clipboard.writeText(currentText())
    showToast('Text copied')
  }

  const copyHtml = async () => {
    await navigator.clipboard.writeText(await htmlWithResolvedImages(currentHtml()))
    showToast('HTML copied')
  }

  const exportMarkdown = async () => {
    downloadMarkdown(title, await htmlToMarkdownExport(currentHtml()))
    showToast('Markdown downloaded')
  }

  const exportHtml = async () => {
    const body = await htmlWithResolvedImages(currentHtml())
    downloadFile(`${slugify(title)}.html`, wrapHtmlDocument(title, body), 'text/html;charset=utf-8')
    showToast('HTML downloaded')
  }

  const exportPdfFile = async () => {
    await exportPdf(title, currentHtml())
    showToast('PDF downloaded')
  }

  const importMarkdown = async () => {
    const file = await pickFile('.md,text/markdown,text/plain')
    if (!file) return
    const text = await file.text()
    const html = await htmlWithStoredImages(markdownToHtml(text))
    const name = file.name.replace(/\.md$/i, '')
    await persistNow()
    await documents.create({ title: name, content: html })
    showToast('Markdown imported')
  }

  const backupAll = async () => {
    await persistNow()
    const payload = await buildBackup(documents.docs)
    downloadBackup(payload)
    showToast('Backup downloaded')
  }

  const restoreBackup = async () => {
    const file = await pickFile('.json,application/json')
    if (!file) return
    try {
      const payload = parseBackup(await file.text())
      setPendingBackup(payload)
      setRestoreOpen(true)
    } catch {
      showToast('Invalid backup file')
    }
  }

  const applyRestore = async (modeRestore: 'replace' | 'merge') => {
    if (!pendingBackup) return
    await restoreBackupImages(pendingBackup.images)
    if (modeRestore === 'replace') {
      await documents.replaceAll(pendingBackup.documents)
    } else {
      await documents.mergeIn(pendingBackup.documents)
    }
    setRestoreOpen(false)
    setPendingBackup(null)
    showToast(modeRestore === 'replace' ? 'Backup restored' : 'Backup merged')
  }

  const createDocument = async () => {
    await persistNow()
    await documents.create()
    setMode('visual')
    showToast('Document created')
  }

  const confirmDelete = async () => {
    if (!documents.active) return
    await documents.remove(documents.active.id)
    setDeleteOpen(false)
    showToast('Document deleted')
  }

  const applyRename = async (value: string) => {
    setTitle(value)
    if (documents.active) {
      await documents.rename(documents.active.id, value)
    }
    setRenameOpen(false)
  }

  const closeFind = useCallback(() => {
    setFindOpen(false)
    setFindQuery('')
    editor?.commands.setSearchQuery('')
  }, [editor])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const mod = event.metaKey || event.ctrlKey
      if (mod && (event.key === 'k' || event.key === 'K' || event.key === 'p' || event.key === 'P') && !event.shiftKey) {
        event.preventDefault()
        setPaletteOpen(true)
        return
      }
      if (mod && (event.key === 'f' || event.key === 'F')) {
        event.preventDefault()
        setFindOpen(true)
        return
      }
      if (event.key === 'Escape') {
        if (paletteOpen || settingsOpen || linkOpen || deleteOpen || renameOpen || restoreOpen) return
        if (findOpen) {
          closeFind()
          return
        }
        if (focusMode) setFocusMode(false)
        if (sidebarOpen) setSidebarOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [closeFind, deleteOpen, findOpen, focusMode, linkOpen, paletteOpen, renameOpen, restoreOpen, settingsOpen, sidebarOpen])

  const commands: CommandItem[] = [
    { id: 'new', label: 'New Document', run: () => { setPaletteOpen(false); void createDocument() } },
    { id: 'rename', label: 'Rename Document', run: () => { setPaletteOpen(false); setRenameOpen(true) } },
    { id: 'delete', label: 'Delete Document', run: () => { setPaletteOpen(false); setDeleteOpen(true) } },
    { id: 'export-md', label: 'Export as Markdown', run: () => { setPaletteOpen(false); void exportMarkdown() } },
    { id: 'focus', label: 'Toggle Focus Mode', run: () => { setPaletteOpen(false); setFocusMode((value) => !value) } },
    { id: 'theme', label: 'Toggle Theme', run: () => { setPaletteOpen(false); toggleTheme() } },
    { id: 'settings', label: 'Open Settings', run: () => { setPaletteOpen(false); setSettingsOpen(true) } },
    { id: 'find', label: 'Find in Document', hint: 'Ctrl+F', run: () => { setPaletteOpen(false); setFindOpen(true) } },
    { id: 'export-html', label: 'Export as HTML', run: () => { setPaletteOpen(false); void exportHtml() } },
    { id: 'export-pdf', label: 'Export as PDF', run: () => { setPaletteOpen(false); void exportPdfFile() } },
    { id: 'backup', label: 'Backup All Documents', run: () => { setPaletteOpen(false); void backupAll() } },
  ]

  if (!editor || !documents.ready) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-desk font-sans text-muted">
        Opening notepad…
      </div>
    )
  }

  const linkHref = String(editor.getAttributes('link').href ?? '')

  return (
    <div className={`min-h-svh bg-desk font-sans text-ink ${focusMode ? 'focus-mode' : ''}`}>
      <div className="flex min-h-svh">
        {!focusMode && (
          <Sidebar
            docs={documents.docs}
            activeId={documents.activeId}
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            onSelect={async (id) => {
              await persistNow()
              documents.select(id)
            }}
            onCreate={() => void createDocument()}
            onRename={(id) => {
              if (id !== documents.activeId) documents.select(id)
              setRenameOpen(true)
            }}
            onDelete={(id) => {
              if (id !== documents.activeId) documents.select(id)
              setDeleteOpen(true)
            }}
            onTogglePin={(id) => void documents.togglePin(id)}
          />
        )}

        <div className="min-w-0 flex-1">
          <div className={`mx-auto px-4 py-6 sm:py-10 ${focusMode ? 'max-w-none pt-16' : ''}`}>
            {!focusMode && (
              <Header
                title={title}
                onTitleChange={setTitle}
                mode={mode}
                onModeChange={switchMode}
                theme={theme}
                onToggleTheme={toggleTheme}
                onFocusMode={() => setFocusMode(true)}
                onToggleSidebar={() => setSidebarOpen((value) => !value)}
                onOpenPalette={() => setPaletteOpen(true)}
                onOpenSettings={() => setSettingsOpen(true)}
                onExportMarkdown={() => void exportMarkdown()}
                onExportHtml={() => void exportHtml()}
                onExportPdf={() => void exportPdfFile()}
                onImportMarkdown={() => void importMarkdown()}
                onBackup={() => void backupAll()}
                onRestore={() => void restoreBackup()}
                onCopyMarkdown={() => void copyMarkdown()}
                onCopyText={() => void copyText()}
                onCopyHtml={() => void copyHtml()}
              />
            )}

            <div className="relative rounded-2xl bg-paper ring-1 ring-line paper-shadow">
              {!focusMode && mode === 'visual' && (
                <Toolbar editor={editor} onLink={openLinkDialog} onImage={() => void pickAndInsertImage()} />
              )}
              {mode === 'visual' ? (
                <EditorContent editor={editor} />
              ) : (
                <MarkdownSource
                  value={markdown}
                  onChange={setMarkdown}
                />
              )}
              {!focusMode && (
                <StatusBar
                  editor={editor}
                  mode={mode}
                  markdown={markdown}
                  saved={isSaved}
                  focusMode={focusMode}
                  onToggleFocus={() => setFocusMode((value) => !value)}
                />
              )}
              {findOpen && (
                <FindBar
                  editor={editor}
                  mode={mode}
                  markdown={markdown}
                  query={findQuery}
                  onQuery={setFindQuery}
                  onClose={closeFind}
                />
              )}
            </div>

            {!focusMode && (
              <footer className="mt-4 space-y-1.5 text-center text-[11px] text-muted">
                <p className="font-medium tracking-[0.14em] uppercase">
                  A{' '}
                  <a
                    href="https://www.amirtahan.ir/sharpbird"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline-offset-2 hover:text-ink hover:underline"
                  >
                    SharpBird Labs
                  </a>{' '}
                  product
                </p>
                <p>
                  Develop with ❤️ by{' '}
                  <a
                    href="https://amirtahan.ir"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium underline-offset-2 hover:text-ink hover:underline"
                  >
                    AmirTahan
                  </a>
                </p>
              </footer>
            )}
          </div>
        </div>
      </div>

      {focusMode && (
        <button
          type="button"
          onClick={() => setFocusMode(false)}
          className="fixed top-4 left-1/2 z-20 inline-flex -translate-x-1/2 items-center gap-2 rounded-full bg-paper/95 px-3 py-1.5 text-xs font-medium text-muted ring-1 ring-line paper-shadow hover:text-ink"
        >
          <Minimize2 size={14} />
          Exit focus
          <span className="text-[10px]">{isSaved ? 'Saved' : 'Saving...'}</span>
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

      {deleteOpen && (
        <ConfirmDialog
          title="Delete document?"
          message="This removes the document from this browser. This cannot be undone."
          confirmLabel="Delete"
          onClose={() => setDeleteOpen(false)}
          onConfirm={() => void confirmDelete()}
        />
      )}

      {renameOpen && (
        <PromptDialog
          title="Rename document"
          label="Title"
          initialValue={title}
          confirmLabel="Rename"
          onClose={() => setRenameOpen(false)}
          onConfirm={(value) => void applyRename(value)}
        />
      )}

      {restoreOpen && pendingBackup && (
        <ChoiceDialog
          title="Restore backup?"
          message={`This backup has ${pendingBackup.documents.length} document${pendingBackup.documents.length === 1 ? '' : 's'}. Replace everything, or merge with existing notes?`}
          primaryLabel="Replace"
          secondaryLabel="Merge"
          onClose={() => {
            setRestoreOpen(false)
            setPendingBackup(null)
          }}
          onPrimary={() => void applyRestore('replace')}
          onSecondary={() => void applyRestore('merge')}
        />
      )}

      {paletteOpen && (
        <CommandPalette commands={commands} onClose={() => setPaletteOpen(false)} />
      )}

      {settingsOpen && (
        <SettingsDialog
          settings={settings}
          theme={theme}
          onThemeChange={setTheme}
          onChange={setSettings}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {toast && <Toast message={toast} />}
    </div>
  )
}
