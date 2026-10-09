// The chat model: one llama.rn context running Qwen3.5-4B on the CPU (Wave 0 decision:
// 6 threads, no mmap, n_ctx 4096). Moved here from the Wave 0 spike. The vision file (mmproj)
// loads only when asked for (the Wave 0 benchmark); the chat leaves it out until Vision (#18),
// which saves memory for the embedding model running beside it.
import {
  addNativeLogListener,
  getBackendDevicesInfo,
  initLlama,
  toggleNativeLog,
  type LlamaContext,
} from 'llama.rn';

import diagnostics from '../../../modules/tahak-diagnostics';
import { assistantModelFiles } from './modelFiles';
import type { GenerateResult } from './pipeline';
import { N_PREDICT, type ChatMessage } from './prompt';

export type Backend = 'cpu' | 'gpu';

export const N_CTX = 4096;
/** Big and middle cores of the Snapdragon 8 Gen 3 (1 + 5); the two small cores stay idle. */
export const DEFAULT_THREADS = 6;
/**
 * All of Qwen3.5-4B's layers, when offloading to the GPU. In the Wave 0 spike the GPU
 * (OpenCL, Adreno 750) path got the app SIGKILLed at 6.2-6.9 GB PSS while loading; only the
 * CPU path is usable for now.
 */
const GPU_LAYERS = 99;
/** Caps the tokens one photo can take, so a full-size camera photo still fits in N_CTX. */
export const IMAGE_MAX_TOKENS = 1024;

export type LoadedModel = {
  context: LlamaContext;
  backend: Backend;
  threads: number;
  vision: boolean;
  imageMaxTokens: number;
  nGpuLayers: number;
  nCtx: number;
  modelLoadMs: number;
  mmprojLoadMs: number;
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
    return () => {
      listeners.delete(listener);
    };
  },
  getSnapshot: () => state,
};

/** llama.cpp's own log (model loading, backends, errors) goes to logcat under this tag. */
export const LLAMA_LOG_TAG = 'TAHAK_LLAMA';
type EngineGlobals = { tahakLlamaLog?: { remove(): void } };
const engineGlobals = globalThis as EngineGlobals;

export async function forwardNativeLog() {
  if (engineGlobals.tahakLlamaLog) return;
  engineGlobals.tahakLlamaLog = addNativeLogListener((level, text) => {
    const line = text.trimEnd();
    if (line) diagnostics.log(LLAMA_LOG_TAG, `${level}: ${line}`);
  });
  await toggleNativeLog(true);
}

export async function cpuDeviceName(): Promise<string> {
  const info = await getBackendDevicesInfo();
  return info.find((d) => d.type.toLowerCase() === 'cpu')?.deviceName ?? 'CPU';
}

let pending: Promise<LoadedModel> | null = null;

export type LoadOptions = { threads?: number; imageMaxTokens?: number; vision?: boolean; reload?: boolean };

/**
 * Loads the chat model, reusing the loaded one if it already matches (a loaded model with
 * vision also serves text-only requests). With reload, always starts from scratch.
 */
export function loadModel(
  backend: Backend = 'cpu',
  { threads = DEFAULT_THREADS, imageMaxTokens = IMAGE_MAX_TOKENS, vision = false, reload = false }: LoadOptions = {},
): Promise<LoadedModel> {
  const current = state.status === 'ready' ? state.model : null;
  if (
    !reload &&
    current?.backend === backend &&
    current.threads === threads &&
    (current.vision || !vision) &&
    (!vision || current.imageMaxTokens === imageMaxTokens)
  ) {
    return Promise.resolve(current);
  }
  if (pending) return pending;
  pending = doLoad(backend, threads, imageMaxTokens, vision).finally(() => {
    pending = null;
  });
  return pending;
}

