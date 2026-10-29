import styles from './participants-screen.module.css'

type Participant = {
  id: string
  name: string
}

type ParticipantsScreenProps = {
  participants: Participant[]
}

export function ParticipantsScreen({ participants }: ParticipantsScreenProps) {
  return (
    <ul className={styles.list}>
      {participants.map((participant) => (
        <li key={participant.id} className={styles.participant}>
          {participant.name}
        </li>
      ))}
    </ul>
  )
}
