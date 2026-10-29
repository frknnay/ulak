import { randomUUID } from 'node:crypto'
import { WebSocketServer, type WebSocket } from 'ws'
import { parseClientMessage, type ServerMessage } from '../signaling/signaling.ts'

// Starts a signaling server on the given port. Port 0 picks a free one.
export function startSignalingServer(port: number): WebSocketServer {
  // Everyone connected is in the one session, keyed by peer id.
  const peers = new Map<string, WebSocket>()

  const server = new WebSocketServer({ port })

  server.on('connection', (socket) => {
    const id = randomUUID()

    send(socket, { type: 'welcome', id, peers: [...peers.keys()] })
    broadcast({ type: 'peer-joined', id })
    peers.set(id, socket)

    socket.on('message', (data) => {
      const message = parseClientMessage(data.toString())
      if (!message) return

      // Relay the handshake to its target, stamped with the sender's id so
      // the target knows which peer connection it belongs to.
      const target = peers.get(message.to)
      if (target) send(target, { type: 'signal', from: id, signal: message.signal })
    })

    socket.on('close', () => {
      peers.delete(id)
      broadcast({ type: 'peer-left', id })
    })
  })

  function broadcast(message: ServerMessage) {
    for (const socket of peers.values()) send(socket, message)
  }

  return server
}

function send(socket: WebSocket, message: ServerMessage) {
  socket.send(JSON.stringify(message))
}
