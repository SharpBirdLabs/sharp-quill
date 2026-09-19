import { useEffect, useMemo, useRef, useState } from 'react'
import { shortcut } from '../lib/keys'

export type CommandItem = {
  id: string
  label: string
  hint?: string
  run: () => void
}

type CommandPaletteProps = {
  commands: CommandItem[]
  onClose: () => void
}

export function CommandPalette({ commands, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [index, setIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return commands
    return commands.filter((item) => item.label.toLowerCase().includes(needle))
  }, [commands, query])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setIndex((current) => (filtered.length ? (current + 1) % filtered.length : 0))
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        setIndex((current) =>
          filtered.length ? (current - 1 + filtered.length) % filtered.length : 0,
        )
      }
      if (event.key === 'Enter') {
        event.preventDefault()
        filtered[index]?.run()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [filtered, index, onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-[12vh] backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="w-full max-w-lg overflow-hidden rounded-2xl bg-paper ring-1 ring-line paper-shadow"
        onClick={(event) => event.stopPropagation()}
      >
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setIndex(0)
          }}
          placeholder={`Search commands… (${shortcut('Mod+K')})`}
          className="w-full border-b border-line bg-transparent px-4 py-3 text-base outline-none"
        />
        <ul className="max-h-80 overflow-y-auto p-2">
          {filtered.length === 0 && (
            <li className="px-3 py-6 text-center text-sm text-muted">No matching commands</li>
          )}
          {filtered.map((item, itemIndex) => (
            <li key={item.id}>
              <button
                type="button"
                onMouseEnter={() => setIndex(itemIndex)}
                onClick={() => item.run()}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm ${
                  itemIndex === index ? 'bg-ink text-paper' : 'text-ink hover:bg-black/5 dark:hover:bg-white/10'
                }`}
              >
                <span>{item.label}</span>
                {item.hint && (
                  <span className={itemIndex === index ? 'text-paper/70' : 'text-muted'}>{item.hint}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
