// App-wide color scheme + a manual dark-mode toggle. Falls back to the
// system appearance the first time the app is opened, then remembers
// whatever the user picked in Settings — written straight to a small
// JSON file via expo-file-system, since there's no database yet but this
// one preference is worth persisting across app restarts.

import { createContext, useContext, useMemo, useState, type PropsWithChildren } from 'react';
import { Appearance } from 'react-native';
import { File, Paths } from 'expo-file-system';

export type ColorScheme = 'light' | 'dark';

export type Colors = {
  background: string;
  surface: string;
  border: string;
  text: string;
  textMuted: string;
  accent: string;
  onAccent: string;
};

// primary: black/white · secondary: green-leaning teal · background: warm
// off-white (light) / cool off-black (dark), each nudged toward the
// opposite mode's accent so the whole thing reads as one family.
export const palette: Record<ColorScheme, Colors> = {
  light: {
    background: '#F4F1E9',
    surface: '#FFFFFF',
    border: '#E3DFD2',
    text: '#171717',
    textMuted: '#6E6B62',
    accent: '#1C9A88',
    onAccent: '#FFFFFF',
  },
  dark: {
    background: '#10140F',
    surface: '#1A211C',
    border: '#2B332C',
    text: '#F2F1EC',
    textMuted: '#98A196',
    accent: '#3CDBC0',
    onAccent: '#0A0F0C',
  },
};

type ThemeContextValue = {
  scheme: ColorScheme;
  colors: Colors;
  toggleScheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const settingsFile = new File(Paths.document, 'settings.json');

function readStoredScheme(): ColorScheme | null {
  try {
    if (!settingsFile.exists) return null;
    const parsed = JSON.parse(settingsFile.textSync());
    return parsed.colorScheme === 'dark' || parsed.colorScheme === 'light' ? parsed.colorScheme : null;
  } catch {
    return null;
  }
}

function writeStoredScheme(scheme: ColorScheme) {
  try {
    if (!settingsFile.exists) {
      settingsFile.create();
    }
    settingsFile.write(JSON.stringify({ colorScheme: scheme }));
  } catch {
    // Best effort — worst case the preference doesn't survive a restart.
  }
}

function initialScheme(): ColorScheme {
  return readStoredScheme() ?? (Appearance.getColorScheme() === 'dark' ? 'dark' : 'light');
}

export function ThemeProvider({ children }: PropsWithChildren) {
  const [scheme, setScheme] = useState<ColorScheme>(initialScheme);

  const toggleScheme = () => {
    setScheme((prev) => {
      const next: ColorScheme = prev === 'dark' ? 'light' : 'dark';
      writeStoredScheme(next);
      return next;
    });
  };

  const value = useMemo(() => ({ scheme, colors: palette[scheme], toggleScheme }), [scheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
}
