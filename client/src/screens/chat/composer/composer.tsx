import type { FormEvent, KeyboardEvent, RefObject } from 'react'
import { SendHorizontal, X } from 'lucide-react'
import { EmojiPicker } from '../../../components/emoji-picker/emoji-picker'
import { IconButton } from '../../../components/icon-button/icon-button'
import { ComposerStrip } from './composer-strip/composer-strip'
import styles from './composer.module.css'

type ComposerProps = {
  inputRef: RefObject<HTMLTextAreaElement | null>
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

  // Puts the emoji in place of the selected text, or at the cursor, and
  // leaves the cursor after it so typing carries on from there.
  function insertEmoji(emoji: string) {
    const input = inputRef.current
    if (!input) return
    input.setRangeText(emoji, input.selectionStart, input.selectionEnd, 'end')
    input.focus()
    onChange(input.value)
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
        <ComposerStrip
          action={
            <IconButton label="Cancel editing" className={styles.cancel} onClick={onCancelEdit}>
              <X />
            </IconButton>
          }
        >
          <span>Editing message</span>
          <q className={styles.original}>{editing}</q>
        </ComposerStrip>
      )}
      {offline && (
        <ComposerStrip tone="muted" role="status">
          Offline. Reconnecting…
        </ComposerStrip>
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
        <div className={styles.toolbar}>
          <EmojiPicker disabled={offline} onSelect={insertEmoji} />
          <IconButton
            type="submit"
            label={editing !== null ? 'Save' : 'Send'}
            className={styles.send}
            disabled={!text || offline}
          >
            <SendHorizontal />
          </IconButton>
        </div>
      </div>
    </form>
  )
}
