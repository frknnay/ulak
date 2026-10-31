// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import { JoinScreen } from './join-screen'

afterEach(cleanup)

function renderJoin() {
  const onJoin = vi.fn<(name: string) => void>()
  render(<JoinScreen onJoin={onJoin} />)
  return { onJoin, input: screen.getByRole('textbox', { name: 'Your name' }) }
}

function join() {
  fireEvent.click(screen.getByRole('button', { name: 'Join chat' }))
}

test('suggests a guest name', () => {
  const { onJoin, input } = renderJoin()

  expect(input).toHaveProperty('value', expect.stringMatching(/^Guest \d{4}$/))
  join()
  expect(onJoin).toHaveBeenCalledWith(expect.stringMatching(/^Guest \d{4}$/))
})

test('joins with the chosen name, without surrounding spaces', () => {
  const { onJoin, input } = renderJoin()

  fireEvent.change(input, { target: { value: '  Furkan ' } })
  join()

  expect(onJoin).toHaveBeenCalledWith('Furkan')
})

test('cannot join without a name', () => {
  const { onJoin, input } = renderJoin()

  fireEvent.change(input, { target: { value: '   ' } })
  join()

  expect(onJoin).not.toHaveBeenCalled()
})
