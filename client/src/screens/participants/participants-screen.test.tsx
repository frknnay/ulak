// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, test } from 'vitest'
import { ChatContext } from '../../chat/chat-context'
import { ParticipantsScreen } from './participants-screen'

afterEach(cleanup)

test('lists everyone by name and marks this participant as You', () => {
  render(
    <ChatContext
      value={{
        selfId: 'bob',
        online: true,
        participants: [
          { id: 'bob', name: 'Bob' },
          { id: 'alice', name: 'Alice' },
        ],
        log: [],
        typingNames: [],
        send: () => {},
        announceTyping: () => {},
        edit: () => {},
        remove: () => {},
      }}
    >
      <ParticipantsScreen />
    </ChatContext>,
  )

  const names = screen.getAllByRole('listitem').map((item) => item.textContent)
  expect(names).toEqual(['Alice', 'Bob (You)'])
})
