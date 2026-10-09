import { Directory, File, Paths } from 'expo-file-system';

import type { PackFiles } from './store';

/**
 * PackFiles on the phone, with expo-file-system, under the app's own files folder
 * (Paths.document). The app writes every file itself: files pushed with adb are owned by
 * the shell user and the app cannot read them (Wave 0).
 */
export function createExpoPackFiles(folderName: string): PackFiles {
  const root = new Directory(Paths.document, folderName);
  const uriOf = (path: string) => (path ? Paths.join(root.uri, path) : root.uri);

  return {
    async readText(path) {
      const file = new File(uriOf(path));
      return file.exists ? file.text() : null;
    },

    async writeText(path, text) {
      const file = new File(uriOf(path));
      if (!file.exists) file.create({ intermediates: true });
      file.write(text);
    },

    async listDirectories(path) {
      const folder = new Directory(uriOf(path));
      if (!folder.exists) return [];
      return folder
        .listAsRecords()
        .filter((entry) => entry.isDirectory)
        .map((entry) => Paths.basename(entry.uri.replace(/\/+$/, '')));
    },

    async makeDirectory(path) {
      new Directory(uriOf(path)).create({ intermediates: true, idempotent: true });
    },

    async remove(path) {
      const info = Paths.info(uriOf(path));
      if (!info.exists) return;
      if (info.isDirectory) new Directory(uriOf(path)).delete();
      else new File(uriOf(path)).delete();
    },

    async move(from, to) {
      // Packs and their incoming folders are siblings, so a rename is enough.
      new Directory(uriOf(from)).rename(to);
    },

    async download(url, path, onProgress) {
      await File.downloadFileAsync(url, new File(uriOf(path)), {
        idempotent: true,
        onProgress: ({ bytesWritten, totalBytes }) => onProgress(bytesWritten, totalBytes),
      });
    },

    uri: (path) => new File(uriOf(path)).uri,
  };
}
