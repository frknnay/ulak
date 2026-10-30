import { useRef, useState } from 'react'
import { useChat } from '../../chat/chat-context'
import type { Message } from '../../protocol/protocol'

// A message that this participant is changing in the composer.
type Editing = { id: string; original: string; text: string }

// The chat log and the composer: what it shows, and what sending, editing
// and deleting a message do.
export function useChatScreen() {
  const { selfId, online, log, send, edit, remove } = useChat()
  // The new message keeps its draft while the composer edits another one.
  const [draft, setDraft] = useState('')
  const [editing, setEditing] = useState<Editing | null>(null)
  const input = useRef<HTMLTextAreaElement>(null)

  return {
    log,
    online,
    // The composer's text box, focused when editing starts.
    input,
    // The composer's text: the message being edited, or the new one.
    text: editing ? editing.text : draft,
    // The original text of the message being edited, or null for a new one.
    editingOriginal: editing?.original ?? null,

    // Only the author can change a message, and not after deleting it.
    canChange(message: Message) {
      return message.authorId === selfId && !message.deleted
    },

    setText(text: string) {
      if (editing) setEditing({ ...editing, text })
      else setDraft(text)
    },

    startEditing(message: Message) {
      setEditing({ id: message.id, original: message.text, text: message.text })
      input.current?.focus()
    },

    cancelEditing() {
      setEditing(null)
    },

    deleteMessage(message: Message) {
      if (!confirm('Delete this message?')) return
      remove(message.id)
      if (editing?.id === message.id) setEditing(null)
    },

    submit(text: string) {
      if (!editing) {
        send(text)
        setDraft('')
        return
      }
      if (text !== editing.original) edit(editing.id, text)
      setEditing(null)
    },
  }
}
