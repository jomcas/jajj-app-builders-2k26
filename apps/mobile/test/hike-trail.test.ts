// The Hike's pure parts (issue #7): where a position is on a Trail, the next Waypoint,
// progress and ETA, the end-Hike suggestion, the simulated walk and its deep links.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, test } from 'node:test';

import type { Waypoint, WaypointType } from '../src/modules/destination-pack/types.ts';
import { fill, formatDistance, splitDuration } from '../src/modules/hike/format.ts';
import { createSimulatedWalk } from '../src/modules/hike/simulate/player.ts';
import { DEFAULT_SPEED, parseHikeLink } from '../src/modules/hike/simulate/simLink.ts';
import {
  EXCURSIONS,
  WALK,
  buildSimulatedWalk,
  insertExcursion,
  sampleAt,
  walkDurationS,
  type WalkSample,
} from '../src/modules/hike/simulate/walkScript.ts';
import {
  bearingDeg,
  destinationPoint,
  distanceM,
  locateOnTrail,
  pointAlongTrail,
  prepareTrail,
  type LatLon,
  type PreparedTrail,
} from '../src/modules/hike/trail/geometry.ts';
import {
  PACE,
  dismissEndSuggestion,
  etaSeconds,
  nextWaypoint,
  placeWaypoints,
  progressFraction,
  recentPaceMps,
  shouldSuggestEnd,
  startTracker,
  trackPosition,
  type PlacedWaypoint,
} from '../src/modules/hike/trail/progress.ts';

// --- Fixtures -------------------------------------------------------------------------------

const START: LatLon = { latitude: 14.05, longitude: 120.8 };

/** A line from START, one leg per [bearing, metres]. */
function lineFrom(start: LatLon, legs: [number, number][]): [number, number][] {
  const points: [number, number][] = [[start.longitude, start.latitude]];
  let at = start;
  for (const [bearing, metres] of legs) {
    at = destinationPoint(at, metres, bearing);
    points.push([at.longitude, at.latitude]);
  }
  return points;
}

const near = (actual: number, expected: number, tolerance: number, message?: string) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `${message ?? ''} ${actual} is not within ${tolerance} of ${expected}`);

/** A straight Trail 1000 m due east of START. */
const EAST_LINE = lineFrom(START, [[90, 500], [90, 500]]);
const east = prepareTrail(EAST_LINE)!;

/** The first Batulao Trail in the seed, with the length the seed gives for it. */
function seedTrail(): { trail: PreparedTrail; seedLengthM: number } {
  const sql = readFileSync(join(import.meta.dirname, '..', '..', '..', 'supabase', 'seed', 'batulao.sql'), 'utf8');
  const [, length, json] = sql.match(/, (\d+(?:\.\d+)?),\s*'(\{"type":"LineString"[^']+)'/)!;
  return { trail: prepareTrail(JSON.parse(json).coordinates)!, seedLengthM: Number(length) };
}
const { trail: batulao, seedLengthM: batulaoSeedLengthM } = seedTrail();

function waypoint(id: string, type: WaypointType, at: LatLon, position: number, distance: number): Waypoint {
  return {
    id,
    trailId: 't',
    type,
    name: id,
    latitude: at.latitude,
    longitude: at.longitude,
    elevationM: null,
    position,
    distanceM: distance,
  };
}

// --- locateOnTrail --------------------------------------------------------------------------

