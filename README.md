# On The Go

An Android app, purpose TBD. Built with [Expo](https://expo.dev) + React
Native + TypeScript so it's fast to iterate on and easy to see changes live
on a real phone.

## Running it on your phone

1. Install **Expo Go** from the Play Store on your Android phone.
2. On your computer, clone this repo and install dependencies:

   ```sh
   git clone https://github.com/chansencode/on-the-go.git
   cd on-the-go
   npm install
   ```

3. Start the dev server:

   ```sh
   npx expo start
   ```

4. Scan the QR code it prints with the Expo Go app (your phone and
   computer need to be on the same WiFi network). The app opens on your
   phone.

## The dev loop with Claude

This session runs in the cloud, not on your machine, so the loop is:

1. You ask for a change in this chat.
2. Claude edits the code here and pushes the commit to this branch.
3. On your machine: `git pull`, and the running `expo start` dev server
   picks up the change and reloads the app on your phone automatically —
   usually within a second or two.

No rebuild, no reinstalling the app — just pull and it reloads.

## Project structure

- `App.tsx` — the root component. Start here.
- `app.json` — Expo app config (name, icon, Android/iOS settings).
- `index.ts` — entry point, registers `App` as the root component.
