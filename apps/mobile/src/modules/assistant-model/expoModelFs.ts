import { Directory, DownloadTask, File, Paths } from 'expo-file-system';

import diagnostics from '../../../modules/tahak-diagnostics';
import type { ModelFs } from './downloader';
import type { ModelManifest } from './manifest';

const fileUri = (path: string) => `file://${path}`;

/**
 * Creates a missing file or folder through its parent. Outside the app's internal folders,
 * expo-file-system grants WRITE only on paths that already exist and are writable, so a new
 * path must be made from its (existing) parent folder.
 */
function createChild(path: string, kind: 'file' | 'folder') {
  const parent = new Directory(fileUri(path.slice(0, path.lastIndexOf('/'))));
  const name = Paths.basename(path);
  if (kind === 'folder') parent.createDirectory(name);
  else parent.createFile(name, null);
}

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
      if (!new Directory(fileUri(path)).exists) createChild(path, 'folder');
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
      if (!destination.exists) createChild(path, 'file');
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
