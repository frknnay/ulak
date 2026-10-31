# Ulak

_Ulak_ is Turkish for "messenger", the courier who carried news from town
to town.

A real-time chat for several participants. Peers connect to each other
directly over WebRTC DataChannels in a full mesh. A small WebSocket
signaling server only introduces them.

> **How this was built.** The code is AI-generated, written with an AI
> coding agent, but I made the design decisions and steered it. These are
> the main ones and why:
>
> - **Logic in hooks, markup in components.** A screen's state and
>   handlers live in a hook next to it, such as `useChatScreen`, so the UI
>   stays separate from the business code.
> - **CSS modules.** Each component's styles sit next to it and are
>   scoped to it, so class names never clash. Global CSS is only for the
>   reset, colors and spacing.
> - **Husky and lint-staged.** Every commit is formatted, linted and
>   type-checked before it lands, so the history stays clean.
>
> The rules the agent works by are in [`AGENTS.md`](AGENTS.md).

## Running it

You need Node 22.18 or newer, which runs the server's TypeScript
directly, and pnpm.

```sh
pnpm install
pnpm dev
```

`pnpm dev` starts the signaling server on `ws://localhost:8080` and the
client on `http://localhost:5173`. Open the client in two or more windows
to chat. Each tab is its own participant, with a random name such as
"Guest 4821".

To build the client, run `pnpm build`, then serve the build with
`pnpm preview`. The signaling server still has to run, for example with
`pnpm --filter @ulak/server start`.

Other commands:

- `pnpm test`: unit tests for the client and the server
- `pnpm test:e2e`: end-to-end tests in Chromium. The first run needs
  `pnpm --filter @ulak/client exec playwright install chromium`.
- `pnpm lint`, `pnpm format:check`, `pnpm typecheck`

## Architecture

I chose peer-to-peer (option B). Each client opens a WebRTC DataChannel to
every other client, a full mesh, so chat messages never pass through a
server. The signaling server only tells clients who else is there and
relays their offers, answers and ICE candidates. It holds no chat state,
so it stays about 50 lines.

I picked it because it fits a chat inside a meeting: groups are small, and
a mesh needs no server to relay or store messages. The cost is that every
peer has to keep the shared history itself, which the protocol below
handles.

The client keeps three layers apart, so the core logic runs without a
browser:

- **Protocol and state**
  ([`client/src/protocol`](client/src/protocol),
  [`client/src/chat-state`](client/src/chat-state)): plain TypeScript.
  Event types, a parser that drops malformed input, and a reducer that
  applies events to the chat state.
- **Transport** ([`client/src/transport`](client/src/transport)): the
  WebRTC mesh. It sends and receives parsed events behind a small
  interface and knows nothing about chat state.
- **UI** ([`client/src/screens`](client/src/screens),
  [`client/src/components`](client/src/components)): React.
  `ChatProvider` connects the transport to the reducer, and screens read
  the chat with `useChat()`. Shared components are presentational.

The signaling message types live in the server package, and the client
imports them as
[`@ulak/server/signaling`](server/src/signaling/signaling.ts), so both
sides parse the same types.

## Message protocol

Every message is a JSON object with a `type` field. Receivers check each
message with a parser and drop anything malformed.

### Signaling (client and server)

Defined in
[`server/src/signaling/signaling.ts`](server/src/signaling/signaling.ts).
The server never sees chat messages.

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

Defined in
[`client/src/protocol/protocol.ts`](client/src/protocol/protocol.ts).
Events don't name their sender: the receiver knows which peer each DataChannel belongs to.

| Event                                          | Meaning                             |
| ---------------------------------------------- | ----------------------------------- |
| `{ type: 'hello', participant: { id, name } }` | Who the sender is                   |
| `{ type: 'message', id, text, sentAt }`        | A new message                       |
| `{ type: 'edit', id, text, editedAt }`         | The author changed a message's text |
| `{ type: 'delete', id }`                       | The author deleted a message        |
| `{ type: 'history', messages }`                | Every message the sender knows      |
| `{ type: 'typing' }`                           | The sender is writing a message     |

- **Joining.** When a DataChannel opens, each side sends `hello` and then
  `history`, so a newcomer sees the messages that were sent before it
  joined. Each tab keeps its participant id and name in `sessionStorage`,
  so a reload keeps the same identity.
- **Reconnecting.** If the signaling connection closes, the tab closes
  its peer connections and connects again 2 seconds later, retrying until
  the server is back. Meanwhile the composer says it's offline and is
  disabled. The tab then rejoins like a newcomer, so the `history`
  exchange catches it up on messages that were sent while it was away.
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
- **Typing.** While a participant writes a new message, they send
  `typing` at most every 2 seconds. The others show their name above the
  composer until that participant's message arrives, or until 4 seconds
  pass without another `typing`. Since stopping is a timeout and not an
  event, a closed tab can't leave a name behind.

## Testing

- **Unit tests** (Vitest) cover the core logic without a browser: the
  event parser, the chat reducer (messages, edits, deletes, authorship,
  merging history, typing), linking connections to participants, and the
  stored identity.
- **Server tests** (`node:test`) start a real signaling server on a free
  port and check that it introduces peers, relays signals only to their
  target, announces joins and leaves, and ignores malformed messages.
- **End-to-end tests** (Playwright) open several participants as separate
  browser contexts in Chromium, against their own signaling server and
  client. They cover presence, sending, history for newcomers, leaving,
  editing, deleting, showing who is typing, keeping the newest messages in
  view, and rejoining after a dropped signaling connection.

The transport has no unit tests. Faking WebRTC would mostly test the fake,
so the end-to-end tests cover it with real connections instead.
