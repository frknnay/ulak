import { Info } from 'lucide-react'
import styles from './notice.module.css'

type NoticeProps = {
  time: string
  text: string
}

export function Notice({ time, text }: NoticeProps) {
  return (
    <div className={styles.notice}>
      <span className={styles.text}>
        <Info aria-hidden className={styles.icon} />
        {text}
      </span>
      <time className={styles.time}>{time}</time>
    </div>
  )
}
