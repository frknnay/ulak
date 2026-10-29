// Messages between a client and the signaling server. The server only
// introduces peers and relays their WebRTC handshake. Chat messages never
// pass through it.

// One step of the WebRTC handshake between two peers. The newcomer sends
// an offer to every peer already in the session, and each one answers.
export type Signal =
  | { kind: 'offer'; sdp: string }
  | { kind: 'answer'; sdp: string }
  | {
      kind: 'ice'
      candidate: { candidate: string; sdpMid: string | null; sdpMLineIndex: number | null }
    }

export type ClientMessage = { type: 'signal'; to: string; signal: Signal }

export type ServerMessage =
  // Sent once on connect: the client's own id and the peers already here.
  | { type: 'welcome'; id: string; peers: string[] }
  | { type: 'peer-joined'; id: string }
  | { type: 'peer-left'; id: string }
  | { type: 'signal'; from: string; signal: Signal }

export function parseClientMessage(data: string): ClientMessage | undefined {
  const message = parseJson(data)
  if (
    isRecord(message) &&
    message.type === 'signal' &&
    typeof message.to === 'string' &&
    isSignal(message.signal)
  ) {
    return { type: 'signal', to: message.to, signal: message.signal }
  }
  return undefined
}

export function parseServerMessage(data: string): ServerMessage | undefined {
  const message = parseJson(data)
  if (!isRecord(message)) return undefined

  switch (message.type) {
    case 'welcome':
      return typeof message.id === 'string' && isStringArray(message.peers)
        ? { type: 'welcome', id: message.id, peers: message.peers }
        : undefined
    case 'peer-joined':
    case 'peer-left':
      return typeof message.id === 'string' ? { type: message.type, id: message.id } : undefined
    case 'signal':
      return typeof message.from === 'string' && isSignal(message.signal)
        ? { type: 'signal', from: message.from, signal: message.signal }
        : undefined
    default:
      return undefined
  }
}

function isSignal(value: unknown): value is Signal {
  if (!isRecord(value)) return false

  switch (value.kind) {
    case 'offer':
    case 'answer':
      return typeof value.sdp === 'string'
    case 'ice': {
      const candidate = value.candidate
      return (
        isRecord(candidate) &&
        typeof candidate.candidate === 'string' &&
        (candidate.sdpMid === null || typeof candidate.sdpMid === 'string') &&
        (candidate.sdpMLineIndex === null || typeof candidate.sdpMLineIndex === 'number')
      )
    }
    default:
      return false
  }
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

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}
