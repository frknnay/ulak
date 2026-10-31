import { useChat } from '../../chat/chat-context'
import styles from './participants-screen.module.css'

export function ParticipantsScreen() {
  const { selfId, participants } = useChat()
  const sorted = participants.toSorted((a, b) => a.name.localeCompare(b.name))

  return (
    <ul className={styles.list}>
      {sorted.map((participant) => (
        <li key={participant.id} className={styles.participant}>
          {participant.name}
          {participant.id === selfId && <span className={styles.you}> (You)</span>}
        </li>
      ))}
    </ul>
  )
}
