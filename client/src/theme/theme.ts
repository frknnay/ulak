export type Theme = 'light' | 'dark'

const storageKey = 'ulak:theme'
const darkQuery = '(prefers-color-scheme: dark)'
const listeners = new Set<() => void>()

// The page follows the OS until the participant picks a theme. Their pick
// lives in localStorage, so every tab and later visit uses it too, and
// sits on <html> as data-theme, which index.css reads.

// Applies the theme picked in an earlier visit. Call it before the first
// render, so the page doesn't flash the OS theme first.
export function restoreTheme(storage: Pick<Storage, 'getItem'> = localStorage) {
  const theme = storage.getItem(storageKey)
  if (theme === 'light' || theme === 'dark') document.documentElement.dataset.theme = theme
}

export function pickTheme(theme: Theme, storage: Pick<Storage, 'setItem'> = localStorage) {
  storage.setItem(storageKey, theme)
  document.documentElement.dataset.theme = theme
  listeners.forEach((listener) => listener())
}

// The theme the page shows now.
export function currentTheme(): Theme {
  const picked = document.documentElement.dataset.theme
  if (picked === 'light' || picked === 'dark') return picked
  return matchMedia(darkQuery).matches ? 'dark' : 'light'
}

// Calls the listener when the current theme may have changed: the
// participant picked one, or the OS switched.
export function subscribeToTheme(listener: () => void): () => void {
  const query = matchMedia(darkQuery)
  listeners.add(listener)
  query.addEventListener('change', listener)
  return () => {
    listeners.delete(listener)
    query.removeEventListener('change', listener)
  }
}
