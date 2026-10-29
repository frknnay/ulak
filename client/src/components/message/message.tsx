import styles from './message.module.css'

type MessageProps = {
  author: string
  time: string
  text: string
}

export function Message({ author, time, text }: MessageProps) {
  return (
    <article>
      <header className={styles.header}>
        <span className={styles.author}>{author}</span>
        <time className={styles.time}>{time}</time>
      </header>
      <p className={styles.text}>{text}</p>
    </article>
  )
}
