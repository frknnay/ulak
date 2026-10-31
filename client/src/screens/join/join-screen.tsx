import type { FormEvent } from 'react'
import { useJoinScreen } from './use-join-screen'
import styles from './join-screen.module.css'

type JoinScreenProps = {
  onJoin: (name: string) => void
}

// Asks for the name that the others will see, before joining the chat.
export function JoinScreen({ onJoin }: JoinScreenProps) {
  const join = useJoinScreen(onJoin)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    join.join()
  }

  return (
    <form className={styles.join} onSubmit={handleSubmit}>
      <label className={styles.field}>
        <span className={styles.label}>Your name</span>
        {/* Selected at first, so typing replaces the suggested name. */}
        <input
          className={styles.input}
          value={join.name}
          maxLength={40}
          autoFocus
          onFocus={(event) => event.target.select()}
          onChange={(event) => join.setName(event.target.value)}
        />
      </label>
      <button type="submit" className={styles.button} disabled={!join.canJoin}>
        Join chat
      </button>
    </form>
  )
}
