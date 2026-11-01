// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { currentTheme, pickTheme, restoreTheme } from './theme'

function fakeStorage(entries: Record<string, string> = {}) {
  const items = new Map(Object.entries(entries))
  return {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => void items.set(key, value),
  }
}

// jsdom has no matchMedia, so each test says which theme the OS uses.
function osPrefersDark(dark: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: dark && query === '(prefers-color-scheme: dark)',
  }))
}

// A reload starts with a fresh page.
function reload() {
  delete document.documentElement.dataset.theme
}

describe('theme', () => {
  beforeEach(reload)
  afterEach(() => void vi.unstubAllGlobals())

  test.each([
    ['light', false],
    ['dark', true],
  ] as const)('follows the OS when it uses %s', (theme, dark) => {
    osPrefersDark(dark)
    restoreTheme(fakeStorage())
    expect(currentTheme()).toBe(theme)
  })

  test('shows the picked theme over the OS one', () => {
    osPrefersDark(true)
    pickTheme('light', fakeStorage())
    expect(currentTheme()).toBe('light')
  })

  test('keeps the picked theme across reloads', () => {
    osPrefersDark(false)
    const storage = fakeStorage()
    pickTheme('dark', storage)
    reload()
    restoreTheme(storage)
    expect(currentTheme()).toBe('dark')
  })

  test('ignores a stored theme it does not know', () => {
    osPrefersDark(false)
    restoreTheme(fakeStorage({ 'ulak:theme': 'sepia' }))
    expect(currentTheme()).toBe('light')
  })
})
