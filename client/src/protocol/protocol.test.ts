import { describe, expect, test } from 'vitest'
import { parsePeerEvent, type Message, type PeerEvent } from './protocol'

const message: Message = {
  id: 'm1',
  authorId: 'alice',
  authorName: 'Alice',
  text: 'Hi',
  sentAt: 1000,
  editedAt: null,
  deleted: false,
}

describe('parsePeerEvent', () => {
  test.each<PeerEvent>([
    { type: 'hello', participant: { id: 'alice', name: 'Alice' } },
    { type: 'message', id: 'm1', text: 'Hi', sentAt: 1000 },
    { type: 'edit', id: 'm1', text: 'Hello', editedAt: 2000 },
    { type: 'delete', id: 'm1' },
    { type: 'history', messages: [message, { ...message, id: 'm2', editedAt: 2000 }] },
  ])('accepts a valid $type event', (event) => {
    expect(parsePeerEvent(JSON.stringify(event))).toEqual(event)
  })

  test('drops fields that are not part of the event', () => {
    const data = JSON.stringify({ type: 'delete', id: 'm1', extra: true })
    expect(parsePeerEvent(data)).toEqual({ type: 'delete', id: 'm1' })
  })

  test.each([
    ['invalid JSON', '{'],
    ['a non-object', '"hello"'],
    ['an unknown type', JSON.stringify({ type: 'shout', id: 'm1' })],
    ['a hello without a name', JSON.stringify({ type: 'hello', participant: { id: 'alice' } })],
    ['a message without text', JSON.stringify({ type: 'message', id: 'm1', sentAt: 1000 })],
    ['a blank message', JSON.stringify({ type: 'message', id: 'm1', text: '  ', sentAt: 1000 })],
    [
      'a non-numeric time',
      JSON.stringify({ type: 'message', id: 'm1', text: 'Hi', sentAt: 'now' }),
    ],
    ['a blank edit', JSON.stringify({ type: 'edit', id: 'm1', text: '', editedAt: 2000 })],
    ['a delete without an id', JSON.stringify({ type: 'delete' })],
    [
      'a history with a malformed message',
      JSON.stringify({ type: 'history', messages: [{ ...message, deleted: 'no' }] }),
    ],
  ])('rejects %s', (_, data) => {
    expect(parsePeerEvent(data)).toBeUndefined()
  })
})
