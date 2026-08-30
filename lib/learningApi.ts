// Talks to main-frame's Learning-app API (ADR-002 in that repo): decks,
// cards, and word recordings. Mirrors lib/server.ts's conventions — same
// Settings-provided server URL, same "throw if not configured" shape.

import { getSession } from './auth';
import { readSettings } from './settings';
import { NotLoggedInError, ServerNotConfiguredError } from './server';

function getServerUrl(): string {
  const url = readSettings().serverUrl?.trim();
  if (!url) throw new ServerNotConfiguredError();
  return url.replace(/\/+$/, '');
}

// main-frame now gates these routes behind a mobile bearer token (see
// its adr/ADR-000-living-document.md) — same session/token server.ts's
// Poems calls already use.
function authHeaders(): Record<string, string> {
  const session = getSession();
  if (!session) throw new NotLoggedInError();
  return { Authorization: `Bearer ${session.token}` };
}

// main-frame's project has Vercel's own deployment protection on every
// URL (staging included — see main-frame's adr/ADR-000-living-document.md),
// so a request from outside Vercel's own infra needs this header to get
// past the SSO wall. EXPO_PUBLIC_* vars are inlined into the JS bundle at
// EAS build time — same "not really secret once shipped" status as any
// other value baked into a mobile app, which this app's own docs already
// reason about (see docs/sharing-integration.md's note on static tokens).
// If unset (e.g. local dev against an unprotected URL), the header is
// simply omitted rather than failing outright.
function protectionBypassHeaders(): Record<string, string> {
  const secret = process.env.EXPO_PUBLIC_VERCEL_BYPASS_SECRET;
  return secret ? { 'x-vercel-protection-bypass': secret } : {};
}

// There's no "list decks" endpoint on main-frame yet, so the decks that
// exist are hardcoded here until that changes. See on-the-go's
// adr/ADR-000-living-document.md.
export const DECKS = [
  {
    id: 1,
    name: 'Swedish ↔ Lithuanian',
    languageOneLabel: 'Swedish',
    languageTwoLabel: 'Lithuanian',
  },
  {
    id: 2,
    name: 'Žuikis Puikus',
    languageOneLabel: 'Lithuanian',
    languageTwoLabel: 'Swedish',
  },
] as const;

export type Deck = (typeof DECKS)[number];

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
  const response = await fetch(`${baseUrl}/api/decks/${deckId}/cards${query}`, {
    headers: { ...protectionBypassHeaders(), ...authHeaders() },
  });
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
    headers: { 'Content-Type': 'application/json', ...protectionBypassHeaders(), ...authHeaders() },
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
    headers: { 'Content-Type': 'application/json', ...protectionBypassHeaders(), ...authHeaders() },
    body: JSON.stringify({ word, audioBase64, recordedBy }),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? `Upload failed: server returned ${response.status}`);
  }
  return response.json();
}
