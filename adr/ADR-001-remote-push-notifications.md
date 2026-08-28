# ADR-001: Remote push notifications for sharing events

## Status

Draft / Proposed — not yet implemented. Revisit once main-frame's API and
the actual sharing feature exist; this ADR just captures the shape of the
migration ahead of time.

## Context

`on-the-go` is a two-person shared platform (see `README.md`'s auth
model). The core notification requirement is: when one person shares
something, the other person gets a notification on their phone, and vice
versa. That's a **remote push notification**, not a local one — it has to
be delivered by a server (main-frame) to a device that may not have the
app open.

Two things about the current setup make this non-trivial:

1. **Dev workflow.** The current dev loop (`README.md`) runs the app in
   **Expo Go**: edit code, `git pull` on the phone-connected machine,
   `expo start` hot-reloads over the same WiFi network. This is fast to
   iterate on but has no native code of its own.
2. **Expo Go dropped remote push.** As of Expo SDK 53+, `expo-notifications`
   no longer supports *remote* push notifications inside Expo Go on
   Android — only local (on-device, no server involved) notifications
   still work there. Testing real push requires a **development build**
   instead of Expo Go.

So adding this feature isn't just "install a package" — it also forces a
dev-loop change.

## Decision (proposed)

- **Package:** `expo-notifications`, using **Expo push tokens** relayed
  through the **Expo Push Service**, rather than integrating directly
  with Firebase Cloud Messaging (FCM). main-frame sends notifications by
  POSTing to Expo's push endpoint with each recipient's Expo push token,
  instead of managing Firebase project credentials itself.
- **Token storage:** each user's Expo push token is registered with
  main-frame (new column/table keyed to the user record already used for
  auth — see `src/auth/`) on login / app start, and refreshed if it
  changes.
- **Trigger:** the "share" action on main-frame, once it exists, looks up
  the *other* user's token and sends a push through the Expo Push
  Service.
- **Dev workflow:** move from Expo Go to an **EAS Cloud development
  build** for anything push-related — see "The new development flow"
  below for what that changes in practice (short version: day-to-day
  editing stays the same; only the one-time build step and an Expo
  account are new).

## Consequences

- New dependency: `expo-notifications`, plus its config plugin in
  `app.json` (icon/color/sound config, Android permissions).
- Android setup needed regardless of push: a notification channel
  (mandatory on Android 8+) and a runtime permission prompt (Android 13+).
- The phone will need a development build installed at least once
  (via EAS Build in the cloud, or a local `expo prebuild` + native
  Android build) to test push — plain Expo Go is no longer sufficient
  for that slice of testing. This changes the "just `git pull` and it
  reloads" story from `README.md` for push-related work specifically.
- main-frame gains a responsibility it didn't have before: storing push
  tokens per user and calling out to Expo's push API, including handling
  push receipts/errors (e.g. dropping a token that comes back
  `DeviceNotRegistered`).

## The new development flow

The good news: the *day-to-day* loop barely changes. What changes is a
one-time setup step, and what triggers redoing it.

**Today (Expo Go), for reference:**
1. Edit code, push the commit.
2. `git pull` on the phone-connected machine.
3. The already-running `expo start` dev server picks it up; Expo Go
   reloads in a couple seconds. No rebuild, no Expo account.

**One-time setup for a development build:**
1. Add `expo-dev-client` and `expo-notifications` as dependencies.
2. Produce a development build — a custom APK that replaces Expo Go on
   the phone, with those native modules baked in. Two ways to get one:
   - **EAS Cloud Build** (recommended for us):
     `eas build --platform android --profile development`. Compiles on
     Expo's servers — no Android SDK needed on your machine. Output is a
     downloadable APK you sideload onto your phone (one-time "allow
     installs from this source" prompt).
   - **Local build**: `npx expo run:android`. Compiles on your own
     machine via Android Studio's SDK — no Expo account, but requires
     the full Android toolchain installed locally.

   Since I (Claude) run in the cloud and you're just pulling and running
   on your phone, **EAS Cloud Build fits our setup better** — it doesn't
   ask you to install Android Studio just to get a dev build onto your
   phone.

**Day-to-day after that: unchanged.** Same `git pull`, same already
running `npx expo start`, same instant JS hot-reload. The only visible
difference is you open the custom dev-client app instead of Expo Go — it
has a small launcher screen but connects to the dev server the same way.

**When you'd have to rebuild (redo the one-time step):**
- Adding a new native dependency later.
- Changing native config in `app.json` (notification icon/color,
  permissions).
- Upgrading the Expo SDK.

Everyday JS/TS edits reload exactly like they do now in between those
events.

## Account and cost implications

EAS Cloud Build requires an Expo account for the first time in this
project — today, `expo start` + Expo Go work anonymously, with no
account at all. Setting this up means:

- `eas login` once, and `eas build:configure` once (links an EAS project
  id into `app.json`). A personal free Expo account is enough; nothing
  about the two-user setup or main-frame requires a paid or
  organization-level account.

Cost-wise, the free tier should comfortably cover this project:

| | Free tier | Expected usage here |
|---|---|---|
| EAS Build | 15 Android builds/month, 1 concurrent, 45 min timeout | Rebuilds only happen on native-dependency/config/SDK changes — rare, not a daily thing |
| EAS Update (OTA) | up to 1,000 MAU | 2 users |
| Push sending (Expo Push Service, `exp.host`) | Not part of EAS's paid tiers at all — a separate, free API | N/A |

So this migration is a one-time account-creation step, not a
recurring-cost decision. Revisit only if build frequency or user count
ever grows enough to bump into the free-tier limits above.

## Alternatives considered

- **Local notifications only.** Rejected — doesn't satisfy the actual
  requirement, since local notifications can't be triggered by the other
  person's action from another device.
- **Direct FCM integration (skip Expo Push Service).** Gives more control
  and removes a dependency on Expo's relay infrastructure, at the cost of
  main-frame having to manage a Firebase project and FCM credentials
  directly. Deferred for now since the Expo Push Service path is
  significantly less setup for a two-user app; revisit if we ever move
  off Expo tooling.
- **Client-side polling instead of push.** Rejected — defeats the point
  of an instant notification and burns battery/data for no benefit over
  a proper push.

## Open questions

- Push token lifecycle: when to drop/refresh a stored token (logout,
  reinstall, token rotation).
- iOS is out of scope for now (README describes this as an Android app);
  if that changes, APNs credentials become part of this decision too.
