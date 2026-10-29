import { useState, type FormEvent, type KeyboardEvent } from 'react'
import { SendHorizontal } from 'lucide-react'
import { useChat } from '../../chat/chat-context'
import { IconButton } from '../../components/icon-button/icon-button'
import { Message } from '../../components/message/message'
import { Notice } from '../../components/notice/notice'
import styles from './chat-screen.module.css'

// Times as in the mockup, such as 09:21.
const timeFormat = new Intl.DateTimeFormat(undefined, {
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

export function ChatScreen() {
  const { log, send } = useChat()

  return (
    <>
      <ol className={styles.log}>
        {log.map((entry) =>
          entry.kind === 'message' ? (
            <li key={entry.message.id} className={styles.entry}>
              <Message
                author={entry.message.authorName}
                time={timeFormat.format(entry.message.sentAt)}
                text={entry.message.text}
              />
            </li>
          ) : (
            <li key={entry.notice.id} className={styles.entry}>
              <Notice time={timeFormat.format(entry.notice.at)} text={entry.notice.text} />
            </li>
          ),
        )}
      </ol>
      <Composer onSend={send} />
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
