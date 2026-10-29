---
name: commit
description: Write a git commit in this repo's style. Read this skill before making any git commit, including when asked to commit, or to commit and push.
---

# Commit

Reviewers read the history to see how the work progressed, so each commit
should be one meaningful step with a message that explains it.

## Subject

`<scope>: <summary>`, or `<summary>` alone when no scope fits. Reverts and merges may use Git's default.

- scope: optional lowercase area noun (`chat`, `presence`, `protocol`, `rtc`, `signaling`, `ui`, `tests`, `docs`, `build`). Reuse one from `git log -n 50 --pretty=format:%s` before inventing a new one. Cross-area: broader scope or `protocol, ui`. Never `feat`/`fix`/`chore`.
- summary: imperative, lowercase first letter (keep identifier case), ≤50 chars ideal, 72 max, no period. Describe behavior, not the code edit. If it needs "and", consider two commits.

Good: `chat: show an edited marker on changed messages`, `rtc: reconnect a peer after its data channel closes`
Bad: `fix: edit bug`, `Update MessageList.tsx`

## Body

Optional. Blank line after the subject, wrap at ~72 columns.

- Why first (requirement, bug, edge case), then what changed. Skip the how unless surprising.
- Name real components, hooks, files, protocol event types and config keys.
- Say how it was verified and what fails without the change.
- Short active sentences, one idea each. Link cause and effect with "so", "because", "since". One term per concept.
- Bullets are fine for several separate parts.

## Clarity

Every sentence must parse on the first read:

- Keep relative pronouns ("a message that the peer edited", not "a message the peer edited").
- Don't nest a clause between a verb and its object.
- No bare "this"/"that"/"it" with an unclear antecedent.

## Don't

- Never name the company that set this assignment, in the subject, body or branch name.
- No AI attribution: no `Co-Authored-By` for an AI, no "Generated with" notices.
- No sign-offs or other footers.

## Steps

1. Arguments are guidance; paths or globs limit what is committed.
2. Check `git status`, `git diff` and `git diff --cached`. Unstage unrelated changes. Ask if a file's inclusion is unclear.
3. Run `pnpm lint`, `pnpm format:check` and `pnpm build`, plus the tests once they exist. Don't commit if any of them fail.
4. Stage by path, never `git add -A`/`.`. Commit `pnpm-lock.yaml` with any `package.json` dependency change.
5. Commit via stdin:

```sh
git commit -F - <<'EOF'
<subject>

<body>
EOF
```
