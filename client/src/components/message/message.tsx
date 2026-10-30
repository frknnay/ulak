import type { ReactNode } from 'react'
import styles from './message.module.css'

type MessageProps = {
  // The author's name, or null when the message continues the author's
  // group and shows only its text.
  author: string | null
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
      {author !== null && <header className={styles.author}>{author}</header>}
      <div className={styles.body}>
        {deleted ? (
          <p className={styles.deleted}>Message deleted</p>
        ) : (
          <p className={styles.text}>{text}</p>
        )}
        <span className={styles.meta}>
          {edited && !deleted && <span className={styles.edited}>(edited)</span>}
          <time className={styles.time}>{time}</time>
          {actions && <span className={styles.actions}>{actions}</span>}
        </span>
      </div>
    </article>
  )
}
