import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

export type HikerPosition = {
  latitude: number;
  longitude: number;
  /** Horizontal accuracy in metres, if the phone reports it. */
  accuracyM: number | null;
  /** When the fix was taken, in ms since the epoch. */
  timestamp: number;
};

/** unknown: not checked yet · ask: the app may ask · blocked: only Android settings can allow it. */
export type LocationPermission = 'unknown' | 'granted' | 'ask' | 'blocked';

// A last known fix younger than this is shown at once, before the first live one arrives.
const LAST_KNOWN_MAX_AGE_MS = 2 * 60 * 1000;

function toPosition(location: Location.LocationObject): HikerPosition {
  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    accuracyM: location.coords.accuracy ?? null,
    timestamp: location.timestamp,
  };
}

function toPermission(response: Location.LocationPermissionResponse): LocationPermission {
  if (response.granted) return 'granted';
  return response.canAskAgain ? 'ask' : 'blocked';
}

function servicesEnabled(): Promise<boolean> {
  return Location.hasServicesEnabledAsync().catch(() => true);
}

/**
 * The hiker's position from the phone's GPS, which works without signal (ADR 0002).
 * Watches only while location permission is granted; `requestPermission` shows Android's
 * dialog and is called from the app's own explanation, never on its own.
 */
export function useHikerPosition(): {
  permission: LocationPermission;
  position: HikerPosition | null;
  requestPermission: () => Promise<void>;
  /**
   * Starts watching again and says whether location is on for the whole phone. Android stops
   * the watch while location is switched off, and does not restart it when it comes back.
   */
  retry: () => Promise<{ servicesEnabled: boolean }>;
} {
  const [permission, setPermission] = useState<LocationPermission>('unknown');
  const [position, setPosition] = useState<HikerPosition | null>(null);
  const [attempt, setAttempt] = useState(0);
  const subscription = useRef<Location.LocationSubscription | null>(null);

  // Checked on mount and again when the app comes back, e.g. after the hiker allowed
  // location in Android settings.
  useEffect(() => {
    let alive = true;
    const check = () =>
      Location.getForegroundPermissionsAsync().then(
        (response) => alive && setPermission(toPermission(response)),
        () => alive && setPermission('ask'),
      );
    check();
    const listener = AppState.addEventListener('change', (state) => {
      if (state === 'active') check();
    });
    return () => {
      alive = false;
      listener.remove();
    };
  }, []);

  useEffect(() => {
    if (permission !== 'granted') return;
    let alive = true;

    Location.getLastKnownPositionAsync({ maxAge: LAST_KNOWN_MAX_AGE_MS })
      .then((last) => {
        if (alive && last) setPosition((current) => current ?? toPosition(last));
      })
      .catch(() => {});

    Location.watchPositionAsync(
      { accuracy: Location.Accuracy.BestForNavigation, distanceInterval: 2, timeInterval: 1000 },
      (location) => {
        if (alive) setPosition(toPosition(location));
      },
    )
      .then((watch) => {
        if (alive) subscription.current = watch;
        else watch.remove();
      })
      .catch(() => {});

    return () => {
      alive = false;
      subscription.current?.remove();
      subscription.current = null;
    };
  }, [permission, attempt]);

  const requestPermission = useCallback(async () => {
    try {
      setPermission(toPermission(await Location.requestForegroundPermissionsAsync()));
    } catch {
      setPermission('blocked');
    }
  }, []);

  const retry = useCallback(async () => {
    const enabled = await servicesEnabled();
    if (enabled) setAttempt((n) => n + 1);
    return { servicesEnabled: enabled };
  }, []);

  return { permission, position, requestPermission, retry };
}
