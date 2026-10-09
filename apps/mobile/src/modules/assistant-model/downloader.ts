// The model download as a small state machine over an injected filesystem, so it runs in
// plain Node tests with a fake one. Pure: imports only other pure files.
//
// Rules that keep the 3.4 GB already on the phone safe:
// - A file counts as present when it exists at exactly its manifest size. Present files are
//   never written, moved or deleted.
// - Each file downloads into "<name>.part" and is renamed only when the .part file is
//   complete at the expected size. A file of the wrong size under the final name is reported
//   as an error and left alone.
// - A download resumes from the .part file's length on disk (an HTTP Range request), after a
//   pause, a dropped connection or an app restart.
import { manifestBytes, PART_SUFFIX, type ModelManifest } from './manifest.ts';

/** What the Ask tab and setup screen show. Byte counts cover all files of the manifest. */
export type ModelState =
  | { status: 'missing'; bytesDone: number; bytesTotal: number }
  | { status: 'downloading'; bytesDone: number; bytesTotal: number }
  | { status: 'paused'; bytesDone: number; bytesTotal: number }
  | { status: 'error'; bytesDone: number; bytesTotal: number; message: string }
  | { status: 'ready'; bytesDone: number; bytesTotal: number };

export type ModelStatus = ModelState['status'];

/** One running transfer. */
export type Transfer = {
  /** Resolves 'done' when the server finished sending, 'paused' after pause(). Rejects on failure. */
  result: Promise<'done' | 'paused'>;
  pause(): void;
};

/** The filesystem and network operations the downloader needs. Paths are absolute. */
export type ModelFs = {
  /** The folder that holds the manifest's files. */
  folder(manifest: ModelManifest): string;
  /** Size in bytes, or null if there is no such file. */
  size(path: string): number | null;
  makeFolder(path: string): void;
  /** Renames a file within its folder. Never called onto an existing file. */
  rename(fromPath: string, toPath: string): void;
  /** Deletes one file. Only ever called on a .part file. */
  removePart(path: string): void;
  /**
   * Downloads url into path. With fromByte > 0 it appends from that offset (Range request);
   * the server may answer with the whole file instead, which then restarts the file.
   * onProgress gets the file's total bytes written so far, offset included.
   */
  download(url: string, path: string, fromByte: number, onProgress: (bytesWritten: number) => void): Transfer;
};

export type DownloaderOptions = {
  fs: ModelFs;
  manifest: ModelManifest;
  /** Diagnostic log line (logcat on the phone). */
  log?: (message: string) => void;
  /** Wait before retrying after a network failure. 0 or less turns automatic retry off. */
  retryDelayMs?: number;
  setTimer?: (callback: () => void, ms: number) => unknown;
  clearTimer?: (timer: unknown) => void;
  /** Milliseconds; throttles progress updates. */
  now?: () => number;
  /** Least time between two progress updates sent to listeners. */
  progressIntervalMs?: number;
};

export type ModelDownloader = {
  getState(): ModelState;
  subscribe(listener: () => void): () => void;
  /** Starts or resumes the download. Does nothing if ready or already downloading. */
  start(): void;
  /** Pauses the download, keeping the bytes so far. Also stops automatic retry. */
  pause(): void;
  /** Absolute paths of the manifest's files, in manifest order. */
  paths(): string[];
  /** Re-reads the files on disk (ready, missing or partly downloaded). Not while downloading. */
  refresh(): void;
  /** Stops any transfer and retry for good (used when switching manifests). */
  dispose(): void;
};

const PROGRESS_LOG_STEP = 0.05;

export function partPath(path: string): string {
  return path + PART_SUFFIX;
}

/**
 * Reads what is already on disk: the bytes that count towards the download, and whether
 * every file is present at its exact size.
 */
export function inspectFiles(fs: ModelFs, manifest: ModelManifest): { bytesDone: number; complete: boolean } {
  const folder = fs.folder(manifest);
  let bytesDone = 0;
  let complete = true;
  for (const file of manifest.files) {
    const path = `${folder}/${file.name}`;
    const finalSize = fs.size(path);
    if (finalSize === file.bytes) {
      bytesDone += file.bytes;
      continue;
    }
    complete = false;
    if (finalSize === null) {
      const part = fs.size(partPath(path));
      if (part !== null) bytesDone += Math.min(part, file.bytes);
    }
  }
  return { bytesDone, complete };
}

