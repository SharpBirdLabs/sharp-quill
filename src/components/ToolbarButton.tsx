import type { ReactNode } from 'react'
import { cn } from '../lib/cn'

type ToolbarButtonProps = {
  label: string
  shortcut?: string
  active?: boolean
  disabled?: boolean
  onClick: () => void
  children: ReactNode
  wide?: boolean
}

export function ToolbarButton({
  label,
  shortcut,
  active,
  disabled,
  onClick,
  children,
  wide,
}: ToolbarButtonProps) {
  const hint = shortcut ? `${label} · ${shortcut}` : label

  return (
    <button
      type="button"
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      aria-label={hint}
      aria-pressed={active}
      className={cn(
        'group relative inline-flex h-9 items-center justify-center rounded-lg text-ink transition-colors',
        wide ? 'min-w-9 gap-1 px-2 text-[13px] font-semibold tracking-wide' : 'w-9',
        'hover:bg-black/5 hover:text-ink dark:hover:bg-white/10',
        'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent',
        active &&
          'bg-accent/20 text-accent ring-1 ring-accent/40 hover:bg-accent/25 hover:text-accent dark:hover:bg-accent/25',
        disabled && 'pointer-events-none opacity-35',
      )}
    >
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute top-[calc(100%+8px)] left-1/2 z-30 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-ink px-2 py-1 text-[11px] font-medium tracking-wide text-paper opacity-0 shadow-lg transition group-hover:opacity-100 sm:block"
      >
        {hint}
      </span>
    </button>
  )
}

export function ToolbarDivider() {
  return <span aria-hidden className="mx-1 hidden h-6 w-px bg-line sm:block" />
}
