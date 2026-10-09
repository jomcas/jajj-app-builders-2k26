// Photo questions as the app runs them (Vision, #18): the pure photo pipeline (photoPipeline.ts)
// wired to the phone's router, vector index and chat model, on the same one-at-a-time queue as
// text questions.
//
//   readPhotoAhead(uri, language)   when a photo is attached: attach the vision file and read the
//                                   photo now, while the hiker types. llama.rn keeps a snapshot
//                                   right after the photo, so the question later reuses it.
//   answerPhoto(question, uri, …)   the answer; the photo is read here if it wasn't already.
//
// Each logs one line under TAHAK_ASSISTANT (type photo-read / photo-answer) with the timings,
// the vision settings and the peak memory (PSS) while it ran.

import diagnostics from '../../../modules/tahak-diagnostics';
import type { Language } from '../../i18n/types';
import { routeEmergency, toAssistantReply } from '../emergency';
import { enqueue, registeredTools } from './assistant';
import { memorySampler } from './benchLog';
import { complete, type LoadedModel } from './llm';
import { answerPhotoQuestion, type PhotoReply } from './photoPipeline';
import { buildPhotoMessages } from './photoPrompt';
import { appIndex, type VectorIndex } from './vectorIndex';
import { isPhotoCached, modelWithVision, notePhotoCached, scheduleIdleRelease, visionSettings } from './vision';

export type PhotoActivity = { phase: 'idle' } | { phase: 'reading' | 'answering'; since: number };

let activity: PhotoActivity = { phase: 'idle' };
const listeners = new Set<() => void>();
function setActivity(next: PhotoActivity) {
  activity = next;
  listeners.forEach((l) => l());
}

/** What the photo path is doing now, for the Ask tab's status line. */
export const photoActivity = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  getSnapshot: () => activity,
};

const releaseOnQueue = (task: () => Promise<void>) => enqueue(task);

function log(record: Record<string, unknown>) {
  try {
    diagnostics.log('TAHAK_ASSISTANT', JSON.stringify(record));
  } catch {
    // Logging must never break an answer.
  }
}

function settingsRecord() {
  const s = visionSettings();
  return { image_max_tokens: s.imageMaxTokens, mmproj: s.mmproj };
}

/** Reads the photo into the model's cache ahead of the question. Safe to call more than once. */
export function readPhotoAhead(uri: string, language: Language): Promise<void> {
  return enqueue(async () => {
    if (isPhotoCached(uri, language)) return;
    const started = Date.now();
    setActivity({ phase: 'reading', since: started });
    const memory = memorySampler();
    try {
      const { model, attachMs } = await modelWithVision();
      const read = await complete(model, buildPhotoMessages(language, [], '', uri), undefined, { nPredict: 1 });
      notePhotoCached(uri, language);
      log({
        type: 'photo-read',
        ui: language,
        ...settingsRecord(),
        attach_ms: attachMs,
        prompt_tokens: read.promptTokens,
        cached_tokens: read.cachedTokens ?? null,
        ms: Date.now() - started,
        peak_pss_kb: memory.stop(),
      });
    } finally {
      memory.stop();
      setActivity({ phase: 'idle' });
      scheduleIdleRelease(releaseOnQueue);
    }
  });
}

export type PhotoAnswerOptions = {
  language: Language;
  onDisplay?: (text: string) => void;
  index?: VectorIndex;
  /** The photo's size, for the log only. */
  size?: { width: number; height: number };
};

/** Answers a question about a photo. An empty question asks what the photo shows. */
export function answerPhoto(question: string, uri: string, options: PhotoAnswerOptions): Promise<PhotoReply & { timing: PhotoTiming }> {
  return enqueue(() => runPhoto(question, uri, options));
}

export type PhotoTiming = {
  /** From Send to the first word of the answer (the photo read included, if it wasn't ahead). */
  firstWordMs: number;
  /** True if the photo came from the cache (read ahead) rather than being read after Send. */
  photoCached: boolean;
};

async function runPhoto(
  question: string,
  uri: string,
  { language, onDisplay, index = appIndex, size }: PhotoAnswerOptions,
): Promise<PhotoReply & { timing: PhotoTiming }> {
  const started = Date.now();
  const wasReadAhead = isPhotoCached(uri, language);
  const memory = memorySampler();
  let model: LoadedModel | null = null;
  let attachMs = 0;
  try {
    const reply = await answerPhotoQuestion(
      question,
      uri,
      language,
      {
        emergencyRoute: async (q, l) => toAssistantReply(routeEmergency(q, l)),
        tools: registeredTools(),
        // Only a Guide match stops an answer; the distress card is for the hiker's own words.
        guard: (text, l) => {
          const route = routeEmergency(text, l);
          return route?.kind === 'guide' ? { kind: 'emergency', guideId: route.guideId } : null;
        },
        search: (q) => index.search(q),
        corpus: () => index.chunks(),
        threshold: index.spec.threshold,
        passageLanguage: (ui) => ui,
        generate: async (messages, onText) => {
          setActivity({ phase: 'answering', since: started });
          const loaded = await modelWithVision();
          model = loaded.model;
          attachMs = loaded.attachMs;
          return complete(loaded.model, messages, onText);
        },
        stop: () => void (model as LoadedModel | null)?.context.stopCompletion(),
      },
      onDisplay,
    );
    const generation = reply.generation;
    const photoCached = !!generation && wasReadAhead;
    const timing: PhotoTiming = { firstWordMs: generation ? generation.ttftMs + attachMs : 0, photoCached };
    if (generation) notePhotoCached(uri, language);
    log({
      type: 'photo-answer',
      question,
      ui: language,
      verdict:
        reply.kind === 'emergency'
          ? `emergency-${reply.stage}`
          : reply.kind === 'tool'
            ? `tool:${reply.toolId}`
            : reply.kind === 'off-topic'
            ? `off-topic-${reply.reason}`
            : `answer-${reply.scope}`,
      guide: reply.kind === 'emergency' ? (reply.guideId ?? null) : null,
      best: reply.kind === 'emergency' || reply.kind === 'tool' ? null : Math.round(reply.gate.best * 1000) / 1000,
      llm_ran: !!generation,
      read_ahead: wasReadAhead,
      photo_cached: photoCached,
      ...settingsRecord(),
      photo_px: size ? `${size.width}x${size.height}` : null,
      attach_ms: attachMs,
      ttft_ms: generation?.ttftMs ?? null,
      gen_tps: generation ? Math.round(generation.generationTps * 10) / 10 : null,
      prompt_tokens: generation?.promptTokens ?? null,
      cached_tokens: generation?.cachedTokens ?? null,
      gen_tokens: generation?.generatedTokens ?? null,
      sources: reply.kind === 'photo-answer' ? reply.sources.map((s) => s.id) : [],
      ms: Date.now() - started,
      peak_pss_kb: memory.stop(),
    });
    return { ...reply, timing };
  } finally {
    memory.stop();
    setActivity({ phase: 'idle' });
    scheduleIdleRelease(releaseOnQueue);
  }
}
