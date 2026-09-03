# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

# Branch workflow

Read `adr/ADR-000-living-document.md` first, every session — it's the
running backlog/context sketchpad.

This repo is developed from both a **mobile** session (the Claude app,
phone-only) and a **desktop** session (Claude Code CLI, or the human).
They don't have the same GitHub access, so:

- **If you're a mobile session** (no reachable way to rename/delete a
  branch or change the default branch — only create branch/commit and
  open/close/merge PR): branch from `main`'s tip, name it
  `claude/<short-slug>`, and work toward a **draft PR against `main`**.
  Don't expect to rename, force-repoint, or delete the branch yourself.
- **If you're a desktop session**: you own branch administration —
  review and merge (or close) PRs mobile sessions open, then delete the
  branch (remote *and* local, plus any worktree checked out to it) once
  it's merged or confirmed superseded. Don't leave merged/superseded
  branches sitting around.

Full rationale: `adr/ADR-003-mobile-desktop-branch-workflow.md`.
