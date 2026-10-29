import { parseServerMessage, type ServerMessage, type Signal } from '@ulak/server/signaling'
import { parsePeerEvent, type PeerEvent } from '../protocol/protocol'

// Connects this tab to every other peer in the session with one
// RTCPeerConnection and one DataChannel each, a full mesh. The signaling
// server only introduces peers and relays their handshake. Peer ids here
// are the server's connection ids, not participant ids.

export type TransportHandlers = {
  // The DataChannel to a peer is open, so events can be sent to it.
  onPeerOpen: (peerId: string) => void
  onEvent: (peerId: string, event: PeerEvent) => void
  // The DataChannel to a peer closed. Only called after onPeerOpen.
  onPeerClose: (peerId: string) => void
}

export type Transport = {
  send: (peerId: string, event: PeerEvent) => void
  broadcast: (event: PeerEvent) => void
  close: () => void
}

type Peer = { connection: RTCPeerConnection; channel?: RTCDataChannel; open: boolean }

export function connectTransport(signalingUrl: string, handlers: TransportHandlers): Transport {
  const socket = new WebSocket(signalingUrl)
  const peers = new Map<string, Peer>()

  // Handle signaling messages one at a time, so an ICE candidate is never
  // added before the offer or answer that precedes it has been applied.
  let queue = Promise.resolve()
  socket.addEventListener('message', (event) => {
    const message = parseServerMessage(String(event.data))
    if (!message) return
    queue = queue.then(() => handleSignaling(message)).catch(console.error)
  })

  async function handleSignaling(message: ServerMessage) {
    switch (message.type) {
      case 'welcome':
        // The newcomer offers to every peer already here, and they only
        // answer, so two peers never send offers to each other.
        for (const peerId of message.peers) await offer(peerId)
        break
      case 'peer-joined':
        // The newcomer will send an offer.
        break
      case 'peer-left':
        closePeer(message.id)
        break
      case 'signal':
        await applySignal(message.from, message.signal)
        break
    }
  }

  async function offer(peerId: string) {
    const peer = createPeer(peerId)
    setUpChannel(peerId, peer, peer.connection.createDataChannel('chat'))
    await peer.connection.setLocalDescription()
    sendSignal(peerId, { kind: 'offer', sdp: peer.connection.localDescription?.sdp ?? '' })
  }

  async function applySignal(peerId: string, signal: Signal) {
    switch (signal.kind) {
      case 'offer': {
        const peer = createPeer(peerId)
        peer.connection.addEventListener('datachannel', (event) => {
          setUpChannel(peerId, peer, event.channel)
        })
        await peer.connection.setRemoteDescription({ type: 'offer', sdp: signal.sdp })
        await peer.connection.setLocalDescription()
        sendSignal(peerId, { kind: 'answer', sdp: peer.connection.localDescription?.sdp ?? '' })
        break
      }
      case 'answer':
        await peers
          .get(peerId)
          ?.connection.setRemoteDescription({ type: 'answer', sdp: signal.sdp })
        break
      case 'ice':
        await peers.get(peerId)?.connection.addIceCandidate(signal.candidate)
        break
    }
  }

  function createPeer(peerId: string): Peer {
    // No ICE servers: peers reach each other on localhost or the same LAN.
    const peer: Peer = { connection: new RTCPeerConnection(), open: false }
    peers.set(peerId, peer)

    peer.connection.addEventListener('icecandidate', ({ candidate }) => {
      if (!candidate) return
      sendSignal(peerId, {
        kind: 'ice',
        candidate: {
          candidate: candidate.candidate,
          sdpMid: candidate.sdpMid,
          sdpMLineIndex: candidate.sdpMLineIndex,
        },
      })
    })
    peer.connection.addEventListener('connectionstatechange', () => {
      if (peer.connection.connectionState === 'failed') closePeer(peerId)
    })
    return peer
  }

  function setUpChannel(peerId: string, peer: Peer, channel: RTCDataChannel) {
    peer.channel = channel
    channel.addEventListener('open', () => {
      peer.open = true
      handlers.onPeerOpen(peerId)
    })
    channel.addEventListener('message', (event) => {
      const peerEvent = parsePeerEvent(String(event.data))
      if (peerEvent) handlers.onEvent(peerId, peerEvent)
    })
    channel.addEventListener('close', () => closePeer(peerId))
  }

  function closePeer(peerId: string) {
    const peer = peers.get(peerId)
    if (!peer) return
    peers.delete(peerId)
    peer.connection.close()
    if (peer.open) handlers.onPeerClose(peerId)
  }

  function sendSignal(to: string, signal: Signal) {
    socket.send(JSON.stringify({ type: 'signal', to, signal }))
  }

  function send(peerId: string, event: PeerEvent) {
    const channel = peers.get(peerId)?.channel
    if (channel?.readyState === 'open') channel.send(JSON.stringify(event))
  }

  return {
    send,
    broadcast(event) {
      for (const peerId of peers.keys()) send(peerId, event)
    },
    close() {
      socket.close()
      for (const peerId of [...peers.keys()]) closePeer(peerId)
    },
  }
}
