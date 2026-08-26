// Talks to the not-yet-built "main-frame" backend. The endpoint shapes
// here are a guess at a reasonable contract — {name, user, soundFile,
// directory} in, {id} back — and are meant to be the first thing we
// reconcile once that server actually exists and we know its real API.

import { readSettings } from './settings';

export class ServerNotConfiguredError extends Error {
  constructor() {
    super('No server URL set. Add one in Settings first.');
    this.name = 'ServerNotConfiguredError';
  }
}

function getServerUrl(): string {
  const url = readSettings().serverUrl?.trim();
  if (!url) throw new ServerNotConfiguredError();
  return url.replace(/\/+$/, '');
}

export type ShareRecordingInput = {
  name: string;
  directory: string[];
  soundFileBase64: string;
};

// Uploads the recording; returns the remote record's id.
export async function shareRecording({ name, directory, soundFileBase64 }: ShareRecordingInput): Promise<string> {
  const baseUrl = getServerUrl();
  const user = readSettings().userName?.trim() || 'unknown';

  const response = await fetch(`${baseUrl}/api/recordings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, user, directory, soundFile: soundFileBase64 }),
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
  });

  if (!response.ok && response.status !== 404) {
    throw new Error(`Unshare failed: server returned ${response.status}`);
  }
}