async function doLoad(backend: Backend, threads: number, imageMaxTokens: number, vision: boolean): Promise<LoadedModel> {
  try {
    await forwardNativeLog();
    // Only one chat model fits in memory: free the previous one first. Only this context:
    // the embedding model's context stays loaded beside it.
    if (state.status === 'ready') await state.model.context.release();
    setState({ status: 'loading', backend, percent: 0, phase: 'model' });
    const paths = assistantModelFiles();
    const nGpuLayers = backend === 'gpu' ? GPU_LAYERS : 0;
    // With no device list llama.rn picks the Adreno GPU (OpenCL) even when no layers are
    // offloaded, so a CPU run names the CPU device explicitly.
    const devices = backend === 'cpu' ? [await cpuDeviceName()] : undefined;

    const modelStart = Date.now();
    const context = await initLlama(
      {
        model: paths.llm,
        n_ctx: N_CTX,
        n_threads: threads,
        n_gpu_layers: nGpuLayers,
        devices,
        n_parallel: 1,
        // No mmap: on the CPU llama.cpp repacks the weights for i8mm into its own buffer, and
        // with mmap the original file pages stayed resident too (weights held twice).
        use_mmap: false,
        use_mlock: false,
        // Multimodal prompts need fixed token positions.
        ctx_shift: false,
      },
      (percent) => setState({ status: 'loading', backend, percent, phase: 'model' }),
    );
    const modelLoadMs = Date.now() - modelStart;

    let mmprojLoadMs = 0;
    if (vision) {
      setState({ status: 'loading', backend, percent: 100, phase: 'mmproj' });
      const mmprojStart = Date.now();
      const visionReady = await context.initMultimodal({
        path: paths.mmproj,
        use_gpu: backend === 'gpu',
        image_max_tokens: imageMaxTokens,
      });
      mmprojLoadMs = Date.now() - mmprojStart;
      if (!visionReady) throw new Error('The vision file (mmproj) did not load.');
    }

    const model: LoadedModel = {
      context,
      backend,
      threads,
      vision,
      imageMaxTokens,
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

/** Drops the empty <think></think> block Qwen3.5 can still emit with thinking off. */
export function withoutEmptyThinking(text: string): string {
  return text.replace(/^\s*<think>\s*<\/think>\s*/, '').trim();
}

// Qwen3.5's suggested sampling for non-thinking answers; fixed seed for repeatable runs.
const SAMPLING = { temperature: 0.7, top_p: 0.8, top_k: 20, min_p: 0, seed: 42 };

/**
 * Runs one chat completion with thinking off, streaming the raw text so far through onText.
 * Used by the Assistant's pipeline (generate) and, with a photo, by the Wave 0 benchmark.
 */
export async function complete(
  model: LoadedModel,
  messages: (ChatMessage | { role: 'user'; content: unknown })[],
  onText?: (textSoFar: string) => void,
  { nPredict = N_PREDICT, fresh = false, temperature }: { nPredict?: number; fresh?: boolean; temperature?: number } = {},
): Promise<GenerateResult & { promptTps: number; totalMs: number }> {
  // Drop the cached prompt so the whole prompt is evaluated (fair benchmark numbers).
  if (fresh) await model.context.clearCache(false);
  let soFar = '';
  let firstTokenAt = 0;
  const start = Date.now();
  const result = await model.context.completion(
    {
      messages: messages as never,
      // Thinking off, both as llama.rn's flag and as the chat template's own switch.
      enable_thinking: false,
      chat_template_kwargs: { enable_thinking: false },
      reasoning_format: 'auto',
      n_predict: nPredict,
      ...SAMPLING,
      ...(temperature === undefined ? {} : { temperature }),
    },
    (data) => {
      if (!firstTokenAt) firstTokenAt = Date.now();
      soFar += data.token;
      onText?.(withoutEmptyThinking(soFar));
    },
  );
  const end = Date.now();
  return {
    text: withoutEmptyThinking(result.content || result.text),
    promptTokens: result.timings.prompt_n,
    cachedTokens: result.timings.cache_n,
    promptTps: result.timings.prompt_per_second,
    generatedTokens: result.timings.predicted_n,
    generationTps: result.timings.predicted_per_second,
    ttftMs: (firstTokenAt || end) - start,
    totalMs: end - start,
    truncated: result.stopped_limit > 0 || result.truncated,
  };
}
