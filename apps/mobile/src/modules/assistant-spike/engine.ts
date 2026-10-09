// One llama.rn context for the spike: load Qwen3.5-4B plus its vision file (mmproj) on the
// CPU or the GPU, then answer one question at a time, optionally about one photo.
import {
  addNativeLogListener,
  getBackendDevicesInfo,
  initLlama,
  releaseAllLlama,
  toggleNativeLog,
  type LlamaContext,
} from 'llama.rn';

import diagnostics from '../../../modules/tahak-diagnostics';
import { SYSTEM_MESSAGE } from './prompts';

export const MODEL_FILE = 'Qwen3.5-4B-Q4_K_M.gguf';
export const MMPROJ_FILE = 'Qwen3.5-4B-mmproj-F16.gguf';

export type Backend = 'cpu' | 'gpu';

export const N_CTX = 4096;
/** Big and middle cores of the Snapdragon 8 Gen 3 (1 + 5); the two small cores stay idle. */
export const DEFAULT_THREADS = 6;
/**
 * All of Qwen3.5-4B's layers, when offloading to the GPU. In the Wave 0 spike the GPU
 * (OpenCL, Adreno 750) path got the app SIGKILLed at 6.2-6.9 GB PSS while loading, with
 * mmap on or off and with the vision file on the CPU; only the CPU path is usable for now.
 */
const GPU_LAYERS = 99;
/** Caps the tokens one photo can take, so a full-size camera photo still fits in N_CTX. */
export const IMAGE_MAX_TOKENS = 1024;

export type LoadedModel = {
  context: LlamaContext;
  backend: Backend;
  threads: number;
  imageMaxTokens: number;
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

/**
 * Folder under the app's external files directory that holds the model files. The folder
 * and files must be owned by the app: the app reads its external files directory through a
 * bind mount with plain Unix permissions, so files pushed there with `adb push` (owned by
 * the shell user, in a shell-owned folder) fail to open with "Permission denied". Copying
 * them with `adb shell run-as com.tahak.app cp …` makes app-owned copies.
 */
export const MODEL_DIR = 'assistant-models';

export function modelPaths(): { model: string; mmproj: string } {
  const dir = diagnostics.externalFilesDir();
  if (!dir) throw new Error('The external files directory is not available.');
  return { model: `${dir}/${MODEL_DIR}/${MODEL_FILE}`, mmproj: `${dir}/${MODEL_DIR}/${MMPROJ_FILE}` };
}

/** llama.cpp's own log (model loading, backends, errors) goes to logcat under this tag. */
export const LLAMA_LOG_TAG = 'TAHAK_LLAMA';
// On globalThis so a Fast Refresh, which re-runs this file, does not add a second listener.
type EngineGlobals = { tahakLlamaLog?: { remove(): void } };
const engineGlobals = globalThis as EngineGlobals;

async function forwardNativeLog() {
  if (engineGlobals.tahakLlamaLog) return;
  engineGlobals.tahakLlamaLog = addNativeLogListener((level, text) => {
    const line = text.trimEnd();
    if (line) diagnostics.log(LLAMA_LOG_TAG, `${level}: ${line}`);
  });
  await toggleNativeLog(true);
}

async function cpuDeviceName(): Promise<string> {
  const info = await getBackendDevicesInfo();
  return info.find((d) => d.type.toLowerCase() === 'cpu')?.deviceName ?? 'CPU';
}

let pending: Promise<LoadedModel> | null = null;

/**
 * Loads the model on the given backend, reusing the current one if it already matches.
 * With reload, always starts from scratch (the benchmark does this to time the load).
 */
export function loadModel(
  backend: Backend,
  {
    threads = DEFAULT_THREADS,
    imageMaxTokens = IMAGE_MAX_TOKENS,
    reload = false,
  }: { threads?: number; imageMaxTokens?: number; reload?: boolean } = {},
): Promise<LoadedModel> {
  const current = state.status === 'ready' ? state.model : null;
  if (
    !reload &&
    current?.backend === backend &&
    current.threads === threads &&
    current.imageMaxTokens === imageMaxTokens
  ) {
    return Promise.resolve(current);
  }
  if (pending) return pending;
  pending = doLoad(backend, threads, imageMaxTokens).finally(() => {
    pending = null;
  });
  return pending;
}

async function doLoad(backend: Backend, threads: number, imageMaxTokens: number): Promise<LoadedModel> {
  try {
    await forwardNativeLog();
    // Only one model fits in memory: free the previous context first.
    await releaseAllLlama();
    setState({ status: 'loading', backend, percent: 0, phase: 'model' });
    const paths = modelPaths();
    const nGpuLayers = backend === 'gpu' ? GPU_LAYERS : 0;
    // With no device list llama.rn picks the Adreno GPU (OpenCL) even when no layers are
    // offloaded, so a CPU run names the CPU device explicitly.
    const devices = backend === 'cpu' ? [await cpuDeviceName()] : undefined;

    const modelStart = Date.now();
    const context = await initLlama(
      {
        model: paths.model,
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

    setState({ status: 'loading', backend, percent: 100, phase: 'mmproj' });
    const mmprojStart = Date.now();
    const visionReady = await context.initMultimodal({
      path: paths.mmproj,
      use_gpu: backend === 'gpu',
      image_max_tokens: imageMaxTokens,
    });
    const mmprojLoadMs = Date.now() - mmprojStart;
    if (!visionReady) throw new Error('The vision file (mmproj) did not load.');

    const model: LoadedModel = {
      context,
      backend,
      threads,
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

/** Drops the empty <think></think> block Qwen3.5 can still emit with thinking off. */
export function withoutEmptyThinking(text: string): string {
  return text.replace(/^\s*<think>\s*<\/think>\s*/, '').trim();
}

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
      // Thinking off, both as llama.rn's flag and as the chat template's own switch.
      enable_thinking: false,
      chat_template_kwargs: { enable_thinking: false },
      reasoning_format: 'auto',
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
      onText?.(withoutEmptyThinking(soFar));
    },
  );
  const end = Date.now();

  return {
    text: withoutEmptyThinking(result.content || result.text),
    promptTokens: result.timings.prompt_n,
    promptTps: result.timings.prompt_per_second,
    generatedTokens: result.timings.predicted_n,
    generationTps: result.timings.predicted_per_second,
    ttftMs: (firstTokenAt || end) - start,
    totalMs: end - start,
    truncated: result.stopped_limit > 0 || result.truncated,
  };
}
