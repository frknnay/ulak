# ulak

A real-time chat app for several participants, built as a take-home
assignment for a web frontend role.

## Hard rules

- Keep it simple. A small, well-structured solution beats a feature-rich
  one. Ask before adding a bonus feature or a new dependency.
- Do only the step the user asked for. When asked to discuss, review or
  propose, do not change files.
- The user makes the architectural decisions. If a task needs one this file
  does not cover, lay out the options and trade-offs and ask.
- Commit only when the user asks, one meaningful change per commit. Read
  `.agents/skills/commit/SKILL.md` before every commit.
- Never write the name of the company that set this assignment anywhere in
  the repo: code, filenames, metadata, docs or commit messages.

## Architecture

Peer-to-peer: each client opens a WebRTC DataChannel to every other client
in the session (a full mesh). Chat messages never pass through a server. A
minimal WebSocket signaling server only introduces peers and relays their
offers, answers and ICE candidates.

Keep these layers separate so the core can be tested without a browser:

- Protocol and state: plain TypeScript with no React or transport imports.
  Message types, validation and a reducer that applies events to chat state.
- Transport: sends and receives protocol events behind a small interface.
- UI: React components that render state and dispatch user actions.

The README documents the message protocol. Update it in the same commit as
any protocol change.

The UI follows the mockup in `design/mockup.png`.

## Layout

A pnpm workspace. ESLint, Prettier and TypeScript live at the root.

- `client/`: the React app, built with Vite.
  - `src/components/`: common components shared across screens, each in
    its own folder, such as `icon-button/icon-button.tsx`.
  - `src/screens/`: the screens from the mockup, each in its own folder,
    such as `chat-screen/chat-screen.tsx`.
  - `src/protocol/protocol.ts`: the peer-to-peer chat events and their
    parser.
  - `src/chat-state/chat-state.ts`: the reducer that applies events to
    chat state.
  - Tests sit next to the file they test, such as `chat-state.test.ts`,
    and run with Vitest.
- `server/`: the WebSocket signaling server. Node runs its TypeScript
  directly, with no build step.
  - `src/`: one folder per module, with its tests next to it, such as
    `signaling-server/signaling-server.test.ts`. Tests use `node:test`.
  - `src/signaling/signaling.ts`: the signaling message types and their
    parsers. The client imports them as `@ulak/server/signaling`.

## Conventions

- Name files and folders in kebab-case, such as `icon-button.tsx`.
- Style components with CSS modules: put `icon-button.module.css` next to
  `icon-button.tsx`. Global CSS is only for resets and shared custom
  properties such as colors and spacing.
- Tests check behavior, not implementation details. Never weaken a test to
  make it pass; report the failure and its cause.

## Commands

Use pnpm, not npm or yarn. Run these from the repo root.

- `pnpm dev`: start every package's dev server
- `pnpm typecheck`: type-check every package
- `pnpm build`: type-check, then build the client
- `pnpm test`: run every package's tests
- `pnpm lint`: run ESLint over the whole repo
- `pnpm format`: format the whole repo with Prettier
- `pnpm format:check`: fail if any file is not formatted
- `pnpm preview`: serve the client's production build

A husky pre-commit hook runs lint-staged, which formats and lints the
staged files, then runs `pnpm typecheck`.

A change is done when `pnpm lint`, `pnpm format:check`, `pnpm build` and
`pnpm test` pass. Test multi-participant behavior in 2 or more browser
windows.
