import styles from './typing-indicator.module.css'

type TypingIndicatorProps = {
  // The others who are writing a message.
  names: string[]
}

// A line above the composer such as "Kiana is typing…". It stays in the
// page while empty, so screen readers announce it when it fills.
export function TypingIndicator({ names }: TypingIndicatorProps) {
  return (
    <div aria-live="polite" className={styles.typing}>
      {typingText(names)}
    </div>
  )
}

function typingText(names: string[]): string {
  switch (names.length) {
    case 0:
      return ''
    case 1:
      return `${names[0]} is typing…`
    case 2:
      return `${names[0]} and ${names[1]} are typing…`
    default:
      return 'Several people are typing…'
  }
}
