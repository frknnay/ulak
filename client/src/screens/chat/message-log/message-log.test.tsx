// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, expect, test } from 'vitest'
import type { ChatLogEntry } from '../../../chat-state/chat-state'
import { MessageLog } from './message-log'

afterEach(cleanup)

let nextId = 0

// A message from this author, sent at this local time such as '09:21'.
function message(author: string, text: string, time = '09:00'): ChatLogEntry {
  const [hours, minutes] = time.split(':').map(Number)
  return {
    kind: 'message',
    message: {
      id: `message-${nextId++}`,
      authorId: author,
      authorName: author,
      text,
      sentAt: new Date(2026, 9, 30, hours, minutes).getTime(),
      editedAt: null,
      deleted: false,
    },
  }
}

function notice(text: string): ChatLogEntry {
  return { kind: 'notice', notice: { id: `notice-${nextId++}`, text, at: 0 } }
}

function renderLog(log: ChatLogEntry[]) {
  render(
    <MessageLog
      log={log}
      authorName={(message) => message.authorName}
      canChange={() => false}
      onEdit={() => {}}
      onDelete={() => {}}
    />,
  )
}

// The message that shows this text.
function article(text: string) {
  return screen.getAllByRole('article').find((element) => within(element).queryByText(text))!
}

test("an author's consecutive messages show the name once", () => {
  renderLog([message('Alice', 'First'), message('Alice', 'Second'), message('Alice', 'Third')])

  expect(screen.getAllByText('Alice')).toHaveLength(1)
  expect(within(article('First')).queryByText('Alice')).not.toBeNull()
})

test("another author's message starts a new group", () => {
  renderLog([message('Alice', 'First'), message('Bob', 'Reply'), message('Alice', 'Again')])

  expect(within(article('Reply')).queryByText('Bob')).not.toBeNull()
  expect(within(article('Again')).queryByText('Alice')).not.toBeNull()
})

test('a notice starts a new group', () => {
  renderLog([message('Alice', 'Before'), notice('Bob joined'), message('Alice', 'After')])

  expect(within(article('After')).queryByText('Alice')).not.toBeNull()
})

test('every message in a group shows its time', () => {
  renderLog([message('Alice', 'First', '09:21'), message('Alice', 'Second', '09:24')])

  expect(within(article('First')).queryByText('09:21')).not.toBeNull()
  expect(within(article('Second')).queryByText('09:24')).not.toBeNull()
})
