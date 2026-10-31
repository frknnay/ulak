import { useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react'
import { chatLog, chatReducer, createChatState } from '../chat-state/chat-state'
import type { ChatEvent } from '../protocol/protocol'
import { connectTransport, type Transport } from '../transport/transport'
import { ChatContext, type ChatContextValue } from './chat-context'
import { createConnections } from './connections'
import { loadIdentity } from './identity'

// The signaling server runs next to the client on port 8080. Using the
// page's host lets other devices on the LAN join. The end-to-end tests
// set VITE_SIGNALING_URL to run their own server.
const signalingUrl = import.meta.env.VITE_SIGNALING_URL ?? `ws://${location.hostname}:8080`

// While a participant types, `typing` events go out at most this often.
const typingInterval = 2000
// The others drop the name this long after the last `typing` event, so a
// pause or a closed tab clears it.
const typingTimeout = 4000

// Holds the one chat state and transport for the whole app, and connects
// the two: events from peers go to the reducer, and messages that this
// participant sends go to the reducer and to every peer.
export function ChatProvider({ children }: { children: ReactNode }) {
  const [self] = useState(() => loadIdentity())
  const [state, dispatch] = useReducer(chatReducer, self, createChatState)
  const transport = useRef<Transport | null>(null)
  // Whether the signaling connection is open. Assumed at first, so the
  // composer doesn't flash as offline while the page loads.
  const [online, setOnline] = useState(true)
  // When this participant last sent `typing`.
  const lastTypingAt = useRef(0)

  // The transport callbacks need the latest messages to send as history.
  const latestState = useRef(state)
  useEffect(() => {
    latestState.current = state
  })

  useEffect(() => {
    // The transport knows peers by connection id, and the chat state by
    // participant id.
    const connections = createConnections()
    // Each participant's timer to drop them from the typing list. Every
    // `typing` event from them starts it over.
    const typingTimers = new Map<string, ReturnType<typeof setTimeout>>()

    function restartTypingTimer(participantId: string) {
      clearTimeout(typingTimers.get(participantId))
      const timer = setTimeout(() => {
        typingTimers.delete(participantId)
        dispatch({ type: 'stopped-typing', participantId })
      }, typingTimeout)
      typingTimers.set(participantId, timer)
    }

    const connection = connectTransport(signalingUrl, {
      onOnline: () => setOnline(true),
      onOffline: () => setOnline(false),
      onPeerOpen(peerId) {
        connection.send(peerId, { type: 'hello', participant: self })
        connection.send(peerId, {
          type: 'history',
          messages: Object.values(latestState.current.messages),
        })
      },
      onEvent(peerId, event) {
        if (event.type === 'hello') {
          if (connections.link(peerId, event.participant.id)) {
            dispatch({ type: 'joined', participant: event.participant, at: Date.now() })
          }
          return
        }
        const from = connections.participantOf(peerId)
        if (!from) return
        dispatch({ type: 'received', from, event })
        if (event.type === 'typing') restartTypingTimer(from)
      },
      onPeerClose(peerId) {
        const participantId = connections.unlink(peerId)
        if (participantId) dispatch({ type: 'left', participantId, at: Date.now() })
      },
    })
    transport.current = connection
    return () => {
      connection.close()
      for (const timer of typingTimers.values()) clearTimeout(timer)
    }
  }, [self])

  const value = useMemo<ChatContextValue>(() => {
    // Apply this participant's own events locally, then share them.
    function publish(event: ChatEvent) {
      dispatch({ type: 'received', from: self.id, event })
      transport.current?.broadcast(event)
    }

    return {
      selfId: self.id,
      online,
      participants: Object.values(state.participants),
      log: chatLog(state),
      typingNames: state.typing.map((id) => state.participants[id].name),
      send(text) {
        publish({ type: 'message', id: crypto.randomUUID(), text, sentAt: Date.now() })
        // The message clears this participant's name for the others, so the
        // next draft announces typing again right away.
        lastTypingAt.current = 0
      },
      announceTyping() {
        // Typing is only for the others, so it skips the local reducer.
        const now = Date.now()
        if (now - lastTypingAt.current < typingInterval) return
        lastTypingAt.current = now
        transport.current?.broadcast({ type: 'typing' })
      },
      edit(id, text) {
        publish({ type: 'edit', id, text, editedAt: Date.now() })
      },
      remove(id) {
        publish({ type: 'delete', id })
      },
    }
  }, [self, state, online])

  return <ChatContext value={value}>{children}</ChatContext>
}
