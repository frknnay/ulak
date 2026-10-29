import { describe, expect, test } from 'vitest'
import { createConnections } from './connections'

describe('connections', () => {
  test('links a connection to the participant that said hello on it', () => {
    const connections = createConnections()
    expect(connections.link('c1', 'alice')).toBe(true)
    expect(connections.participantOf('c1')).toBe('alice')
  })

  test('knows no participant for a connection without a hello', () => {
    expect(createConnections().participantOf('c1')).toBeUndefined()
  })

  test('keeps the first participant if a connection says hello again', () => {
    const connections = createConnections()
    connections.link('c1', 'alice')
    expect(connections.link('c1', 'bob')).toBe(false)
    expect(connections.participantOf('c1')).toBe('alice')
  })

  test('reports a leave when the participant’s only connection closes', () => {
    const connections = createConnections()
    connections.link('c1', 'alice')
    expect(connections.unlink('c1')).toBe('alice')
    expect(connections.participantOf('c1')).toBeUndefined()
  })

  test('reports no leave while the participant has another connection', () => {
    // After a reload, the new connection says hello before the old one closes.
    const connections = createConnections()
    connections.link('old', 'alice')
    connections.link('new', 'alice')
    expect(connections.unlink('old')).toBeUndefined()
    expect(connections.unlink('new')).toBe('alice')
  })

  test('reports no leave for a connection that never said hello', () => {
    expect(createConnections().unlink('c1')).toBeUndefined()
  })
})
