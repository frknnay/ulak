import { createContext, use } from 'react'
import type { ChatLogEntry } from '../chat-state/chat-state'
import type { Participant } from '../protocol/protocol'

export type ChatContextValue = {
  selfId: string
  participants: Participant[]
  log: ChatLogEntry[]
  send: (text: string) => void
  // Only the author's edits and deletes count, so these are for own messages.
  edit: (id: string, text: string) => void
  remove: (id: string) => void
}

export const ChatContext = createContext<ChatContextValue | null>(null)

// The chat that ChatProvider holds. Screens call this to read the chat
// and to send, edit and delete messages.
export function useChat(): ChatContextValue {
  const chat = use(ChatContext)
  if (!chat) throw new Error('useChat must be used inside ChatProvider')
  return chat
}
