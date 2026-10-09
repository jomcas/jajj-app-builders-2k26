// A Hike's progress on its Trail: the next Waypoint, the distance and ETA to it, the progress
// bar, and when to suggest ending the Hike. Pure (type-only imports), tested under plain Node.
// Part of the hike module's public interface (see ../index.ts).

import type { Waypoint } from '../../destination-pack';
import { distanceM, locateOnTrail, type LatLon, type PreparedTrail, type TrailLocation } from './geometry.ts';

/** A Waypoint and where it sits along its Trail. */
export type PlacedWaypoint = { waypoint: Waypoint; alongM: number };

/** Up the Trail towards the summit, or back down towards the jump-off. */
export type Leg = 'up' | 'down';

/** A Waypoint closer than this along the Trail counts as reached. */
export const WAYPOINT_REACHED_M = 15;
/** Within this of the end of the Trail, the hiker has reached the top and the Hike turns back. */
export const TURNAROUND_M = 30;

/**
 * The ETA model. Naismith's rule (5 km/h, plus 1 h for every 600 m of climb) on a typical
 * Philippine day-hike trail, which climbs about 150 m per km, works out to about 2.2 km/h.
 * That is the pace until the hiker's own pace is known. After that, the ETA uses the recent
 * pace along the Trail over the last 5 minutes, kept between 1.1 and 5 km/h so a rest stop
 * or a GPS jump cannot give a silly ETA. The distance is along the Trail, not straight-line.
 */
export const PACE = {
  defaultMps: 0.6,
  minMps: 0.3,
  maxMps: 1.4,
  windowS: 300,
  /** The recent pace needs at least this much time and this much progress to count. */
  minSpanS: 60,
  minMovedM: 20,
} as const;

/** The end-Hike suggestion. See shouldSuggestEnd. */
export const END_SUGGESTION = {
  /** Within this straight-line distance of the jump-off. */
  nearJumpOffM: 50,
  /** Having been at least this far along the Trail (as a share of its length)... */
  minFraction: 0.5,
  /** Once dismissed, the suggestion comes back only after the hiker has gone this far away. */
  rearmM: 100,
} as const;

/**
 * Where each of a Trail's Waypoints sits along it, ordered from the jump-off. Each Waypoint is
 * projected onto the line; the pack's own `distanceM` breaks ties where the line doubles back.
 * `authoredLengthM` is the Trail's `distanceM` from the pack, used to scale those hints to the
 * measured line.
 */
export function placeWaypoints(
  trail: PreparedTrail,
  waypoints: readonly Waypoint[],
  authoredLengthM?: number,
): PlacedWaypoint[] {
  const scale = authoredLengthM && authoredLengthM > 0 ? trail.lengthM / authoredLengthM : 1;
  const placed: PlacedWaypoint[] = [];
  for (const waypoint of waypoints) {
    const hint = Number.isFinite(waypoint.distanceM) ? waypoint.distanceM * scale : undefined;
    const location = locateOnTrail(waypoint, trail, { nearAlongM: hint });
    if (location) placed.push({ waypoint, alongM: location.distanceAlongM });
  }
  return placed.sort((a, b) => a.alongM - b.alongM || a.waypoint.position - b.waypoint.position);
}

/**
 * The next Waypoint on this leg: going up, the first Waypoint further along the Trail than the
 * hiker; going down, the first one behind them. A Waypoint within WAYPOINT_REACHED_M counts as
 * reached. `distanceM` is along the Trail. null when there are no Waypoints left on this leg.
 */
export function nextWaypoint(
  placed: readonly PlacedWaypoint[],
  alongM: number,
  leg: Leg = 'up',
): (PlacedWaypoint & { distanceM: number }) | null {
  if (leg === 'up') {
    const next = placed.find((p) => p.alongM > alongM + WAYPOINT_REACHED_M);
    return next ? { ...next, distanceM: next.alongM - alongM } : null;
  }
  for (let i = placed.length - 1; i >= 0; i--) {
    if (placed[i].alongM < alongM - WAYPOINT_REACHED_M) {
      return { ...placed[i], distanceM: alongM - placed[i].alongM };
    }
  }
  return null;
}

/**
 * The progress bar, 0 to 1: distance done along the Trail ÷ Trail length. On the way up that
 * is the distance from the jump-off; on the way back down it is the distance back from the top.
 */
export function progressFraction(alongM: number, lengthM: number, leg: Leg = 'up'): number {
  if (!(lengthM > 0)) return 0;
  const done = leg === 'up' ? alongM : lengthM - alongM;
  return Math.max(0, Math.min(1, done / lengthM));
}

/** One position's distance along the Trail at a time, for the recent pace. */
export type PaceSample = { timestamp: number; alongM: number };

/**
 * The hiker's recent pace along the Trail in m/s, from samples over the last PACE.windowS,
 * clamped to PACE.minMps..maxMps. null while there is too little to go on.
 */
