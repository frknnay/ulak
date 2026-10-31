import type { Participant } from '../protocol/protocol'

const storageKey = 'ulak:participant'

// Who this tab is. The id and name live in sessionStorage, so a reload
// keeps the same identity and the right to edit earlier messages.
// Undefined until the participant has chosen a name in this tab.
export function loadIdentity(
  storage: Pick<Storage, 'getItem'> = sessionStorage,
): Participant | undefined {
  return parseParticipant(storage.getItem(storageKey))
}

// Gives this tab a new identity with the name that the participant chose.
export function createIdentity(
  name: string,
  storage: Pick<Storage, 'setItem'> = sessionStorage,
): Participant {
  const participant = { id: crypto.randomUUID(), name }
  storage.setItem(storageKey, JSON.stringify(participant))
  return participant
}

// A name to suggest, such as "Guest 4821".
export function guestName(): string {
  return `Guest ${Math.floor(1000 + Math.random() * 9000)}`
}

function parseParticipant(data: string | null): Participant | undefined {
  if (!data) return undefined
  try {
    const value: unknown = JSON.parse(data)
    if (
      typeof value === 'object' &&
      value !== null &&
      'id' in value &&
      typeof value.id === 'string' &&
      'name' in value &&
      typeof value.name === 'string'
    ) {
      return { id: value.id, name: value.name }
    }
  } catch {
    // Fall through, so the participant chooses a name again.
  }
  return undefined
}
