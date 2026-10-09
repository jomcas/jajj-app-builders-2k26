// The embedding model: a second, small llama.rn context beside the chat model, on the CPU.
// It turns passages (at download time) and questions (at question time) into unit vectors.
import { initLlama, type LlamaContext } from 'llama.rn';

import type { Chunk } from './corpus';
import { DEFAULT_EMBED_MODEL, type EmbedModelSpec } from './embedModels';
import { cpuDeviceName, forwardNativeLog } from './llm';
import { fileExists, modelFilePath } from './modelFiles';
import { normalize } from './vectors';

/** Embedding runs beside the chat model; 4 threads leave cores for the UI. */
const EMBED_THREADS = 4;
/** Passages are under ~700 characters (~250 tokens); the whole input must fit in one batch. */
const EMBED_CTX = 1024;

export type Embedder = {
  spec: EmbedModelSpec;
  loadMs: number;
  embedQuery(question: string): Promise<Float32Array>;
  embedPassage(chunk: Chunk): Promise<Float32Array>;
  release(): Promise<void>;
};

const loaded = new Map<string, Promise<Embedder>>();

export function embedderAvailable(spec: EmbedModelSpec = DEFAULT_EMBED_MODEL): boolean {
  return fileExists(modelFilePath(spec.file));
}

/** Loads the embedding model once and keeps it; concurrent callers share one load. */
export function loadEmbedder(spec: EmbedModelSpec = DEFAULT_EMBED_MODEL): Promise<Embedder> {
  let task = loaded.get(spec.id);
  if (!task) {
    task = doLoad(spec);
    loaded.set(spec.id, task);
    task.catch(() => loaded.delete(spec.id));
  }
  return task;
}

async function doLoad(spec: EmbedModelSpec): Promise<Embedder> {
  await forwardNativeLog();
  const path = modelFilePath(spec.file);
  if (!fileExists(path)) throw new Error(`The embedding model is missing: ${spec.file}`);
  const start = Date.now();
  const context: LlamaContext = await initLlama({
    model: path,
    embedding: true,
    n_ctx: EMBED_CTX,
    n_batch: EMBED_CTX,
    n_ubatch: EMBED_CTX,
    n_threads: EMBED_THREADS,
    n_gpu_layers: 0,
    devices: [await cpuDeviceName()],
    use_mmap: false,
    use_mlock: false,
  });
  const loadMs = Date.now() - start;
  // One request at a time: llama.rn contexts are not re-entrant.
  let queue: Promise<unknown> = Promise.resolve();
  const embed = (text: string) => {
    const run = queue.then(async () => normalize((await context.embedding(text, { embd_normalize: 2 })).embedding));
    queue = run.catch(() => undefined);
    return run;
  };
  return {
    spec,
    loadMs,
    embedQuery: (question) => embed(spec.query(question)),
    embedPassage: (chunk) => embed(spec.passage(chunk)),
    async release() {
      loaded.delete(spec.id);
      await context.release();
    },
  };
}
