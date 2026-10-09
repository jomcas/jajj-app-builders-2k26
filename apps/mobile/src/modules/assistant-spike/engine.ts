// One llama.rn context for the spike: load Qwen3.5-4B plus its vision file (mmproj) on the
// CPU or the GPU, then answer one question at a time, optionally about one photo.
import { initLlama, releaseAllLlama, type LlamaContext } from 'llama.rn';

import diagnostics from '../../../modules/tahak-diagnostics';
import { SYSTEM_MESSAGE } from './prompts';

export const MODEL_FILE = 'Qwen3.5-4B-Q4_K_M.gguf';
export const MMPROJ_FILE = 'Qwen3.5-4B-mmproj-F16.gguf';

export type Backend = 'cpu' | 'gpu';

export const N_CTX = 4096;
/** Big and middle cores of the Snapdragon 8 Gen 3 (1 + 5); the two small cores stay idle. */
export const DEFAULT_THREADS = 6;
/** All of Qwen3.5-4B's layers, when offloading to the GPU. */
const GPU_LAYERS = 99;
/** Caps the tokens one photo can take, so a full-size camera photo still fits in N_CTX. */
const IMAGE_MAX_TOKENS = 1024;

export type LoadedModel = {
  context: LlamaContext;
  backend: Backend;
  threads: number;
  nGpuLayers: number;
  nCtx: number;
  modelLoadMs: number;
  mmprojLoadMs: number;
  /** What llama.rn reports: whether the GPU is in use, which devices, and why not. */
  gpu: boolean;
  devices: string[];
  reasonNoGPU: string;
  androidLib: string;
};

export type EngineState =
  | { status: 'idle' }
  | { status: 'loading'; backend: Backend; percent: number; phase: 'model' | 'mmproj' }
  | { status: 'ready'; model: LoadedModel }
  | { status: 'error'; error: string };

let state: EngineState = { status: 'idle' };
const listeners = new Set<() => void>();

function setState(next: EngineState) {
  state = next;
  listeners.forEach((listener) => listener());
}

export const engineStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot: () => state,
};

/** The model files sit in the app's external files directory, under models/. */
export function modelPaths(): { model: string; mmproj: string } {
  const dir = diagnostics.externalFilesDir();
  if (!dir) throw new Error('The external files directory is not available.');
  return { model: `${dir}/models/${MODEL_FILE}`, mmproj: `${dir}/models/${MMPROJ_FILE}` };
}

let pending: Promise<LoadedModel> | null = null;

/**
 * Loads the model on the given backend, reusing the current one if it already matches.
 * With reload, always starts from scratch (the benchmark does this to time the load).
 */
export function loadModel(
  backend: Backend,
  { threads = DEFAULT_THREADS, reload = false }: { threads?: number; reload?: boolean } = {},
): Promise<LoadedModel> {
  const current = state.status === 'ready' ? state.model : null;
  if (!reload && current?.backend === backend && current.threads === threads) {
    return Promise.resolve(current);
  }
  if (pending) return pending;
  pending = doLoad(backend, threads).finally(() => {
    pending = null;
  });
  return pending;
}

async function doLoad(backend: Backend, threads: number): Promise<LoadedModel> {
  try {
    // Only one model fits in memory: free the previous context first.
    await releaseAllLlama();
    setState({ status: 'loading', backend, percent: 0, phase: 'model' });
    const paths = modelPaths();
    const nGpuLayers = backend === 'gpu' ? GPU_LAYERS : 0;

    const modelStart = Date.now();
    const context = await initLlama(
      {
        model: paths.model,
        n_ctx: N_CTX,
        n_threads: threads,
        n_gpu_layers: nGpuLayers,
        n_parallel: 1,
        use_mmap: true,
        use_mlock: false,
        // Multimodal prompts need fixed token positions.
        ctx_shift: false,
      },
      (percent) => setState({ status: 'loading', backend, percent, phase: 'model' }),
    );
    const modelLoadMs = Date.now() - modelStart;

    setState({ status: 'loading', backend, percent: 100, phase: 'mmproj' });
    const mmprojStart = Date.now();
    const visionReady = await context.initMultimodal({
      path: paths.mmproj,
      use_gpu: backend === 'gpu',
      image_max_tokens: IMAGE_MAX_TOKENS,
    });
    const mmprojLoadMs = Date.now() - mmprojStart;
    if (!visionReady) throw new Error('The vision file (mmproj) did not load.');

    const model: LoadedModel = {
      context,
      backend,
      threads,
      nGpuLayers,
      nCtx: N_CTX,
      modelLoadMs,
      mmprojLoadMs,
      gpu: context.gpu,
      devices: context.devices ?? [],
      reasonNoGPU: context.reasonNoGPU,
      androidLib: context.androidLib ?? '',
    };
    setState({ status: 'ready', model });
    return model;
  } catch (error) {
    setState({ status: 'error', error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
}

export type AnswerMetrics = {
  text: string;
  promptTokens: number;
  promptTps: number;
  generatedTokens: number;
  generationTps: number;
  /** From sending the request to the first streamed token, including any photo encoding. */
  ttftMs: number;
  totalMs: number;
  /** True if the answer hit the n_predict limit rather than ending on its own. */
  truncated: boolean;
};

const N_PREDICT = 512;

/**
 * Asks one question, optionally about one photo (a file:// URI or path), streaming the
 * answer through onText. Thinking mode is off so the latency is that of a direct answer.
 */
export async function ask(
  model: LoadedModel,
  { question, photo, fresh = false }: { question: string; photo?: string; fresh?: boolean },
  onText?: (textSoFar: string) => void,
): Promise<AnswerMetrics> {
  // Drop the cached prompt so the whole prompt is evaluated (fair benchmark numbers).
  if (fresh) await model.context.clearCache(false);

  const content = photo
    ? [
        { type: 'text', text: question },
        { type: 'image_url', image_url: { url: photo } },
      ]
    : question;

  let soFar = '';
  let firstTokenAt = 0;
  const start = Date.now();
  const result = await model.context.completion(
    {
      messages: [
        { role: 'system', content: SYSTEM_MESSAGE },
        { role: 'user', content },
      ],
      enable_thinking: false,
      n_predict: N_PREDICT,
      // Qwen3.5's suggested sampling for non-thinking answers; fixed seed for repeatable runs.
      temperature: 0.7,
      top_p: 0.8,
      top_k: 20,
      min_p: 0,
      seed: 42,
    },
    (data) => {
      if (!firstTokenAt) firstTokenAt = Date.now();
      soFar += data.token;
      onText?.(soFar);
    },
  );
  const end = Date.now();

  return {
    text: (result.content || result.text).trim(),
    promptTokens: result.timings.prompt_n,
    promptTps: result.timings.prompt_per_second,
    generatedTokens: result.timings.predicted_n,
    generationTps: result.timings.predicted_per_second,
    ttftMs: (firstTokenAt || end) - start,
    totalMs: end - start,
    truncated: result.stopped_limit > 0 || result.truncated,
  };
}
