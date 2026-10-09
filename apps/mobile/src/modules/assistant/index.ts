// The Assistant (issue #14): the Ask tab's on-device chat, answering from the Destination
// Pack, the Guide Library and the app help through RAG (docs/plan.md; ADR 0003, ADR 0005).
//
//   answer(question, { language, onDisplay })   the pipeline, for the chat and the bench:
//       emergencyRoute? → relevanceGate → retrieve → generate (see pipeline.ts)
//   setEmergencyRoute(route)                     stage 1, for emergency routing (#15)
//
// Passages are embedded when a pack is downloaded or updated, and once for the Guides and
// the app help (vectorIndex.ts). adb hooks (bench.ts, benchLink.ts): the test-set bench
// tahak://assistant/bench, the no-pack test switch tahak://assistant/test?packs=none, and
// the Wave 0 model benchmark tahak://spike/bench.

import type { FeatureModule } from '../types';
import { AskScreen } from './AskScreen';
import { listenForAssistantLinks } from './bench';
import { startIndexing } from './vectorIndex';

export { answer, setEmergencyRoute } from './assistant';
export type { EmergencyReply, Reply } from './pipeline';

// From import time, not from the screen: tabs mount lazily, and a link or a pack download
// may come before the Ask tab is opened.
listenForAssistantLinks();
startIndexing();

export default {
  id: 'assistant',
  tab: 'ask',
  Screen: AskScreen,
  hikeModes: ['solo', 'group'],
  offlineNeeds: ['model', 'guide-library'],
} satisfies FeatureModule;
