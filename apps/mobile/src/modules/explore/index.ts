import type { FeatureModule } from '../types';
import { ExploreScreen } from './ExploreScreen';

// Explore (issue #4): lists Destinations from Supabase while online, or the downloaded ones
// when offline, and opens a Destination to download its pack. Packs live in the
// destination-pack module; this module only shows them.
export default {
  id: 'explore',
  tab: 'explore',
  Screen: ExploreScreen,
  hikeModes: ['solo', 'group'],
  offlineNeeds: ['destination-pack'],
} satisfies FeatureModule;
