import { Pin, Plus, Search, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { cn } from '../lib/cn'
import { sortDocuments } from '../lib/documents'
import type { QuillDocument } from '../lib/idb'

type SidebarProps = {
  docs: QuillDocument[]
  activeId: string | null
  open: boolean
  onClose: () => void
  onSelect: (id: string) => void
  onCreate: () => void
  onRename: (id: string) => void
  onDelete: (id: string) => void
  onTogglePin: (id: string) => void
}

export function Sidebar({
  docs,
  activeId,
  open,
  onClose,
  onSelect,
  onCreate,
  onRename,
  onDelete,
  onTogglePin,
}: SidebarProps) {
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<'updated' | 'title'>('updated')

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const filtered = needle
      ? docs.filter((doc) => (doc.title || 'Untitled').toLowerCase().includes(needle))
      : docs
    return sortDocuments(filtered, sort)
  }, [docs, query, sort])

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-30 bg-black/30 lg:hidden',
          open ? 'block' : 'hidden',
        )}
        onClick={onClose}
      />
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-[min(18rem,calc(100vw-2rem))] flex-col border-r border-line bg-paper/95 backdrop-blur-sm transition-transform lg:static lg:z-0 lg:w-72 lg:translate-x-0 lg:bg-paper/80',
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        <div className="flex items-center justify-between gap-2 px-3 pt-4 pb-2">
          <p className="text-[11px] font-semibold tracking-[0.16em] text-muted uppercase">
            Documents
          </p>
          <button
            type="button"
            onClick={onCreate}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-ink hover:bg-black/5 dark:hover:bg-white/10"
          >
            <Plus size={14} />
            New
          </button>
        </div>

        <div className="px-3 pb-2">
          <label className="relative block">
            <Search size={14} className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search titles"
              className="w-full rounded-xl border border-line bg-desk/40 py-2 pr-3 pl-8 text-sm outline-none focus:border-accent focus:ring-4 focus:ring-accent/15"
            />
          </label>
          <div className="mt-2 flex gap-1">
            <SortChip active={sort === 'updated'} onClick={() => setSort('updated')}>
              Recent
            </SortChip>
            <SortChip active={sort === 'title'} onClick={() => setSort('title')}>
              Title
            </SortChip>
          </div>
        </div>

        <ul className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
          {visible.length === 0 && (
            <li className="px-2 py-6 text-center text-sm text-muted">No documents</li>
          )}
          {visible.map((doc) => {
            const active = doc.id === activeId
            return (
              <li key={doc.id}>
                <div
                  className={cn(
                    'group mb-1 flex items-start gap-1 rounded-xl px-2 py-2',
                    active ? 'bg-ink text-paper' : 'hover:bg-black/5 dark:hover:bg-white/8',
                  )}
                >
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(doc.id)
                      onClose()
                    }}
                    onDoubleClick={() => onRename(doc.id)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <span className="block truncate text-sm font-medium">
                      {doc.title.trim() || 'Untitled'}
                    </span>
                    <span className={cn('mt-0.5 block text-[11px]', active ? 'text-paper/70' : 'text-muted')}>
                      {formatWhen(doc.updatedAt)}
                    </span>
                  </button>
                  <button
                    type="button"
                    aria-label={doc.pinned ? 'Unpin' : 'Pin'}
                    onClick={() => onTogglePin(doc.id)}
                    className={cn(
                      'mt-0.5 rounded-md p-1',
                      doc.pinned ? 'opacity-80' : 'opacity-0 group-hover:opacity-70 hover:opacity-100',
                    )}
                  >
                    <Pin size={13} />
                  </button>
                  <button
                    type="button"
                    aria-label="Delete document"
                    onClick={() => onDelete(doc.id)}
                    className={cn(
                      'mt-0.5 rounded-md p-1 opacity-0 group-hover:opacity-70 hover:opacity-100',
                      active ? 'hover:bg-white/10' : 'hover:bg-black/5',
                    )}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      </aside>
    </>
  )
}

function SortChip({
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
      className={cn(
        'rounded-lg px-2 py-1 text-[11px] font-medium',
        active ? 'bg-ink text-paper' : 'text-muted hover:bg-black/5 hover:text-ink dark:hover:bg-white/10',
      )}
    >
      {children}
    </button>
  )
}

function formatWhen(ts: number) {
  const delta = Date.now() - ts
  if (delta < 45_000) return 'Just now'
  if (delta < 3600_000) return `${Math.max(1, Math.round(delta / 60_000))}m ago`
  if (delta < 86400_000) return `${Math.round(delta / 3600_000)}h ago`
  return new Date(ts).toLocaleDateString()
}
