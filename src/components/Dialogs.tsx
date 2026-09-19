import { useEffect, useId, useRef, type FormEvent, type ReactNode } from 'react'
import { X } from 'lucide-react'

type ModalProps = {
  title: string
  onClose: () => void
  children: ReactNode
}

function Modal({ title, onClose, children }: ModalProps) {
  const labelId = useId()

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelId}
        className="w-full max-w-md rounded-2xl bg-paper p-5 text-ink ring-1 ring-line paper-shadow"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 id={labelId} className="text-lg font-semibold tracking-tight">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1 text-muted hover:bg-black/5 hover:text-ink dark:hover:bg-white/10"
          >
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

type LinkDialogProps = {
  initialUrl: string
  canRemove: boolean
  onClose: () => void
  onApply: (url: string) => void
  onRemove: () => void
}

export function LinkDialog({
  initialUrl,
  canRemove,
  onClose,
  onApply,
  onRemove,
}: LinkDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    const url = inputRef.current?.value.trim() ?? ''
    if (url) onApply(url)
  }

  return (
    <Modal title="Insert link" onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-muted">URL</span>
          <input
            ref={inputRef}
            defaultValue={initialUrl}
            placeholder="https://example.com"
            className="w-full rounded-xl border border-line bg-desk/40 px-3 py-2.5 text-ink outline-none ring-accent/0 transition focus:border-accent focus:ring-4 focus:ring-accent/15"
          />
        </label>
        <div className="flex flex-wrap justify-end gap-2">
          {canRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="rounded-xl px-3 py-2 text-sm font-medium text-muted hover:bg-black/5 hover:text-ink dark:hover:bg-white/10"
            >
              Remove link
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-3 py-2 text-sm font-medium text-muted hover:bg-black/5 hover:text-ink dark:hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-xl bg-ink px-4 py-2 text-sm font-medium text-paper hover:opacity-90"
          >
            Apply
          </button>
        </div>
      </form>
    </Modal>
  )
}

type ConfirmDialogProps = {
  title: string
  message: string
  confirmLabel: string
  onClose: () => void
  onConfirm: () => void
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  onClose,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Modal title={title} onClose={onClose}>
      <p className="mb-5 text-sm leading-6 text-muted">{message}</p>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl px-3 py-2 text-sm font-medium text-muted hover:bg-black/5 hover:text-ink dark:hover:bg-white/10"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="rounded-xl bg-ink px-4 py-2 text-sm font-medium text-paper hover:opacity-90"
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}

type PromptDialogProps = {
  title: string
  label: string
  initialValue: string
  confirmLabel: string
  onClose: () => void
  onConfirm: (value: string) => void
}

export function PromptDialog({
  title,
  label,
  initialValue,
  confirmLabel,
  onClose,
  onConfirm,
}: PromptDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    onConfirm(inputRef.current?.value.trim() ?? '')
  }

  return (
    <Modal title={title} onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-muted">{label}</span>
          <input
            ref={inputRef}
            defaultValue={initialValue}
            className="w-full rounded-xl border border-line bg-desk/40 px-3 py-2.5 text-ink outline-none ring-accent/0 transition focus:border-accent focus:ring-4 focus:ring-accent/15"
          />
        </label>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-3 py-2 text-sm font-medium text-muted hover:bg-black/5 hover:text-ink dark:hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-xl bg-ink px-4 py-2 text-sm font-medium text-paper hover:opacity-90"
          >
            {confirmLabel}
          </button>
        </div>
      </form>
    </Modal>
  )
}

type ChoiceDialogProps = {
  title: string
  message: string
  onClose: () => void
  primaryLabel: string
  secondaryLabel: string
  onPrimary: () => void
  onSecondary: () => void
}

export function ChoiceDialog({
  title,
  message,
  onClose,
  primaryLabel,
  secondaryLabel,
  onPrimary,
  onSecondary,
}: ChoiceDialogProps) {
  return (
    <Modal title={title} onClose={onClose}>
      <p className="mb-5 text-sm leading-6 text-muted">{message}</p>
      <div className="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl px-3 py-2 text-sm font-medium text-muted hover:bg-black/5 hover:text-ink dark:hover:bg-white/10"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSecondary}
          className="rounded-xl px-3 py-2 text-sm font-medium ring-1 ring-line hover:bg-black/5 dark:hover:bg-white/10"
        >
          {secondaryLabel}
        </button>
        <button
          type="button"
          onClick={onPrimary}
          className="rounded-xl bg-ink px-4 py-2 text-sm font-medium text-paper hover:opacity-90"
        >
          {primaryLabel}
        </button>
      </div>
    </Modal>
  )
}

export function Toast({ message }: { message: string }) {
  return (
    <div
      role="status"
      className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper shadow-lg"
    >
      {message}
    </div>
  )
}
