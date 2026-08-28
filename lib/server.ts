// Talks to the "main-frame" backend. The endpoint shapes here are a
// guess at a reasonable contract — {name, user, soundFile, directory}
// in, {id} back — documented in docs/sharing-integration.md, and meant
// to be the first thing reconciled once /api/recordings actually exists.

import { getSession } from './auth';
import { readSettings } from './settings';

export class ServerNotConfiguredError extends Error {
  constructor() {
    super('No server URL set. Add one in Settings first.');
    this.name = 'ServerNotConfiguredError';
  }
}

export class NotLoggedInError extends Error {
  constructor() {
    super('Not logged in. Log in from Settings first.');
    this.name = 'NotLoggedInError';
  }
}

function getServerUrl(): string {
  const url = readSettings().serverUrl?.trim();
  if (!url) throw new ServerNotConfiguredError();
  return url.replace(/\/+$/, '');
}

function authHeaders(): Record<string, string> {
  const session = getSession();
  if (!session) throw new NotLoggedInError();
  return { Authorization: `Bearer ${session.token}` };
}

export type ShareRecordingInput = {
  name: string;
  directory: string[];
  soundFileBase64: string;
};

// Uploads the recording; returns the remote record's id.
export async function shareRecording({ name, directory, soundFileBase64 }: ShareRecordingInput): Promise<string> {
  const baseUrl = getServerUrl();
  const session = getSession();
  if (!session) throw new NotLoggedInError();

  const response = await fetch(`${baseUrl}/api/recordings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ name, user: session.displayName, directory, soundFile: soundFileBase64 }),
  });

  if (!response.ok) {
    throw new Error(`Share failed: server returned ${response.status}`);
  }

  const data = await response.json();
  if (!data?.id) {
    throw new Error('Share failed: server response had no id');
  }
  return String(data.id);
}

export async function unshareRecording(remoteId: string): Promise<void> {
  const baseUrl = getServerUrl();

  const response = await fetch(`${baseUrl}/api/recordings/${encodeURIComponent(remoteId)}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });

  if (!response.ok && response.status !== 404) {
    throw new Error(`Unshare failed: server returned ${response.status}`);
  }
}
