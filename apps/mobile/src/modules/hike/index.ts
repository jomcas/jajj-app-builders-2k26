import type { FeatureModule } from '../types';
import { HikeScreen } from './HikeScreen';

// The Hike tab (issue #6): the downloaded Destination's offline map with its Trails, typed
// Waypoint pins and the hiker's GPS dot. Built to grow: #7 adds the Trail picker and the Hike
// itself, #8 the Deviation (the Trail line already has a dashed variant, see map/mapStyle.ts).
// Packs come from the destination-pack module's public interface only (ADR 0001).
export default {
  id: 'hike',
  tab: 'hike',
  Screen: HikeScreen,
  hikeModes: ['solo', 'group'],
  offlineNeeds: ['destination-pack'],
} satisfies FeatureModule;
