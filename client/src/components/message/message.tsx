import type { ReactNode } from 'react'
import styles from './message.module.css'

type MessageProps = {
  author: string
  time: string
  text: string
  edited: boolean
  deleted: boolean
  // Controls shown after the time, such as a menu on own messages.
  actions?: ReactNode
}

export function Message({ author, time, text, edited, deleted, actions }: MessageProps) {
  return (
    <article className={styles.message}>
      <header className={styles.header}>
        <span className={styles.author}>{author}</span>
        <span className={styles.meta}>
          {edited && !deleted && <span className={styles.edited}>(edited)</span>}
          <time className={styles.time}>{time}</time>
          {actions && <span className={styles.actions}>{actions}</span>}
        </span>
      </header>
      {deleted ? (
        <p className={styles.deleted}>Message deleted</p>
      ) : (
        <p className={styles.text}>{text}</p>
      )}
    </article>
  )
}
