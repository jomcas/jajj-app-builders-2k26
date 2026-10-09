// The vision file's lifecycle (Vision, #18). The chat model loads without it; it is attached
// to the loaded model (~1 s, no model reload) when a photo is first picked, and detached after
// VISION_IDLE_MS without a photo question, to give its memory back to the map and the rest of
// the app. The settings come from the on-phone benchmark (visionBench.ts, see the PR):
// IMAGE_TOKENS caps how many tokens one photo becomes. Fewer tokens is faster; below this
// the answers lost detail. llama.cpp downscales the photo to fit, so a full-size camera photo
// costs the same as a small one, apart from decoding the JPEG.

import { attachVision, detachVision, engineStore, loadModel, type LoadedModel, type VisionOptions } from './llm';
import { MMPROJ_FILE } from './modelFiles';

/** Tokens one photo may take. See the table in the #18 PR for how it was chosen. */
export const IMAGE_TOKENS = 256;
/** Detach the vision file after this long without a photo question. */
export const VISION_IDLE_MS = 2 * 60_000;

let settings: VisionOptions = { imageMaxTokens: IMAGE_TOKENS, mmproj: MMPROJ_FILE };

/** For the vision bench: another vision file or token cap (undefined restores the defaults). */
export function setVisionSettings(next?: Partial<VisionOptions>) {
  settings = { imageMaxTokens: next?.imageMaxTokens ?? IMAGE_TOKENS, mmproj: next?.mmproj ?? MMPROJ_FILE };
}

export function visionSettings(): VisionOptions {
  return settings;
}

/** The chat model with the vision file attached. Call only from the Assistant's queue. */
export async function modelWithVision(): Promise<{ model: LoadedModel; attachMs: number }> {
  cancelIdleRelease();
  const model = await loadModel('cpu');
  const attachMs = await attachVision(model, settings);
  return { model, attachMs };
}

/**
 * The photo whose tokens are in the chat model's cache (read ahead, or the last photo answered),
 * and in which UI language (the system prompt differs). Any text question replaces the cache.
 */
let cachedPhoto: { uri: string; language: string } | null = null;

export function isPhotoCached(uri: string, language: string): boolean {
  return cachedPhoto?.uri === uri && cachedPhoto.language === language;
}

export function notePhotoCached(uri: string | null, language = '') {
  cachedPhoto = uri ? { uri, language } : null;
}

let idleTimer: ReturnType<typeof setTimeout> | null = null;

function cancelIdleRelease() {
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = null;
}

/**
 * Detaches the vision file after VISION_IDLE_MS, unless another photo question comes first.
 * run puts the detach on the Assistant's queue, so it never lands mid-answer.
 */
export function scheduleIdleRelease(run: (task: () => Promise<void>) => Promise<void>, ms = VISION_IDLE_MS) {
  cancelIdleRelease();
  idleTimer = setTimeout(() => {
    idleTimer = null;
    void run(async () => {
      const state = engineStore.getSnapshot();
      if (state.status === 'ready' && state.model.vision) await detachVision(state.model);
    }).catch(() => undefined);
  }, ms);
}
