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
- **main-frame** (separate repo, `chansencode/main-frame`): the backend,
  live now — staging (`master`/Preview) and production both deployed
  and migrated, staging/production pipeline as designed (see
  main-frame's ADR-001). `users` table exists (two accounts, no
  self-signup); NextAuth is wired for a future web login; a separate
  `/api/mobile/login` route issues this app's bearer token.
  `/api/recordings` exists too, but it's Learning's word_recordings
  upload endpoint, not Poems' — see the Sketches section and the to-do
  below. Every `*.vercel.app` deployment URL sits behind Vercel's own
  SSO wall (`ssoProtection: all_except_custom_domains`); this app gets
  past it with a Protection Bypass secret sent as a header (see
  `lib/learningApi.ts`), not a decision Poems' future endpoint gets to
  skip re-making — same header will be needed there too.
- **Auth model: real two-account login, done.** `lib/auth.ts` handles
  login/logout/session against `/api/mobile/login`; `lib/server.ts`
  sends the resulting `Authorization: Bearer` token. Settings has a real
  username/password form in place of the old "Your name" field.
- **Learning tab's real vocabulary source:** the `zuikus-puikus` word
  list (Lithuanian vocabulary + translations extracted from a
  children's book) is merged and live — both it and the original dummy
  Swedish↔Lithuanian deck are real decks in main-frame's database,
  selectable from the Learning tab today.
- **ADR-001** (push notifications): drafted, not implemented. Decision
  is Expo Push Service + an EAS Cloud development build, triggered once
  Poems' sharing feature is live end-to-end — still blocked on that (see
  the Sketches section), not on main-frame existing anymore.

## To-dos (backlog)

- [ ] **Build Poems' actual backend endpoint** — not `/api/recordings`,
      that name is now taken by Learning's word_recordings upload route.
      See the Sketches section below for the real open questions
      (storage shape, and that nothing sketched so far lets the other
      person actually hear a shared poem) before just picking a new path
      and wiring it up.
- [x] ~~main-frame: deploy to Vercel, provision the Neon database~~ —
      done. Production: `https://main-frame-chansencodes-projects.vercel.app`.
- [x] ~~on-the-go: replace the "Your name" Settings field with a real
      login screen~~ — done (`lib/auth.ts`, real username/password login,
      see "Auth model" above).
- [x] ~~Once main-frame has a real URL: set it as the Server URL~~ —
      done, defaults automatically now (`lib/settings.ts`), overridable
      from Settings.
- [x] ~~Wire the `zuikus-puikus` word list in as a Learning category~~ —
      done: both it and the original dummy deck are live, selectable
      from the Learning tab's category list.
- [ ] Implement ADR-001 (push notifications) once sharing is live
      end-to-end — still blocked on the to-do above, not just on
      main-frame existing anymore.

## Sketches / ideas in progress

_Half-formed stuff, not yet decision-ready. Promote to a numbered ADR
once it firms up._

- **Poems' backend integration needs a real look, not just wiring up
  the guessed contract.** `docs/sharing-integration.md`'s provisional
  contract (`POST /api/recordings` → `{id}`, `DELETE /api/recordings/:id`)
  predates the Learning app's real backend work and has a concrete
  problem now: main-frame's actual `/api/recordings` (built today, see
  its own ADR-002) is the *word_recordings* upload endpoint —
  `{word, audioBase64, recordedBy}` in, `{word, recordedAt}` out. Same
  path, completely different shape. Pointing `lib/server.ts` at the real
  main-frame today would just fail (or worse, silently misvalidate).
  Poems needs its own path — `/api/poems` is the obvious pick, matching
  how `decks`/`word_recordings` are named after the feature they belong
  to, not reused across features.

  Three real, unresolved things worth deciding before wiring it for
  real, not just fixing the path:
  1. **Storage shape probably shouldn't just copy `word_recordings`.**
     That table's `bytea` column was justified by real math — 3-second
     clips, a hard 10-second server-side cap, comfortably inside Neon's
     free-tier storage (see main-frame's ADR-002). Poems have no stated
     length limit at all today, and a poem recitation is plausibly
     minutes long, not seconds. The same "just store bytes in Postgres"
     reasoning doesn't automatically carry over — worth actually
     computing, the way word_recordings' storage was, rather than
     assuming.
  2. **There's no way for the other person to ever actually hear a
     shared poem.** The guessed contract only has upload
     (`POST`) and delete (`DELETE`) — no list, no fetch. Sharing today
     would be write-only from main-frame's perspective: a poem goes in,
     and nothing sketched anywhere reads it back out. That's arguably
     the actual point of "sharing" not being designed yet, not a small
     gap.
  3. Auth is *not* an open question anymore, unlike when that doc was
     written — `lib/server.ts` already sends a real Bearer token via
     `getSession()`, same mechanism Learning uses. Nothing new needed
     here, just noting it so it doesn't get re-litigated.

  Not promoting this to a numbered ADR yet since (1) and (2) are real
  open questions, not settled decisions dressed up as a sketch.

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
- 2026-08-28: main-frame deployed for real (staging and production),
  Learning tab wired to it end-to-end, `zuikus-puikus` merged in as a
  real deck, and the Vercel SSO-wall + Server-URL-default gaps closed —
  see main-frame's own ADR-000 for the fuller account. Refreshed this
  file's stale "being built right now"/"no live deployment" bullets
  above to match. While checking Poems' own path to a real backend,
  found that `docs/sharing-integration.md`'s guessed `/api/recordings`
  contract now collides with the real one main-frame built today for a
  different feature entirely — see Sketches.
