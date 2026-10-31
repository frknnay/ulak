import { describe, expect, test } from 'vitest'
import { createIdentity, guestName, loadIdentity } from './identity'

function fakeStorage(entries: Record<string, string> = {}) {
  const items = new Map(Object.entries(entries))
  return {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => void items.set(key, value),
  }
}

describe('identity', () => {
  test('has none before the participant chooses a name', () => {
    expect(loadIdentity(fakeStorage())).toBeUndefined()
  })

  test('creates an identity with the chosen name', () => {
    const identity = createIdentity('Furkan', fakeStorage())
    expect(identity.id).not.toBe('')
    expect(identity.name).toBe('Furkan')
  })

  test('keeps the same identity across reloads', () => {
    const storage = fakeStorage()
    const identity = createIdentity('Furkan', storage)
    expect(loadIdentity(storage)).toEqual(identity)
  })

  test('gives each tab its own identity', () => {
    expect(createIdentity('A', fakeStorage()).id).not.toBe(createIdentity('A', fakeStorage()).id)
  })

  test.each([
    ['not an identity', '{"id": 42}'],
    ['not JSON', '{'],
  ])('ignores stored data that is %s', (_, data) => {
    expect(loadIdentity(fakeStorage({ 'ulak:participant': data }))).toBeUndefined()
  })
})

test('suggests a guest name', () => {
  expect(guestName()).toMatch(/^Guest \d{4}$/)
})
