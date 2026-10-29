import { useState, type FormEvent, type KeyboardEvent } from 'react'
import { SendHorizontal } from 'lucide-react'
import { IconButton } from '../../components/icon-button/icon-button'
import { Message } from '../../components/message/message'
import { Notice } from '../../components/notice/notice'
import styles from './chat-screen.module.css'

// What the chat log shows: a participant's message, or a notice such as
// "Marcus joined".
export type ChatEntry =
  | { kind: 'message'; id: string; author: string; time: string; text: string }
  | { kind: 'notice'; id: string; time: string; text: string }

type ChatScreenProps = {
  entries: ChatEntry[]
  onSend: (text: string) => void
}

export function ChatScreen({ entries, onSend }: ChatScreenProps) {
  return (
    <>
      <ol className={styles.log}>
        {entries.map((entry) => (
          <li key={entry.id} className={styles.entry}>
            {entry.kind === 'message' ? (
              <Message author={entry.author} time={entry.time} text={entry.text} />
            ) : (
              <Notice time={entry.time} text={entry.text} />
            )}
          </li>
        ))}
      </ol>
      <Composer onSend={onSend} />
    </>
  )
}

function Composer({ onSend }: { onSend: (text: string) => void }) {
  const [draft, setDraft] = useState('')
  const text = draft.trim()

  function send() {
    if (!text) return
    onSend(text)
    setDraft('')
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    send()
  }

  // Enter sends, Shift+Enter starts a new line.
  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      send()
    }
  }

  return (
    <form className={styles.composer} onSubmit={handleSubmit}>
      <textarea
        className={styles.input}
        aria-label="Message"
        placeholder="Write to everyone"
        rows={2}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={handleKeyDown}
      />
      <IconButton type="submit" label="Send" className={styles.send} disabled={!text}>
        <SendHorizontal />
      </IconButton>
    </form>
  )
}
