// The simulated walk's script: a Hike up a Trail and back, as one position per simulated
// second, with scripted excursions off the Trail. Pure, tested under plain Node.
//
// The excursions are there for the Deviation (#8: more than 40 m off the Trail for more than
// 30 s). The short one must not trigger it; the long one must. All times are simulated time,
// so they hold at any playback speed, as long as #8 times a Deviation by the positions'
// timestamps rather than the wall clock.

import {
  destinationPoint,
  locateOnTrail,
  pointAlongTrail,
  type LatLon,
  type PreparedTrail,
} from '../trail/geometry.ts';

export type ExcursionKind = 'short' | 'long';

export type Excursion = {
  /** Furthest distance from the Trail, in metres. */
  offsetM: number;
  /** Time spent at offsetM, in simulated seconds (not counting walking out and back). */
  holdS: number;
};

/** Short: never far enough for a Deviation. Long: well past 40 m for well over 30 s. */
export const EXCURSIONS: Record<ExcursionKind, Excursion> = {
  short: { offsetM: 25, holdS: 20 },
  long: { offsetM: 60, holdS: 45 },
};

export const WALK = {
  /** Walking pace up the Trail, m/s (2.9 km/h). */
  upMps: 0.8,
  /** Walking pace back down, m/s (3.6 km/h). */
  downMps: 1.0,
  /** Pace walking off the Trail and back, m/s. */
  offTrailMps: 1.0,
  /** Rest at the top before turning back, s. */
  summitRestS: 60,
  /** Where along the Trail (share of its length) the scripted excursions start, on the way up. */
  shortAt: 0.25,
  longAt: 0.6,
} as const;

export type WalkPhase = 'up' | 'top' | 'down' | 'done';

export type WalkSample = LatLon & {
  /** Simulated seconds since the start. */
  tS: number;
  phase: WalkPhase;
  /** Distance along the Trail of the walk's own point (the excursion's anchor while off it). */
  alongM: number;
  /** Set while on an excursion off the Trail. */
  excursion: ExcursionKind | null;
  /** How far off the Trail the script means this sample to be, in metres. */
  intendedOffM: number;
};

/**
 * The positions of an excursion that starts and ends at `anchor` on the Trail: walk straight
 * out at right angles to the Trail, hold at the offset, walk back. Goes to whichever side
 * keeps it furthest from every part of the Trail (switchbacks can bring another leg close).
 * One sample per simulated second, starting one second after `startS`.
 */
export function excursionSamples(
  trail: PreparedTrail,
  anchorAlongM: number,
  kind: ExcursionKind,
  startS: number,
  phase: WalkPhase,
): WalkSample[] {
  const { offsetM, holdS } = EXCURSIONS[kind];
  const { point: anchor, bearingDeg } = pointAlongTrail(trail, anchorAlongM);
  const sides = [bearingDeg + 90, bearingDeg - 90].map((bearing) => (bearing + 360) % 360);
  const offTrail = (bearing: number) =>
    locateOnTrail(destinationPoint(anchor, offsetM, bearing), trail)?.offTrailM ?? 0;
  const side = offTrail(sides[0]) >= offTrail(sides[1]) ? sides[0] : sides[1];

  const rampS = Math.max(1, Math.round(offsetM / WALK.offTrailMps));
  const offsets: number[] = [];
  for (let s = 1; s <= rampS; s++) offsets.push((offsetM * s) / rampS);
  for (let s = 0; s < holdS; s++) offsets.push(offsetM);
  for (let s = rampS - 1; s >= 0; s--) offsets.push((offsetM * s) / rampS);

  return offsets.map((offset, i) => ({
    ...destinationPoint(anchor, offset, side),
    tS: startS + i + 1,
    phase,
    alongM: anchorAlongM,
    excursion: offset > 0 ? kind : null,
    intendedOffM: offset,
  }));
}

