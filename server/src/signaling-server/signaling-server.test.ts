import assert from 'node:assert/strict'
import { once } from 'node:events'
import { test, type TestContext } from 'node:test'
import { WebSocket } from 'ws'
import { parseServerMessage, type ServerMessage } from '../signaling/signaling.ts'
import { startSignalingServer } from './signaling-server.ts'

const offer = { kind: 'offer', sdp: 'v=0' } as const

test('tells a newcomer its id and the peers already in the session', async (t) => {
  const join = await startServer(t)
  const alice = await join()
  const bob = await join()

  assert.deepEqual(alice.welcome.peers, [])
  assert.deepEqual(bob.welcome.peers, [alice.id])
  assert.notEqual(alice.id, bob.id)
})

test('announces joins and leaves to the other peers', async (t) => {
  const join = await startServer(t)
  const alice = await join()
  const bob = await join()

  assert.deepEqual(await alice.next(), { type: 'peer-joined', id: bob.id })

  bob.socket.close()
  assert.deepEqual(await alice.next(), { type: 'peer-left', id: bob.id })
})

test('relays a signal only to its target, stamped with the sender', async (t) => {
  const join = await startServer(t)
  const alice = await join()
  const bob = await join()
  const carol = await join()
  await alice.next() // bob joined
  await alice.next() // carol joined
  await bob.next() // carol joined

  carol.send({ type: 'signal', to: alice.id, signal: offer })
  carol.socket.close()

  assert.deepEqual(await alice.next(), { type: 'signal', from: carol.id, signal: offer })
  // Bob's next message is the leave, so the signal did not reach him.
  assert.deepEqual(await bob.next(), { type: 'peer-left', id: carol.id })
})

test('ignores malformed messages and unknown targets', async (t) => {
  const join = await startServer(t)
  const alice = await join()
  const bob = await join()
  await alice.next() // bob joined

  bob.socket.send('not json')
  bob.send({ type: 'signal', to: alice.id, signal: { kind: 'offer' } })
  bob.send({ type: 'shout', to: alice.id, signal: offer })
  bob.send({ type: 'signal', to: 'nobody', signal: offer })
  bob.send({ type: 'signal', to: alice.id, signal: offer })

  // The valid signal is the first thing Alice receives.
  assert.deepEqual(await alice.next(), { type: 'signal', from: bob.id, signal: offer })
})

// Starts a server on a free port for one test and returns a function that
// connects a new peer to it. Everything is closed when the test ends.
async function startServer(t: TestContext) {
  const server = startSignalingServer(0)
  await once(server, 'listening')
  const address = server.address()
  assert(address !== null && typeof address === 'object')

  const sockets: WebSocket[] = []
  t.after(() => {
    for (const socket of sockets) socket.close()
    server.close()
  })

  return async function join() {
    const socket = new WebSocket(`ws://localhost:${address.port}`)
    sockets.push(socket)
    const peer = listen(socket)
    const welcome = await peer.next()
    assert(welcome.type === 'welcome')
    return { ...peer, socket, welcome, id: welcome.id }
  }
}

// Queues the messages that a socket receives so a test can await them in
// order without missing any that arrive early.
function listen(socket: WebSocket) {
  const received: ServerMessage[] = []
  const waiting: ((message: ServerMessage) => void)[] = []

  socket.on('message', (data) => {
    const message = parseServerMessage(data.toString())
    assert(message, `unexpected message: ${data.toString()}`)
    const resolve = waiting.shift()
    if (resolve) resolve(message)
    else received.push(message)
  })

  return {
    next(): Promise<ServerMessage> {
      const message = received.shift()
      if (message) return Promise.resolve(message)
      return new Promise((resolve) => waiting.push(resolve))
    },
    send(message: unknown) {
      socket.send(JSON.stringify(message))
    },
  }
}
