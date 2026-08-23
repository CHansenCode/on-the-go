# On The Go

An Android app, purpose TBD. Built with [Expo](https://expo.dev) + React
Native + TypeScript, developed entirely through chat with Claude — no
computer required.

## How this app gets built

There's no computer running a local dev server for this project. Instead:

1. **One-time setup**: an installable APK was built in Expo's cloud (EAS
   Build) and sideloaded onto the phone directly — no Play Store.
2. **Every code change since**: Claude edits the code in this repo, commits
   and pushes, then publishes an over-the-air update (`eas update`). The
   installed app checks for updates on launch, so a full close-and-reopen
   picks up the change in seconds — no rebuild, no reinstall.
3. A new **EAS Build** (and reinstall) is only needed again if something
   native changes — a new native module/dependency, an Expo SDK upgrade, or
   native config like permissions or the app icon.

## Project structure

Routing is file-based via [Expo Router](https://docs.expo.dev/router/introduction/):

- `app/_layout.tsx` — root layout.
- `app/(tabs)/_layout.tsx` — the bottom tab bar.
- `app/(tabs)/index.tsx` — the **Learning** tab.
- `app/(tabs)/status.tsx` — the **Status** tab.
- `app.json` — Expo app config (name, icon, Android/iOS settings, EAS
  project id, OTA update URL).
- `eas.json` — EAS Build profiles (`preview` for the sideloaded APK,
  `production` for a future Play Store build) and the update channel.

Add a new page by adding a new file under `app/`.
