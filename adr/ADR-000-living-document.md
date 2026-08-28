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

- **Branch reconciliation: done, twice over.** `6ce6lt` is the branch
  going forward; `2l3rm8`'s mock two-account login and API client stub
  were retired in favor of the real thing. A **second** round of
  concurrent work then landed directly on both `6ce6lt` and main-frame's
  `master` from a separate ("desktop") session while this session was
  mid-task on the auth work below — see the Log for what that added.
  `2l3rm8` itself is still left alone, not deleted, not merged (only its
  `adr/` docs and sketches get ported over by hand as they show up).
- **The app is "Dramonkes"**: a flashcard language-learning tab
  (Learning) plus a shared audio-poem recorder (Poems), for exactly two
  people.
- **Two build/deploy loops exist, decoupled from each other:**
  - on-the-go ships via EAS Build (native changes) + EAS Update
    (JS-only changes) — no computer involved, see `README.md`.
  - main-frame ships via git push to `master` → Vercel preview
    (staging) → a manual GitHub Actions `workflow_dispatch` to promote
    to production. Already exercised for real: staging deploy, DB
    migration, and a first production promotion have all actually run
    (main-frame's own ADR-000 Log has the details).
  - **Open problem, not yet solved:** triggering an on-the-go build is
    still tied to whichever session holds live EAS credentials — see
    "Sketches" below.
- **main-frame** (separate repo, `chansencode/main-frame`): the backend.
  Next.js on Vercel, Postgres on Neon. Live and real now, not just
  designed: a `users` table (two accounts, no self-signup) backs both
  NextAuth (future web login) and `/api/mobile/login` (this app's bearer
  token). `GET /api/decks/:deckId/cards`, `POST /api/recordings`, and
  `POST /api/recordings/batch` all exist and are deployed to production
  — **but none of the three are auth-gated yet** (`requireMobileAuth()`
  exists and is ready to adopt; main-frame's own ADR-000 to-dos track
  this). Production's stable URL: `https://main-frame-chansencodes-projects.vercel.app`.
  Every request also needs an `x-vercel-protection-bypass` header to get
  past Vercel's SSO wall — see `lib/learningApi.ts`, value comes from
  `EXPO_PUBLIC_VERCEL_BYPASS_SECRET` at EAS build time, not committed.
- **Auth model: real two-account login — built and merged into the
  Learning tab.** `lib/auth.ts` (`login`/`logout`/`getSession`) backs a
  real login form in Settings; `lib/server.ts`'s Poems sharing and
  `components/FlashcardSession.tsx`'s word-recording attribution both
  now read the same session (the latter's use of the older
  `readSettings().userName` field was a leftover from before these two
  pieces of parallel work were reconciled — fixed as part of this
  entry). Whether the two real accounts have actually been created yet
  (`npm run create-user`, main-frame side) hasn't been confirmed in this
  session — check before assuming login works end-to-end on-device.
- **Learning tab's real vocabulary source: wired in.** The `zuikus-puikus`
  book vocabulary (237 words) is now deck 2 ("Žuikis Puikus") in
  `lib/learningApi.ts`'s `DECKS`, seeded on main-frame and live in
  production alongside the original 100-word Swedish↔Lithuanian deck
  (deck 1). `data/flashcards.ts` and all local dummy data are gone —
  the Learning tab is 100% API-backed now.
- **on-the-go's Server URL is still not actually set anywhere.** It's a
  per-device Settings field (`readSettings().serverUrl`), typed by hand
  on the phone — nothing in the repo can set it. Until someone opens
  Settings and enters the production URl above, the Learning tab and
  Poems sharing can't reach main-frame at all, on either device.
- **ADR-001** (push notifications): drafted, not implemented. Decision
  is Expo Push Service + an EAS Cloud development build, triggered once
  main-frame's sharing feature is live end-to-end (the client side
  already exists; the trigger is server-side, once `/api/recordings`
  sends real notifications on share).
- **ADR-002** (word recordings, front-end half): implemented — see that
  file's own status line for what's verified vs. still open (no
  "list decks" endpoint, nothing writes to `decks_attempts` yet, routes
  not auth-gated).

## To-dos (backlog)

- [ ] **On-device:** open Settings and set the Server URL to
      `https://main-frame-chansencodes-projects.vercel.app`, then log in
      — neither the Learning tab nor Poems sharing can reach main-frame
      until that's typed in by hand on each phone.
- [ ] Confirm the two real accounts actually exist on main-frame
      (`npm run create-user` run twice against the real `DATABASE_URL`)
      — not confirmed from this session's vantage point.
- [ ] main-frame: gate `/api/decks/:deckId/cards`, `/api/recordings`,
      `/api/recordings/batch` behind `requireMobileAuth()` — currently
      wide open. (Tracked on main-frame's own ADR-000 too; don't
      duplicate the fix, just don't forget it from this side.)
- [ ] Confirm whether a new EAS Build (vs. just an EAS Update) is needed
      to actually ship the merged Learning-tab/word-recording work to
      both phones — `expo-audio` was already a native dependency before
      this (Poems), so this is probably JS-only and shippable via
      `eas update`, but that should be verified (`tsc`, `expo export`)
      rather than assumed before publishing.
- [ ] Implement ADR-001 (push notifications) once sharing is live
      end-to-end.
- [ ] Decide the shared build-trigger problem below (Sketches) before it
      causes a real conflict — two sessions have already landed
      concurrent, unreconciled work on this same branch once.

## Sketches / ideas in progress

_Half-formed stuff, not yet decision-ready. Promote to a numbered ADR
once it firms up._

- **Build triggering needs a home that isn't tied to one session.**
  Right now, actually triggering an EAS build/update is only possible
  from whichever session happens to hold live EAS credentials directly
  — today that's effectively "whichever session gets there first."
  That's what let this round of concurrent work happen unnoticed until
  a `git fetch` surfaced it. What's needed: a build trigger that works
  the same regardless of which session made the change — the likely
  shape is GitHub Actions holding its own Expo/EAS token as a repo
  secret (on push, or `workflow_dispatch`), the same pattern
  main-frame's own ADR-001 already used for its deploy pipeline instead
  of relying on any one developer's local credentials. Not decided or
  investigated yet — just flagged so it isn't lost. (Ported over from
  `2l3rm8`'s own sketch of the same problem, independently arrived at.)

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
- 2026-08-28: A `git fetch` surfaced a second, unreconciled round of
  concurrent work: a separate session had pushed directly onto both
  `6ce6lt` and main-frame's `master` while this session was mid-task on
  the auth work above — real API routes (`/api/decks/:deckId/cards`,
  `/api/recordings`, `/api/recordings/batch`), a full schema
  (`decks`/`decks_cards`/`decks_attempts`/`word_recordings`, main-frame's
  own ADR-002), the Learning tab rewritten to call that API instead of
  local dummy data, the real `zuikus-puikus` vocabulary seeded as a
  second deck, Vercel's SSO wall resolved via a protection-bypass
  secret, and a first real production promotion. Both fast-forwarded
  cleanly (no divergence — `ed035c5`, this session's auth commit, is an
  ancestor of main-frame's new tip, and the other session's own
  main-frame log records merging that same commit in on their end).
  One real integration gap from the two efforts running in parallel:
  `FlashcardSession.tsx`'s word-recording upload still attributed
  recordings via the old `readSettings().userName` field instead of the
  new `lib/auth.ts` session — fixed as part of reading in this round.
