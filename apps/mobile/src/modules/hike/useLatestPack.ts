import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';

import { getPack, listDownloaded, subscribe, type DestinationPack } from '../destination-pack';
import { hikeStore } from './hikeStore';
import { destinationChoices, pickShownPack, samePack, type DestinationChoice } from './latestPack';

export type ShownPackState =
  | { status: 'loading' }
  | { status: 'none' }
  | {
      status: 'ready';
      pack: DestinationPack;
      /** Every downloaded Destination, for the Destination choice. */
      choices: DestinationChoice[];
      /** Switches the Hike tab to another downloaded Destination, and remembers it. */
      choose: (destinationId: string) => void;
    };

// The hiker's Destination choice survives a relaunch (issue #52).
const CHOICE_KEY = 'tahak.hike.destination';

// The store's listener also fires on every download progress tick, so re-reading waits for
// the ticks to settle.
const RELOAD_DELAY_MS = 500;

/**
 * The Destination Pack the Hike tab shows, read from the phone (works offline) and read again
 * when a pack is added or updated: the running Hike's, else the hiker's saved choice if still
 * downloaded, else the most recent download. Uses the destination-pack module's public
 * interface only (ADR 0001).
 */
export function useLatestPack(): ShownPackState {
  const [packs, setPacks] = useState<DestinationPack[] | null>(null);
  // undefined while the saved choice is still being read.
  const [chosenId, setChosenId] = useState<string | null | undefined>(undefined);
  const { hike } = useSyncExternalStore(hikeStore.subscribe, hikeStore.getSnapshot);
  const hikeDestinationId = hike?.destinationId ?? null;

  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(CHOICE_KEY)
      .catch(() => null)
      .then((saved) => {
        if (alive) setChosenId((current) => (current === undefined ? (saved ?? null) : current));
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const load = async () => {
      try {
        const destinations = await listDownloaded();
        const read = await Promise.all(destinations.map((destination) => getPack(destination.id)));
        if (!alive) return;
        const next = read.filter((pack): pack is DestinationPack => pack !== null);
        // Keep the same objects for unchanged packs, so the map need not re-render.
        setPacks((previous) => next.map((pack) => previous?.find((old) => samePack(old, pack)) ?? pack));
      } catch {
        if (alive) setPacks((previous) => previous ?? []);
      }
    };

    load();
    const unsubscribe = subscribe(() => {
      clearTimeout(timer);
      timer = setTimeout(load, RELOAD_DELAY_MS);
    });
    return () => {
      alive = false;
      clearTimeout(timer);
      unsubscribe();
    };
  }, []);

  const choose = useCallback((destinationId: string) => {
    setChosenId(destinationId);
    AsyncStorage.setItem(CHOICE_KEY, destinationId).catch(() => {
      // A failed write only means the choice is not remembered after a relaunch.
    });
  }, []);

  return useMemo<ShownPackState>(() => {
    if (packs === null || chosenId === undefined) return { status: 'loading' };
    const pack = pickShownPack(packs, chosenId, hikeDestinationId);
    if (!pack) return { status: 'none' };
    return { status: 'ready', pack, choices: destinationChoices(packs), choose };
  }, [packs, chosenId, hikeDestinationId, choose]);
}
