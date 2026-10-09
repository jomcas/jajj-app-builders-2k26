import type { FeatureModule } from '../types';
import { listenForPreviewLinks, PreviewGate } from './PreviewGate';

// Emergency routing (issue #15, ADR 0003): an emergency question opens its Guide instead of
// getting an answer from the model. No tab. Runs first in the Assistant's pipeline:
//
//   answer(question) = emergencyRoute? → relevanceGate → retrieve → generate
//
// Public interface:
//
//   routeEmergency(question, uiLanguage) → { guideId, confidence, matched } | null
//       Fast (about a millisecond), deterministic and offline: words and phrases, not a model.
//       English, Filipino and Taglish, with Filipino affixes, typos, negation ("hindi naman
//       dumudugo") and the distant past ("last year") handled. Rules: lexicon.ts.
//   routeEmergencyWithSecondStage(question, uiLanguage, secondStage?) → Promise<… | null>
//       The same, plus an optional check (an embedding, say) for near misses only.
//   explainEmergency(question) → every Guide's score and matched phrases (bench, preview)
//   <EmergencyGuideCard guideId onOpened? />
//       Icon, title, at most two lines of the Guide's own summary, "Open Guide", and "Call
//       911" / the Flare hint where the Guide's call for help gives them. No model text.
//   EMERGENCY_QUESTIONS, ORDINARY_QUESTIONS, EDGE_CASES: the fixed test sets.
//
// Dev only: tahak://emergency/preview/<id> and tahak://emergency/ask?q=… show the card
// (PreviewGate.tsx).

listenForPreviewLinks();

export { EmergencyGuideCard } from './EmergencyGuideCard';
export { explainEmergency, routeEmergency, routeEmergencyWithSecondStage } from './route';
export type { EmergencyRoute, Explanation, SecondStage } from './router';
export { EDGE_CASES, EMERGENCY_QUESTIONS, ORDINARY_QUESTIONS, type RoutingCase } from './testSet';

export default {
  id: 'emergency',
  hikeModes: ['solo', 'group'],
  offlineNeeds: ['guide-library'],
  launchGate: __DEV__ ? PreviewGate : undefined,
} satisfies FeatureModule;