describe('locateOnTrail', () => {
  const mid = destinationPoint(START, 500, 90);

  test('the measured length matches the great-circle length', () => {
    near(east.lengthM, 1000, 0.5);
    let haversine = 0;
    for (let i = 1; i < batulao.coordinates.length; i++) {
      const [lonA, latA] = batulao.coordinates[i - 1];
      const [lonB, latB] = batulao.coordinates[i];
      haversine += distanceM({ latitude: latA, longitude: lonA }, { latitude: latB, longitude: lonB });
    }
    near(batulao.lengthM, haversine, haversine * 0.001);
    // The measured length agrees with the length the seed gives for this Trail.
    near(batulao.lengthM, batulaoSeedLengthM, 60);
  });

  test('a position on the line: no distance off, no bearing', () => {
    const at = locateOnTrail(mid, east)!;
    near(at.distanceAlongM, 500, 0.5);
    near(at.offTrailM, 0, 0.05);
    near(at.fraction, 0.5, 0.001);
    assert.equal(at.beyond, null);
    near(distanceM(at.nearestPoint, mid), 0, 0.05);
  });

  test('off to the north side: the way back is south', () => {
    const at = locateOnTrail(destinationPoint(mid, 30, 0), east)!;
    near(at.offTrailM, 30, 0.2);
    near(at.distanceAlongM, 500, 0.5);
    near(at.bearingToNearestDeg!, 180, 0.5);
    near(distanceM(at.nearestPoint, mid), 0, 0.5);
  });

  test('off to the south side: the way back is north', () => {
    const at = locateOnTrail(destinationPoint(mid, 60, 180), east)!;
    near(at.offTrailM, 60, 0.3);
    near(at.distanceAlongM, 500, 0.5);
    const bearing = at.bearingToNearestDeg!;
    assert.ok(bearing < 0.5 || bearing > 359.5, `bearing ${bearing}`);
  });

  test('before the start: snaps to the jump-off', () => {
    const at = locateOnTrail(destinationPoint(START, 50, 270), east)!;
    assert.equal(at.beyond, 'start');
    assert.equal(at.distanceAlongM, 0);
    near(at.offTrailM, 50, 0.3);
    near(at.bearingToNearestDeg!, 90, 0.5);
  });

  test('after the end: snaps to the end of the Trail', () => {
    const end = destinationPoint(START, 1000, 90);
    const at = locateOnTrail(destinationPoint(end, 80, 45), east)!;
    assert.equal(at.beyond, 'end');
    near(at.distanceAlongM, east.lengthM, 0.001);
    near(at.offTrailM, 80, 0.3);
    near(at.fraction, 1, 1e-9);
    near(at.bearingToNearestDeg!, 225, 0.5);
  });

  test('a short Trail of two points 5 m apart', () => {
    const short = lineFrom(START, [[0, 5]]);
    const at = locateOnTrail(destinationPoint(destinationPoint(START, 2.5, 0), 3, 90), short)!;
    near(at.distanceAlongM, 2.5, 0.05);
    near(at.offTrailM, 3, 0.05);
    near(at.bearingToNearestDeg!, 270, 1);
  });

  test('a corner: the nearest point is the corner itself', () => {
    const corner = lineFrom(START, [[90, 200], [0, 200]]);
    const bend = destinationPoint(START, 200, 90);
    const at = locateOnTrail(destinationPoint(bend, 20, 135), corner)!;
    near(at.distanceAlongM, 200, 0.5);
    near(at.offTrailM, 20, 0.3);
  });

  test('a switchback: the hint keeps the position on the leg the hiker is on', () => {
    // Out 200 m east, 10 m north, back 200 m west: two legs 10 m apart.
    const hairpin = lineFrom(START, [[90, 200], [0, 10], [270, 200]]);
    const between = destinationPoint(destinationPoint(START, 100, 90), 5, 0);
    near(locateOnTrail(between, hairpin, { nearAlongM: 90 })!.distanceAlongM, 100, 1);
    near(locateOnTrail(between, hairpin, { nearAlongM: 320 })!.distanceAlongM, 310, 1);
  });

  test('a raw line works as well as a prepared one; too few points give null', () => {
    const fromRaw = locateOnTrail(mid, EAST_LINE)!;
    near(fromRaw.distanceAlongM, 500, 0.5);
    assert.equal(locateOnTrail(mid, [[120.8, 14.05]]), null);
    assert.equal(locateOnTrail(mid, [[120.8, 14.05], [120.8, 14.05]]), null);
    assert.equal(prepareTrail([[999, 14], [120.8, 14.05]]), null);
  });

  test('pointAlongTrail and bearings', () => {
    const { point, bearingDeg: direction } = pointAlongTrail(east, 250);
    near(distanceM(point, destinationPoint(START, 250, 90)), 0, 0.3);
    near(direction, 90, 0.5);
    near(bearingDeg(START, destinationPoint(START, 100, 30)), 30, 0.1);
    near(distanceM(pointAlongTrail(east, 5000).point, destinationPoint(START, 1000, 90)), 0, 0.5);
  });
});

// --- Next Waypoint, progress, ETA -----------------------------------------------------------

