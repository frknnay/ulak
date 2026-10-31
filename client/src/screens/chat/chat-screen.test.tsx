// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, expect, test } from 'vitest'
import { ChatContext } from '../../chat/chat-context'
import type { ChatLogEntry } from '../../chat-state/chat-state'
import { ChatScreen } from './chat-screen'

afterEach(cleanup)

function message(id: string, authorId: string, authorName: string, text: string): ChatLogEntry {
  return {
    kind: 'message',
    message: { id, authorId, authorName, text, sentAt: 0, editedAt: null, deleted: false },
  }
}

// Shows the chat screen to Alice, whose id is 'alice', while the others
// in `typingNames` write a message.
function renderChat(log: ChatLogEntry[], typingNames: string[] = []) {
  render(
    <ChatContext
      value={{
        selfId: 'alice',
        online: true,
        participants: [],
        log,
        typingNames,
        send: () => {},
        announceTyping: () => {},
        edit: () => {},
        remove: () => {},
      }}
    >
      <ChatScreen />
    </ChatContext>,
  )
}

// The message that shows this text.
function article(text: string) {
  return screen.getAllByRole('article').find((element) => within(element).queryByText(text))!
}

test('own messages show You as the author', () => {
  renderChat([message('1', 'alice', 'Guest 1234', 'Mine')])

  expect(within(article('Mine')).queryByText('You')).not.toBeNull()
  expect(screen.queryByText('Guest 1234')).toBeNull()
})

test("others' messages show the author's name", () => {
  renderChat([message('1', 'bob', 'Guest 5678', 'Theirs')])

  expect(within(article('Theirs')).queryByText('Guest 5678')).not.toBeNull()
  expect(screen.queryByText('You')).toBeNull()
})

test.each([
  [['Guest 5678'], 'Guest 5678 is typing…'],
  [['Guest 5678', 'Guest 9012'], 'Guest 5678 and Guest 9012 are typing…'],
  [['Guest 5678', 'Guest 9012', 'Guest 3456'], 'Several people are typing…'],
])('shows who is typing: %j', (names, text) => {
  renderChat([], names)

  expect(screen.queryByText(text)).not.toBeNull()
})

test('shows no typing line while nobody types', () => {
  renderChat([])

  expect(screen.queryByText(/typing…/)).toBeNull()
})
