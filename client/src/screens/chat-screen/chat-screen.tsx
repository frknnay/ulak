import { useRef, useState, type FormEvent, type KeyboardEvent, type Ref } from 'react'
import { SendHorizontal, X } from 'lucide-react'
import { useChat } from '../../chat/chat-context'
import type { Message as ChatMessage } from '../../protocol/protocol'
import { IconButton } from '../../components/icon-button/icon-button'
import { Menu } from '../../components/menu/menu'
import { Message } from '../../components/message/message'
import { Notice } from '../../components/notice/notice'
import styles from './chat-screen.module.css'

// Times as in the mockup, such as 09:21.
const timeFormat = new Intl.DateTimeFormat(undefined, {
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

// A message that this participant is changing in the composer.
type Editing = { id: string; original: string; text: string }

export function ChatScreen() {
  const { selfId, log, send, edit, remove } = useChat()
  // The new message keeps its draft while the composer edits another one.
  const [draft, setDraft] = useState('')
  const [editing, setEditing] = useState<Editing | null>(null)
  const input = useRef<HTMLTextAreaElement>(null)

  function startEditing(message: ChatMessage) {
    setEditing({ id: message.id, original: message.text, text: message.text })
    input.current?.focus()
  }

  function deleteMessage(message: ChatMessage) {
    if (!confirm('Delete this message?')) return
    remove(message.id)
    if (editing?.id === message.id) setEditing(null)
  }

  function submit(text: string) {
    if (!editing) {
      send(text)
      setDraft('')
      return
    }
    if (text !== editing.original) edit(editing.id, text)
    setEditing(null)
  }

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
                edited={entry.message.editedAt !== null}
                deleted={entry.message.deleted}
                actions={
                  entry.message.authorId === selfId &&
                  !entry.message.deleted && (
                    <Menu
                      label="Message actions"
                      items={[
                        { label: 'Edit', onSelect: () => startEditing(entry.message) },
                        { label: 'Delete', onSelect: () => deleteMessage(entry.message) },
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
      <Composer
        inputRef={input}
        value={editing ? editing.text : draft}
        editing={editing?.original ?? null}
        onChange={(text) => (editing ? setEditing({ ...editing, text }) : setDraft(text))}
        onSubmit={submit}
        onCancelEdit={() => setEditing(null)}
      />
    </>
  )
}

type ComposerProps = {
  inputRef: Ref<HTMLTextAreaElement>
  value: string
  // The original text of the message being edited, or null for a new one.
  editing: string | null
  onChange: (text: string) => void
  onSubmit: (text: string) => void
  onCancelEdit: () => void
}

function Composer({ inputRef, value, editing, onChange, onSubmit, onCancelEdit }: ComposerProps) {
  const text = value.trim()

  function submit() {
    if (text) onSubmit(text)
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    submit()
  }

  // Enter sends, Shift+Enter starts a new line, and Escape stops editing.
  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      submit()
    } else if (event.key === 'Escape' && editing !== null) {
      onCancelEdit()
    }
  }

  return (
    <form className={styles.composer} onSubmit={handleSubmit}>
      {editing !== null && (
        <div className={styles.editing}>
          <div className={styles.editingLabel}>
            <span>Editing message</span>
            <q className={styles.original}>{editing}</q>
          </div>
          <IconButton label="Cancel editing" className={styles.cancel} onClick={onCancelEdit}>
            <X />
          </IconButton>
        </div>
      )}
      <div className={styles.field}>
        <textarea
          ref={inputRef}
          className={styles.input}
          aria-label="Message"
          placeholder="Write to everyone"
          rows={2}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
        />
        <IconButton
          type="submit"
          label={editing !== null ? 'Save' : 'Send'}
          className={styles.send}
          disabled={!text}
        >
          <SendHorizontal />
        </IconButton>
      </div>
    </form>
  )
}
