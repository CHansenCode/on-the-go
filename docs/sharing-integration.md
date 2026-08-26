# Poems sharing — status & integration notes

Tracks what's implemented on the app side for sharing poems, the
provisional contract it talks to, and what's still open before it can
talk to a real backend.

## Status

**Local (done, works today, no backend needed):**

- Recordings and folders can be deleted (`lib/poems.ts`:
  `deleteRecording`, `deleteFolder`). Deleting a folder removes
  everything inside it. Both confirm via an alert first.
- Each recording's share state (`shared`, `remoteId`) is tracked in a
  JSON sidecar next to the audio file — `<name>.m4a.meta.json`. The
  filesystem is still the source of truth for what recordings/folders
  exist; this sidecar is just metadata *about* a file, not structure.
- Settings (`app/(tabs)/settings.tsx`) gained two fields: **Your name**
  and **Server URL**, stored via `lib/settings.ts` (one consolidated
  local settings file, read-modify-write, so unrelated features don't
  clobber each other's fields).
- Poems folder screen: a share icon per recording toggles share/unshare.
  A shared recording's name renders in the theme's accent color; an
  unshared one stays in normal text — color is the only visual
  difference, no extra iconography.

**Remote (client is wired, server doesn't exist yet):**

- `lib/server.ts` implements `shareRecording()` and `unshareRecording()`
  against a guessed contract (below). Right now, tapping share/unshare
  either fails with "no server configured" (if Settings → Server URL is
  empty) or a real HTTP error (since nothing is listening yet).

## Provisional API contract

Guessed, not finalized — reconcile this against whatever `main-frame`
actually implements once that repo exists / is attached to a session.

**Share** — `POST {serverUrl}/api/recordings`

```json
{
  "name": "Ode to Tuesday",
  "user": "Alex",
  "directory": ["Us"],
  "soundFile": "<base64-encoded .m4a>"
}
```

Response: `{ "id": "<remote record id>" }` on success. Any non-2xx is
treated as failure and shown to the user.

`directory` is an array of path segments — currently always a single
element since the app only supports one folder level today, but shaped
to extend to nested folders later without a contract change.

**Unshare** — `DELETE {serverUrl}/api/recordings/:id`

204/200 or 404 (already gone) are both treated as success.

Roughly matches the shape floated for the DB record itself:
`{ name, user, soundFile, directory }`.

## Open items

- **Auth strategy between app and server.** Nothing today — the app
  just POSTs to whatever URL is in Settings, unauthenticated. Needs a
  decision before this goes further than local testing: a shared
  static token (simplest, fine for "only two users" but a secret
  baked into a mobile app is only ever a speed bump, not real
  security), per-user login (more work, actual auth), or something
  else. Worth deciding this *before* wiring the real endpoints rather
  than bolting it on after.
- Real endpoint URLs/response shapes once `main-frame` exists — this
  doc's contract is a starting point for that conversation, not a
  spec either side is committed to.
- No retry/offline queueing if a share fails mid-upload — it just
  surfaces an alert today.
- No "list what's shared" / browse-the-shared-library view yet on
  either side.
