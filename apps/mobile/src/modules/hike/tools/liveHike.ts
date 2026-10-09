// The running Hike's latest tracked position, as the Hike screen last showed it, for the
// Assistant's distance tool. The Hike screen keeps tracking while another tab is in front
// (the GPS or simulated walk runs for the whole Hike), so this stays live.

import type { LiveHike } from './distance';

let live: LiveHike | null = null;

/** Called by the Hike screen with each tracked position, and with null when tracking stops. */
export function publishLiveHike(next: LiveHike | null): void {
  live = next;
}

/** The latest tracked position of the Hike with this id, or null. */
export function liveHikeFor(hikeId: number): LiveHike | null {
  return live && live.hikeId === hikeId ? live : null;
}
