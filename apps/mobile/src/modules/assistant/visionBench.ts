// The Vision bench (#18): one photo question through the real photo pipeline, from adb, with
// the vision settings under test. Logs to logcat under TAHAK_VISION_BENCH: a "result" line per
// run (time to the first word, tok/s, tokens, peak PSS) and "answer" lines with the text.
//
//   adb shell run-as com.tahak.app mkdir -p cache/vision-bench
//   adb shell run-as com.tahak.app cp /data/local/tmp/plant.jpg cache/vision-bench/
//   adb shell 'am start -a android.intent.action.VIEW -d "tahak://assistant/vision-bench?photo=plant.jpg&q=what%20is%20this%3F&tokens=256" com.tahak.app'
//
// See benchLink.ts for the options.
import { Asset } from 'expo-asset';
import { Paths } from 'expo-file-system';

import diagnostics from '../../../modules/tahak-diagnostics';
import { enqueue } from './assistant';
import type { VisionBenchOptions } from './benchLink';
import { logChunks, memorySampler, round } from './benchLog';
import { engineStore } from './llm';
import { answerPhoto, readPhotoAhead } from './photoAssistant';
import { notePhotoCached, setVisionSettings, visionSettings } from './vision';

export const VISION_BENCH_TAG = 'TAHAK_VISION_BENCH';

const BENCH_PHOTO = require('./assets/bench-photo.jpg');

function log(record: Record<string, unknown>) {
  diagnostics.log(VISION_BENCH_TAG, JSON.stringify(record));
}

async function photoUri(photo: string): Promise<string> {
  if (photo === 'bundled') {
    const asset = Asset.fromModule(BENCH_PHOTO);
    await asset.downloadAsync();
    return asset.localUri ?? asset.uri;
  }
  return `${Paths.cache.uri.replace(/\/?$/, '/')}vision-bench/${photo}`;
}

/** Empties the chat model's cache, so the photo is read from scratch. */
function forgetPhoto(): Promise<void> {
  return enqueue(async () => {
    notePhotoCached(null);
    const state = engineStore.getSnapshot();
    if (state.status === 'ready') await state.model.context.clearCache(false);
  });
}

let running = false;

export async function runVisionBench(options: VisionBenchOptions): Promise<void> {
  if (running) return;
  running = true;
  const run = Date.now().toString(36);
  try {
    setVisionSettings({ imageMaxTokens: options.imageMaxTokens, mmproj: options.mmproj });
    const uri = await photoUri(options.photo);
    log({ type: 'start', run, ...options, ...visionSettings(), uri, airplane_mode: diagnostics.airplaneMode() });
    for (let i = 1; i <= options.runs; i++) {
      await forgetPhoto();
      const memory = memorySampler();
      const started = Date.now();
      let aheadMs: number | null = null;
      if (options.ahead) {
        await readPhotoAhead(uri, options.ui);
        aheadMs = Date.now() - started;
      }
      const sent = Date.now();
      const reply = await answerPhoto(options.question, uri, { language: options.ui });
      const gen = reply.generation;
      const model = engineStore.getSnapshot();
      log({
        type: 'result',
        run,
        i,
        photo: options.photo,
        question: options.question,
        ui: options.ui,
        ...visionSettings(),
        verdict: reply.kind === 'emergency' ? `emergency-${reply.stage}:${reply.guideId ?? 'distress'}` : reply.kind === 'off-topic' ? `off-topic-${reply.reason}` : `answer-${reply.scope}`,
        llm_ran: !!gen,
        ahead_ms: aheadMs,
        first_word_ms: gen ? reply.timing.firstWordMs : null,
        ttft_ms: gen?.ttftMs ?? null,
        gen_tps: gen ? round(gen.generationTps) : null,
        prompt_tokens: gen?.promptTokens ?? null,
        cached_tokens: gen?.cachedTokens ?? null,
        gen_tokens: gen?.generatedTokens ?? null,
        answer_ms: Date.now() - sent,
        mmproj_load_ms: model.status === 'ready' ? model.model.mmprojLoadMs : null,
        peak_pss_kb: memory.stop(),
      });
      const text = reply.kind === 'photo-answer' ? reply.text : `(${reply.kind}; model said: ${reply.raw ?? 'not run'})`;
      logChunks(log, { type: 'answer', run, i }, text);
    }
    log({ type: 'done', run });
  } catch (error) {
    log({ type: 'error', run, error: error instanceof Error ? (error.stack ?? error.message) : String(error) });
  } finally {
    setVisionSettings();
    running = false;
  }
}
