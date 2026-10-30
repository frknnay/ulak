import type { AriaRole, ReactNode } from 'react'
import styles from './composer-strip.module.css'

type ComposerStripProps = {
  // Accent for what the participant is doing, muted for the chat's state.
  tone?: 'accent' | 'muted'
  role?: AriaRole
  // A control beside the strip, such as a button that closes it.
  action?: ReactNode
  children: ReactNode
}

// A strip above the input, like a reply preview: a quote of the message
// being edited, or that the chat is offline.
export function ComposerStrip({ tone = 'accent', role, action, children }: ComposerStripProps) {
  return (
    <div role={role} className={styles.strip}>
      <div className={`${styles.label} ${styles[tone]}`}>{children}</div>
      {action}
    </div>
  )
}
