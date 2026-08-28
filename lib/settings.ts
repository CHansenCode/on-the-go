// One local settings file, one place that reads/writes it — so unrelated
// features (dark mode, the sharing server, whose phone this is) never
// clobber each other by each writing their own trimmed-down JSON blob.

import { File, Paths } from 'expo-file-system';

export type ColorScheme = 'light' | 'dark';

export type AppSettings = {
  colorScheme?: ColorScheme;
  serverUrl?: string;
  /** @deprecated superseded by the real login below (authToken etc.) */
  userName?: string;
  authToken?: string;
  authUsername?: string;
  authDisplayName?: string;
};

// main-frame's stable production URL (confirmed live, not one of the
// per-deployment preview URLs that changes on every push) — see
// main-frame's adr/ADR-000-living-document.md. Used as the default so
// the app works out of the box; still overridable from Settings (e.g.
// to point at staging or a local dev server instead).
export const DEFAULT_SERVER_URL = 'https://main-frame-chansencodes-projects.vercel.app';

const settingsFile = new File(Paths.document, 'settings.json');

export function readSettings(): AppSettings {
  try {
    if (!settingsFile.exists) return { serverUrl: DEFAULT_SERVER_URL };
    const parsed = JSON.parse(settingsFile.textSync());
    const settings = typeof parsed === 'object' && parsed !== null ? parsed : {};
    return { serverUrl: DEFAULT_SERVER_URL, ...settings };
  } catch {
    return { serverUrl: DEFAULT_SERVER_URL };
  }
}

export function writeSettings(patch: Partial<AppSettings>) {
  try {
    const next = { ...readSettings(), ...patch };
    if (!settingsFile.exists) {
      settingsFile.create();
    }
    settingsFile.write(JSON.stringify(next));
  } catch {
    // Best effort — worst case a preference doesn't survive a restart.
  }
}
