import { Moon, Sun } from 'lucide-react'
import type { Theme } from '../../theme/theme'
import { IconButton } from '../icon-button/icon-button'
import styles from './theme-toggle.module.css'

type ThemeToggleProps = {
  theme: Theme
  onToggle: () => void
}

// Switches between the light and dark theme. It shows the sun in the dark
// theme and the moon in the light one, and is pressed while dark.
export function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  const dark = theme === 'dark'
  return (
    <IconButton label="Dark theme" aria-pressed={dark} className={styles.toggle} onClick={onToggle}>
      {dark ? <Sun /> : <Moon />}
    </IconButton>
  )
}
