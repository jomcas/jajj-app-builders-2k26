import type { FeatureModule } from '../types';
import { PlaceholderScreen } from './PlaceholderScreen';

// Placeholder that proves a module can fill a tab through the registry alone.
// Replace it with the Assistant module when llama.rn lands in the Ask tab.
export default {
  id: 'placeholder',
  tab: 'ask',
  Screen: PlaceholderScreen,
  hikeModes: ['solo', 'group'],
  offlineNeeds: [],
} satisfies FeatureModule;
