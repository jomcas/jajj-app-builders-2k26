import { useEffect, useState } from 'react';

import { getPack, listDownloaded, subscribe, type DestinationPack } from '../destination-pack';
import { pickLatestPack, samePack } from './latestPack';

export type LatestPackState =
  | { status: 'loading' }
  | { status: 'none' }
  | { status: 'ready'; pack: DestinationPack };

// The store's listener also fires on every download progress tick, so re-reading waits for
// the ticks to settle.
const RELOAD_DELAY_MS = 500;

/**
 * The most recently downloaded Destination Pack, read from the phone (works offline), and
 * read again when a pack is added or updated. Uses the destination-pack module's public
 * interface only (ADR 0001).
 */
export function useLatestPack(): LatestPackState {
  const [state, setState] = useState<LatestPackState>({ status: 'loading' });

  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const load = async () => {
      try {
        const destinations = await listDownloaded();
        const packs = await Promise.all(destinations.map((destination) => getPack(destination.id)));
        const latest = pickLatestPack(packs);
        if (!alive) return;
        setState((previous) => {
          if (!latest) return { status: 'none' };
          if (previous.status === 'ready' && samePack(previous.pack, latest)) return previous;
          return { status: 'ready', pack: latest };
        });
      } catch {
        if (alive) setState((previous) => (previous.status === 'loading' ? { status: 'none' } : previous));
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

  return state;
}
