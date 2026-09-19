type LogoProps = {
  className?: string
  title?: string
}

/** SharpQuill mark: a SharpBird whose tail is a writing nib. */
export function Logo({ className = 'h-10 w-10', title = 'SharpQuill' }: LogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      role="img"
      aria-label={title}
    >
      <rect width="64" height="64" rx="14" fill="#F3EEE3" />
      <rect x="3" y="3" width="58" height="58" rx="12" fill="#FFFDF8" />
      <path
        fill="#1E3A5F"
        d="M18 40c0-11 10-22 23-23 5-.4 9 2 10 6 1.2 4.2-1.5 7.4-5.6 8.6-3 .8-5.2 3.6-4.4 8 1 5.4-3.2 10-10 10-8 0-13-4.2-13-9.6Z"
      />
      <path fill="#1E3A5F" d="M36 16.5 52 10l-6.2 16.5-8.3-2.2Z" />
      <path fill="#D4A017" d="m44.5 28.5 9.5-2.8-6.2 8.4Z" />
      <path fill="#D4A017" d="m28.5 44.5 12.8 12.2-15.4-5.4Z" />
    </svg>
  )
}
