import { expect, test as base, type BrowserContext, type Page } from '@playwright/test'

// `join()` opens the app as a new participant, in its own browser context
// like a separate window. Every participant leaves when the test ends, so
// the next test starts with an empty session.
const test = base.extend<{ join: () => Promise<Page> }>({
  join: async ({ browser }, provide) => {
    const contexts: BrowserContext[] = []
    await provide(async () => {
      const context = await browser.newContext()
      contexts.push(context)
      const page = await context.newPage()
      await page.goto('/')
      return page
    })
    for (const context of contexts) await context.close()
  },
})

// Waits until the page sees this many participants, including itself.
async function expectParticipants(page: Page, count: number) {
  await expect(page.getByRole('tab', { name: `Participants (${count})` })).toBeVisible()
}

async function participantNames(page: Page): Promise<string[]> {
  await page.getByRole('tab', { name: /Participants/ }).click()
  return page.getByRole('listitem').allTextContents()
}

async function send(page: Page, text: string) {
  await page.getByRole('textbox', { name: 'Message' }).fill(text)
  await page.keyboard.press('Enter')
}

// Hovers the message with this text to reveal its ⋯ menu, opens the
// menu and picks an action.
async function act(page: Page, text: string, action: 'Edit' | 'Delete') {
  const message = page.getByRole('article').filter({ hasText: text })
  await message.hover()
  await message.getByRole('button', { name: 'Message actions' }).click()
  await page.getByRole('button', { name: action }).click()
}

test('participants see each other', async ({ join }) => {
  const alice = await join()
  const bob = await join()

  await expectParticipants(alice, 2)
  await expectParticipants(bob, 2)
  await expect(alice.getByText(/Guest \d{4} joined/)).toBeVisible()

  const names = await participantNames(alice)
  expect(names).toHaveLength(2)
  expect(await participantNames(bob)).toEqual(names)
})

test('a message reaches every other participant', async ({ join }) => {
  const alice = await join()
  const bob = await join()
  const carol = await join()
  await expectParticipants(alice, 3)

  await send(alice, 'Hello from Alice')

  await expect(bob.getByText('Hello from Alice')).toBeVisible()
  await expect(carol.getByText('Hello from Alice')).toBeVisible()
})

test('a newcomer sees the messages sent before it joined', async ({ join }) => {
  const alice = await join()
  const bob = await join()
  await expectParticipants(alice, 2)
  await send(alice, 'Sent before Carol')
  await expect(bob.getByText('Sent before Carol')).toBeVisible()

  const carol = await join()

  await expect(carol.getByText('Sent before Carol')).toBeVisible()
})

test('the others see a participant leave', async ({ join }) => {
  const alice = await join()
  const bob = await join()
  await expectParticipants(alice, 2)

  await bob.context().close()

  await expect(alice.getByText(/Guest \d{4} left/)).toBeVisible()
  await expectParticipants(alice, 1)
})

test('an author edits a message and the others see it was edited', async ({ join }) => {
  const alice = await join()
  const bob = await join()
  await expectParticipants(alice, 2)
  await send(alice, 'Meet at 10')
  await expect(bob.getByText('Meet at 10')).toBeVisible()

  // Only the author can change a message.
  await expect(bob.getByRole('button', { name: 'Message actions' })).toHaveCount(0)

  await act(alice, 'Meet at 10', 'Edit')
  const input = alice.getByRole('textbox', { name: 'Message' })
  await expect(input).toHaveValue('Meet at 10')
  await input.fill('Meet at 11')
  await alice.keyboard.press('Enter')

  const message = bob.getByRole('article').filter({ hasText: 'Meet at 11' })
  await expect(message.getByText('(edited)')).toBeVisible()
  await expect(bob.getByText('Meet at 10')).toHaveCount(0)
  await expect(input).toHaveValue('')
})

test('an author deletes a message and the others see it was deleted', async ({ join }) => {
  const alice = await join()
  const bob = await join()
  await expectParticipants(alice, 2)
  await send(alice, 'Oops, wrong chat')
  await expect(bob.getByText('Oops, wrong chat')).toBeVisible()

  alice.once('dialog', (dialog) => dialog.accept())
  await act(alice, 'Oops, wrong chat', 'Delete')

  await expect(bob.getByText('Message deleted')).toBeVisible()
  await expect(bob.getByText('Oops, wrong chat')).toHaveCount(0)
})

test('the log follows new messages unless the reader scrolls up', async ({ join }) => {
  const alice = await join()
  const bob = await join()
  await expectParticipants(alice, 2)
  for (let i = 1; i <= 30; i++) await send(alice, `Message ${i}`)

  await expect(bob.getByText('Message 30', { exact: true })).toBeInViewport()

  // Reading older messages, Bob isn't pulled away by a new one.
  await bob.getByText('Message 30', { exact: true }).hover()
  await bob.mouse.wheel(0, -10_000)
  await expect(bob.getByText('Message 1', { exact: true })).toBeInViewport()
  await send(alice, 'Message 31')
  await expect(bob.getByText('Message 31')).toBeAttached()
  await expect(bob.getByText('Message 31')).not.toBeInViewport()

  // Back at the bottom, Bob follows new messages again.
  await bob.mouse.wheel(0, 10_000)
  await expect(bob.getByText('Message 31')).toBeInViewport()
  await send(alice, 'Message 32')
  await expect(bob.getByText('Message 32')).toBeInViewport()
})
