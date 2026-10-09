// The Wave 0 model benchmark, moved here from the spike, started from adb with a deep link:
//
//   adb shell am start -a android.intent.action.VIEW -d "tahak://spike/bench?backend=cpu" com.tahak.app
//
// For each backend it loads the model and the vision file, answers the Taglish question,
// describes the bundled photo, and logs the results to logcat under the tag TAHAK_BENCH:
// one JSON "result" line per backend, then "answer" lines with the full answer text.
import { Asset } from 'expo-asset';
import { getBackendDevicesInfo } from 'llama.rn';

import diagnostics from '../../../modules/tahak-diagnostics';
import type { SpikeBenchOptions } from './benchLink';
import { complete, loadModel, type Backend } from './llm';
import { LLM_FILE, MMPROJ_FILE } from './modelFiles';
import { logChunks, memorySampler, round } from './benchLog';

// The bundled test photo: "Begunjscica, mountain trail from Zelenica Lodge breaching the
// ridge" by Ajznponar, Wikimedia Commons, CC0 1.0 (public domain dedication).
// https://commons.wikimedia.org/wiki/File:Begunjscica,_mountain_trail_from_Zelenica_Lodge_breaching_the_ridge.jpg
// Downscaled to 574×768 (about 200 KB) for the spike.
const BENCH_PHOTO = require('./assets/bench-photo.jpg');

export const LOG_TAG = 'TAHAK_BENCH';

const SYSTEM_MESSAGE = [
  'You are the Assistant in Tahak, an offline hiking helper for Filipino mountain trails.',
  'Answer in the same language and style the hiker uses. Keep answers short and practical.',
  'Trail notes (SAMPLE spike data, not real Batulao info):',
  '- Camp 2 has a water source: a small spring about 50 m below the campsite. Boil or filter it first.',
  '- From Camp 2 the summit is about 1.2 km away, roughly 45 minutes of steady hiking.',
].join('\n');
const BENCH_QUESTION = 'May tubig ba sa Camp 2? Gaano kalayo pa ang summit?';
const BENCH_PHOTO_PROMPT = 'Describe this photo for a hiker: the terrain, the trail, and anything that matters for safety.';

function log(record: Record<string, unknown>) {
  diagnostics.log(LOG_TAG, JSON.stringify(record));
}

type Metrics = Awaited<ReturnType<typeof complete>>;

function taskRecord(metrics: Metrics, peakPssKb: number) {
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

let running = false;

export async function runSpikeBench({ backends, threads, imageMaxTokens }: SpikeBenchOptions): Promise<void> {
  if (running) return;
  running = true;
  const run = Date.now().toString(36);
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

    for (const backend of backends as Backend[]) {
      const memory = memorySampler();
      try {
        const model = await loadModel(backend, { threads, imageMaxTokens, vision: true, reload: true });
        const loadPeak = memory.endPhase();
        const system = { role: 'system' as const, content: SYSTEM_MESSAGE };
        const taglish = await complete(model, [system, { role: 'user', content: BENCH_QUESTION }], undefined, { nPredict: 512, fresh: true });
        const taglishPeak = memory.endPhase();
        const photoAnswer = await complete(
          model,
          [
            system,
            {
              role: 'user',
              content: [
                { type: 'text', text: BENCH_PHOTO_PROMPT },
                { type: 'image_url', image_url: { url: photo } },
              ],
            },
          ],
          undefined,
          { nPredict: 512, fresh: true },
        );
        const photoPeak = memory.endPhase();
        const mem = diagnostics.memoryKb();
        log({
          type: 'result',
          run,
          model: LLM_FILE,
          mmproj: MMPROJ_FILE,
          backend,
          n_gpu_layers: model.nGpuLayers,
          gpu_in_use: model.gpu,
          devices: model.devices,
          reason_no_gpu: model.reasonNoGPU,
          android_lib: model.androidLib,
          n_ctx: model.nCtx,
          threads: model.threads,
          image_max_tokens: model.imageMaxTokens,
          model_load_ms: model.modelLoadMs,
          mmproj_load_ms: model.mmprojLoadMs,
          load_peak_pss_kb: loadPeak,
          taglish: taskRecord(taglish, taglishPeak),
          photo: taskRecord(photoAnswer, photoPeak),
          peak_pss_kb: memory.stop(),
          vm_hwm_kb: mem.VmHWM,
          vm_rss_kb: mem.VmRSS,
          airplane_mode: diagnostics.airplaneMode(),
        });
        logChunks(log, { type: 'answer', run, backend, task: 'taglish' }, taglish.text);
        logChunks(log, { type: 'answer', run, backend, task: 'photo' }, photoAnswer.text);
      } finally {
        memory.stop();
      }
    }
    log({ type: 'done', run });
  } catch (error) {
    log({ type: 'error', run, error: error instanceof Error ? error.message : String(error) });
  } finally {
    running = false;
  }
}
