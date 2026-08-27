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

const settingsFile = new File(Paths.document, 'settings.json');

export function readSettings(): AppSettings {
  try {
    if (!settingsFile.exists) return {};
    const parsed = JSON.parse(settingsFile.textSync());
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
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
