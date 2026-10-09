import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { AppState } from 'react-native';

import { REFRESH } from './rules';
import type { ForecastStorage, ForecastStore } from './store';

// The store's seams on the phone, and the loop that keeps Forecasts fresh. The app has no
// connectivity module, so "back online" is found by trying: on launch, whenever the app comes
// to the foreground, and every retryEveryMs while it is open. shouldRefresh only lets a try
// through when a Forecast is missing, old, or the last try failed.

const PREFIX = 'tahak.forecast.';
const FETCH_TIMEOUT_MS = 15_000;

export const asyncStorage: ForecastStorage = {
  read: (key) => AsyncStorage.getItem(PREFIX + key),
  write: (key, text) => AsyncStorage.setItem(PREFIX + key, text),
};

export async function fetchJson(url: string): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

/** The phone's last known position, only if location is already allowed. Never prompts. */
export async function lastKnownLocation(): Promise<{ latitude: number; longitude: number } | null> {
  const permission = await Location.getForegroundPermissionsAsync();
  if (!permission.granted) return null;
  const position = await Location.getLastKnownPositionAsync();
  return position ? { latitude: position.coords.latitude, longitude: position.coords.longitude } : null;
}

/** Starts the store and the refresh loop for the life of the app. */
export function keepFresh(store: ForecastStore): void {
  store.start();
  store.refreshDue();

  let timer: ReturnType<typeof setInterval> | undefined;
  const run = () => {
    clearInterval(timer);
    timer = setInterval(() => store.refreshDue(), REFRESH.retryEveryMs);
  };
  run();
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      store.refreshDue();
      run();
    } else {
      // Timers don't run reliably in the background; resume on the next foreground.
      clearInterval(timer);
    }
  });
}
