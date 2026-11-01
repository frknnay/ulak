import { useSyncExternalStore } from 'react'
import { currentTheme, subscribeToTheme } from './theme'

// The theme the page shows now, kept up to date.
export function useTheme() {
  return useSyncExternalStore(subscribeToTheme, currentTheme)
}
