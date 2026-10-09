// The Assistant's vector index on the phone. The search corpus has parts: the app help, the
// Guide Library, and one part per downloaded Destination Pack. Each part is embedded once and
// stored in the app's files folder (assistant-index/<model>/<part>.json for the chunks and
// .f32 for the vectors), and is embedded again only when its content hash changes: a new pack
// version, edited Guides or help, or another embedding model. Packs are embedded when they
// are downloaded or updated (destination-pack's subscribe), never at question time.

import { Directory, File, Paths } from 'expo-file-system';

import diagnostics from '../../../modules/tahak-diagnostics';
import { getPack, listDownloaded, subscribe as subscribeToPacks } from '../destination-pack';
import { listGuides } from '../guides';
import { APP_HELP } from './appHelp';
import { contentHash, guideChunks, helpChunks, needsReembed, packChunks, type Chunk } from './corpus';
import { DEFAULT_EMBED_MODEL, type EmbedModelSpec } from './embedModels';
import { embedderAvailable, loadEmbedder, type Embedder } from './embedder';
import type { Hit } from './pipeline';
import { topK } from './vectors';

const INDEX_DIR = 'assistant-index';
/** Hits returned per question: the prompt uses the best 3 groups, the bench logs these. */
export const SEARCH_K = 8;

type Part = { key: string; chunks: Chunk[]; vectors: Float32Array[]; packVersion?: number };
type Header = { modelId: string; hash: string; dims: number; packVersion?: number; chunks: Chunk[] };

export type IndexStatus =
  | { phase: 'idle' }
  | { phase: 'indexing'; part: string; done: number; total: number }
  | { phase: 'ready'; chunks: number }
  | { phase: 'error'; error: string };

export type VectorIndex = {
  spec: EmbedModelSpec;
  status(): IndexStatus;
  subscribe(listener: () => void): () => void;
  /** Brings every part up to date. Safe to call repeatedly; calls are serialized. */
  sync(): Promise<void>;
  search(question: string, options?: { ignorePacks?: boolean }): Promise<Hit[]>;
  /** Every chunk in the corpus (for picking the English twin of a hit). */
  chunks(options?: { ignorePacks?: boolean }): Chunk[];
  /** Number of chunks per part, for the bench log. */
  summary(): Record<string, number>;
  embedder(): Promise<Embedder>;
};

function partDir(spec: EmbedModelSpec): Directory {
  return new Directory(Paths.document, INDEX_DIR, spec.id);
}

function toBytes(vectors: Float32Array[], dims: number): Uint8Array {
  const flat = new Float32Array(vectors.length * dims);
  vectors.forEach((v, i) => flat.set(v, i * dims));
  return new Uint8Array(flat.buffer);
}

function fromBytes(bytes: Uint8Array, count: number, dims: number): Float32Array[] | null {
  if (bytes.byteLength !== count * dims * 4) return null;
  // Copy into an aligned buffer: the native buffer may not start on a 4-byte boundary.
  const flat = new Float32Array(new Uint8Array(bytes).buffer);
  return Array.from({ length: count }, (_, i) => flat.subarray(i * dims, (i + 1) * dims));
}

