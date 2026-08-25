// Poems are stored directly as files on disk — a folder is a real
// Directory, a recording is a real audio File inside it. No database,
// no separate index to keep in sync: the filesystem *is* the source of
// truth. Everything here is local-only; there's no sync between devices
// yet.

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

export type Recording = {
  file: File;
  name: string; // display name, without the file extension
  createdAt: Date | null;
};

export function listRecordings(folder: Directory): Recording[] {
  const files = folder
    .list()
    .filter((entry): entry is File => entry instanceof File && entry.name.endsWith('.m4a'));

  return files
    .map((file) => ({
      file,
      name: file.name.replace(/\.m4a$/, ''),
      createdAt: file.creationTime ? new Date(file.creationTime) : null,
    }))
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
  recording.file.delete();
}
