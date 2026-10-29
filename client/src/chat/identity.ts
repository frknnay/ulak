import type { Participant } from '../protocol/protocol'

const storageKey = 'ulak:participant'

// Who this tab is. The id and name live in sessionStorage, so a reload
// keeps the same identity and the right to edit earlier messages.
export function loadIdentity(
  storage: Pick<Storage, 'getItem' | 'setItem'> = sessionStorage,
): Participant {
  const stored = parseParticipant(storage.getItem(storageKey))
  if (stored) return stored

  const participant = {
    id: crypto.randomUUID(),
    name: `Guest ${Math.floor(1000 + Math.random() * 9000)}`,
  }
  storage.setItem(storageKey, JSON.stringify(participant))
  return participant
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
    // Fall through and create a new identity.
  }
  return undefined
}
