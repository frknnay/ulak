import { useLayoutEffect, useRef } from 'react'
import type { ChatLogEntry } from '../../../chat-state/chat-state'
import { Menu } from '../../../components/menu/menu'
import { Message } from '../../../components/message/message'
import { Notice } from '../../../components/notice/notice'
import type { Message as ChatMessage } from '../../../protocol/protocol'
import styles from './message-log.module.css'

// Times as in the mockup, such as 09:21.
const timeFormat = new Intl.DateTimeFormat(undefined, {
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

// How close to the bottom, in pixels, still counts as reading the newest
// messages.
const bottomSlack = 40

type MessageLogProps = {
  log: ChatLogEntry[]
  // Whether this participant may edit and delete the message.
  canChange: (message: ChatMessage) => boolean
  onEdit: (message: ChatMessage) => void
  onDelete: (message: ChatMessage) => void
}

export function MessageLog({ log, canChange, onEdit, onDelete }: MessageLogProps) {
  const element = useRef<HTMLOListElement>(null)
  // Whether the log scrolls to new entries. It stops while the participant
  // scrolls up to read older messages, so they don't jump away.
  const following = useRef(true)

  useLayoutEffect(() => {
    const list = element.current
    if (list && following.current) list.scrollTop = list.scrollHeight
  }, [log])

  function handleScroll() {
    const list = element.current
    if (!list) return
    following.current = list.scrollHeight - list.scrollTop - list.clientHeight <= bottomSlack
  }

  return (
    <ol ref={element} className={styles.log} onScroll={handleScroll}>
      {log.map((entry) =>
        entry.kind === 'message' ? (
          <li key={entry.message.id} className={styles.entry}>
            <Message
              author={entry.message.authorName}
              time={timeFormat.format(entry.message.sentAt)}
              text={entry.message.text}
              edited={entry.message.editedAt !== null}
              deleted={entry.message.deleted}
              actions={
                canChange(entry.message) && (
                  <Menu
                    label="Message actions"
                    items={[
                      { label: 'Edit', onSelect: () => onEdit(entry.message) },
                      { label: 'Delete', onSelect: () => onDelete(entry.message) },
                    ]}
                  />
                )
              }
            />
          </li>
        ) : (
          <li key={entry.notice.id} className={styles.entry}>
            <Notice time={timeFormat.format(entry.notice.at)} text={entry.notice.text} />
          </li>
        ),
      )}
    </ol>
  )
}
