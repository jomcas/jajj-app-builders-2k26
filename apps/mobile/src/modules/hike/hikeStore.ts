// The running Hike, if any, kept outside React so it survives tab switches and a deep link
// can start one before the Hike tab has ever been opened. Also owns the position source:
// while a simulated walk runs, useHikerPosition reads it instead of the GPS.

import { Linking } from 'react-native';

import { createSimulatedWalk, type SimulatedWalk } from './simulate/player';
import { parseHikeLink, type HikeLink } from './simulate/simLink';
import type { PreparedTrail } from './trail/geometry';

export type RunningHike = {
  /** Changes with every Hike, so per-Hike state can reset on it. */
  id: number;
  destinationId: string;
  trailId: string;
  /** The positions come from a simulated walk, not the GPS. */
  simulation: SimulatedWalk | null;
  startedAt: number;
};

type State = {
  hike: RunningHike | null;
  /** A simulate link waiting for the Hike tab and its pack. */
  pendingSimulation: Extract<HikeLink, { action: 'simulate' }> | null;
};

let state: State = { hike: null, pendingSimulation: null };
let nextId = 1;
const listeners = new Set<() => void>();

function setState(next: Partial<State>) {
  state = { ...state, ...next };
  listeners.forEach((listener) => listener());
}

export const hikeStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  getSnapshot: () => state,
};

/** Starts a Hike on a Trail, on the GPS or on a simulated walk along that Trail. */
export function startHike({
  destinationId,
  trailId,
  trail,
  simulated,
  speed,
  startFraction,
}: {
  destinationId: string;
  trailId: string;
  trail: PreparedTrail;
  simulated: boolean;
  speed?: number;
  startFraction?: number;
}) {
  state.hike?.simulation?.stop();
  const simulation = simulated ? createSimulatedWalk({ trail, trailId, speed, startFraction }) : null;
  simulation?.start();
  setState({
    hike: { id: nextId++, destinationId, trailId, simulation, startedAt: Date.now() },
    pendingSimulation: null,
  });
}

/** Ends the running Hike: stops the simulated walk, if any, and tracking. */
export function endHike() {
  state.hike?.simulation?.stop();
  setState({ hike: null });
}

export function clearPendingSimulation() {
  if (state.pendingSimulation) setState({ pendingSimulation: null });
}

function handleLink(url: string | null) {
  const link = parseHikeLink(url);
  if (!link) return;
  if (link.action === 'simulate') setState({ pendingSimulation: link });
  else if (link.action === 'off-trail') state.hike?.simulation?.goOffTrail();
  else endHike();
}

// Kept on globalThis so a Fast Refresh, which re-runs this file, replaces the listener
// instead of adding another.
type LinkGlobals = { tahakHikeLinks?: { remove(): void }; tahakHikeInitialUrlSeen?: boolean };
const linkGlobals = globalThis as LinkGlobals;

/** Handles tahak://hike/... links (see simulate/simLink.ts), whether or not the tab is open. */
export function listenForHikeLinks() {
  if (!linkGlobals.tahakHikeInitialUrlSeen) {
    linkGlobals.tahakHikeInitialUrlSeen = true;
    void Linking.getInitialURL().then(handleLink, () => undefined);
  }
  linkGlobals.tahakHikeLinks?.remove();
  linkGlobals.tahakHikeLinks = Linking.addEventListener('url', ({ url }) => handleLink(url));
}