export function createModelDownloader(options: DownloaderOptions): ModelDownloader {
  const { fs, manifest } = options;
  const log = options.log ?? (() => {});
  const retryDelayMs = options.retryDelayMs ?? 15_000;
  const setTimer = options.setTimer ?? ((callback, ms) => setTimeout(callback, ms));
  const clearTimer = options.clearTimer ?? ((timer) => clearTimeout(timer as ReturnType<typeof setTimeout>));
  const now = options.now ?? (() => Date.now());
  const progressIntervalMs = options.progressIntervalMs ?? 250;
  const bytesTotal = manifestBytes(manifest);
  const folder = fs.folder(manifest);

  const listeners = new Set<() => void>();
  let state: ModelState = initialState();
  /** Bumped by pause and dispose so a stale transfer's callbacks are ignored. */
  let run = 0;
  let transfer: Transfer | null = null;
  let retryTimer: unknown = null;
  let disposed = false;
  let lastEmit = 0;
  let lastLoggedFraction = 0;

  function initialState(): ModelState {
    const { bytesDone, complete } = inspectFiles(fs, manifest);
    if (complete) return { status: 'ready', bytesDone: bytesTotal, bytesTotal };
    return { status: bytesDone > 0 ? 'paused' : 'missing', bytesDone, bytesTotal };
  }

  function setState(next: ModelState, { throttle = false } = {}) {
    state = next;
    if (throttle) {
      const t = now();
      if (t - lastEmit < progressIntervalMs) return;
      lastEmit = t;
    }
    listeners.forEach((listener) => listener());
  }

  function cancelRetry() {
    if (retryTimer !== null) clearTimer(retryTimer);
    retryTimer = null;
  }

  function fail(message: string, { retry }: { retry: boolean }) {
    transfer = null;
    const { bytesDone } = inspectFiles(fs, manifest);
    log(`error at ${bytesDone}/${bytesTotal} bytes: ${message}`);
    setState({ status: 'error', bytesDone, bytesTotal, message });
    if (retry && retryDelayMs > 0 && !disposed) {
      log(`retrying in ${Math.round(retryDelayMs / 1000)} s`);
      retryTimer = setTimer(() => {
        retryTimer = null;
        if (state.status === 'error') start();
      }, retryDelayMs);
    }
  }

  /** Downloads the next missing file, or finishes. */
  function next(thisRun: number) {
    if (thisRun !== run || disposed) return;
    let doneBefore = 0;
    for (const file of manifest.files) {
      const path = `${folder}/${file.name}`;
      const finalSize = fs.size(path);
      if (finalSize === file.bytes) {
        doneBefore += file.bytes;
        continue;
      }
      if (finalSize !== null) {
        // Not ours to touch: someone else put a file there. Say so and stop.
        fail(`${file.name} is ${finalSize} bytes, expected ${file.bytes}`, { retry: false });
        return;
      }
      const part = partPath(path);
      let offset = fs.size(part) ?? 0;
      if (offset > file.bytes) {
        log(`${file.name}${PART_SUFFIX} is ${offset} bytes, more than ${file.bytes}: starting it again`);
        fs.removePart(part);
        offset = 0;
      }
      if (offset === file.bytes) {
        finish(file.name, path, file.bytes);
        next(thisRun);
        return;
      }
      log(offset > 0 ? `resume ${file.name} from byte ${offset} of ${file.bytes}` : `start ${file.name} (${file.bytes} bytes)`);
      setState({ status: 'downloading', bytesDone: doneBefore + offset, bytesTotal });
      const current = fs.download(file.url, part, offset, (written) => {
        if (thisRun !== run) return;
        const bytesDone = doneBefore + Math.min(written, file.bytes);
        const fraction = bytesDone / bytesTotal;
        if (fraction - lastLoggedFraction >= PROGRESS_LOG_STEP) {
          lastLoggedFraction = fraction;
          log(`progress ${file.name} at byte ${written}: ${bytesDone}/${bytesTotal} (${Math.round(fraction * 100)}%)`);
        }
        setState({ status: 'downloading', bytesDone, bytesTotal }, { throttle: true });
      });
      transfer = current;
      current.result.then(
        (outcome) => {
          if (transfer === current) transfer = null;
          if (thisRun !== run && outcome !== 'paused') return;
          if (outcome === 'paused') {
            const { bytesDone } = inspectFiles(fs, manifest);
            log(`paused ${file.name} at byte ${fs.size(part) ?? 0}`);
            if (!disposed) setState({ status: 'paused', bytesDone, bytesTotal });
            return;
          }
          const size = fs.size(part) ?? 0;
          if (size !== file.bytes) {
            // Short: the next attempt resumes from here. Long: corrupt, start the file again.
            if (size > file.bytes) fs.removePart(part);
            fail(`${file.name} finished at ${size} bytes, expected ${file.bytes}`, { retry: size < file.bytes });
            return;
          }
          finish(file.name, path, file.bytes);
          next(thisRun);
        },
        (error: unknown) => {
          if (transfer === current) transfer = null;
          if (thisRun !== run) return;
          fail(error instanceof Error ? error.message : String(error), { retry: true });
        },
      );
      return;
    }
    log(`ready: all ${manifest.files.length} files present (${bytesTotal} bytes)`);
    setState({ status: 'ready', bytesDone: bytesTotal, bytesTotal });
  }

  function finish(name: string, path: string, bytes: number) {
    fs.rename(partPath(path), path);
    log(`complete ${name}: size ${bytes} checked, renamed from ${name}${PART_SUFFIX}`);
  }

  function start() {
    if (disposed || state.status === 'ready' || state.status === 'downloading') return;
    cancelRetry();
    run += 1;
    lastLoggedFraction = state.bytesDone / bytesTotal;
    try {
      fs.makeFolder(folder);
      next(run);
    } catch (error) {
      fail(error instanceof Error ? error.message : String(error), { retry: false });
    }
  }

  function pause() {
    cancelRetry();
    if (state.status === 'downloading' && transfer) {
      // The transfer's result reports 'paused' and sets the state.
      transfer.pause();
      return;
    }
    if (state.status === 'error') setState({ status: 'paused', bytesDone: state.bytesDone, bytesTotal });
  }

  return {
    getState: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    start,
    pause,
    paths: () => manifest.files.map((file) => `${folder}/${file.name}`),
    refresh() {
      if (state.status === 'downloading') return;
      setState(initialState());
    },
    dispose() {
      disposed = true;
      cancelRetry();
      transfer?.pause();
      run += 1;
    },
  };
}
