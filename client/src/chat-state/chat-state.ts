import type { ChatEvent, Message, Participant } from '../protocol/protocol'

// A line in the log such as "Marcus joined". Notices are local: each peer
// records them when it sees someone come or go, and they are not shared.
export type Notice = { id: string; text: string; at: number }

export type ChatState = {
  selfId: string
  // Everyone in the session, including this participant.
  participants: Record<string, Participant>
  messages: Record<string, Message>
  notices: Notice[]
  // Others who are writing a message, in the order they started.
  typing: string[]
}

export type ChatAction =
  | { type: 'joined'; participant: Participant; at: number }
  | { type: 'left'; participantId: string; at: number }
  // An event from a participant, or from this participant itself.
  | { type: 'received'; from: string; event: ChatEvent }
  // No `typing` event has come from this participant for a while.
  | { type: 'stopped-typing'; participantId: string }

export type ChatLogEntry =
  { kind: 'message'; message: Message } | { kind: 'notice'; notice: Notice }

export function createChatState(self: Participant): ChatState {
  return {
    selfId: self.id,
    participants: { [self.id]: self },
    messages: {},
    notices: [],
    typing: [],
  }
}

export function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'joined': {
      const { participant } = action
      if (participant.id === state.selfId) return state

      // A peer that reconnects says hello again, so only announce new ones.
      const isNew = !(participant.id in state.participants)
      return {
        ...state,
        participants: { ...state.participants, [participant.id]: participant },
        notices: isNew ? addNotice(state, `${participant.name} joined`, action.at) : state.notices,
      }
    }
    case 'left': {
      const participant = state.participants[action.participantId]
      if (!participant || participant.id === state.selfId) return state

      const participants = { ...state.participants }
      delete participants[participant.id]
      return {
        ...state,
        participants,
        notices: addNotice(state, `${participant.name} left`, action.at),
        typing: withoutTyping(state, participant.id),
      }
    }
    case 'received':
      return applyEvent(state, action.from, action.event)
    case 'stopped-typing':
      return { ...state, typing: withoutTyping(state, action.participantId) }
  }
}

function applyEvent(state: ChatState, from: string, event: ChatEvent): ChatState {
  const sender = state.participants[from]
  if (!sender) return state

  switch (event.type) {
    case 'message': {
      if (event.id in state.messages) return state
      // Sending ends the typing, so the name goes away with the message.
      const typing = withoutTyping(state, from)
      return withMessage(
        { ...state, typing },
        {
          id: event.id,
          authorId: from,
          authorName: sender.name,
          text: event.text,
          sentAt: event.sentAt,
          editedAt: null,
          deleted: false,
        },
      )
    }
    case 'edit': {
      // Only the author may edit, and a deleted message stays deleted.
      const message = state.messages[event.id]
      if (!message || message.authorId !== from || message.deleted) return state
      return withMessage(state, { ...message, text: event.text, editedAt: event.editedAt })
    }
    case 'delete': {
      const message = state.messages[event.id]
      if (!message || message.authorId !== from) return state
      return withMessage(state, { ...message, text: '', deleted: true })
    }
    case 'history': {
      const messages = { ...state.messages }
      for (const incoming of event.messages) {
        const known = messages[incoming.id]
        messages[incoming.id] = known ? mergeMessage(known, incoming) : incoming
      }
      return { ...state, messages }
    }
    case 'typing': {
      if (from === state.selfId || state.typing.includes(from)) return state
      return { ...state, typing: [...state.typing, from] }
    }
  }
}

// Two peers can hold different versions of a message. A delete beats any
// edit, and otherwise the later edit wins.
function mergeMessage(known: Message, incoming: Message): Message {
  if (incoming.authorId !== known.authorId || known.deleted) return known
  if (incoming.deleted) return incoming
  return (incoming.editedAt ?? 0) > (known.editedAt ?? 0) ? incoming : known
}

// Messages and notices in one list, oldest first.
export function chatLog(state: ChatState): ChatLogEntry[] {
  const entries = [
    ...Object.values(state.messages).map((message) => ({
      at: message.sentAt,
      entry: { kind: 'message', message } as const,
    })),
    ...state.notices.map((notice) => ({
      at: notice.at,
      entry: { kind: 'notice', notice } as const,
    })),
  ]
  return entries.sort((a, b) => a.at - b.at).map(({ entry }) => entry)
}

function withMessage(state: ChatState, message: Message): ChatState {
  return { ...state, messages: { ...state.messages, [message.id]: message } }
}

function withoutTyping(state: ChatState, participantId: string): string[] {
  return state.typing.filter((id) => id !== participantId)
}

function addNotice(state: ChatState, text: string, at: number): Notice[] {
  return [...state.notices, { id: `notice-${state.notices.length}`, text, at }]
}
