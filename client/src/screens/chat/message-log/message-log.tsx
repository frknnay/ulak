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

// Whether a message continues its author's group: the entry before it is a
// message from the same author. Another author's message or a notice
// starts a new group.
function continuesGroup(previous: ChatLogEntry | undefined, message: ChatMessage): boolean {
  return previous?.kind === 'message' && previous.message.authorId === message.authorId
}

type MessageLogProps = {
  log: ChatLogEntry[]
  // The name shown above the message.
  authorName: (message: ChatMessage) => string
  // Whether this participant may edit and delete the message.
  canChange: (message: ChatMessage) => boolean
  onEdit: (message: ChatMessage) => void
  onDelete: (message: ChatMessage) => void
}

export function MessageLog({ log, authorName, canChange, onEdit, onDelete }: MessageLogProps) {
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
      {log.map((entry, index) => {
        if (entry.kind === 'notice') {
          return (
            <li key={entry.notice.id} className={styles.entry}>
              <Notice time={timeFormat.format(entry.notice.at)} text={entry.notice.text} />
            </li>
          )
        }
        const continued = continuesGroup(log[index - 1], entry.message)
        return (
          <li
            key={entry.message.id}
            className={continued ? `${styles.entry} ${styles.continued}` : styles.entry}
          >
            <Message
              author={continued ? null : authorName(entry.message)}
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
        )
      })}
    </ol>
  )
}
