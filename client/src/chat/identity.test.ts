import { describe, expect, test } from 'vitest'
import { loadIdentity } from './identity'

function fakeStorage(entries: Record<string, string> = {}) {
  const items = new Map(Object.entries(entries))
  return {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => void items.set(key, value),
  }
}

describe('loadIdentity', () => {
  test('creates a guest identity on the first visit', () => {
    const identity = loadIdentity(fakeStorage())
    expect(identity.id).not.toBe('')
    expect(identity.name).toMatch(/^Guest \d{4}$/)
  })

  test('keeps the same identity across reloads', () => {
    const storage = fakeStorage()
    expect(loadIdentity(storage)).toEqual(loadIdentity(storage))
  })

  test('gives each tab its own identity', () => {
    expect(loadIdentity(fakeStorage()).id).not.toBe(loadIdentity(fakeStorage()).id)
  })

  test('replaces stored data that is not an identity', () => {
    const storage = fakeStorage({ 'ulak:participant': '{"id": 42}' })
    const identity = loadIdentity(storage)
    expect(identity.name).toMatch(/^Guest \d{4}$/)
    expect(loadIdentity(storage)).toEqual(identity)
  })

  test('replaces stored data that is not JSON', () => {
    const identity = loadIdentity(fakeStorage({ 'ulak:participant': '{' }))
    expect(identity.name).toMatch(/^Guest \d{4}$/)
  })
})
