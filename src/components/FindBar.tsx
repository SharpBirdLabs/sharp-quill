import type { Editor } from '@tiptap/react'
import { ChevronDown, ChevronUp, X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import type { EditorMode } from '../lib/storage'

type FindBarProps = {
  editor: Editor | null
  mode: EditorMode
  markdown: string
  query: string
  onQuery: (value: string) => void
  onClose: () => void
}

export function FindBar({ editor, mode, markdown, query, onQuery, onClose }: FindBarProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const markdownIndex = useRef(0)

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  useEffect(() => {
    if (mode !== 'visual' || !editor) return
    editor.commands.setSearchQuery(query)
    requestAnimationFrame(() => {
      editor.view.dom.querySelector('.search-match-active')?.scrollIntoView({
        block: 'center',
        behavior: 'smooth',
      })
    })
  }, [editor, mode, query])

  const count =
    mode === 'visual'
      ? ((editor?.storage.searchHighlight?.count as number | undefined) ?? 0)
      : countPlain(markdown, query)

  const go = (direction: 1 | -1) => {
    if (!query) return
    if (mode === 'visual' && editor) {
      const current = (editor.storage.searchHighlight?.index as number | undefined) ?? 0
      editor.commands.setSearchIndex(current + direction)
      requestAnimationFrame(() => {
        editor.view.dom.querySelector('.search-match-active')?.scrollIntoView({
          block: 'center',
          behavior: 'smooth',
        })
      })
      return
    }
    const textarea = document.querySelector<HTMLTextAreaElement>('textarea.markdown-source')
    if (!textarea) return
    const hay = markdown.toLowerCase()
    const needle = query.toLowerCase()
    if (!needle || !hay.includes(needle)) return
    const startAt = direction === 1 ? markdownIndex.current + 1 : markdownIndex.current - 1
    let found = direction === 1 ? hay.indexOf(needle, startAt) : hay.lastIndexOf(needle, startAt)
    if (found === -1) {
      found = direction === 1 ? hay.indexOf(needle) : hay.lastIndexOf(needle)
    }
    if (found === -1) return
    markdownIndex.current = found
    textarea.focus()
    textarea.setSelectionRange(found, found + query.length)
  }

  return (
    <div className="absolute top-3 right-3 z-20 flex items-center gap-1 rounded-xl bg-paper/95 px-2 py-1.5 ring-1 ring-line paper-shadow">
      <input
        ref={inputRef}
        value={query}
        onChange={(event) => {
          markdownIndex.current = -1
          onQuery(event.target.value)
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            go(event.shiftKey ? -1 : 1)
          }
          if (event.key === 'Escape') onClose()
        }}
        placeholder="Find in document"
        className="w-40 bg-transparent px-2 text-sm outline-none sm:w-52"
      />
      <span className="px-1 text-[11px] text-muted">{query ? count : ''}</span>
      <button type="button" aria-label="Previous match" className="rounded-md p-1 hover:bg-black/5 dark:hover:bg-white/10" onClick={() => go(-1)}>
        <ChevronUp size={14} />
      </button>
      <button type="button" aria-label="Next match" className="rounded-md p-1 hover:bg-black/5 dark:hover:bg-white/10" onClick={() => go(1)}>
        <ChevronDown size={14} />
      </button>
      <button type="button" aria-label="Close find" className="rounded-md p-1 hover:bg-black/5 dark:hover:bg-white/10" onClick={onClose}>
        <X size={14} />
      </button>
    </div>
  )
}

function countPlain(text: string, query: string) {
  if (!query) return 0
  const hay = text.toLowerCase()
  const needle = query.toLowerCase()
  let count = 0
  let from = 0
  while (from < hay.length) {
    const found = hay.indexOf(needle, from)
    if (found === -1) break
    count += 1
    from = found + needle.length
  }
  return count
}
