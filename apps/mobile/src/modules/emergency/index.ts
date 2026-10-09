import type { FeatureModule } from '../types';
import { listenForPreviewLinks, PreviewGate } from './PreviewGate';

// Emergency routing (issue #15, ADR 0003): an emergency question opens its Guide instead of
// getting an answer from the model. No tab. Runs first in the Assistant's pipeline:
//
//   answer(question) = emergencyRoute? → relevanceGate → retrieve → generate
//
// Public interface:
//
//   routeEmergency(question, uiLanguage) →
//       { kind: 'guide', guideId, confidence, matched }   show <EmergencyGuideCard guideId>
//     | { kind: 'distress', matched }                     bare "help"/"tulong"/"SOS": <DistressCard>
//     | null                                              not an emergency: on to the gate
//       Fast (about a millisecond), deterministic and offline: words and phrases, not a model.
//       A Guide match always wins over distress ("help, nakagat ng ahas" opens Snakebite).
//       English, Filipino and Taglish, with Filipino affixes, typos, negation ("hindi naman
//       dumudugo") and the distant past ("last year") handled. Rules: lexicon.ts.
//   routeEmergencyWithSecondStage(question, uiLanguage, secondStage?) → Promise<… | null>
//       The same, plus an optional check (an embedding, say) for near misses only.
//   explainEmergency(question) → every Guide's score and matched phrases (bench, preview)
//   <EmergencyGuideCard guideId onOpened? />
//       Icon, title, at most two lines of the Guide's own summary, "Open Guide", and "Call
//       911" / the Flare hint where the Guide's call for help gives them. No model text.
//   <DistressCard onOpened? />
//       Call 911, the Flare hint (it never fires the Flare), and links to the top 5 Emergency
//       Guides. Fixed catalog text only.
//   EMERGENCY_QUESTIONS, ORDINARY_QUESTIONS, EDGE_CASES: the fixed test sets.
//
// Dev only: tahak://emergency/preview/<id>, …/distress and …/ask?q=… show the cards
// (PreviewGate.tsx).

listenForPreviewLinks();

export { toAssistantReply, type AssistantEmergencyReply } from './assistantReply';
export { DistressCard } from './DistressCard';
export { EmergencyGuideCard } from './EmergencyGuideCard';
export { explainEmergency, routeEmergency, routeEmergencyWithSecondStage } from './route';
export type { DistressRoute, EmergencyResult, EmergencyRoute, Explanation, SecondStage } from './router';
export { EDGE_CASES, EMERGENCY_QUESTIONS, ORDINARY_QUESTIONS, type RoutingCase } from './testSet';

export default {
  id: 'emergency',
  hikeModes: ['solo', 'group'],
  offlineNeeds: ['guide-library'],
  launchGate: __DEV__ ? PreviewGate : undefined,
} satisfies FeatureModule;
