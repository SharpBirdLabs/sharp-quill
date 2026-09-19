import type { ChangeEvent, KeyboardEvent } from 'react'

type MarkdownSourceProps = {
  value: string
  onChange: (value: string) => void
}

export function MarkdownSource({ value, onChange }: MarkdownSourceProps) {
  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    onChange(event.target.value)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Tab') return
    event.preventDefault()
    const target = event.currentTarget
    const start = target.selectionStart
    const end = target.selectionEnd
    const next = `${value.slice(0, start)}  ${value.slice(end)}`
    onChange(next)
    requestAnimationFrame(() => {
      target.selectionStart = target.selectionEnd = start + 2
    })
  }

  return (
    <textarea
      className="markdown-source px-6 py-8 sm:px-10 sm:py-10"
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      placeholder="Start writing..."
      spellCheck
      aria-label="Raw Markdown"
    />
  )
}
