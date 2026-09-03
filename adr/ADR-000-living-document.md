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
    (JS-only changes) — no computer involved, see `README.md`. Two
    `eas update`s have actually shipped this way already (see Log) —
    JS-only changes reliably don't need a new Build.
  - main-frame ships via git push to `master` → Vercel preview
    (staging) → a manual GitHub Actions `workflow_dispatch` to promote
    to production. Already exercised for real: staging deploy, DB
    migration, and a first production promotion have all actually run
    (main-frame's own ADR-000 Log has the details).
  - **Open problem, not solved, getting worse:** triggering an on-the-go
    build is tied to whichever session holds live EAS credentials —
    and as of this entry, *two* sessions hold them at once (this one,
    and a separate desktop session that used its own login to publish
    the updates in the Log below). That's a live collision risk, not
    just a hypothetical one — see "Sketches" below.
- **main-frame** (separate repo, `chansencode/main-frame`): the backend.
  Next.js on Vercel, Postgres on Neon. Live and real now, not just
  designed: a `users` table (two accounts, no self-signup) backs both
  NextAuth (future web login) and `/api/mobile/login` (this app's bearer
  token). `GET /api/decks/:deckId/cards`, `POST /api/recordings`
  (Learning's word_recordings upload — *not* Poems', see Sketches), and
  `POST /api/recordings/batch` all exist and are deployed. **All three
  are now auth-gated behind `requireMobileAuth()`** — `lib/learningApi.ts`
  sends the same bearer token `lib/server.ts`'s Poems calls already use
  (see Log). Production's stable URL: `https://main-frame-chansencodes-projects.vercel.app`.
  Every request also needs an `x-vercel-protection-bypass` header to get
  past Vercel's SSO wall — see `lib/learningApi.ts`, value comes from
  `EXPO_PUBLIC_VERCEL_BYPASS_SECRET` at EAS build time, not committed.
- **Auth model: real two-account login — built and merged into the
  Learning tab.** `lib/auth.ts` (`login`/`logout`/`getSession`) backs a
  real login form in Settings; `lib/server.ts`'s Poems sharing and
  `components/FlashcardSession.tsx`'s word-recording attribution both
  now read the same session (the latter's use of the older
  `readSettings().userName` field was a leftover from before these two
  pieces of parallel work were reconciled — fixed, see Log). Whether the
  two real accounts have actually been created yet (`npm run
  create-user`, main-frame side) hasn't been confirmed from either
  session's vantage point — check before assuming login works
  end-to-end on-device.
- **Learning tab's real vocabulary source: wired in.** The `zuikus-puikus`
  book vocabulary (237 words) is now deck 2 ("Žuikis Puikus") in
  `lib/learningApi.ts`'s `DECKS`, seeded on main-frame and live in
  production alongside the original 100-word Swedish↔Lithuanian deck
  (deck 1). `data/flashcards.ts` and all local dummy data are gone —
  the Learning tab is 100% API-backed now.
- **on-the-go's Server URL now defaults to production in code**
  (`lib/settings.ts`'s `DEFAULT_SERVER_URL`) rather than needing to be
  typed in by hand on each phone — Settings can still override it (e.g.
  to point at staging). No device-side action needed for this anymore.
- **ADR-001** (push notifications): drafted, not implemented. Decision
  is Expo Push Service + an EAS Cloud development build, triggered once
  Poems' sharing feature is live end-to-end — blocked specifically on
  Poems getting its own backend endpoint (see Sketches), not on
  main-frame existing at all anymore.
- **ADR-002** (word recordings, front-end half): implemented — see that
  file's own status line for what's verified vs. still open (no
  "list decks" endpoint, nothing writes to `decks_attempts` yet, routes
  not auth-gated).
- **`main` now exists and is GitHub's default branch** (created
  2026-08-31, from `6ce6lt`'s tip). Until then the repo had never had
  one — GitHub's default was a `claude/…` dev branch. PR #1 (which had
  proposed merging `6ce6lt` into `2l3rm8`) was closed as superseded,
  since its head was already `main`'s tip. `2l3rm8` was checked once
  more for anything not yet reflected on `main` — nothing was; its
  feature work stays superseded (see above) and its process notes are
  already folded into this file. Left alone, not deleted (only branch
  kept around deliberately — see 2026-09-03 Log entry for why every
  other one wasn't).
- **Session workflow: branch administration is desktop-only.** Promoted
  to **ADR-003** (`adr/ADR-003-mobile-desktop-branch-workflow.md`) —
  see that file for the full decision. Short version: mobile branches
  from `main`, names it `claude/<slug>`, works toward a draft PR against
  `main`; desktop owns merging, deleting branches, and all other
  repo-settings actions.

## To-dos (backlog)

- [ ] **Build Poems' actual backend endpoint** — not `/api/recordings`,
      that name is now taken by Learning's word_recordings upload route.
      See the Sketches section for the real open questions (storage
      shape, and that nothing sketched so far lets the other person
      actually hear a shared poem) before just picking a new path and
      wiring it up.
- [ ] **On-device:** log in from Settings (Server URL now defaults
      correctly on its own — see above).
- [ ] Confirm the two real accounts actually exist on main-frame
      (`npm run create-user` run twice against the real `DATABASE_URL`)
      — not confirmed from either session's vantage point.
- [x] ~~main-frame: gate `/api/decks/:deckId/cards`, `/api/recordings`,
      `/api/recordings/batch` behind `requireMobileAuth()`~~ — done
      2026-08-30 on main-frame's side; `lib/learningApi.ts` updated in
      the same session to send the bearer token. See Log. **Not yet
      shipped to a device** — needs an `eas update` (JS-only) once
      pushed, or Learning will start 401ing against a gated staging/
      production deploy.
- [ ] Implement ADR-001 (push notifications) once Poems' sharing is
      live end-to-end.
- [ ] **Decide the shared build-trigger problem (Sketches) before it
      causes real damage, not just wasted work.** Two rounds of
      unreconciled concurrent pushes have already landed on this branch
      (see Log) purely by luck of non-overlapping files — an actual
      conflict is only a matter of time with two sessions both holding
      live EAS credentials at once.
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
- [x] ~~Confirm whether a new EAS Build (vs. just an EAS Update) is
      needed to ship the merged Learning-tab/word-recording work~~ —
      confirmed JS-only: two `eas update`s have already shipped it for
      real (see Log).

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
- **Build triggering needs a home that isn't tied to one session.**
  Right now, actually triggering an EAS build/update is only possible
  from whichever session happens to hold live EAS credentials directly
  — today that's effectively "whichever session gets there first," and
  as of this entry that's literally true of two sessions simultaneously.
  That ambiguity is what let a round of concurrent work happen unnoticed
  until a `git fetch` surfaced it (see Log) — twice, counting this one.
  What's needed: a build trigger that works the same regardless of which
  session made the change — the likely shape is GitHub Actions holding
  its own Expo/EAS token as a repo secret (on push, or
  `workflow_dispatch`), the same pattern main-frame's own ADR-001
  already used for its deploy pipeline instead of relying on any one
  developer's local credentials. Not decided or investigated yet — just
  flagged so it isn't lost. (Originally ported over from `2l3rm8`'s own
  sketch of the same problem, independently arrived at.)

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
  concurrent work: a separate (desktop) session had pushed directly onto
  both `6ce6lt` and main-frame's `master` while this session was
  mid-task on the auth work above — real API routes
  (`/api/decks/:deckId/cards`, `/api/recordings`, `/api/recordings/batch`),
  a full schema (`decks`/`decks_cards`/`decks_attempts`/`word_recordings`,
  main-frame's own ADR-002), the Learning tab rewritten to call that API
  instead of local dummy data, the real `zuikus-puikus` vocabulary
  seeded as a second deck, Vercel's SSO wall resolved via a
  protection-bypass secret, and a first real production promotion. Both
  fast-forwarded cleanly (no divergence — `ed035c5`, this session's auth
  commit, is an ancestor of main-frame's new tip, and the other
  session's own main-frame log records merging that same commit in on
  their end). One real integration gap from the two efforts running in
  parallel: `FlashcardSession.tsx`'s word-recording upload still
  attributed recordings via the old `readSettings().userName` field
  instead of the new `lib/auth.ts` session — fixed as part of reading in
  this round. Separately, that desktop session found that
  `docs/sharing-integration.md`'s guessed `/api/recordings` contract for
  Poems now collides with the real `/api/recordings` main-frame built
  the same day for a completely different feature — see Sketches.
- 2026-08-28: That same desktop session logged into EAS directly (its
  own login, not the mobile session's) and published two real
  `eas update`s to the `preview` channel — the merged Learning-tab/
  word-recording work, then a follow-up defaulting Server URL to
  production. Both JS-only, no new Build needed, confirming that to-do.
  This is the concrete case the build-trigger sketch above warns about:
  two sessions holding live EAS credentials at once, purely by each
  independently deciding to log in — the *third* round of unreconciled
  concurrent work on this branch today (this Log entry's own merge being
  the third `git fetch` surprise), this time on the exact resource
  (`adr/ADR-000-living-document.md` itself) most likely to conflict.
- 2026-08-30: main-frame gated `/api/decks/:deckId/cards`,
  `/api/recordings`, and `/api/recordings/batch` behind
  `requireMobileAuth()` (decided a while back, only just implemented —
  see main-frame's own ADR-000 Log). `lib/learningApi.ts` updated in the
  same session, before that landed, to send `Authorization: Bearer
  <token>` via a new `authHeaders()` — same `getSession()`/
  `NotLoggedInError` pattern `lib/server.ts`'s Poems calls already use,
  so the two files handle "not logged in" identically now. Verified with
  `tsc --noEmit` only (no Expo/device run) — not yet shipped to a
  device, so Learning will 401 in the field until an `eas update` goes
  out (see To-dos; this session has no EAS login to do that itself).
- 2026-08-31: A separate (Claude Code, desktop) session noticed the repo
  had no `main` branch at all — GitHub's default was
  `claude/android-app-chat-dev-2l3rm8`, a shorter, older dev line.
  Created `main` from `6ce6lt`'s tip (`e721a3d`, the same commit as
  `android-app-review`) and the human set it as GitHub's default. PR #1
  (`6ce6lt` → `2l3rm8`) closed as superseded — its head was already
  `main`'s tip, nothing left to merge. Re-checked `2l3rm8` once more for
  anything not yet folded into `main`: nothing was (see "Current context
  snapshot" above). That session also had no way to rename or delete a
  branch or change the repo's default branch — GitHub-settings actions,
  out of reach of the git-object-level GitHub tools it had — which is
  the origin of the "branch administration is desktop-only" convention
  above.
- 2026-09-03: A desktop session ran the first real branch cleanup under
  that convention, plus fixed unrelated local corruption it found along
  the way (not caused by this session — pre-existing as of Aug 31):
  - **Local repo repair:** the checked-out `android-app-review` branch
    had a 0-byte ref file (no commit, `HEAD` wouldn't resolve, `git
    fetch` failed outright) and, separately, 35 of 41 tracked files were
    0 bytes on disk even though git's index/objects still held real
    content matching `main`. Both fixed — HEAD now on a proper local
    `main` tracking `origin/main`, working tree restored from the index
    (no data was actually lost; it was recoverable from git the whole
    time).
  - **Draft PR #2 (`claude/missing-main-branch-2nczun`) reviewed and
    merged** — the 33-line ADR-000 addition that had recorded the
    branch-admin convention above. Promoted that convention out of this
    file into **ADR-003** (`adr/ADR-003-mobile-desktop-branch-workflow.md`)
    and into `AGENTS.md` (so every session, mobile or desktop, actually
    sees it), since it's now been exercised for real, not just sketched.
  - **Branch cleanup:** deleted `claude/android-app-chat-dev-6ce6lt`
    (remote + local; PR #1 already closed as superseded, identical to
    `main`) and `android-app-review` (remote; pure duplicate of `main`,
    no PR), removed the `.claude/worktrees/on-the-go-hotfixes` worktree
    that had been checked out to `6ce6lt`, and deleted a stray
    local-only `reconcile-6ce6lt` branch (unpushed, mislabeled — it
    actually pointed at `2l3rm8`'s tip). `claude/android-app-chat-dev-2l3rm8`
    left alone, per the existing decision to keep it for reference.
  - Remaining branches: `main` (default) and `claude/android-app-chat-dev-2l3rm8`
    (kept for reference) only.
