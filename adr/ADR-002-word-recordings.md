# ADR-002: Front-end requirements for word recordings

## Status

Implemented (`lib/learningApi.ts`, `lib/wordRecordings.ts`,
`components/FlashcardSession.tsx`) — main-frame's API surface now
exists, and this branch calls it instead of local dummy data. Verified
against a live main-frame instance: real cards fetched, a real AAC
recording uploaded and re-fetched through the batch endpoint, and the
local base64 decoder checked byte-for-byte against the original file.
Not yet run on an actual device/simulator — that verification is still
open, along with three gaps out of scope for this pass: there's still
no "list decks" endpoint (`CURRENT_DECK` is hardcoded), nothing writes
to `decks_attempts` yet (swipe results stay client-side only), and the
`decks`/`recordings` routes aren't auth-gated (see main-frame's
ADR-000).

## Context

main-frame's ADR-002 (`main-frame` repo, `adr/ADR-002-learning-app-schema.md`)
designs a `word_recordings` table for this app's Learning tab: either
person can record short audio for a word on a flashcard so the other can
hear it. It's matched to a card by lower-cased word text rather than a
hard foreign key, stored as raw AAC bytes directly in Postgres (no CDN
or object storage), and comes with requirements the eventual upload
route must enforce: lower-case the word server-side, verify the audio
actually decodes as AAC, reject anything over 10 seconds, and upsert
rather than reject/duplicate on re-record. That ADR settles the backend
shape; this one works through what those decisions require of on-the-go
specifically — including a client-side architecture decision (caching
recordings locally, below) that in turn reshaped main-frame's read path.

Two things worth flagging about this file's history:

- It was originally written and numbered ADR-001, at a point when this
  branch (`claude/android-app-chat-dev-6ce6lt`) had no `adr/` folder of
  its own yet — the sibling branch, `claude/android-app-chat-dev-2l3rm8`,
  already had one (an ADR-000 living document plus its own ADR-001 on
  push notifications), and the two branches were explicitly not yet
  reconciled. Renumbered to ADR-002 once that reconciliation actually
  happened (see ADR-000's log) and `2l3rm8`'s `adr/` folder — including
  its ADR-001 — was ported onto this branch, which otherwise would have
  left two different ADR-001 files.
- When this was written, this branch had no main-frame integration at
  all — the Learning tab ran entirely on local dummy data
  (`data/flashcards.ts`). That's what the "Implemented" status above
  and the rest of this document now supersede.

## Decision (proposed)

1. **Recording format: explicit AAC/`.m4a` config, not default
   presets.** `expo-audio` (already a dependency — the Poems tab records
   with it) doesn't necessarily produce the same container/codec on iOS
   and Android with an un-inspected preset. Recording options need to be
   set explicitly for both platforms to guarantee `.m4a`/AAC output
   either way — matching what main-frame's upload route will actually
   accept, and matching what Poems already saves as (`lib/poems.ts`
   writes `.m4a` files today, so the format side of this may already be
   covered — worth confirming rather than assuming when this gets built).
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
   conditional "record"/play button:** cards come back with recording
   metadata per slot (`language_one`/`language_two` independently —
   either, both, or neither may have one). A slot with none shows
   "record this"; a slot with one shows play. Playback is always from a
   local file, never a live fetch — see the caching design below, which
   is what actually determines the shape of the metadata and audio
   endpoints on main-frame's side.

### Local caching: play from disk, not from the network

Recordings are cached to local device storage rather than fetched fresh
on every playback, mirroring the Poems tab's existing approach
(`lib/poems.ts`): the filesystem is the source of truth for what's
cached, no separate database or index to keep in sync with it beyond a
small per-file metadata sidecar (Poems' `<file>.m4a.meta.json` pattern).

- **Storage layout:** a new `word-recordings/` directory under
  `Paths.document` (via `expo-file-system`'s `Directory`/`File`, same as
  Poems), one `<sanitized-word>.m4a` file per cached recording plus a
  `<sanitized-word>.m4a.meta.json` sidecar holding `{ recordedAt }` —
  the same timestamp main-frame returns for that word, used purely to
  detect staleness, not displayed anywhere.
- **The flow, once a group and word count are chosen:**
  1. Show a loading state.
  2. Fetch that deck's cards from main-frame — metadata only
     (`recordedAt` per slot with a recording, `null` for slots without
     one), no audio bytes. See main-frame's ADR-002 for this endpoint's
     shape.
  3. For each word in the response that has a recording, compare its
     `recordedAt` to the local sidecar's (if any). Collect the words
     that are either not cached at all or whose local copy is older.
  4. Send that collected list — and only that list — in one batched
     request to main-frame, get back audio for just those words, save
     each to `word-recordings/`, and write its sidecar.
  5. Drop the loading state; render the deck. Every play button reads
     from the local `.m4a` file, never the network.
- **Re-recording is what makes step 3 necessary at all:** since
  main-frame upserts a word's recording in place (ADR-002) rather than
  keeping history, `recorded_at` moving forward is the only signal that
  a previously-cached copy is now stale — there's no other way to know
  someone else re-recorded a word since this device last synced it.
- **No eviction policy for now.** Even a full corpus of recordings is
  small (tens of MB at worst — see main-frame's ADR-002 storage math),
  so nothing here deletes a cached recording once fetched. Worth
  revisiting only if the corpus grows enough for that to matter, which
  isn't close today.

## Consequences

- Everything above is blocked on main-frame's API surface existing at
  all; nothing here can be implemented before then (tracked on
  main-frame's side, not duplicated in this file).
- The local cache never shrinks on its own (no eviction policy) — fine
  at today's scale, worth a real look if the recording corpus ever grows
  enough to threaten device storage, which is far off.
- A stale local recording is only ever detected the next time its deck
  is opened (the staleness check happens at deck-load time, not via any
  background sync) — someone re-recording a word won't reach the other
  person's device until they next open that deck.
- Recording requires microphone permission, new for this app — not
  decided here, but worth noting alongside the notification permissions
  `2l3rm8`'s ADR-001 (push notifications) already introduces, since both
  will eventually need reconciling into one permissions story once the
  branches merge.
