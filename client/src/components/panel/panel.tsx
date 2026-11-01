import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { IconButton } from '../icon-button/icon-button'
import styles from './panel.module.css'

type PanelProps = {
  title: string
  // Buttons in the header, before the close button.
  actions?: ReactNode
  onClose?: () => void
  children: ReactNode
}

export function Panel({ title, actions, onClose, children }: PanelProps) {
  return (
    <section className={styles.panel} aria-labelledby="panel-title">
      <header className={styles.header}>
        <h1 id="panel-title" className={styles.title}>
          {title}
        </h1>
        {actions}
        {onClose && (
          <IconButton label="Close" onClick={onClose}>
            <X />
          </IconButton>
        )}
      </header>
      <div className={styles.body}>{children}</div>
    </section>
  )
}
