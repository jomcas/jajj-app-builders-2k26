// Destination Pack store (issue #4): the public interface. Other modules import from here
// only, never from the files beside it (ADR 0001).
//
//   listCatalog()           Destinations in Supabase. Online only; throws when offline.
//   listDownloaded()        Destinations whose pack is on the phone. Works offline.
//   getPack(id)             A downloaded pack, or null. Works offline (ADR 0002):
//                             destination  name, region, summary in en and fil, position
//                             trails       each with a GeoJSON LineString ([lon, lat] pairs)
//                             waypoints    jump_off | campsite | water | summit, in order
//                             passages     reference info in en and fil, for the Assistant
//                             mapFileUri   file:// URI of the local PMTiles map, for MapLibre
//   downloadPack(dest)      Downloads or updates a pack, with progress in getDownloadState.
//   getDownloadState(id)    idle | downloading (bytes done / total, fraction) | error.
//   subscribe(listener)     Told when a download moves on or a pack is added.
//
// Use with useSyncExternalStore(subscribe, () => getDownloadState(id)) in a screen.

import type { FeatureModule } from '../types';
import { createCatalog } from './catalog';
import { createExpoPackFiles } from './expoFiles';
import { createPackStore, progressPercent, type PackStore } from './store';

export type {
  Destination,
  DestinationPack,
  DownloadProgress,
  DownloadState,
  LineString,
  ReferencePassage,
  Trail,
  Waypoint,
  WaypointType,
} from './types';
export type { PackStore };
export { progressPercent };

const store = createPackStore({
  files: createExpoPackFiles('destination-packs'),
  catalog: createCatalog({
    url: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
    anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
  }),
});

export const listCatalog: PackStore['listCatalog'] = store.listCatalog;
export const listDownloaded: PackStore['listDownloaded'] = store.listDownloaded;
export const getPack: PackStore['getPack'] = store.getPack;
export const downloadPack: PackStore['downloadPack'] = store.downloadPack;
export const getDownloadState: PackStore['getDownloadState'] = store.getDownloadState;
export const subscribe: PackStore['subscribe'] = store.subscribe;

// No screen of its own: Explore shows the packs, the Hike map and the Assistant read them.
export default {
  id: 'destination-pack',
  hikeModes: ['solo', 'group'],
  offlineNeeds: [],
} satisfies FeatureModule;
