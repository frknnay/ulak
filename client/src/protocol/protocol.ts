// Events that peers exchange over their DataChannels, as JSON. The README
// documents this protocol.
//
// The transport tells the receiver which peer sent an event, so events
// don't name their sender. When a DataChannel opens, each side sends
// `hello` and then `history`.

export type Participant = { id: string; name: string }

// A chat message as every peer stores it. A deleted message keeps its
// place in the log with its text cleared.
export type Message = {
  id: string
  authorId: string
  authorName: string
  text: string
  // Milliseconds since the epoch, from the author's clock.
  sentAt: number
  editedAt: number | null
  deleted: boolean
}

export type PeerEvent =
  // Who the sender is. Its id stays the same across reloads.
  | { type: 'hello'; participant: Participant }
  | { type: 'message'; id: string; text: string; sentAt: number }
  | { type: 'edit'; id: string; text: string; editedAt: number }
  | { type: 'delete'; id: string }
  // Every message the sender knows, so a newcomer sees what came before.
  | { type: 'history'; messages: Message[] }

// The events that change the chat log, as opposed to `hello`.
export type ChatEvent = Exclude<PeerEvent, { type: 'hello' }>

export function parsePeerEvent(data: string): PeerEvent | undefined {
  const event = parseJson(data)
  if (!isRecord(event)) return undefined

  switch (event.type) {
    case 'hello':
      return isParticipant(event.participant)
        ? { type: 'hello', participant: event.participant }
        : undefined
    case 'message':
      return typeof event.id === 'string' && isText(event.text) && isTime(event.sentAt)
        ? { type: 'message', id: event.id, text: event.text, sentAt: event.sentAt }
        : undefined
    case 'edit':
      return typeof event.id === 'string' && isText(event.text) && isTime(event.editedAt)
        ? { type: 'edit', id: event.id, text: event.text, editedAt: event.editedAt }
        : undefined
    case 'delete':
      return typeof event.id === 'string' ? { type: 'delete', id: event.id } : undefined
    case 'history':
      return Array.isArray(event.messages) && event.messages.every(isMessage)
        ? { type: 'history', messages: event.messages }
        : undefined
    default:
      return undefined
  }
}

function isParticipant(value: unknown): value is Participant {
  return isRecord(value) && typeof value.id === 'string' && typeof value.name === 'string'
}

function isMessage(value: unknown): value is Message {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.authorId === 'string' &&
    typeof value.authorName === 'string' &&
    typeof value.text === 'string' &&
    isTime(value.sentAt) &&
    (value.editedAt === null || isTime(value.editedAt)) &&
    typeof value.deleted === 'boolean'
  )
}

// Message text must have something besides whitespace.
function isText(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== ''
}

function isTime(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function parseJson(data: string): unknown {
  try {
    return JSON.parse(data)
  } catch {
    return undefined
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
