/** Modifier label that matches the user's platform. */
export function modKey() {
  if (typeof navigator === 'undefined') return 'Ctrl'
  return /mac|iphone|ipad|ipod/i.test(navigator.userAgent) ? '⌘' : 'Ctrl'
}

export function shortcut(combo: string) {
  return combo.replace('Mod', modKey())
}
