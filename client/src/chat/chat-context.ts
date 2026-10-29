import { createContext, use } from 'react'
import type { ChatLogEntry } from '../chat-state/chat-state'
import type { Participant } from '../protocol/protocol'

export type ChatContextValue = {
  selfId: string
  participants: Participant[]
  log: ChatLogEntry[]
  send: (text: string) => void
}

export const ChatContext = createContext<ChatContextValue | null>(null)

// The chat that ChatProvider holds. Screens call this to read the chat
// and send messages.
export function useChat(): ChatContextValue {
  const chat = use(ChatContext)
  if (!chat) throw new Error('useChat must be used inside ChatProvider')
  return chat
}
