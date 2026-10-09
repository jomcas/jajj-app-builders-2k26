// The Assistant as the app runs it: the pure pipeline (pipeline.ts) wired to the phone's
// vector index and chat model. The chat screen and the adb bench both call answer().
//
//   answer(question) = emergencyRoute? → relevanceGate → retrieve → generate
//
// #15 plugs the emergency check in with setEmergencyRoute(); it runs before the gate.

import type { Language } from '../../i18n/types';
import { complete, loadModel } from './llm';
import { answerQuestion, type PipelineDeps, type Reply } from './pipeline';
import { appIndex, type VectorIndex } from './vectorIndex';

let emergencyRoute: PipelineDeps['emergencyRoute'];

/** Stage 1 of the pipeline (ADR 0003), set by the emergency-routing ticket (#15). */
export function setEmergencyRoute(route: PipelineDeps['emergencyRoute']) {
  emergencyRoute = route;
}

// A test switch for "no Destination Pack downloaded" without deleting the pack:
// tahak://assistant/test?packs=none (and packs=all to undo), or the bench's packs=none.
let ignorePacks = false;
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
  return answerQuestion(
    question,
    language,
    {
      emergencyRoute,
      search: (q) => index.search(q, { ignorePacks: skipPacks }),
      corpus: () => index.chunks({ ignorePacks: skipPacks }),
      threshold,
      generate: async (messages, onText) => complete(await loadModel('cpu'), messages, onText),
    },
    onDisplay,
  );
}
