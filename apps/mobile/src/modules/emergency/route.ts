// The router over the bundled Guide Library, built once on first use.
import type { Language } from '../../i18n/types';
import { listGuides } from '../guides';
import { createEmergencyRouter, type EmergencyRoute, type EmergencyRouter, type Explanation, type SecondStage } from './router';

let router: EmergencyRouter | null = null;

function getRouter(): EmergencyRouter {
  router ??= createEmergencyRouter(listGuides());
  return router;
}

/**
 * Is this question an emergency, and which Guide answers it? Fast (about a millisecond),
 * deterministic and offline. Returns null for anything else, which then goes on to the
 * relevance gate and the Assistant (ADR 0005).
 *
 * Matching always uses both English and Filipino, because hikers mix them (Taglish);
 * uiLanguage is accepted for the pipeline's sake and does not change the result.
 */
export function routeEmergency(question: string, uiLanguage: Language): EmergencyRoute | null {
  return getRouter().route(question, uiLanguage);
}

/** routeEmergency, plus an optional second stage (such as an embedding check) for near misses. */
export function routeEmergencyWithSecondStage(
  question: string,
  uiLanguage: Language,
  secondStage?: SecondStage,
): Promise<EmergencyRoute | null> {
  return getRouter().routeWithSecondStage(question, uiLanguage, secondStage);
}

/** Every Guide's score for a question: for the bench and the dev preview. */
export function explainEmergency(question: string): Explanation {
  return getRouter().explain(question);
}
