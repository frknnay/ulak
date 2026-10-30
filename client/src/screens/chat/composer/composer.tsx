import type { FormEvent, KeyboardEvent, Ref } from 'react'
import { SendHorizontal, X } from 'lucide-react'
import { IconButton } from '../../../components/icon-button/icon-button'
import styles from './composer.module.css'

type ComposerProps = {
  inputRef: Ref<HTMLTextAreaElement>
  value: string
  // The original text of the message being edited, or null for a new one.
  editing: string | null
  // While offline, nothing can be sent, so the input is disabled.
  offline: boolean
  onChange: (text: string) => void
  onSubmit: (text: string) => void
  onCancelEdit: () => void
}

export function Composer({
  inputRef,
  value,
  editing,
  offline,
  onChange,
  onSubmit,
  onCancelEdit,
}: ComposerProps) {
  const text = value.trim()

  function submit() {
    if (text && !offline) onSubmit(text)
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
          <div className={styles.label}>
            <span>Editing message</span>
            <q className={styles.original}>{editing}</q>
          </div>
          <IconButton label="Cancel editing" className={styles.cancel} onClick={onCancelEdit}>
            <X />
          </IconButton>
        </div>
      )}
      {offline && (
        <div role="status" className={`${styles.label} ${styles.offline}`}>
          Offline. Reconnecting…
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
          disabled={offline}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
        />
        <IconButton
          type="submit"
          label={editing !== null ? 'Save' : 'Send'}
          className={styles.send}
          disabled={!text || offline}
        >
          <SendHorizontal />
        </IconButton>
      </div>
    </form>
  )
}
