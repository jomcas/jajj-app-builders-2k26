import { withModelGate } from '../assistant-model';
import type { FeatureModule } from '../types';
import { listenForBenchLinks } from './bench';
import { SpikeScreen } from './SpikeScreen';

// Wave 0 model spike (issue #2): a test screen in the Ask tab for Qwen3.5-4B through
// llama.rn, plus a benchmark started from adb (see bench.ts). The real Assistant module
// replaces this one in Wave 2.

// Listen from import time, not from the screen: a bench link must work even when the Ask
// tab has never been opened (tabs mount lazily).
listenForBenchLinks();

export default {
  id: 'assistant-spike',
  tab: 'ask',
  // Download progress until the model is on the phone, then the spike (issue #13).
  Screen: withModelGate(SpikeScreen),
  hikeModes: ['solo', 'group'],
  offlineNeeds: ['model'],
} satisfies FeatureModule;