describe('next Waypoint, progress and ETA', () => {
  const at = (m: number) => destinationPoint(START, m, 90);
  const waypoints = [
    waypoint('summit', 'summit', at(1000), 4, 1000),
    waypoint('jump-off', 'jump_off', at(0), 1, 0),
    waypoint('water', 'water', at(300), 2, 300),
    waypoint('camp', 'campsite', at(600), 3, 600),
  ];
  const placed = placeWaypoints(east, waypoints, 1000);

  test('Waypoints are ordered by where they sit along the Trail', () => {
    assert.deepEqual(placed.map((p) => p.waypoint.id), ['jump-off', 'water', 'camp', 'summit']);
    near(placed[2].alongM, 600, 0.5);
  });

  test('going up: the first Waypoint further along than the hiker', () => {
    const next = nextWaypoint(placed, 100, 'up')!;
    assert.equal(next.waypoint.id, 'water');
    near(next.distanceM, 200, 0.5);
    // Standing at a Waypoint counts as having reached it.
    assert.equal(nextWaypoint(placed, 295, 'up')!.waypoint.id, 'camp');
    assert.equal(nextWaypoint(placed, 999, 'up'), null);
  });

  test('going down: the first Waypoint behind the hiker', () => {
    const next = nextWaypoint(placed, 500, 'down')!;
    assert.equal(next.waypoint.id, 'water');
    near(next.distanceM, 200, 0.5);
    assert.equal(nextWaypoint(placed, 100, 'down')!.waypoint.id, 'jump-off');
    assert.equal(nextWaypoint(placed, 5, 'down'), null);
  });

  test('progress is distance done along the Trail over its length', () => {
    assert.equal(progressFraction(250, 1000, 'up'), 0.25);
    assert.equal(progressFraction(250, 1000, 'down'), 0.75);
    assert.equal(progressFraction(-20, 1000), 0);
    assert.equal(progressFraction(1200, 1000), 1);
    assert.equal(progressFraction(10, 0), 0);
  });

  test('ETA: the default pace until there is a recent one, which is clamped', () => {
    near(etaSeconds(600, null), 600 / PACE.defaultMps, 1e-9);
    assert.equal(etaSeconds(600, 1), 600);
    assert.equal(etaSeconds(-5, 1), 0);

    const walk = (mps: number, seconds: number) =>
      Array.from({ length: seconds / 10 + 1 }, (_, i) => ({ timestamp: i * 10_000, alongM: i * 10 * mps }));
    near(recentPaceMps(walk(1, 120))!, 1, 1e-9);
    assert.equal(recentPaceMps(walk(1, 30)), null, 'too short a span');
    assert.equal(recentPaceMps(walk(0.05, 300)), null, 'too little progress');
    assert.equal(recentPaceMps(walk(0.2, 600)), PACE.minMps);
    assert.equal(recentPaceMps(walk(3, 120)), PACE.maxMps);
    // Only the last five minutes count: fast long ago, 0.5 m/s lately.
    const samples = [{ timestamp: 0, alongM: 0 }, { timestamp: 60_000, alongM: 500 }];
    for (let t = 120; t <= 600; t += 60) samples.push({ timestamp: t * 1000, alongM: 500 + (t - 60) * 0.5 });
    near(recentPaceMps(samples)!, 0.5, 1e-9);
  });

  test('formatting', () => {
    assert.equal(formatDistance(842), '840 m');
    assert.equal(formatDistance(996), '1.0 km');
    assert.equal(formatDistance(2345), '2.3 km');
    assert.deepEqual(splitDuration(61), { hours: 0, minutes: 2 });
    assert.deepEqual(splitDuration(3900), { hours: 1, minutes: 5 });
    assert.equal(fill('{a} · {b}', { a: 1, b: 'x' }), '1 · x');
  });
});

// --- Ending the Hike ------------------------------------------------------------------------

