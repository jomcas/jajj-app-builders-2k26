// The Assistant as the app runs it: the pure pipeline (pipeline.ts) wired to the phone's
// vector index and chat model. The chat screen and the adb bench both call answer().
//
//   answer(question) = emergencyRoute? → relevanceGate → retrieve → generate
//
// Stage 1 is #15's emergency routing (routeEmergency): an emergency opens its Guide, bare
// distress gets the distress card, and neither the gate nor the model runs (ADR 0003).
// setEmergencyRoute() replaces it, for tests.

import diagnostics from '../../../modules/tahak-diagnostics';
import type { Language } from '../../i18n/types';
import { routeEmergency, toAssistantReply } from '../emergency';
import { complete, loadModel } from './llm';
import { answerQuestion, type PipelineDeps, type Reply } from './pipeline';
import { appIndex, type VectorIndex } from './vectorIndex';

let emergencyRoute: PipelineDeps['emergencyRoute'] = async (question, language) =>
  toAssistantReply(routeEmergency(question, language));

/** Stage 1 of the pipeline (ADR 0003), set by the emergency-routing ticket (#15). */
export function setEmergencyRoute(route: PipelineDeps['emergencyRoute']) {
  emergencyRoute = route;
}

// A test switch for "no Destination Pack downloaded" without deleting the pack:
// tahak://assistant/test?packs=none (and packs=all to undo), or the bench's packs=none.
let ignorePacks = false;
/**
 * Which twin of each passage the model reads: the UI language's (default) or always English
 * (the bench's passages=en). On the phone, Filipino passages gave the Filipino UI more accurate
 * answers than translating English ones on the fly.
 */
let passageLanguageOverride: 'en' | 'ui' = 'ui';
export function setPassageLanguage(value: 'en' | 'ui') {
  passageLanguageOverride = value;
}
const testListeners = new Set<() => void>();

export const testFlags = {
  ignorePacks: () => ignorePacks,
  setIgnorePacks(value: boolean) {
    ignorePacks = value;
    testListeners.forEach((l) => l());
  },
  subscribe(listener: () => void) {
    testListeners.add(listener);
    return () => {
      testListeners.delete(listener);
    };
  },
};

export type AnswerOptions = {
  language: Language;
  /** Called with the text to show so far (empty until the answer has cited a passage). */
  onDisplay?: (text: string) => void;
  index?: VectorIndex;
  threshold?: number;
  ignorePacks?: boolean;
};

// One question at a time: llama.rn contexts are not re-entrant.
let queue: Promise<unknown> = Promise.resolve();

export function answer(question: string, options: AnswerOptions): Promise<Reply> {
  const run = queue.then(() => runAnswer(question, options));
  queue = run.catch(() => undefined);
  return run;
}

async function runAnswer(
  question: string,
  { language, onDisplay, index = appIndex, threshold = index.spec.threshold, ignorePacks: skipPacks = ignorePacks }: AnswerOptions,
): Promise<Reply> {
  const started = Date.now();
  const reply = await answerQuestion(
    question,
    language,
    {
      emergencyRoute,
      search: (q) => index.search(q, { ignorePacks: skipPacks }),
      corpus: () => index.chunks({ ignorePacks: skipPacks }),
      threshold,
      passageLanguage: (ui) => (passageLanguageOverride === 'ui' ? ui : 'en'),
      generate: async (messages, onText) => complete(await loadModel('cpu'), messages, onText),
    },
    onDisplay,
  );
  logReply(question, language, reply, Date.now() - started);
  return reply;
}

/** One line per answer under TAHAK_ASSISTANT: whether the model ran, the gate and the sources. */
function logReply(question: string, language: Language, reply: Reply, ms: number) {
  const generation = reply.kind === 'emergency' ? undefined : reply.generation;
  try {
    diagnostics.log(
      'TAHAK_ASSISTANT',
      JSON.stringify({
        type: 'answer',
        question,
        ui: language,
        verdict: reply.kind === 'off-topic' ? `off-topic-${reply.reason}` : reply.kind === 'emergency' && reply.distress ? 'distress' : reply.kind,
        guide: reply.kind === 'emergency' ? (reply.guideId ?? null) : null,
        best: reply.kind === 'emergency' ? null : Math.round(reply.gate.best * 1000) / 1000,
        threshold: reply.kind === 'emergency' ? null : reply.gate.threshold,
        llm_ran: !!generation,
        ttft_ms: generation?.ttftMs ?? null,
        gen_tps: generation ? Math.round(generation.generationTps * 10) / 10 : null,
        prompt_tokens: generation?.promptTokens ?? null,
        cached_tokens: generation?.cachedTokens ?? null,
        sources: reply.kind === 'answer' ? reply.sources.map((s) => s.id) : [],
        ms,
      }),
    );
  } catch {
    // Logging must never break an answer.
  }
}