export function createVectorIndex(spec: EmbedModelSpec = DEFAULT_EMBED_MODEL): VectorIndex {
  const parts = new Map<string, Part>();
  let status: IndexStatus = { phase: 'idle' };
  const listeners = new Set<() => void>();
  const setStatus = (next: IndexStatus) => {
    status = next;
    listeners.forEach((l) => l());
  };

  async function readStored(key: string): Promise<{ header: Header; vectors: Float32Array[] } | null> {
    try {
      const dir = partDir(spec);
      const headerFile = new File(dir, `${key}.json`);
      const vectorFile = new File(dir, `${key}.f32`);
      if (!headerFile.exists || !vectorFile.exists) return null;
      const header = JSON.parse(await headerFile.text()) as Header;
      const vectors = fromBytes(await vectorFile.bytes(), header.chunks.length, header.dims);
      return vectors ? { header, vectors } : null;
    } catch {
      return null;
    }
  }

  function writeStored(key: string, header: Header, vectors: Float32Array[]) {
    const dir = partDir(spec);
    dir.create({ intermediates: true, idempotent: true });
    // Vectors first, header last: a header only exists next to complete vectors.
    const vectorFile = new File(dir, `${key}.f32`);
    if (!vectorFile.exists) vectorFile.create();
    vectorFile.write(toBytes(vectors, header.dims));
    const headerFile = new File(dir, `${key}.json`);
    if (!headerFile.exists) headerFile.create();
    headerFile.write(JSON.stringify(header));
  }

  function removeStored(key: string) {
    for (const ext of ['json', 'f32']) {
      const file = new File(partDir(spec), `${key}.${ext}`);
      if (file.exists) file.delete();
    }
  }

  /** Loads a part from disk, or embeds and stores it when the stored one is missing or stale. */
  async function ensurePart(key: string, chunks: Chunk[], packVersion?: number) {
    const hash = contentHash(spec.id, chunks);
    const current = parts.get(key);
    if (current && contentHash(spec.id, current.chunks) === hash) return;

    const stored = await readStored(key);
    if (stored && !needsReembed(stored.header, { modelId: spec.id, hash })) {
      parts.set(key, { key, chunks: stored.header.chunks, vectors: stored.vectors, packVersion });
      log({ type: 'index', part: key, action: 'loaded', chunks: chunks.length });
      return;
    }

    const embedder = await loadEmbedder(spec);
    const start = Date.now();
    const vectors: Float32Array[] = [];
    for (const chunk of chunks) {
      setStatus({ phase: 'indexing', part: key, done: vectors.length, total: chunks.length });
      vectors.push(await embedder.embedPassage(chunk));
    }
    const dims = vectors[0]?.length ?? 0;
    writeStored(key, { modelId: spec.id, hash, dims, packVersion, chunks }, vectors);
    parts.set(key, { key, chunks, vectors, packVersion });
    log({ type: 'index', part: key, action: 'embedded', chunks: chunks.length, ms: Date.now() - start, dims });
  }

  let running: Promise<void> | null = null;
  let again = false;

  async function doSync() {
    try {
      await ensurePart('help', helpChunks(APP_HELP));
      await ensurePart('guides', listGuides().flatMap((g) => guideChunks(g)));
      const downloaded = await listDownloaded();
      const live = new Set<string>();
      for (const destination of downloaded) {
        const pack = await getPack(destination.id);
        if (!pack) continue;
        const key = `pack-${destination.id}`;
        live.add(key);
        await ensurePart(key, packChunks(pack), pack.destination.packVersion);
      }
      for (const key of [...parts.keys()]) {
        if (key.startsWith('pack-') && !live.has(key)) {
          parts.delete(key);
          removeStored(key);
        }
      }
      setStatus({ phase: 'ready', chunks: allChunks().length });
    } catch (error) {
      setStatus({ phase: 'error', error: error instanceof Error ? error.message : String(error) });
      log({ type: 'index', action: 'error', error: String(error) });
    }
  }

  function sync(): Promise<void> {
    if (running) {
      again = true;
      return running;
    }
    running = (async () => {
      do {
        again = false;
        await doSync();
      } while (again);
    })().finally(() => {
      running = null;
    });
    return running;
  }

  function selected(ignorePacks = false): Part[] {
    return [...parts.values()].filter((p) => !(ignorePacks && p.key.startsWith('pack-')));
  }

  function allChunks(ignorePacks = false): Chunk[] {
    return selected(ignorePacks).flatMap((p) => p.chunks);
  }

  return {
    spec,
    status: () => status,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    sync,
    async search(question, { ignorePacks = false } = {}) {
      if (status.phase !== 'ready') await sync();
      const embedder = await loadEmbedder(spec);
      const query = await embedder.embedQuery(question);
      const entries = selected(ignorePacks).flatMap((p) => p.chunks.map((chunk, i) => ({ chunk, vector: p.vectors[i] })));
      return topK(query, entries, (e) => e.vector, SEARCH_K).map(({ item, score }) => ({ chunk: item.chunk, score }));
    },
    chunks: ({ ignorePacks = false } = {}) => allChunks(ignorePacks),
    summary: () => Object.fromEntries([...parts.values()].map((p) => [p.key, p.chunks.length])),
    embedder: () => loadEmbedder(spec),
  };
}

// ---- The app's index ----------------------------------------------------------------------

export const INDEX_LOG_TAG = 'TAHAK_ASSISTANT';

function log(record: Record<string, unknown>) {
  try {
    diagnostics.log(INDEX_LOG_TAG, JSON.stringify(record));
  } catch {
    // Logging must never break indexing.
  }
}

export const appIndex = createVectorIndex();

type IndexGlobals = { tahakIndexUnsubscribe?: () => void; tahakIndexTimer?: ReturnType<typeof setTimeout> };
const indexGlobals = globalThis as IndexGlobals;

/**
 * Embeds the corpus at startup if anything changed, and again whenever a pack is downloaded
 * or updated. Pack-store events fire for every progress step, so they are debounced; the
 * sync itself skips parts whose hash is unchanged.
 */
export function startIndexing() {
  if (!embedderAvailable(appIndex.spec)) {
    log({ type: 'index', action: 'skipped', reason: `embedding model missing: ${appIndex.spec.file}` });
    return;
  }
  indexGlobals.tahakIndexUnsubscribe?.();
  indexGlobals.tahakIndexUnsubscribe = subscribeToPacks(() => {
    if (indexGlobals.tahakIndexTimer) clearTimeout(indexGlobals.tahakIndexTimer);
    indexGlobals.tahakIndexTimer = setTimeout(() => void appIndex.sync(), 1500);
  });
  void appIndex.sync();
}