describe('the end-Hike suggestion', () => {
  const base = { lengthM: 1000, firstWaypointPastJumpOffM: 300 };

  test('not at the start of a Hike', () => {
    assert.equal(shouldSuggestEnd({ ...base, distanceToJumpOffM: 0, maxAlongM: 0 }), false);
    assert.equal(shouldSuggestEnd({ ...base, distanceToJumpOffM: 10, maxAlongM: 200 }), false);
  });

  test('near the jump-off after half the Trail or the first Waypoint past it', () => {
    assert.equal(shouldSuggestEnd({ ...base, distanceToJumpOffM: 40, maxAlongM: 520 }), true);
    assert.equal(shouldSuggestEnd({ ...base, distanceToJumpOffM: 40, maxAlongM: 290 }), true);
    assert.equal(shouldSuggestEnd({ ...base, firstWaypointPastJumpOffM: null, distanceToJumpOffM: 40, maxAlongM: 290 }), false);
  });

  test('not further than 50 m from the jump-off', () => {
    assert.equal(shouldSuggestEnd({ ...base, distanceToJumpOffM: 51, maxAlongM: 1000 }), false);
  });

  test('a running Hike: suggested on the way back, dismissed, and back after leaving and returning', () => {
    const at = (m: number) => destinationPoint(START, m, 90);
    const placed: PlacedWaypoint[] = placeWaypoints(east, [
      waypoint('jump-off', 'jump_off', at(0), 1, 0),
      waypoint('summit', 'summit', at(1000), 2, 1000),
    ]);
    let tracker = startTracker();
    let t = 0;
    const step = (m: number) => {
      t += 10_000;
      const result = trackPosition(tracker, east, placed, { ...at(m), timestamp: t })!;
      tracker = result.tracker;
      return result.view;
    };

    assert.equal(step(0).suggestEnd, false);
    assert.equal(step(400).leg, 'up');
    const top = step(990);
    assert.equal(top.leg, 'down', 'turns back at the top');
    assert.equal(top.next!.waypoint.id, 'jump-off');
    near(top.progress, 0.01, 0.001);
    near(step(500).progress, 0.5, 1e-6);
    assert.equal(step(30).suggestEnd, true);

    tracker = dismissEndSuggestion(tracker);
    assert.equal(step(20).suggestEnd, false, 'stays dismissed nearby');
    assert.equal(step(150).suggestEnd, false);
    assert.equal(step(10).suggestEnd, true, 'back again after going 100 m away');
  });
});

// --- Simulated walk -------------------------------------------------------------------------

/** Each sample's actual distance off the Trail. */
function offTrail(trail: PreparedTrail, samples: readonly WalkSample[]): number[] {
  return samples.map((sample) => locateOnTrail(sample, trail)!.offTrailM);
}

/** Longest run of consecutive seconds more than `metres` off the Trail, within a filter. */
function longestRunOver(offs: readonly number[], metres: number, keep: (i: number) => boolean = () => true): number {
  let best = 0;
  let run = 0;
  offs.forEach((off, i) => {
    run = off > metres && keep(i) ? run + 1 : 0;
    best = Math.max(best, run);
  });
  return best;
}

for (const [name, trail] of [['Batulao Old Trail', batulao], ['a straight Trail', east]] as const) {
  describe(`the simulated walk on ${name}`, () => {
    const samples = buildSimulatedWalk(trail);
    const offs = offTrail(trail, samples);
    const [startLon, startLat] = trail.coordinates[0];
    const [endLon, endLat] = trail.coordinates[trail.coordinates.length - 1];
    const jumpOff = { latitude: startLat, longitude: startLon };
    const top = { latitude: endLat, longitude: endLon };

    test('one sample per simulated second', () => {
      samples.forEach((sample, i) => assert.equal(sample.tS, i));
    });

    test('starts at the jump-off, reaches the top, rests, and comes back', () => {
      near(distanceM(samples[0], jumpOff), 0, 0.5);
      const atTop = samples.filter((sample) => sample.phase === 'top');
      assert.equal(atTop.length, WALK.summitRestS);
      atTop.forEach((sample) => near(distanceM(sample, top), 0, 0.5));
      const last = samples[samples.length - 1];
      assert.equal(last.phase, 'done');
      near(distanceM(last, jumpOff), 0, 0.5);
      // Walking speed: about upMps on the way up and downMps on the way down.
      const up = samples.filter((sample) => sample.phase === 'up' && sample.excursion === null).length;
      near(up, trail.lengthM / WALK.upMps, 200);
    });

    test('on the Trail except during the two excursions', () => {
      offs.forEach((off, i) => {
        if (samples[i].intendedOffM === 0) near(off, 0, 0.5, `t=${i}`);
      });
    });

    test('the short excursion: 25 m off for 20 s, never a Deviation (> 40 m for > 30 s)', () => {
      const idx = samples.flatMap((sample, i) => (sample.excursion === 'short' ? [i] : []));
      assert.ok(idx.length > 0);
      assert.ok(samples[idx[0]].alongM <= trail.lengthM * WALK.shortAt + 1);
      const held = idx.filter((i) => samples[i].intendedOffM === EXCURSIONS.short.offsetM);
      // At the full offset from the first such sample to the last: 20 simulated seconds.
      assert.equal(samples[held[held.length - 1]].tS - samples[held[0]].tS, EXCURSIONS.short.holdS);
      const peak = Math.max(...idx.map((i) => offs[i]));
      near(peak, 25, 2);
      assert.equal(longestRunOver(offs, 40, (i) => samples[i].excursion === 'short'), 0);
    });

    test('the long excursion: 60 m off for 45 s, a Deviation (> 40 m for > 30 s)', () => {
      const idx = samples.flatMap((sample, i) => (sample.excursion === 'long' ? [i] : []));
      const shortStart = samples.findIndex((sample) => sample.excursion === 'short');
      assert.ok(idx[0] > shortStart, 'after the short one');
      assert.equal(samples[idx[0]].phase, 'up');
      const held = idx.filter((i) => samples[i].intendedOffM === EXCURSIONS.long.offsetM);
      assert.equal(samples[held[held.length - 1]].tS - samples[held[0]].tS, EXCURSIONS.long.holdS);
      held.forEach((i) => assert.ok(offs[i] >= 55, `t=${i} only ${offs[i]} m off`));
      const over40 = longestRunOver(offs, 40, (i) => samples[i].excursion === 'long');
      assert.ok(over40 >= 45 && over40 > 30, `${over40} s over 40 m`);
    });

    test('an on-demand long excursion, inserted mid-walk', () => {
      const at = Math.round(walkDurationS(samples) * 0.8);
      const { samples: withTrip, startS } = insertExcursion(trail, samples, at);
      assert.equal(startS, at);
      const added = withTrip.length - samples.length;
      assert.equal(added, 2 * EXCURSIONS.long.offsetM + EXCURSIONS.long.holdS);
      assert.equal(walkDurationS(withTrip), walkDurationS(samples) + added);
      withTrip.forEach((sample, i) => assert.equal(sample.tS, i));
      const newOffs = offTrail(trail, withTrip);
      assert.ok(longestRunOver(newOffs, 40, (i) => i > at) >= 45);
      // The walk carries on where it left off.
      near(distanceM(withTrip[at + added + 1], samples[at + 1]), 0, 0.01);
    });

    test('a walk without excursions never leaves the Trail', () => {
      const plain = buildSimulatedWalk(trail, { excursions: false });
      assert.ok(plain.every((sample) => sample.excursion === null));
      assert.ok(offTrail(trail, plain).every((off) => off < 0.5));
    });
  });
}

