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
- **on-the-go auth:** two-user model (this is a shared platform between
  two named people, not open signup). Currently backed by a mock login
  in `src/api/mock.ts` (`you` / `partner`, any password) until
  main-frame exposes a real `/auth/login`. See the TODO in
  `src/auth/AuthContext.tsx`.
- **on-the-go data layer:** `src/api/client.ts` is an authenticated
  fetch wrapper aimed at `EXPO_PUBLIC_API_BASE_URL` (see
  `.env.example`), unused until that env var points at a real
  main-frame deployment.
- **ADR-001** (push notifications): drafted, not implemented. Decision
  is Expo Push Service + an EAS Cloud development build, triggered once
  main-frame and the actual "sharing" feature exist.
- **The core feature itself** — what "sharing" means/does in this app —
  is still undefined. Everything above is infrastructure sketched ahead
  of the feature it'll support.

## To-dos (backlog)

- [ ] Define what the "sharing" feature actually is/does (the app's
      core purpose is still TBD — see `README.md`).
- [ ] Wire `AuthContext.tsx` to a real main-frame `/auth/login` once
      that endpoint exists; retire `src/api/mock.ts`.
- [ ] Set `EXPO_PUBLIC_API_BASE_URL` once main-frame has a deployed URL.
- [ ] Implement ADR-001 (push notifications) once the sharing feature
      exists to trigger them.

## Sketches / ideas in progress

_Half-formed stuff, not yet decision-ready. Promote to a numbered ADR
once it firms up._

- (nothing yet)

## Log

- 2026-08-27: File created.
