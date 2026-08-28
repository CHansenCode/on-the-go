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

- **main-frame** (separate repo): the intended backend for this app.
  Will deploy on Vercel using Vercel's Postgres service. Not built out
  yet — no API surface to point at.
- **⚠️ Two diverged branches exist for this app — unreconciled.** See
  "Open branches" below before starting any new feature work; don't
  assume the plain-`App.tsx` scaffold described in the rest of this
  snapshot is the only (or final) direction.
- **on-the-go auth (branch `claude/android-app-chat-dev-2l3rm8`):**
  two-user model (this is a shared platform between two named people,
  not open signup). Currently backed by a mock login in
  `src/api/mock.ts` (`you` / `partner`, any password) until main-frame
  exposes a real `/auth/login`. See the TODO in `src/auth/AuthContext.tsx`.
- **on-the-go data layer (same branch):** `src/api/client.ts` is an
  authenticated fetch wrapper aimed at `EXPO_PUBLIC_API_BASE_URL` (see
  `.env.example`), unused until that env var points at a real
  main-frame deployment.
- **ADR-001** (push notifications): drafted, not implemented. Decision
  is Expo Push Service + an EAS Cloud development build, triggered once
  main-frame and the actual "sharing" feature exist.
- **The core feature itself** — what "sharing" means/does in this app —
  is still undefined on this branch. (PR #1, below, has already built
  one answer to this.)

## Open branches

As of 2026-08-27, the repo has two branches with diverged, conceptually
different work and one open PR — **not yet reconciled**:

- **`claude/android-app-chat-dev-2l3rm8`** (this branch): plain
  `App.tsx` scaffold, mock two-account login, `src/api` client stub,
  ADR-000/ADR-001.
- **`claude/android-app-chat-dev-6ce6lt`** — **PR #1, "Configure EAS
  Build + EAS Update for phone-only dev loop"**, open, 19 commits: a
  much more developed, differently-scoped app renamed **"Dramonkes"** —
  a flashcard language-learning tool plus a "Poems" tab for recording
  and sharing audio. Notable overlap/conflict with this branch:
  - Already migrated to `expo-router` (deleted `App.tsx`/`index.ts`).
  - Already registered the project with EAS and added `eas.json` /
    `expo-updates` — the dev-build migration ADR-001 proposes is
    partially done there already, for a different original reason (no
    local machine available to run `expo start`).
  - Already built a sharing feature (`lib/server.ts`) against a
    *guessed* main-frame API contract, documented in
    `docs/sharing-integration.md` on that branch.
  - That doc raises the same open question as ADR-001/this file — auth
    between app and server — but its interim answer is a plain "Your
    name" Settings field, not a login, explicitly flagged there as not
    real auth.

  Decision on how to reconcile these two is **deliberately deferred to
  tomorrow** (as of 2026-08-27), pending a look at main-frame's actual
  setup. Confirmed direction so far: **the features built on `6ce6lt`
  (Dramonkes: flashcards, Poems recording/sharing) are real, wanted
  work to keep** — this isn't a "pick one branch and discard the other"
  situation, it's a merge that also has to resolve conflicting
  decisions the two branches made independently, chief among them:
  - **Auth model conflict:** `2l3rm8`'s mock two-account login (real
    sign-in, no server yet) vs. `6ce6lt`'s "Your name" Settings field
    (no auth at all, explicitly flagged there as not real). These don't
    merge automatically — pick one or design a third answer.
  - **Dev loop conflict:** `2l3rm8` assumes the `git pull` + Expo Go
    loop described in `README.md`. `6ce6lt` already moved to an EAS
    Build → download `.apk` → sideload loop, run from a **Claude mobile
    app session** configured with permissions to trigger Expo builds
    directly (not through a `git push` to a main branch — there is no
    main branch; that agent commits to its own branch and triggers
    builds from there).
  - Neither branch has ever been merged into a default/main branch —
    none exists yet. Don't assume a build or "update" implies anything
    landed anywhere beyond that agent's own branch.

  Don't unilaterally merge, close, or rebase either branch onto the
  other without checking in first.

## To-dos (backlog)

- [ ] **Tomorrow, once main-frame's setup is known:** merge the two
      branches, keeping `6ce6lt`'s feature work (flashcards, Poems),
      and resolve the auth-model and dev-loop conflicts described
      above — not a pick-one-discard-one call, an actual reconciliation.
- [ ] Define what the "sharing" feature actually is/does (the app's
      core purpose is still TBD on `2l3rm8` — see `README.md`; PR #1
      already has a candidate answer, the Poems feature).
- [ ] Wire `AuthContext.tsx` to a real main-frame `/auth/login` once
      that endpoint exists; retire `src/api/mock.ts`.
- [ ] Set `EXPO_PUBLIC_API_BASE_URL` once main-frame has a deployed URL.
- [ ] Implement ADR-001 (push notifications) once the sharing feature
      exists to trigger them.

## Sketches / ideas in progress

_Half-formed stuff, not yet decision-ready. Promote to a numbered ADR
once it firms up._

- **Build triggering needs a home that isn't tied to one session.**
  Development on this app happens from two genuinely different places —
  a mobile Claude session (good for dictating ADRs, catching user
  stories on the go) and a terminal-based Claude Code session at a
  desktop (this kind of session). Right now, actually triggering an EAS
  build/update is only possible from whichever session happens to hold
  live EAS credentials directly (per "Open branches" above, that's the
  mobile session's job today — it "triggers builds directly," commit and
  build together, from its own branch). That means "ship this" is
  currently coupled to *which session* made the change, not to the repo
  itself: a change made from a desktop terminal session has no way to
  trigger the same build the mobile session can.
  What's needed instead: a build trigger that works the same regardless
  of which environment made the change — commit from mobile, commit from
  desktop, either one should be able to result in a build without either
  session needing its own standing EAS login. The immediate instinct is
  **GitHub** as that shared point: both kinds of session can already
  `git push`, so a GitHub-side trigger (Actions, on push or
  `workflow_dispatch`) holding its own Expo/EAS token as a repo secret
  would decouple "triggering a build" from "having the EAS CLI logged in
  locally" — the same shape of problem main-frame's ADR-001 already
  solved for its own deploy pipeline (GitHub Actions + repo secrets,
  instead of any one developer's local Vercel/Neon credentials). Worth
  deliberately looking at that ADR as precedent once this gets picked
  up. Not decided, not investigated yet — just flagged so it isn't lost.

## Log

- 2026-08-27: File created.
- 2026-08-27: Discovered PR #1 / branch `claude/android-app-chat-dev-6ce6lt`
  has diverged significantly (see "Open branches"). Reconciliation
  deferred until main-frame's setup is checked.
