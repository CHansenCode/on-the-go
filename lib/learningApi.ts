// Talks to main-frame's Learning-app API (ADR-002 in that repo): decks,
// cards, and word recordings. Mirrors lib/server.ts's conventions — same
// Settings-provided server URL, same "throw if not configured" shape.

import { readSettings } from './settings';
import { ServerNotConfiguredError } from './server';

function getServerUrl(): string {
  const url = readSettings().serverUrl?.trim();
  if (!url) throw new ServerNotConfiguredError();
  return url.replace(/\/+$/, '');
}

// Only one deck exists on main-frame today, and there's no "list decks"
// endpoint yet to discover others — hardcoded until that changes. See
// on-the-go's adr/ADR-000-living-document.md.
export const CURRENT_DECK = {
  id: 1,
  name: 'Swedish ↔ Lithuanian',
  languageOneLabel: 'Swedish',
  languageTwoLabel: 'Lithuanian',
};

export type ApiCard = {
  id: number;
  // null for decks with no English gloss column in their source data
  // (e.g. the Žuikis Puikus deck, which is Lithuanian/Swedish only).
  languageEng: string | null;
  languageOne: string;
  languageTwo: string;
  languageOneRecording: { recordedAt: string } | null;
  languageTwoRecording: { recordedAt: string } | null;
};

export async function fetchDeckCards(deckId: number, wordCount?: number): Promise<ApiCard[]> {
  const baseUrl = getServerUrl();
  const query = wordCount ? `?wordCount=${wordCount}` : '';
  const response = await fetch(`${baseUrl}/api/decks/${deckId}/cards${query}`);
  if (!response.ok) {
    throw new Error(`Fetching deck failed: server returned ${response.status}`);
  }
  return response.json();
}

export type BatchRecording = { word: string; recordedAt: string; audioBase64: string };

export async function fetchRecordingsBatch(words: string[]): Promise<BatchRecording[]> {
  if (words.length === 0) return [];
  const baseUrl = getServerUrl();
  const response = await fetch(`${baseUrl}/api/recordings/batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ words }),
  });
  if (!response.ok) {
    throw new Error(`Fetching recordings failed: server returned ${response.status}`);
  }
  return response.json();
}

export async function uploadRecording(
  word: string,
  audioBase64: string,
  recordedBy?: string
): Promise<{ word: string; recordedAt: string }> {
  const baseUrl = getServerUrl();
  const response = await fetch(`${baseUrl}/api/recordings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ word, audioBase64, recordedBy }),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? `Upload failed: server returned ${response.status}`);
  }
  return response.json();
}
