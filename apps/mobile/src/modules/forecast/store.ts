// The Forecast store: fetches and saves a Forecast for every downloaded Destination and the
// hiker's last known location, and reads the saved ones back offline (ADR 0002: the network
// is only for refreshes, never needed to show one). Pure logic over seams (storage, fetch,
// the packs, the location, the clock), so it runs under plain Node tests with fakes.

import { forecastUrl, parseForecast } from './openMeteo.ts';
import { REFRESH, distanceM, shouldRefresh, type Attempt } from './rules.ts';
import type { Forecast, ForecastEntry, ForecastTarget } from './types';

/** Saved text by key, on the phone. */
export type ForecastStorage = {
  read(key: string): Promise<string | null>;
  write(key: string, text: string): Promise<void>;
};

/** The parts of the destination-pack module's public interface the store uses (ADR 0001). */
export type PackSource = {
  listDownloaded(): Promise<{ id: string; latitude: number; longitude: number }[]>;
  subscribe(listener: () => void): () => void;
};

export type ForecastStore = {
  /** The saved Forecast and refresh state. The same object until it changes. */
  getEntry(key: string): ForecastEntry;
  subscribe(listener: () => void): () => void;
  /** Fetches every place whose Forecast is due (see shouldRefresh). Never throws. */
  refreshDue(options?: { force?: boolean; freshForMs?: number }): Promise<void>;
  /** Fetches one place now, for a hiker's tap. Never throws. */
  refreshKey(key: string): Promise<void>;
  /** Starts listening for pack downloads. Returns a stop. */
  start(): () => void;
};

/** The key a Destination's Forecast is saved under. */
export function destinationKey(destinationId: string): string {
  return `destination:${destinationId}`;
}

/** The key the hiker's last-known-location Forecast is saved under. */
export const HERE_KEY = 'here';

const FORMAT = 1;
const PACK_SETTLE_MS = 1_000;

type Saved = { format: number; forecast: Forecast };

export function createForecastStore(deps: {
  storage: ForecastStorage;
  fetchJson: (url: string) => Promise<unknown>;
  packs: PackSource;
  /** The hiker's last known position, or null (no permission, no fix). Must not prompt. */
  lastKnownLocation: () => Promise<{ latitude: number; longitude: number } | null>;
  now?: () => Date;
  setTimer?: (run: () => void, ms: number) => () => void;
}): ForecastStore {
  const now = deps.now ?? (() => new Date());
  const setTimer =
    deps.setTimer ??
    ((run, ms) => {
      const id = setTimeout(run, ms);
      return () => clearTimeout(id);
    });
  const listeners = new Set<() => void>();
  const entries = new Map<string, ForecastEntry>();
  const loading = new Map<string, Promise<Forecast | null>>();
  const attempts = new Map<string, Attempt>();
  const inFlight = new Set<string>();
  const targets = new Map<string, ForecastTarget>();

  const notify = () => {
    for (const listener of listeners) listener();
  };

  function setEntry(key: string, change: Partial<ForecastEntry>) {
    const previous = entries.get(key) ?? { forecast: undefined, status: 'idle' };
    entries.set(key, { ...previous, ...change });
    notify();
  }

  /** Reads the saved Forecast once; later reads come from memory. */
  function load(key: string): Promise<Forecast | null> {
    const known = entries.get(key)?.forecast;
    if (known !== undefined) return Promise.resolve(known);
    let pending = loading.get(key);
    if (!pending) {
      pending = deps.storage
        .read(key)
        .then((text) => {
          if (!text) return null;
          const saved = JSON.parse(text) as Saved;
          return saved.format === FORMAT ? saved.forecast : null;
        })
        .catch(() => null)
        .then((forecast) => {
          // A fetch may have landed while reading; it is newer.
          if (entries.get(key)?.forecast === undefined) setEntry(key, { forecast });
          return entries.get(key)?.forecast ?? null;
        });
      loading.set(key, pending);
    }
    return pending;
  }

  async function fetchOne(target: ForecastTarget) {
    const { key } = target;
    inFlight.add(key);
    setEntry(key, { status: 'refreshing' });
    try {
      const at = now();
      const forecast = parseForecast(await deps.fetchJson(forecastUrl(target)), target, at);
      await deps.storage.write(key, JSON.stringify({ format: FORMAT, forecast } satisfies Saved));
      attempts.set(key, { at: at.getTime(), failed: false });
      setEntry(key, { forecast, status: 'idle' });
    } catch {
      attempts.set(key, { at: now().getTime(), failed: true });
      setEntry(key, { status: 'failed' });
    } finally {
      inFlight.delete(key);
    }
  }

  async function currentTargets(): Promise<ForecastTarget[]> {
    const list: ForecastTarget[] = [];
    try {
      for (const destination of await deps.packs.listDownloaded()) {
        list.push({ key: destinationKey(destination.id), latitude: destination.latitude, longitude: destination.longitude });
      }
    } catch {
      // No packs readable: nothing to refresh for them.
    }
    try {
      const here = await deps.lastKnownLocation();
      if (here) list.push({ key: HERE_KEY, latitude: here.latitude, longitude: here.longitude });
    } catch {
      // No location: no Forecast for it.
    }
    for (const target of list) targets.set(target.key, target);
    return list;
  }

  async function refreshDue(options: { force?: boolean; freshForMs?: number } = {}) {
    const list = await currentTargets();
    await Promise.all(
      list.map(async (target) => {
        const saved = await load(target.key);
        const moved = saved !== null && distanceM(saved, target) >= REFRESH.movedM;
        const due = shouldRefresh({
          fetchedAt: saved?.fetchedAt ?? null,
          lastAttempt: attempts.get(target.key) ?? null,
          inFlight: inFlight.has(target.key),
          now: now().getTime(),
          force: options.force,
          freshForMs: moved ? 0 : options.freshForMs,
        });
        if (due) await fetchOne(target);
      }),
    );
  }

  return {
    getEntry(key) {
      const entry = entries.get(key);
      if (entry) return entry;
      // First ask: start reading the saved one, and answer "not read yet" meanwhile.
      const fresh: ForecastEntry = { forecast: undefined, status: 'idle' };
      entries.set(key, fresh);
      load(key);
      return fresh;
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },

    refreshDue,

    async refreshKey(key) {
      let target = targets.get(key);
      if (!target) {
        await currentTargets();
        target = targets.get(key);
      }
      if (target && !inFlight.has(key)) await fetchOne(target);
    },

    start() {
      // Downloading a Destination Pack also saves its Forecast. The pack store notifies on
      // every progress tick, so wait for the ticks to settle, then refetch any Forecast that
      // isn't brand new. A pack is only downloaded online, so the fetch should succeed.
      let cancel: (() => void) | undefined;
      const unsubscribe = deps.packs.subscribe(() => {
        cancel?.();
        cancel = setTimer(() => {
          refreshDue({ freshForMs: REFRESH.afterPackDownloadMs });
        }, PACK_SETTLE_MS);
      });
      return () => {
        cancel?.();
        unsubscribe();
      };
    },
  };
}
