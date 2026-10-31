import { useState } from 'react'
import { guestName } from '../../chat/identity'

// The name field on the join screen, suggesting a guest name at first.
export function useJoinScreen(onJoin: (name: string) => void) {
  const [name, setName] = useState(guestName)
  const trimmed = name.trim()

  return {
    name,
    setName,
    // A name needs something besides whitespace.
    canJoin: trimmed !== '',

    join() {
      if (trimmed) onJoin(trimmed)
    },
  }
}
