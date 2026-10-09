import type { FeatureModule } from '../types';
import { useFlareActive } from './flareStore';
import { FlareScreen } from './FlareScreen';
import { onFlareOpenRequest } from './openRequest';
import { flareTool } from './tools';

// The Flare (issue #12): a local distress signal made with the phone's light, screen and
// sound. No tab: it supplies what the shell's SOS control does (ADR 0001). A tap on SOS opens
// the Flare screen from any tab; a 1.5 s hold fires it (ADR 0004). While on, the flashlight
// blinks SOS in Morse (morse.ts, on a native thread in modules/tahak-flare-native), the screen
// strobes white and red twice a second (strobe.ts), a 3 kHz whistle loops at full media volume
// (assets/sounds/flare_whistle.wav, scripts/build-flare-whistle.py), and the screen stays
// awake. The SOS control turns fully red until the Flare is stopped.
//
// Public interface for other modules (a Group Hike Alert later):
//
//   fireFlare(), stopFlare(), useFlareActive(), useFlareState() → { active, torch }
//   openFlareScreen() → shows the Flare screen ready to fire, without firing it
//
// Assistant tool (issue #19): "Help me signal" / "paano mag-signal para makita kami" opens the
// Flare screen, never fires it (tools/signal.ts).

export { fireFlare, stopFlare, useFlareActive, useFlareState, type FlareState } from './flareStore';
export { openFlareScreen } from './openRequest';

export default {
  id: 'flare',
  sos: { Screen: FlareScreen, useActive: useFlareActive, onOpenRequest: onFlareOpenRequest },
  tools: [flareTool],
  hikeModes: ['solo', 'group'],
  offlineNeeds: [],
} satisfies FeatureModule;
