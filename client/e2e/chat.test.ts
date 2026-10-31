import {
  expect,
  test as base,
  type BrowserContext,
  type Page,
  type WebSocketRoute,
} from '@playwright/test'

type JoinOptions = {
  // The name to join under, or the suggested guest name if not given.
  name?: string
  // Runs on the page before the app loads.
  setup?: (page: Page) => Promise<void>
}

// `join()` opens the app as a new participant, in its own browser context
// like a separate window, and joins the chat. Every participant leaves
// when the test ends, so the next test starts with an empty session.
const test = base.extend<{ join: (options?: JoinOptions) => Promise<Page> }>({
  join: async ({ browser }, provide) => {
    const contexts: BrowserContext[] = []
    await provide(async ({ name, setup } = {}) => {
      const context = await browser.newContext()
      contexts.push(context)
      const page = await context.newPage()
      await setup?.(page)
      await page.goto('/')
      if (name) await page.getByRole('textbox', { name: 'Your name' }).fill(name)
      await page.getByRole('button', { name: 'Join chat' }).click()
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
  const alice = await join({ name: 'Alice' })
  const bob = await join({ name: 'Bob' })

  await expectParticipants(alice, 2)
  await expectParticipants(bob, 2)
  await expect(alice.getByText('Bob joined')).toBeVisible()

  // Each sees the same people, with themselves marked as You.
  expect(await participantNames(alice)).toEqual(['Alice (You)', 'Bob'])
  expect(await participantNames(bob)).toEqual(['Alice', 'Bob (You)'])
})

test('a participant joins under the name they choose, and keeps it', async ({ join }) => {
  const alice = await join({ name: 'Alice Press' })
  const bob = await join()

  await expect(bob.getByText('Alice Press joined')).toBeVisible()
  expect(await participantNames(bob)).toContain('Alice Press')

  // A reload keeps the name and joins without asking again.
  await alice.reload()
  await expectParticipants(alice, 2)
  expect(await participantNames(alice)).toContain('Alice Press (You)')
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

test('the others see who is typing until they send or stop', async ({ join }) => {
  const alice = await join()
  const bob = await join()
  await expectParticipants(alice, 2)
  const input = bob.getByRole('textbox', { name: 'Message' })
  const typing = alice.getByText(/Guest \d{4} is typing…/)

  await input.fill('Almost')
  await expect(typing).toBeVisible()

  // Sending clears the line at once, well before the typing timeout.
  await bob.keyboard.press('Enter')
  await expect(alice.getByText('Almost')).toBeVisible()
  await expect(typing).toHaveCount(0, { timeout: 1000 })

  // A draft that Bob abandons clears once his typing events stop.
  await input.fill('Never mind')
  await expect(typing).toBeVisible()
  await input.fill('')
  await expect(typing).toHaveCount(0, { timeout: 10_000 })
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
  await expect(bob.getByText('Message 31', { exact: true })).toBeAttached()
  await expect(bob.getByText('Message 31', { exact: true })).not.toBeInViewport()

  // Back at the bottom, Bob follows new messages again.
  await bob.mouse.wheel(0, 10_000)
  await expect(bob.getByText('Message 31', { exact: true })).toBeInViewport()
  await send(alice, 'Message 32')
  await expect(bob.getByText('Message 32', { exact: true })).toBeInViewport()
})

test('a participant whose signaling connection drops rejoins', async ({ join }) => {
  const alice = await join()
  // Bob's signaling connection runs through the test, so the test can drop
  // it. The config starts the signaling server on port 8090.
  let signaling: { page: WebSocketRoute; server: WebSocketRoute } | undefined
  const bob = await join({
    setup: (page) =>
      page.routeWebSocket(/:8090\//, (route) => {
        signaling = { page: route, server: route.connectToServer() }
      }),
  })
  await expectParticipants(alice, 2)

  await signaling?.server.close()
  await signaling?.page.close()

  // Bob sees he is offline and can't write, and Alice sees him leave.
  const bobStatus = bob.getByRole('status')
  const bobInput = bob.getByRole('textbox', { name: 'Message' })
  await expect(bobStatus).toHaveText('Offline. Reconnecting…')
  await expect(bobInput).toBeDisabled()
  await expect(alice.getByText(/Guest \d{4} left/)).toBeVisible()
  await send(alice, 'Sent while Bob was away')

  // Bob rejoins on his own, and Alice's history brings him the message.
  await expect(bobStatus).toHaveCount(0)
  await expect(bobInput).toBeEnabled()
  await expectParticipants(alice, 2)
  await expect(bob.getByText('Sent while Bob was away')).toBeVisible()
})