export function recentPaceMps(samples: readonly PaceSample[]): number | null {
  if (samples.length < 2) return null;
  const last = samples[samples.length - 1];
  const windowStart = last.timestamp - PACE.windowS * 1000;
  const first = samples.find((sample) => sample.timestamp >= windowStart) ?? samples[0];
  const spanS = (last.timestamp - first.timestamp) / 1000;
  const moved = Math.abs(last.alongM - first.alongM);
  if (spanS < PACE.minSpanS || moved < PACE.minMovedM) return null;
  return Math.max(PACE.minMps, Math.min(PACE.maxMps, moved / spanS));
}

/** Seconds to walk a distance along the Trail at the recent pace, or the default pace. */
export function etaSeconds(distanceAlongM: number, paceMps: number | null): number {
  const pace = paceMps ?? PACE.defaultMps;
  return Math.max(0, distanceAlongM) / pace;
}

/**
 * Whether to suggest ending the Hike: the hiker is within 50 m of the jump-off, after having
 * gone up the Trail, meaning at least half its length or at least to the first Waypoint past
 * the jump-off. It is only a suggestion; the Hike never ends on its own.
 */
export function shouldSuggestEnd({
  distanceToJumpOffM,
  maxAlongM,
  lengthM,
  firstWaypointPastJumpOffM,
}: {
  distanceToJumpOffM: number;
  /** The furthest the hiker has been along the Trail during this Hike. */
  maxAlongM: number;
  lengthM: number;
  /** Where the first Waypoint after the jump-off sits along the Trail, if there is one. */
  firstWaypointPastJumpOffM: number | null;
}): boolean {
  if (distanceToJumpOffM > END_SUGGESTION.nearJumpOffM) return false;
  const halfway = lengthM > 0 && maxAlongM >= END_SUGGESTION.minFraction * lengthM;
  const reachedWaypoint =
    firstWaypointPastJumpOffM !== null && maxAlongM >= firstWaypointPastJumpOffM - WAYPOINT_REACHED_M;
  return halfway || reachedWaypoint;
}

/** What a running Hike keeps between positions. */
export type HikeTracker = {
  leg: Leg;
  /** The furthest along the Trail so far, in metres. */
  maxAlongM: number;
  /** The last distance along, for locateOnTrail's switchback hint. */
  lastAlongM: number | null;
  /** Recent samples for the pace, trimmed to the pace window. */
  samples: PaceSample[];
  /** The hiker said "keep going"; stays until they go END_SUGGESTION.rearmM from the jump-off. */
  endDismissed: boolean;
};

/** What the Hike screen shows for one position. */
export type HikeView = {
  location: TrailLocation;
  leg: Leg;
  next: (PlacedWaypoint & { distanceM: number; etaS: number }) | null;
  progress: number;
  suggestEnd: boolean;
};

export function startTracker(): HikeTracker {
  return { leg: 'up', maxAlongM: 0, lastAlongM: null, samples: [], endDismissed: false };
}

/** The position's place on the Trail and the tracker after it. null if the Trail has no line. */
export function trackPosition(
  tracker: HikeTracker,
  trail: PreparedTrail,
  placed: readonly PlacedWaypoint[],
  position: LatLon & { timestamp: number },
): { tracker: HikeTracker; view: HikeView } | null {
  const location = locateOnTrail(position, trail, { nearAlongM: tracker.lastAlongM ?? undefined });
  if (!location) return null;
  const along = location.distanceAlongM;
  const maxAlongM = Math.max(tracker.maxAlongM, along);
  const leg: Leg = tracker.leg === 'down' || maxAlongM >= trail.lengthM - TURNAROUND_M ? 'down' : 'up';

  const windowStart = position.timestamp - PACE.windowS * 1000;
  const samples = tracker.samples
    .filter((sample) => sample.timestamp >= windowStart && sample.timestamp < position.timestamp)
    .concat({ timestamp: position.timestamp, alongM: along });
  // The pace is measured on this leg only: a turnaround inside the window would cancel out.
  const legSamples = leg === tracker.leg ? samples : samples.slice(-1);

  const [jumpOffLon, jumpOffLat] = trail.coordinates[0];
  const distanceToJumpOffM = distanceM(position, { latitude: jumpOffLat, longitude: jumpOffLon });
  const firstPast = placed.find((p) => p.alongM > WAYPOINT_REACHED_M);
  const endDismissed = tracker.endDismissed && distanceToJumpOffM <= END_SUGGESTION.rearmM;
  const suggestEnd =
    !endDismissed &&
    shouldSuggestEnd({
      distanceToJumpOffM,
      maxAlongM,
      lengthM: trail.lengthM,
      firstWaypointPastJumpOffM: firstPast ? firstPast.alongM : null,
    });

  const next = nextWaypoint(placed, along, leg);
  const pace = recentPaceMps(legSamples);
  return {
    tracker: { leg, maxAlongM, lastAlongM: along, samples: legSamples, endDismissed },
    view: {
      location,
      leg,
      next: next ? { ...next, etaS: etaSeconds(next.distanceM, pace) } : null,
      progress: progressFraction(along, trail.lengthM, leg),
      suggestEnd,
    },
  };
}

/** The tracker after the hiker chose to keep going: no suggestion until they leave and return. */
export function dismissEndSuggestion(tracker: HikeTracker): HikeTracker {
  return { ...tracker, endDismissed: true };
}
