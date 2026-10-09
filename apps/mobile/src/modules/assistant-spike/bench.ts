// The automatic benchmark, started from adb with a deep link:
//
//   adb shell am start -a android.intent.action.VIEW -d "tahak://spike/bench?backend=cpu" com.tahak.app
//
// Query parameters: backend=cpu|gpu|both (default cpu), threads=<n> (default 6).
// For each backend it loads the model and the vision file, answers the Taglish question,
// describes the bundled photo, and logs the results to logcat under the tag TAHAK_BENCH:
// one JSON "result" line per backend, then "answer" lines with the full answer text.
import { Asset } from 'expo-asset';
import { getBackendDevicesInfo } from 'llama.rn';
import { Linking } from 'react-native';

import diagnostics from '../../../modules/tahak-diagnostics';
import { ask, DEFAULT_THREADS, loadModel, MMPROJ_FILE, MODEL_FILE, type AnswerMetrics, type Backend } from './engine';
import { parseBenchUrl, type BenchOptions } from './benchLink';
import { BENCH_PHOTO_PROMPT, BENCH_QUESTION } from './prompts';

// The bundled test photo: "Begunjscica, mountain trail from Zelenica Lodge breaching the
// ridge" by Ajznponar, Wikimedia Commons, CC0 1.0 (public domain dedication).
// https://commons.wikimedia.org/wiki/File:Begunjscica,_mountain_trail_from_Zelenica_Lodge_breaching_the_ridge.jpg
// Downscaled to 574×768 (about 200 KB) for the spike.
const BENCH_PHOTO = require('./assets/bench-photo.jpg');

export const LOG_TAG = 'TAHAK_BENCH';
/** Logcat cuts lines near 4 KB; answer text goes out in pieces well under that. */
const ANSWER_CHUNK = 1500;
const STEPS_PER_BACKEND = 3;

export type BenchState =
  | { status: 'idle' }
  | { status: 'running'; step: number; steps: number }
  | { status: 'done' }
  | { status: 'error'; error: string };

let state: BenchState = { status: 'idle' };
const listeners = new Set<() => void>();

function setState(next: BenchState) {
  state = next;
  listeners.forEach((listener) => listener());
}

export const benchStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot: () => state,
};

function log(record: Record<string, unknown>) {
  diagnostics.log(LOG_TAG, JSON.stringify(record));
}

/** Samples this process's PSS once a second and keeps the peak of the current phase. */
function memorySampler() {
  let phasePeak = 0;
  let overallPeak = 0;
  const sample = () => {
    const pss = diagnostics.memoryKb().pss ?? 0;
    phasePeak = Math.max(phasePeak, pss);
    overallPeak = Math.max(overallPeak, pss);
  };
  sample();
  const timer = setInterval(sample, 1000);
  return {
    /** Peak PSS since the last call, in kB; starts a new phase. */
    endPhase() {
      sample();
      const peak = phasePeak;
      phasePeak = 0;
      return peak;
    },
    stop() {
      clearInterval(timer);
      sample();
      return overallPeak;
    },
  };
}

function taskRecord(metrics: AnswerMetrics, peakPssKb: number) {
  return {
    prompt_tokens: metrics.promptTokens,
    prompt_tps: round(metrics.promptTps),
    gen_tokens: metrics.generatedTokens,
    gen_tps: round(metrics.generationTps),
    ttft_ms: metrics.ttftMs,
    total_ms: metrics.totalMs,
    truncated: metrics.truncated,
    peak_pss_kb: peakPssKb,
  };
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}

function logAnswer(run: string, backend: Backend, task: string, text: string) {
  const parts = Math.max(1, Math.ceil(text.length / ANSWER_CHUNK));
  for (let part = 0; part < parts; part++) {
    log({
      type: 'answer',
      run,
      backend,
      task,
      part: part + 1,
      parts,
      text: text.slice(part * ANSWER_CHUNK, (part + 1) * ANSWER_CHUNK),
    });
  }
}

let running = false;

export async function runBench({ backends, threads }: BenchOptions): Promise<void> {
  if (running) return;
  running = true;
  const run = Date.now().toString(36);
  const steps = backends.length * STEPS_PER_BACKEND;
  let step = 0;
  const next = () => setState({ status: 'running', step: ++step, steps });

  try {
    const devices = await getBackendDevicesInfo();
    log({
      type: 'start',
      run,
      backends,
      threads,
      airplane_mode: diagnostics.airplaneMode(),
      backend_devices: devices.map((d) => `${d.deviceName} (${d.backend}, ${d.type})`),
    });
    const asset = Asset.fromModule(BENCH_PHOTO);
    await asset.downloadAsync();
    const photo = asset.localUri ?? asset.uri;

    for (const backend of backends) {
      const memory = memorySampler();
      try {
        next();
        const model = await loadModel(backend, { threads, reload: true });
        const loadPeak = memory.endPhase();

        next();
        const taglish = await ask(model, { question: BENCH_QUESTION, fresh: true });
        const taglishPeak = memory.endPhase();

        next();
        const photoAnswer = await ask(model, { question: BENCH_PHOTO_PROMPT, photo, fresh: true });
        const photoPeak = memory.endPhase();

        const peakPss = memory.stop();
        const mem = diagnostics.memoryKb();
        log({
          type: 'result',
          run,
          model: MODEL_FILE,
          mmproj: MMPROJ_FILE,
          backend,
          n_gpu_layers: model.nGpuLayers,
          gpu_in_use: model.gpu,
          devices: model.devices,
          reason_no_gpu: model.reasonNoGPU,
          android_lib: model.androidLib,
          n_ctx: model.nCtx,
          threads: model.threads,
          model_load_ms: model.modelLoadMs,
          mmproj_load_ms: model.mmprojLoadMs,
          load_peak_pss_kb: loadPeak,
          taglish: taskRecord(taglish, taglishPeak),
          photo: taskRecord(photoAnswer, photoPeak),
          peak_pss_kb: peakPss,
          vm_hwm_kb: mem.VmHWM,
          vm_rss_kb: mem.VmRSS,
          airplane_mode: diagnostics.airplaneMode(),
        });
        logAnswer(run, backend, 'taglish', taglish.text);
        logAnswer(run, backend, 'photo', photoAnswer.text);
      } finally {
        memory.stop();
      }
    }
    log({ type: 'done', run });
    setState({ status: 'done' });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    log({ type: 'error', run, step, error: message });
    setState({ status: 'error', error: message });
  } finally {
    running = false;
  }
}

// Kept on globalThis so a Fast Refresh, which re-runs this file, replaces the listener
// instead of adding another one (each extra listener would start another benchmark).
type BenchGlobals = { tahakBenchLinks?: { remove(): void }; tahakBenchInitialUrlSeen?: boolean };
const benchGlobals = globalThis as BenchGlobals;

/** Starts the benchmark when the app is opened, or already open, with a bench link. */
export function listenForBenchLinks() {
  const handle = (url: string | null) => {
    const options = parseBenchUrl(url, DEFAULT_THREADS);
    if (options) void runBench(options);
  };
  if (!benchGlobals.tahakBenchInitialUrlSeen) {
    benchGlobals.tahakBenchInitialUrlSeen = true;
    void Linking.getInitialURL().then(handle);
  }
  benchGlobals.tahakBenchLinks?.remove();
  benchGlobals.tahakBenchLinks = Linking.addEventListener('url', ({ url }) => handle(url));
}
