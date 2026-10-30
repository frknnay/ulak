import type { FormEvent, KeyboardEvent, Ref } from 'react'
import { SendHorizontal, X } from 'lucide-react'
import { IconButton } from '../../../components/icon-button/icon-button'
import styles from './composer.module.css'

type ComposerProps = {
  inputRef: Ref<HTMLTextAreaElement>
  value: string
  // The original text of the message being edited, or null for a new one.
  editing: string | null
  onChange: (text: string) => void
  onSubmit: (text: string) => void
  onCancelEdit: () => void
}

export function Composer({
  inputRef,
  value,
  editing,
  onChange,
  onSubmit,
  onCancelEdit,
}: ComposerProps) {
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
