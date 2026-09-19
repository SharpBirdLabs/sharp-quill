import { useCallback, useState } from 'react'
import { loadTheme, saveTheme, type Theme } from '../lib/storage'

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => loadTheme())

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next)
    saveTheme(next)
    document.documentElement.classList.toggle('dark', next === 'dark')
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }, [setTheme, theme])

  return { theme, setTheme, toggleTheme }
}
