import { Directory, DownloadTask, File, Paths } from 'expo-file-system';

import diagnostics from '../../../modules/tahak-diagnostics';
import type { ModelFs } from './downloader';
import type { ModelManifest } from './manifest';

const fileUri = (path: string) => `file://${path}`;

/**
 * The downloader's filesystem on the phone, with expo-file-system, under the app's external
 * files directory (/sdcard/Android/data/com.tahak.app/files), where llama.rn reads the model.
 */
export function createExpoModelFs(): ModelFs {
  return {
    folder(manifest: ModelManifest) {
      const root = diagnostics.externalFilesDir();
      if (!root) throw new Error('The external files directory is not available.');
      return `${root}/${manifest.folder}`;
    },

    size(path) {
      const file = new File(fileUri(path));
      return file.exists ? file.size : null;
    },

    makeFolder(path) {
      new Directory(fileUri(path)).create({ intermediates: true, idempotent: true });
    },

    rename(fromPath, toPath) {
      if (new File(fileUri(toPath)).exists) throw new Error(`${Paths.basename(toPath)} already exists`);
      new File(fileUri(fromPath)).rename(Paths.basename(toPath));
    },

    removePart(path) {
      if (!path.endsWith('.part')) throw new Error(`Refusing to delete ${path}: not a .part file`);
      const file = new File(fileUri(path));
      if (file.exists) file.delete();
    },

    download(url, path, fromByte, onProgress) {
      const destination = new File(fileUri(path));
      const options = { onProgress: ({ bytesWritten }: { bytesWritten: number }) => onProgress(bytesWritten) };
      // On Android the resume data is the byte offset: the native task sends
      // "Range: bytes=<offset>-" and appends to the file from there.
      const task =
        fromByte > 0
          ? DownloadTask.fromSavable(
              { url, fileUri: destination.uri, isDirectory: false, resumeData: String(fromByte) },
              options,
            )
          : File.createDownloadTask(url, destination, options);
      const result = (fromByte > 0 ? task.resumeAsync() : task.downloadAsync()).then((file) =>
        file ? ('done' as const) : ('paused' as const),
      );
      return {
        result,
        pause() {
          if (task.state === 'active') task.pause();
        },
      };
    },
  };
}

/** Deletes the test manifest's folder (dev only). Refuses any other folder. */
export function removeTestFolder(fs: ModelFs, manifest: ModelManifest): void {
  if (manifest.id !== 'test') throw new Error('Only the test download folder may be deleted.');
  const folder = new Directory(fileUri(fs.folder(manifest)));
  if (folder.exists) folder.delete();
}
