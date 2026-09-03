# ADR-003: Mobile/desktop branch workflow

## Status

Accepted. Formalizes a convention ADR-000 first recorded ad hoc on
2026-08-31 (see its Log), and this repo has now exercised for real: a
mobile session opened `claude/missing-main-branch-2nczun` as a draft PR
against `main`, and a desktop session reviewed, merged, and deleted it,
alongside a broader branch cleanup — see ADR-000's Log for that session.

## Context

This app is developed from two kinds of sessions with different tool
access:

- **Mobile** (the Claude app, phone-only, no computer involved): can
  create branches and commits and open/close/merge PRs — git-object-level
  operations — but has no reachable way to rename or delete a branch,
  or change the repository's default branch. Those are GitHub
  repo-settings actions, discovered to be out of reach the hard way
  while setting up `main` (ADR-000, 2026-08-31 Log entry).
- **Desktop** (Claude Code CLI, or the human directly via GitHub's UI):
  has full access, including repo settings.

Without an explicit convention, a mobile session has no way to clean up
after itself — a branch it opens is a branch only desktop can ever
retire. Left unaddressed, that just accumulates stale branches
indefinitely.

## Decision

- **A mobile session branches from `main`'s tip**, names the branch
  `claude/<short-slug>` (matching how GitHub already names
  Claude-created branches), and works toward a **draft PR against
  `main`**. It does not attempt to rename, force-repoint, or delete the
  branch itself, and does not assume it will become the default branch.
- **A desktop session (or the human, via GitHub's UI) owns branch
  administration**: reviewing and merging (or closing) PRs opened by
  mobile sessions, deleting branches once merged or superseded (both
  `git push origin --delete` and the local branch), removing any local
  worktrees checked out to a branch before it's deleted, renaming
  branches, and changing the default branch.
- **Superseded branches are deleted, not left around**, once a desktop
  session has confirmed (via diff, not assumption) that nothing on them
  is unmerged and unique. A branch kept deliberately for reference
  (e.g. `claude/android-app-chat-dev-2l3rm8` as of this writing) is a
  one-off exception, noted in ADR-000, not the default.
- **This is the standing workflow going forward**, not a one-time fix —
  every future mobile-originated branch is expected to follow the same
  `claude/<slug>` → draft PR → desktop merge/cleanup path.

## Consequences

- A mobile session's branch may sit open, un-renamed and undeleted,
  between when its PR is ready and when a desktop session next runs
  cleanup — normal and expected, not a bug to fix on the mobile side.
- Desktop sessions need to actually run this cleanup periodically (or be
  asked to); nothing currently automates it. Worth revisiting if that
  becomes a recurring source of drift.
- `git push origin --delete` and default-branch/rename changes remain
  desktop-only by construction — no future attempt should be made to
  route those through a mobile session's tools.
