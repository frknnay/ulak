# ulak

A real-time chat app for several participants, built as a take-home
assignment for a web frontend role.

## Hard rules

- Keep it simple. A small, well-structured solution beats a feature-rich
  one. Ask before adding a bonus feature or a new dependency.
- Commit often, one meaningful change per commit. Read
  `.agents/skills/commit/SKILL.md` before every commit.

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

## Conventions

- Style components with CSS modules: put `Component.module.css` next to
  `Component.tsx`. Global CSS is only for resets and shared custom
  properties such as colors and spacing.

## Commands

Use pnpm, not npm or yarn. Run these from the repo root.

- `pnpm dev`: start every package's dev server
- `pnpm typecheck`: type-check every package
- `pnpm build`: type-check, then build the client
- `pnpm lint`: run ESLint over the whole repo
- `pnpm format`: format the whole repo with Prettier
- `pnpm format:check`: fail if any file is not formatted
- `pnpm preview`: serve the client's production build

A change is done when `pnpm lint`, `pnpm format:check` and `pnpm build`
pass, along with the tests once a test runner exists. Test multi-participant behavior in 2 or more
browser windows.
