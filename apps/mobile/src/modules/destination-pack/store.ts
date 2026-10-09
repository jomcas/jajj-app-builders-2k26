// The pack store: downloads Destination Packs onto the phone and reads them back offline.
// Pure logic over two seams, the phone's files (PackFiles) and the Supabase catalog
// (Catalog), so it runs under plain Node tests with fakes. No runtime imports.
//
// On the phone, under the packs folder:
//   <destination id>/pack.json      Destination, Trails, Waypoints and passages
//   <destination id>/map.pmtiles    the map file
//   .incoming-<destination id>/     a download in progress; renamed into place when complete,
//                                   so a half-finished download never looks downloaded

import type { Catalog } from './catalog';
import type {
  Destination,
  DestinationPack,
  DownloadProgress,
  DownloadState,
  PackContent,
} from './types';

/** The few file operations the store needs. Paths are relative to the packs folder. */
export type PackFiles = {
  /** The file's text, or null if it does not exist. */
  readText(path: string): Promise<string | null>;
  writeText(path: string, text: string): Promise<void>;
  /** Names of the folders directly inside path; empty if path does not exist. */
  listDirectories(path: string): Promise<string[]>;
  /** Creates the folder and any missing parents. Fine if it already exists. */
  makeDirectory(path: string): Promise<void>;
  /** Deletes a file or folder and everything in it. Fine if it does not exist. */
  remove(path: string): Promise<void>;
  /** Renames a folder. The destination must not exist. */
  move(from: string, to: string): Promise<void>;
  /** Downloads url to path. totalBytes is -1 when the server does not say. */
  download(
    url: string,
    path: string,
    onProgress: (bytesWritten: number, totalBytes: number) => void,
  ): Promise<void>;
  /** The file:// URI of a path, for code that opens the file itself (MapLibre). */
  uri(path: string): string;
};

export type PackStore = {
  /** Destinations in the online catalog. Throws when offline. */
  listCatalog(): Promise<Destination[]>;
  /** Destinations with a complete pack on the phone, by name. Works offline. */
  listDownloaded(): Promise<Destination[]>;
  /** The downloaded pack, or null if there is none. Works offline. */
  getPack(destinationId: string): Promise<DestinationPack | null>;
  /**
   * Downloads (or updates) a Destination's pack. Calling it again while a download runs
   * returns the same download.
   */
  downloadPack(destination: Destination): Promise<DestinationPack>;
  /** The current download state. The same object until it changes. */
  getDownloadState(destinationId: string): DownloadState;
  /** Called whenever a download moves on or a pack is added. Returns an unsubscribe. */
  subscribe(listener: () => void): () => void;
};

const PACK_FILE = 'pack.json';
const MAP_FILE = 'map.pmtiles';
const INCOMING_PREFIX = '.incoming-';
/** Bump when pack.json changes shape; packs in an older format read as not downloaded. */
const PACK_FORMAT = 1;
const IDLE: DownloadState = { status: 'idle' };

type StoredPack = {
  format: number;
  downloadedAt: string;
  content: PackContent;
};

/**
 * Download progress over the whole pack: the content rows first, then the map file, which
 * is most of the bytes. contentBytes is null until the rows have arrived. mapBytesTotal is
 * the expected size of the map file (from the catalog, or the server once it says).
 */
export function packProgress(input: {
  contentBytes: number | null;
  mapBytesWritten: number;
  mapBytesTotal: number;
}): DownloadProgress {
  const content = Math.max(input.contentBytes ?? 0, 0);
  const mapTotal = Math.max(input.mapBytesTotal, input.mapBytesWritten, 0);
  const mapDone = Math.min(Math.max(input.mapBytesWritten, 0), mapTotal);
  const bytesTotal = content + mapTotal;
  const bytesDone = content + mapDone;
  return { bytesDone, bytesTotal, fraction: bytesTotal > 0 ? bytesDone / bytesTotal : 0 };
}

