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
