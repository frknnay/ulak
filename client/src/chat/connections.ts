// Links the transport's connection ids to participant ids. A peer's hello
// links its connection, and a participant can briefly have two: after a
// reload, the new connection can say hello before the old one is seen to
// close.
export function createConnections() {
  const participantIds = new Map<string, string>()

  return {
    // Links a connection to the participant that said hello on it.
    // Returns false if the connection was already linked, since a
    // connection belongs to one participant for its lifetime.
    link(connectionId: string, participantId: string): boolean {
      if (participantIds.has(connectionId)) return false
      participantIds.set(connectionId, participantId)
      return true
    },

    participantOf(connectionId: string): string | undefined {
      return participantIds.get(connectionId)
    },

    // Forgets a closed connection. Returns the participant who left, or
    // undefined if they are still connected another way.
    unlink(connectionId: string): string | undefined {
      const participantId = participantIds.get(connectionId)
      participantIds.delete(connectionId)
      if (!participantId) return undefined
      const stillConnected = [...participantIds.values()].includes(participantId)
      return stillConnected ? undefined : participantId
    },
  }
}
