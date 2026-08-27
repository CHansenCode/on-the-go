# ADR-000: Living document (backlog & sketchpad)

## Status

**Living.** Unlike every other file in `adr/`, this one is never
"accepted," "superseded," or frozen — it's meant to be edited constantly,
by whichever session or dev is in the driver's seat at the time. Read it
at the start of a session to pick up where things left off; update it
before ending one so the next session doesn't have to re-derive context
that only existed in a chat transcript.

## Purpose

Real ADRs (ADR-001 and up) each record one decision, made at one point in
time, and are expected to stay mostly still after that. But a lot of the
useful stuff that happens in conversation is smaller than a decision: a
half-formed idea worth not losing, a to-do that only makes sense once
something else lands, a question that's still open. This file is where
that lives — a running backlog and sketchpad, not a decision record.

## How to use this file

- **Starting a session:** read the "Current context" and "To-dos"
  sections below before doing anything else.
- **Ending a session, or after sketching something in conversation:**
  add/update to-dos and sketches here so the next session (possibly a
  different dev, possibly Claude with no memory of this conversation)
  has it.
- **When a to-do is done:** check it off, and if it's worth remembering
  *that* it happened, move it to the Log with a date. Otherwise just
  delete it.
- **When a sketch matures into an actual decision:** promote it to a new
  `ADR-NNN-*.md`, then replace the sketch entry here with a one-line
  pointer to that ADR instead of duplicating the content.

## Current context snapshot

- **Branch reconciliation: done.** Two branches (`claude/android-app-chat-dev-2l3rm8`
  and `claude/android-app-chat-dev-6ce6lt`) had diverged with conflicting
  work — see the Log below for how that was found and resolved.
  `6ce6lt` is the branch going forward. `2l3rm8`'s mock two-account login
  and API client stub are retired in favor of the real thing (below);
  that branch itself is left alone, not deleted, not merged.
- **The app is "Dramonkes"**: a flashcard language-learning tab
  (Learning) plus a shared audio-poem recorder (Poems), for exactly two
  people. Dev loop is EAS Build (native changes) + EAS Update (JS-only
  changes) — no computer involved, see `README.md`.
- **main-frame** (separate repo, `chansencode/main-frame`): the backend.
  Next.js on Vercel, Postgres on Neon, staging/production pipeline
  already designed (see main-frame's `ADR-0001`). As of the auth work
  below: a `users` table exists (two accounts, no self-signup), NextAuth
  is wired to it for a future web login, and a separate
  `/api/mobile/login` route issues a bearer token for this app. No
  `/api/recordings` yet, no live deployment/URL yet — `docs/sharing-integration.md`
  in this repo has the guessed contract `lib/server.ts` codes against.
- **Auth model: real two-account login (decided, partially built).**
  `lib/server.ts` currently sends an `Authorization: Bearer` token once
  one exists; the on-the-go side of actually logging in (a login screen,
  storing the token) is what's being built right now — check this
  file's to-dos for whether that's landed yet.
- **Learning tab's real vocabulary source:** the `zuikus-puikus` branch
  has a word list (Lithuanian vocabulary + translations, no sentences)
  extracted from a children's book, meant to eventually replace the
  dummy Swedish↔Lithuanian data once main-frame has a real database to
  serve it from. Deliberately left un-merged until then — see the Log.
- **ADR-001** (push notifications): drafted, not implemented. Decision
  is Expo Push Service + an EAS Cloud development build, triggered once
  main-frame's sharing feature is live end-to-end (the client side
  already exists; the trigger is server-side, once `/api/recordings`
  sends real notifications on share).

## To-dos (backlog)

- [ ] Build `/api/recordings` on main-frame (POST to share, DELETE to
      unshare — see `docs/sharing-integration.md` on the app side for
      the guessed contract) and protect it with `requireMobileAuth()`.
- [ ] main-frame: deploy to Vercel, provision the Neon database, run the
      `create-users-table` migration, then `npm run create-user` twice
      (once per real account) against the real `DATABASE_URL`.
- [ ] on-the-go: replace the "Your name" Settings field with a real
      login screen (username + password), store the returned token, and
      have `lib/server.ts` send it. (In progress as of this entry.)
- [ ] Once main-frame has a real URL: set it as the Server URL in
      on-the-go's Settings.
- [ ] Wire the `zuikus-puikus` word list in as a Learning category once
      main-frame's database exists to serve it from, replacing (or
      sitting alongside) the current dummy Swedish↔Lithuanian data.
- [ ] Implement ADR-001 (push notifications) once sharing is live
      end-to-end.

## Sketches / ideas in progress

_Half-formed stuff, not yet decision-ready. Promote to a numbered ADR
once it firms up._

- (nothing yet)

## Log

- 2026-08-27: File created (on branch `2l3rm8`).
- 2026-08-27: Discovered PR #1 / branch `6ce6lt` had diverged
  significantly with a much more developed, differently-scoped app.
  Reconciliation deferred pending a look at main-frame's actual setup.
- 2026-08-27: Also discovered a third branch, `zuikus-puikus` — a word
  list extracted from a children's book for the Learning tab. Decided:
  leave it un-merged until main-frame's database exists to serve it
  from; it's vocabulary + translations, not the book's sentences, so it
  doesn't carry the same copyright concern extracting passages would.
- 2026-08-27: Reconciliation done. Kept `6ce6lt`'s feature work
  (flashcards, Poems, EAS Build/Update pipeline) as the going-forward
  branch, per the plan above. Resolved the auth-model conflict by
  building the real thing `2l3rm8` had mocked: a `users` table +
  NextAuth (web, future) + a separate mobile bearer-token login on
  main-frame, replacing both `2l3rm8`'s mock login and `6ce6lt`'s
  "Your name" field. The dev-loop conflict resolved itself —
  `2l3rm8`'s assumption of a computer running `expo start` was already
  established false earlier in this same effort, before `6ce6lt`'s EAS
  Build/Update loop was ever built.
