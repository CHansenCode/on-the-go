// Poems are stored directly as files on disk — a folder is a real
// Directory, a recording is a real audio File inside it. No database,
// no separate index to keep in sync: the filesystem *is* the source of
// truth for what exists locally. Whether a recording has been shared to
// the (not-yet-built) backend is tracked in a small JSON sidecar next to
// each recording — e.g. "Ode to Tuesday.m4a.meta.json" — since that's
// metadata *about* the file, not folder/file structure itself.

import { Directory, File, Paths } from 'expo-file-system';

const ROOT_DIR_NAME = 'poems';

function sanitizeName(name: string): string {
  // Strip characters that aren't safe in a filename/path segment.
  const safe = name.trim().replace(/[\/\\:*?"<>|]/g, '');
  return safe.length > 0 ? safe : 'Untitled';
}

export function getRoot(): Directory {
  const root = new Directory(Paths.document, ROOT_DIR_NAME);
  if (!root.exists) {
    root.create({ intermediates: true, idempotent: true });
  }
  return root;
}

export function listFolders(): Directory[] {
  return getRoot()
    .list()
    .filter((entry): entry is Directory => entry instanceof Directory)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function createFolder(name: string): Directory {
  const folder = new Directory(getRoot(), sanitizeName(name));
  if (!folder.exists) {
    folder.create({ intermediates: true, idempotent: true });
  }
  return folder;
}

export function getFolder(folderName: string): Directory {
  return new Directory(getRoot(), folderName);
}

// Deletes the folder and everything in it (all its recordings).
export function deleteFolder(folder: Directory) {
  folder.delete();
}

type RecordingMeta = {
  shared: boolean;
  remoteId: string | null;
  sharedAt: string | null;
};

const UNSHARED_META: RecordingMeta = { shared: false, remoteId: null, sharedAt: null };

function metaFileFor(file: File): File {
  return new File(file.parentDirectory, `${file.name}.meta.json`);
}

function readMeta(file: File): RecordingMeta {
  const metaFile = metaFileFor(file);
  try {
    if (!metaFile.exists) return UNSHARED_META;
    const parsed = JSON.parse(metaFile.textSync());
    return {
      shared: Boolean(parsed.shared),
      remoteId: typeof parsed.remoteId === 'string' ? parsed.remoteId : null,
      sharedAt: typeof parsed.sharedAt === 'string' ? parsed.sharedAt : null,
    };
  } catch {
    return UNSHARED_META;
  }
}

function writeMeta(file: File, meta: RecordingMeta) {
  const metaFile = metaFileFor(file);
  if (!metaFile.exists) {
    metaFile.create();
  }
  metaFile.write(JSON.stringify(meta));
}

export type Recording = {
  file: File;
  name: string; // display name, without the file extension
  createdAt: Date | null;
  shared: boolean;
  remoteId: string | null;
};

export function listRecordings(folder: Directory): Recording[] {
  const files = folder
    .list()
    .filter((entry): entry is File => entry instanceof File && entry.name.endsWith('.m4a'));

  return files
    .map((file) => {
      const meta = readMeta(file);
      return {
        file,
        name: file.name.replace(/\.m4a$/, ''),
        createdAt: file.creationTime ? new Date(file.creationTime) : null,
        shared: meta.shared,
        remoteId: meta.remoteId,
      };
    })
    .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
}

// Moves a just-finished recording (still sitting wherever expo-audio wrote
// it) into the chosen folder, under the name the user gave it. Adds " (2)",
// " (3)", etc. if that name is already taken in the folder.
export async function saveRecording(folder: Directory, name: string, recordedUri: string): Promise<File> {
  const baseName = sanitizeName(name);
  let destination = new File(folder, `${baseName}.m4a`);
  let attempt = 1;
  while (destination.exists) {
    attempt += 1;
    destination = new File(folder, `${baseName} (${attempt}).m4a`);
  }

  const source = new File(recordedUri);
  await source.move(destination);
  return destination;
}

export function deleteRecording(recording: Recording) {
  const metaFile = metaFileFor(recording.file);
  if (metaFile.exists) {
    metaFile.delete();
  }
  recording.file.delete();
}

export function markRecordingShared(recording: Recording, remoteId: string): Recording {
  const meta: RecordingMeta = { shared: true, remoteId, sharedAt: new Date().toISOString() };
  writeMeta(recording.file, meta);
  return { ...recording, shared: true, remoteId };
}

export function markRecordingUnshared(recording: Recording): Recording {
  writeMeta(recording.file, UNSHARED_META);
  return { ...recording, shared: false, remoteId: null };
}