/** Whole percent for display. Rounds down, so 100% means every byte is in. */
export function progressPercent(progress: DownloadProgress): number {
  return Math.floor(Math.min(Math.max(progress.fraction, 0), 1) * 100);
}

function checkId(destinationId: string): string {
  // Ids become folder names; the database allows only these characters.
  if (!/^[a-z0-9-]+$/.test(destinationId)) throw new Error(`Bad Destination id "${destinationId}".`);
  return destinationId;
}

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function createPackStore(deps: {
  files: PackFiles;
  catalog: Catalog;
  now?: () => Date;
}): PackStore {
  const { files, catalog } = deps;
  const now = deps.now ?? (() => new Date());
  const listeners = new Set<() => void>();
  const states = new Map<string, DownloadState>();
  const running = new Map<string, Promise<DestinationPack>>();

  function setState(destinationId: string, state: DownloadState) {
    if (state.status === 'idle') states.delete(destinationId);
    else states.set(destinationId, state);
    for (const listener of listeners) listener();
  }

  async function readStored(destinationId: string): Promise<StoredPack | null> {
    const text = await files.readText(`${destinationId}/${PACK_FILE}`);
    if (text === null) return null;
    try {
      const stored = JSON.parse(text) as StoredPack;
      return stored.format === PACK_FORMAT ? stored : null;
    } catch {
      return null;
    }
  }

  function toPack(destinationId: string, stored: StoredPack): DestinationPack {
    return {
      ...stored.content,
      mapFileUri: files.uri(`${destinationId}/${MAP_FILE}`),
      downloadedAt: stored.downloadedAt,
    };
  }

  async function download(destination: Destination): Promise<DestinationPack> {
    const id = checkId(destination.id);
    const incoming = `${INCOMING_PREFIX}${id}`;
    let contentBytes: number | null = null;
    let mapBytesTotal = destination.mapBytes;
    const report = (mapBytesWritten: number) =>
      setState(id, {
        status: 'downloading',
        progress: packProgress({ contentBytes, mapBytesWritten, mapBytesTotal }),
      });

    report(0);
    try {
      await files.remove(incoming);
      await files.makeDirectory(incoming);

      const fetched = await catalog.fetchContent(id);
      const content = fetched.content;
      contentBytes = fetched.bytes;
      mapBytesTotal = content.destination.mapBytes;
      report(0);

      await files.download(
        catalog.mapUrl(content.destination.mapPath),
        `${incoming}/${MAP_FILE}`,
        (written, total) => {
          if (total > 0) mapBytesTotal = total;
          report(written);
        },
      );

      const stored: StoredPack = { format: PACK_FORMAT, downloadedAt: now().toISOString(), content };
      // pack.json goes in last: a folder without it is never read as a pack.
      await files.writeText(`${incoming}/${PACK_FILE}`, JSON.stringify(stored));
      await files.remove(id);
      await files.move(incoming, id);

      setState(id, IDLE);
      return toPack(id, stored);
    } catch (error) {
      await files.remove(incoming).catch(() => undefined);
      setState(id, { status: 'error', error: errorText(error) });
      throw error;
    }
  }

  return {
    listCatalog: () => catalog.listDestinations(),

    async listDownloaded() {
      const names = await files.listDirectories('');
      const packs = await Promise.all(
        names
          .filter((name) => !name.startsWith('.') && /^[a-z0-9-]+$/.test(name))
          .map((name) => readStored(name)),
      );
      return packs
        .flatMap((stored) => (stored ? [stored.content.destination] : []))
        .sort((a, b) => a.name.localeCompare(b.name));
    },

    async getPack(destinationId) {
      const id = checkId(destinationId);
      const stored = await readStored(id);
      return stored ? toPack(id, stored) : null;
    },

    downloadPack(destination) {
      const existing = running.get(destination.id);
      if (existing) return existing;
      const task = download(destination).finally(() => running.delete(destination.id));
      running.set(destination.id, task);
      return task;
    },

    getDownloadState: (destinationId) => states.get(destinationId) ?? IDLE,

    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
