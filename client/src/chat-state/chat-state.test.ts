import { describe, expect, test } from 'vitest'
import type { ChatEvent, Message } from '../protocol/protocol'
import {
  chatLog,
  chatReducer,
  createChatState,
  type ChatAction,
  type ChatState,
} from './chat-state'

const self = { id: 'self', name: 'Sam' }
const alice = { id: 'alice', name: 'Alice' }
const bob = { id: 'bob', name: 'Bob' }

// A session where Sam already sees Alice and Bob.
function session(...actions: ChatAction[]): ChatState {
  return [
    { type: 'joined', participant: alice, at: 0 } as const,
    { type: 'joined', participant: bob, at: 0 } as const,
    ...actions,
  ].reduce(chatReducer, createChatState(self))
}

function from(sender: string, event: ChatEvent): ChatAction {
  return { type: 'received', from: sender, event }
}

const hi = { type: 'message', id: 'm1', text: 'Hi', sentAt: 1000 } as const

function aliceMessage(overrides: Partial<Message> = {}): Message {
  return {
    id: 'm1',
    authorId: 'alice',
    authorName: 'Alice',
    text: 'Hi',
    sentAt: 1000,
    editedAt: null,
    deleted: false,
    ...overrides,
  }
}

describe('messages', () => {
  test('stores a message with its author', () => {
    const state = session(from('alice', hi))
    expect(state.messages.m1).toEqual(aliceMessage())
  })

  test('stores messages that this participant sends', () => {
    const state = session(from('self', hi))
    expect(state.messages.m1).toMatchObject({ authorId: 'self', authorName: 'Sam' })
  })

  test('ignores events from someone who has not said hello', () => {
    const state = session(from('mallory', hi))
    expect(state.messages).toEqual({})
  })

  test('ignores a second message with the same id', () => {
    const state = session(from('alice', hi), from('bob', { ...hi, text: 'Taken over' }))
    expect(state.messages.m1).toEqual(aliceMessage())
  })
})

describe('edits', () => {
  test('replaces the text and marks the message edited', () => {
    const state = session(
      from('alice', hi),
      from('alice', { type: 'edit', id: 'm1', text: 'Hello', editedAt: 2000 }),
    )
    expect(state.messages.m1).toEqual(aliceMessage({ text: 'Hello', editedAt: 2000 }))
  })

  test('ignores an edit by someone other than the author', () => {
    const state = session(
      from('alice', hi),
      from('bob', { type: 'edit', id: 'm1', text: 'Hacked', editedAt: 2000 }),
    )
    expect(state.messages.m1).toEqual(aliceMessage())
  })

  test('ignores an edit to a deleted message', () => {
    const state = session(
      from('alice', hi),
      from('alice', { type: 'delete', id: 'm1' }),
      from('alice', { type: 'edit', id: 'm1', text: 'Back', editedAt: 2000 }),
    )
    expect(state.messages.m1).toEqual(aliceMessage({ text: '', deleted: true }))
  })
})

describe('deletes', () => {
  test('keeps the message in place, deleted and without its text', () => {
    const state = session(from('alice', hi), from('alice', { type: 'delete', id: 'm1' }))
    expect(state.messages.m1).toEqual(aliceMessage({ text: '', deleted: true }))
  })

  test('ignores a delete by someone other than the author', () => {
    const state = session(from('alice', hi), from('bob', { type: 'delete', id: 'm1' }))
    expect(state.messages.m1).toEqual(aliceMessage())
  })
})

describe('history', () => {
  test('adds messages that were sent before this participant joined', () => {
    const state = session(from('alice', { type: 'history', messages: [aliceMessage()] }))
    expect(state.messages.m1).toEqual(aliceMessage())
  })

  test('keeps one copy when several peers send the same message', () => {
    const history: ChatEvent = { type: 'history', messages: [aliceMessage()] }
    const state = session(from('alice', history), from('bob', history))
    const messages = chatLog(state).filter((entry) => entry.kind === 'message')
    expect(messages).toHaveLength(1)
  })

  test('prefers a deleted version over an edited one', () => {
    const state = session(
      from('alice', { type: 'history', messages: [aliceMessage({ text: '', deleted: true })] }),
      from('bob', { type: 'history', messages: [aliceMessage({ text: 'Hello', editedAt: 2000 })] }),
    )
    expect(state.messages.m1).toEqual(aliceMessage({ text: '', deleted: true }))
  })

  test('prefers the later edit', () => {
    const state = session(
      from('alice', { type: 'history', messages: [aliceMessage({ text: 'Two', editedAt: 3000 })] }),
      from('bob', { type: 'history', messages: [aliceMessage({ text: 'One', editedAt: 2000 })] }),
    )
    expect(state.messages.m1).toMatchObject({ text: 'Two', editedAt: 3000 })
  })

  test('does not let a peer change the author of a known message', () => {
    const forged = aliceMessage({ authorId: 'bob', authorName: 'Bob', editedAt: 2000 })
    const state = session(from('alice', hi), from('bob', { type: 'history', messages: [forged] }))
    expect(state.messages.m1).toEqual(aliceMessage())
  })
})

describe('presence', () => {
  test('lists everyone in the session, including this participant', () => {
    expect(Object.values(session().participants)).toEqual([self, alice, bob])
  })

  test('announces a newcomer once, even if they say hello again', () => {
    const carol = { id: 'carol', name: 'Carol' }
    const state = session(
      { type: 'joined', participant: carol, at: 500 },
      { type: 'joined', participant: carol, at: 600 },
    )
    expect(state.participants.carol).toEqual(carol)
    expect(state.notices.map((notice) => notice.text)).toEqual([
      'Alice joined',
      'Bob joined',
      'Carol joined',
    ])
  })

  test('removes someone who leaves and announces it', () => {
    const state = session({ type: 'left', participantId: 'bob', at: 500 })
    expect(state.participants.bob).toBeUndefined()
    expect(state.notices.at(-1)).toMatchObject({ text: 'Bob left', at: 500 })
  })

  test('keeps the messages of someone who left', () => {
    const state = session(from('bob', hi), { type: 'left', participantId: 'bob', at: 2000 })
    expect(state.messages.m1).toMatchObject({ authorName: 'Bob', text: 'Hi' })
  })

  test('ignores a hello that claims to be this participant', () => {
    const state = session({
      type: 'joined',
      participant: { id: 'self', name: 'Imposter' },
      at: 500,
    })
    expect(state.participants.self).toEqual(self)
  })
})

describe('chatLog', () => {
  test('orders messages and notices by time, whatever order they arrived in', () => {
    const state = session(
      from('alice', { ...hi, id: 'late', sentAt: 3000 }),
      { type: 'left', participantId: 'bob', at: 2000 },
      from('alice', { ...hi, id: 'early', sentAt: 1000 }),
    )
    const log = chatLog(state).map((entry) =>
      entry.kind === 'message' ? entry.message.id : entry.notice.text,
    )
    expect(log).toEqual(['Alice joined', 'Bob joined', 'early', 'Bob left', 'late'])
  })
})
