// The Forecast (issue #17): a saved 7-day weather Forecast for every downloaded Destination and
// for the hiker's last known location, labelled with when it was fetched. No tab of its own.
// Fetched from Open-Meteo (free, no key) whenever the phone is online, and read back offline
// (ADR 0002). Packs come from the destination-pack module's public interface only (ADR 0001):
// listDownloaded() for the places, subscribe() so that downloading a pack also saves its
// Forecast.
//
// Refreshing: on launch, on every return to the foreground, and every 30 s while the app is
// open, a place is fetched when its Forecast is missing, over an hour old, or the last try
// failed. There is no connectivity module, so "back online" is found by retrying (rules.ts).
//
// Public interface:
//
//   <ForecastCard destinationId />   the Destination screen's Forecast (Explore)
//   <ForecastChip destinationId />   today's Forecast with its age, for the Hike panel
//   getForecast(key) / subscribeForecasts(listener)   the saved Forecast, for other modules
//                                    (the Assistant's tools later); keys from destinationKey(id)
//                                    or HERE_KEY
//   remainingDays(forecast, now)     today and later, with lessReliable and warnings per day
//
// Weather warnings (thunderstorms, heavy rain, strong wind, extreme heat) are butter, never
// red (ADR 0004). Thresholds in rules.ts.

import { listDownloaded, subscribe } from '../destination-pack';
import type { FeatureModule } from '../types';
import { createForecastCard } from './ForecastCard';
import { createForecastChip } from './ForecastChip';
import { asyncStorage, fetchJson, keepFresh, lastKnownLocation } from './phone';
import { createForecastStore, destinationKey, HERE_KEY } from './store';

export { remainingDays, type ShownDay } from './rules';
export type { Forecast, ForecastDay, ForecastEntry, WarningKind } from './types';
export { destinationKey, HERE_KEY };

const store = createForecastStore({
  storage: asyncStorage,
  fetchJson,
  packs: { listDownloaded, subscribe },
  lastKnownLocation,
});

// Start from import time, not from a screen: the module has no tab, and a pack download or a
// return online should save a Forecast whichever tab is open.
keepFresh(store);

export const ForecastCard = createForecastCard(store);
export const ForecastChip = createForecastChip(store);
export const getForecast = (key: string) => store.getEntry(key).forecast ?? null;
export const subscribeForecasts = store.subscribe;

export default {
  id: 'forecast',
  hikeModes: ['solo', 'group'],
  offlineNeeds: ['forecast'],
} satisfies FeatureModule;