describe('playing the simulated walk', () => {
  test('sampleAt interpolates and clamps', () => {
    const samples = buildSimulatedWalk(east, { excursions: false });
    near(sampleAt(samples, 10.5).alongM, 10.5 * WALK.upMps, 1e-6);
    assert.equal(sampleAt(samples, -3), samples[0]);
    assert.equal(sampleAt(samples, 1e9).tS, samples[samples.length - 1].tS);
  });

  test('a player started part-way stamps positions in simulated time', () => {
    const walk = createSimulatedWalk({ trail: east, trailId: 't', startFraction: 0.5, now: () => 1_000_000 });
    const snapshot = walk.getSnapshot();
    const duration = snapshot.durationS;
    near(snapshot.tS, duration / 2, 1e-9);
    assert.equal(snapshot.position.timestamp, Math.round(1_000_000 + snapshot.tS * 1000));
    assert.equal(snapshot.speed, DEFAULT_SPEED);
    walk.goOffTrail();
    walk.stop();
    assert.equal(walk.getSnapshot().durationS, duration + 2 * 60 + 45);
  });
});

describe('Hike deep links', () => {
  test('simulate, with and without options', () => {
    assert.deepEqual(parseHikeLink('tahak://hike/simulate'), {
      action: 'simulate',
      trailId: null,
      speed: DEFAULT_SPEED,
      startFraction: 0,
    });
    assert.deepEqual(parseHikeLink('tahak://hike/simulate?trail=batulao-old-trail&speed=60&at=0.9'), {
      action: 'simulate',
      trailId: 'batulao-old-trail',
      speed: 60,
      startFraction: 0.9,
    });
    assert.deepEqual(parseHikeLink('tahak://hike/simulate?speed=999&at=7'), {
      action: 'simulate',
      trailId: null,
      speed: 120,
      startFraction: 1,
    });
  });

  test('off-trail, end, and links that are not Hike links', () => {
    assert.deepEqual(parseHikeLink('tahak://hike/simulate/off-trail'), { action: 'off-trail' });
    assert.deepEqual(parseHikeLink('tahak://hike/end'), { action: 'end' });
    assert.equal(parseHikeLink('tahak://spike/bench?backend=cpu'), null);
    assert.equal(parseHikeLink('tahak://hike/other'), null);
    assert.equal(parseHikeLink(null), null);
  });
});
