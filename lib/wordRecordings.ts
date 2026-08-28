// Local cache for word_recordings audio, mirroring lib/poems.ts's approach:
// the filesystem is the source of truth for what's cached, with a small
// per-file JSON sidecar for metadata (here, just `recordedAt`, used to
// detect a stale copy) instead of a separate index/database to keep in
// sync. See adr/ADR-001-word-recordings.md for the full design.

import { Directory, File, Paths } from 'expo-file-system';

import type { ApiCard } from './learningApi';
import { fetchRecordingsBatch } from './learningApi';

const ROOT_DIR_NAME = 'word-recordings';

// Every cache entry is keyed by the word's lower-cased form, matching
// main-frame's own case-insensitive identity for a recording (ADR-002) —
// callers don't need to remember to lower-case before calling.
function canonical(word: string): string {
  const lower = word.trim().toLowerCase();
  const safe = lower.replace(/[\/\\:*?"<>|]/g, '');
  return safe.length > 0 ? safe : '_';
}

function getRoot(): Directory {
  const root = new Directory(Paths.document, ROOT_DIR_NAME);
  if (!root.exists) {
    root.create({ intermediates: true, idempotent: true });
  }
  return root;
}

function audioFileFor(word: string): File {
  return new File(getRoot(), `${canonical(word)}.m4a`);
}

function metaFileFor(word: string): File {
  return new File(getRoot(), `${canonical(word)}.m4a.meta.json`);
}

function readLocalRecordedAt(word: string): string | null {
  const metaFile = metaFileFor(word);
  try {
    if (!metaFile.exists) return null;
    const parsed = JSON.parse(metaFile.textSync());
    return typeof parsed.recordedAt === 'string' ? parsed.recordedAt : null;
  } catch {
    return null;
  }
}

function writeLocalRecordedAt(word: string, recordedAt: string) {
  const metaFile = metaFileFor(word);
  if (!metaFile.exists) metaFile.create();
  metaFile.write(JSON.stringify({ recordedAt }));
}

// Base64 -> bytes without pulling in a dependency: Buffer isn't available
// in this runtime, and atob/btoa support isn't guaranteed across every
// engine this app could run on. Verified against round-trips of every
// byte-length class (no padding / one pad char / two pad chars).
const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
function base64ToBytes(base64: string): Uint8Array {
  const clean = base64.replace(/[^A-Za-z0-9+/]/g, '');
  const bytes: number[] = [];
  for (let i = 0; i < clean.length; i += 4) {
    const e1 = BASE64_CHARS.indexOf(clean[i]);
    const e2 = BASE64_CHARS.indexOf(clean[i + 1]);
    const e3 = clean[i + 2] !== undefined ? BASE64_CHARS.indexOf(clean[i + 2]) : -1;
    const e4 = clean[i + 3] !== undefined ? BASE64_CHARS.indexOf(clean[i + 3]) : -1;
    bytes.push((e1 << 2) | (e2 >> 4));
    if (e3 !== -1) bytes.push(((e2 & 15) << 4) | (e3 >> 2));
    if (e4 !== -1) bytes.push(((e3 & 3) << 6) | e4);
  }
  return Uint8Array.from(bytes);
}

/** Local file:// URI to play this word's audio from, or null if not cached. */
export function getLocalRecordingUri(word: string): string | null {
  const file = audioFileFor(word);
  return file.exists ? file.uri : null;
}

/**
 * Given the cards a session is about to run with, downloads whichever
 * recordings are missing locally or older than the server's copy, in one
 * batched request. Words with no recording at all (both *Recording
 * fields null) are skipped — nothing to fetch. Meant to run once, behind
 * a loading state, before a session starts.
 */
export async function syncRecordings(cards: ApiCard[]): Promise<void> {
  const remote = new Map<string, string>(); // canonical word -> recordedAt
  for (const card of cards) {
    if (card.languageOneRecording) {
      remote.set(canonical(card.languageOne), card.languageOneRecording.recordedAt);
    }
    if (card.languageTwoRecording) {
      remote.set(canonical(card.languageTwo), card.languageTwoRecording.recordedAt);
    }
  }

  const stale = [...remote.entries()]
    .filter(([word, recordedAt]) => readLocalRecordedAt(word) !== recordedAt)
    .map(([word]) => word);

  if (stale.length === 0) return;

  const fetched = await fetchRecordingsBatch(stale);
  for (const { word, recordedAt, audioBase64 } of fetched) {
    const file = audioFileFor(word);
    if (file.exists) file.delete();
    file.create();
    file.write(base64ToBytes(audioBase64));
    writeLocalRecordedAt(word, recordedAt);
  }
}

/**
 * Called right after a successful upload. We already have the just-
 * recorded bytes sitting on disk (wherever expo-audio wrote them) — copy
 * that straight into the cache instead of re-downloading what we just
 * uploaded.
 */
export async function cacheJustUploadedRecording(
  word: string,
  recordedUri: string,
  recordedAt: string
): Promise<void> {
  const destination = audioFileFor(word);
  if (destination.exists) destination.delete();
  await new File(recordedUri).copy(destination);
  writeLocalRecordedAt(word, recordedAt);
}
