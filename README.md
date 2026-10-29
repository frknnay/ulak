# ulak

A real-time chat for several participants. Peers connect to each other
directly over WebRTC DataChannels in a full mesh. A small WebSocket
signaling server only introduces them.

## Message protocol

Every message is a JSON object with a `type` field. Receivers check each
message with a parser and drop anything malformed.

### Signaling (client and server)

Defined in `server/src/signaling/signaling.ts`. The server never sees
chat messages.

| Direction        | Message                            | Meaning                                            |
| ---------------- | ---------------------------------- | -------------------------------------------------- |
| server to client | `{ type: 'welcome', id, peers }`   | Your peer id and the ids of the peers already here |
| server to client | `{ type: 'peer-joined', id }`      | A peer connected                                   |
| server to client | `{ type: 'peer-left', id }`        | A peer disconnected                                |
| client to server | `{ type: 'signal', to, signal }`   | Relay a WebRTC handshake step to peer `to`         |
| server to client | `{ type: 'signal', from, signal }` | A handshake step from peer `from`                  |

A `signal` is an `offer` or `answer` with its `sdp`, or an `ice`
candidate. The newcomer sends an offer to every peer that is already in
the session, and each of them answers, so two peers never send offers to
each other at the same time.

### Chat (peer to peer)

Defined in `client/src/protocol/protocol.ts`. Events don't name their
sender: the receiver knows which peer each DataChannel belongs to.

| Event                                          | Meaning                             |
| ---------------------------------------------- | ----------------------------------- |
| `{ type: 'hello', participant: { id, name } }` | Who the sender is                   |
| `{ type: 'message', id, text, sentAt }`        | A new message                       |
| `{ type: 'edit', id, text, editedAt }`         | The author changed a message's text |
| `{ type: 'delete', id }`                       | The author deleted a message        |
| `{ type: 'history', messages }`                | Every message the sender knows      |

- **Joining.** When a DataChannel opens, each side sends `hello` and then
  `history`, so a newcomer sees the messages that were sent before it
  joined. Each tab keeps its participant id and name in `sessionStorage`,
  so a reload keeps the same identity.
- **Ids and times.** The sender creates message ids and stamps times in
  milliseconds from its own clock. Everyone orders the log by `sentAt`.
- **Edits.** An edit replaces the text and sets `editedAt`, so the UI can
  mark the message as edited.
- **Deletes.** A delete keeps the message in the log with `deleted: true`
  and its text cleared, so others see that it was deleted.
- **Authorship.** A receiver applies an edit or delete only if it came
  from the message's author.
- **Merging history.** Peers merge history by message id. A deleted
  version beats an edited one, and otherwise the later `editedAt` wins.
