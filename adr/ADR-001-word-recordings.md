# ADR-001: Front-end requirements for word recordings

## Status

Draft / Proposed — not yet implemented, blocked on main-frame building
the API surface this depends on. Captures requirements ahead of time,
mirroring main-frame's ADR-002.

## Context

main-frame's ADR-002 (`main-frame` repo, `adr/ADR-002-learning-app-schema.md`)
designs a `word_recordings` table for this app's Learning tab: either
person can record short audio for a word on a flashcard so the other can
hear it. It's matched to a card by lower-cased word text rather than a
hard foreign key, stored as raw AAC bytes directly in Postgres (no CDN
or object storage), and comes with three requirements the eventual
upload route must enforce: lower-case the word server-side, verify the
audio actually decodes as AAC, and reject anything over 10 seconds. That
ADR settles the backend shape; this one works through what those
decisions require of on-the-go specifically.

Two things worth flagging about where this file lives:

- This branch (`claude/android-app-chat-dev-6ce6lt`) doesn't have an
  `adr/` folder yet — the sibling branch,
  `claude/android-app-chat-dev-2l3rm8`, already has one (an ADR-000
  living document plus ADR-001 on push notifications), and the two
  branches are explicitly not yet reconciled (see `2l3rm8`'s ADR-000).
  Rather than add a second, competing ADR-000 here that would need
  manual merging later, this file starts the convention on this branch
  with just the one numbered decision it's actually recording. Once the
  branches are reconciled, this should be folded into whichever ADR-000
  survives.
- This branch has no main-frame integration at all yet — the Learning
  tab runs entirely on local dummy data (`data/flashcards.ts`).
  Everything below is blocked on main-frame's API surface existing,
  which is itself an open to-do on main-frame's side, not something this
  ADR can resolve.

## Decision (proposed)

1. **Recording format: explicit AAC/`.m4a` config, not default
   presets.** `expo-av`'s (or `expo-audio`'s) recording presets don't
   necessarily produce the same container/codec on iOS and Android by
   default. Recording options need to be set explicitly for both
   platforms to guarantee `.m4a`/AAC output either way — matching what
   main-frame's upload route will actually accept. Relying on an
   un-inspected preset risks recording something the server then
   rejects.
2. **Client-side 10-second guard, mirroring the server's hard limit.**
   main-frame will reject uploads over 10 seconds — that's the real
   boundary, not this one. The front end's job is UX: catching this
   before a wasted recording/upload round-trip, not enforcing
   correctness by itself. Two ways to do that, not decided between yet:
   - Auto-stop the recording at 10 seconds sharp — simplest, and
     guarantees every upload passes without the user ever seeing a
     rejection.
   - Let the user record freely, then warn and prompt a re-record if
     they went over.

   Auto-stop is the recommended default unless there's a concrete UX
   reason to let people finish a sentence past 10 seconds — flagging
   this as a decision for whoever implements it, not settled here.
3. **No client-side lower-casing required, but harmless if added.**
   main-frame's route is the authority on normalizing the word's case
   before matching or inserting. The client doesn't need to duplicate
   that before upload, though it may still lower-case locally for its
   own optimistic "does this word already have a recording" checks.
4. **Upload:** send the recorded audio plus the word being recorded to
   whatever endpoint main-frame exposes for this — not built yet (see
   main-frame's ADR-000 to-dos). Blocked until that lands.
5. **Fetching a deck's cards with recordings attached, and the
   conditional "record" button:** once a group and word count are
   chosen, cards should come back with recording info per slot
   (`language_one`/`language_two` independently — either, both, or
   neither may have a recording). A slot with none shows a "record this"
   button; a slot with one shows a play button instead. The exact
   response shape this needs to parse depends on an open call on
   main-frame's side — a streaming `GET /api/recordings/:id` endpoint
   vs. an inlined base64 data URI per card (see ADR-002) — so this
   client needs to adapt to whichever main-frame lands on rather than
   assuming one now.

## Consequences

- Everything above is blocked on main-frame's API surface existing at
  all; nothing here can be implemented before then (tracked on
  main-frame's side, not duplicated in this file).
- Whichever way point 5 resolves changes how much work this client does
  itself — a dedicated audio-fetch step per recording vs. everything
  arriving in one response — worth confirming with main-frame before
  starting implementation rather than guessing and building twice.
- Recording requires microphone permission, new for this app — not
  decided here, but worth noting alongside the notification permissions
  `2l3rm8`'s ADR-001 (push notifications) already introduces, since both
  will eventually need reconciling into one permissions story once the
  branches merge.