/**
 * The whole scripted walk: from the jump-off up to the end of the Trail with the short
 * excursion at 25% and the long one at 60% of the way, a rest at the top, then straight back
 * to the jump-off. Excursions can be left out (for a walk that stays on the Trail).
 */
export function buildSimulatedWalk(
  trail: PreparedTrail,
  { excursions = true }: { excursions?: boolean } = {},
): WalkSample[] {
  const samples: WalkSample[] = [];
  let t = 0;
  const push = (alongM: number, phase: WalkPhase) => {
    const { point } = pointAlongTrail(trail, alongM);
    samples.push({ ...point, tS: t, phase, alongM, excursion: null, intendedOffM: 0 });
  };

  const scripted: { atM: number; kind: ExcursionKind }[] = excursions
    ? [
        { atM: WALK.shortAt * trail.lengthM, kind: 'short' },
        { atM: WALK.longAt * trail.lengthM, kind: 'long' },
      ]
    : [];

  // Up, one second at a time, stepping off the Trail where an excursion is due.
  push(0, 'up');
  let along = 0;
  while (along < trail.lengthM) {
    const nextAlong = Math.min(trail.lengthM, along + WALK.upMps);
    const due = scripted.find((e) => e.atM > along && e.atM <= nextAlong);
    t += 1;
    if (due) {
      push(due.atM, 'up');
      const trip = excursionSamples(trail, due.atM, due.kind, t, 'up');
      samples.push(...trip);
      t = trip[trip.length - 1].tS;
      along = due.atM;
      continue;
    }
    along = nextAlong;
    push(along, 'up');
  }

  for (let s = 0; s < WALK.summitRestS; s++) {
    t += 1;
    push(trail.lengthM, 'top');
  }

  while (along > 0) {
    along = Math.max(0, along - WALK.downMps);
    t += 1;
    push(along, along > 0 ? 'down' : 'done');
  }
  return samples;
}

/** Total simulated duration in seconds. */
export function walkDurationS(samples: readonly WalkSample[]): number {
  return samples.length > 0 ? samples[samples.length - 1].tS : 0;
}

/** Index of the last sample at or before simulated time tS. */
function indexAt(samples: readonly WalkSample[], tS: number): number {
  let lo = 0;
  let hi = samples.length - 1;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (samples[mid].tS <= tS) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

/** The walk's position at simulated time tS, interpolated between samples, clamped to the ends. */
export function sampleAt(samples: readonly WalkSample[], tS: number): WalkSample {
  if (tS <= samples[0].tS) return samples[0];
  const i = indexAt(samples, tS);
  const a = samples[i];
  const b = samples[i + 1];
  if (!b) return a;
  const f = (tS - a.tS) / (b.tS - a.tS);
  return {
    ...a,
    tS,
    latitude: a.latitude + f * (b.latitude - a.latitude),
    longitude: a.longitude + f * (b.longitude - a.longitude),
    alongM: a.alongM + f * (b.alongM - a.alongM),
    intendedOffM: a.intendedOffM + f * (b.intendedOffM - a.intendedOffM),
  };
}

/**
 * The walk with an extra excursion starting at simulated time tS (the on-demand long one for
 * #8). If tS falls inside another excursion, the new one starts once that one is back on the
 * Trail. Everything after it moves later by the excursion's length.
 */
export function insertExcursion(
  trail: PreparedTrail,
  samples: readonly WalkSample[],
  tS: number,
  kind: ExcursionKind = 'long',
): { samples: WalkSample[]; startS: number } {
  let i = indexAt(samples, tS);
  while (i < samples.length - 1 && samples[i].excursion !== null) i++;
  const anchor = samples[i];
  const trip = excursionSamples(trail, anchor.alongM, kind, anchor.tS, anchor.phase);
  const shift = trip.length;
  const after = samples.slice(i + 1).map((sample) => ({ ...sample, tS: sample.tS + shift }));
  return { samples: [...samples.slice(0, i + 1), ...trip, ...after], startS: anchor.tS };
}
