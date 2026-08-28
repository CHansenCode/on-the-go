// Real login against main-frame's /api/mobile/login, replacing the old
// free-typed "Your name" field. Two accounts only, no self-signup —
// there's nowhere in this app to create one.

import { readSettings, writeSettings } from './settings';

export type Session = {
  token: string;
  username: string;
  displayName: string;
};

export function getSession(): Session | null {
  const { authToken, authUsername, authDisplayName } = readSettings();
  if (!authToken || !authUsername) return null;
  return { token: authToken, username: authUsername, displayName: authDisplayName || authUsername };
}

export async function login(username: string, password: string): Promise<Session> {
  const serverUrl = readSettings().serverUrl?.trim();
  if (!serverUrl) {
    throw new Error('No server URL set. Add one above first.');
  }

  const response = await fetch(`${serverUrl.replace(/\/+$/, '')}/api/mobile/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    if (response.status === 401) throw new Error('Wrong username or password.');
    throw new Error(`Login failed: server returned ${response.status}`);
  }

  const data = await response.json();
  if (!data?.token || !data?.user?.username) {
    throw new Error('Login failed: unexpected server response');
  }

  const session: Session = {
    token: data.token,
    username: data.user.username,
    displayName: data.user.displayName ?? data.user.username,
  };

  writeSettings({
    authToken: session.token,
    authUsername: session.username,
    authDisplayName: session.displayName,
  });

  return session;
}

export function logout() {
  writeSettings({ authToken: undefined, authUsername: undefined, authDisplayName: undefined });
}
