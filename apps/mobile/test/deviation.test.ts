// The Deviation rule (issue #8): more than 40 m off the Trail for more than 30 s, timed by the
// positions' timestamps, with hysteresis on the way back and a rule for gaps between positions.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, test } from 'node:test';

import {
  DEVIATION,
  isDeviation,
  startDeviationDetector,
  stepDeviation,
  type DeviationEvent,
  type DeviationFix,
  type DeviationState,
} from '../src/modules/hike/deviation/detector.ts';
import { compassPoint, arrowRotationDeg } from '../src/modules/hike/deviation/direction.ts';
import { SPEEDS } from '../src/modules/hike/simulate/simLink.ts';
import {
  buildSimulatedWalk,
  insertExcursion,
  sampleAt,
  walkDurationS,
  type WalkSample,
} from '../src/modules/hike/simulate/walkScript.ts';
import { destinationPoint, locateOnTrail, prepareTrail, type PreparedTrail } from '../src/modules/hike/trail/geometry.ts';

const T0 = 1_700_000_000_000;

/** Feeds fixes through a fresh detector; returns every event with its fix and the final state. */
function run(fixes: readonly DeviationFix[], from: DeviationState = startDeviationDetector()) {
  let state = from;
  const events: { event: Exclude<DeviationEvent, null>; at: number }[] = [];
  const states: DeviationState[] = [];
  for (const fix of fixes) {
    const step = stepDeviation(state, fix);
    state = step.state;
    states.push(state);
    if (step.event) events.push({ event: step.event, at: fix.timestamp });
  }
  return { state, events, states };
}

/** One fix per second from `fromS` to `toS` (inclusive) at `metres` off the Trail. */
function hold(metres: number, fromS: number, toS: number, everyS = 1): DeviationFix[] {
  const fixes: DeviationFix[] = [];
  for (let s = fromS; s <= toS; s += everyS) fixes.push({ offTrailM: metres, timestamp: T0 + s * 1000 });
  return fixes;
}

describe('the Deviation rule', () => {
  test('the documented numbers', () => {
    assert.deepEqual(DEVIATION, { startOffM: 40, startAfterS: 30, clearOffM: 30, maxGapS: 60 });
  });

  test('41 m for 31 s starts a Deviation, at the 31st second', () => {
    const { state, events } = run([...hold(0, -5, -1), ...hold(41, 0, 31)]);
    assert.deepEqual(events, [{ event: 'started', at: T0 + 31_000 }]);
    assert.ok(isDeviation(state));
  });

  test('41 m for 29 s, then back: no Deviation', () => {
    const { events, state } = run([...hold(41, 0, 29), ...hold(5, 30, 40)]);
    assert.deepEqual(events, []);
    assert.equal(state.status, 'on-trail');
  });

  test('exactly 30 s is not more than 30 s', () => {
    assert.deepEqual(run(hold(41, 0, 30)).events, []);
  });

  test('39 m for 60 s, and exactly 40 m for 60 s: no Deviation', () => {
    assert.deepEqual(run(hold(39, 0, 60)).events, []);
    assert.deepEqual(run(hold(40, 0, 60)).events, []);
  });

  test('one position back within 40 m restarts the 30 s', () => {
    const { events } = run([...hold(45, 0, 20), { offTrailM: 38, timestamp: T0 + 21_000 }, ...hold(45, 22, 52)]);
    assert.deepEqual(events, [], 'only 30 s from 22 to 52');
    const later = run([...hold(45, 0, 20), { offTrailM: 38, timestamp: T0 + 21_000 }, ...hold(45, 22, 53)]);
    assert.deepEqual(later.events, [{ event: 'started', at: T0 + 53_000 }]);
  });

  test('hysteresis: in a Deviation, 31 to 40 m keeps it; 30 m or less clears it', () => {
    const start = run(hold(50, 0, 31)).state;
    assert.ok(isDeviation(start));
    // GPS jitter around 40 m does not switch the alert off and on.
    const jitter = run(
      [41, 39, 41, 39, 35, 31, 40.5, 30.1].map((m, i) => ({ offTrailM: m, timestamp: T0 + (32 + i) * 1000 })),
      start,
    );
    assert.deepEqual(jitter.events, []);
    assert.ok(jitter.states.every(isDeviation));
    const back = run([{ offTrailM: 30, timestamp: T0 + 50_000 }], jitter.state);
    assert.deepEqual(back.events, [{ event: 'cleared', at: T0 + 50_000 }]);
    assert.equal(back.state.status, 'on-trail');
  });

  test('clearing: back on the Trail ends it, and a new Deviation needs another 30 s', () => {
    const { events } = run([...hold(60, 0, 40), ...hold(2, 41, 50), ...hold(60, 51, 81), ...hold(60, 82, 82)]);
    assert.deepEqual(events, [
      { event: 'started', at: T0 + 31_000 },
      { event: 'cleared', at: T0 + 41_000 },
      { event: 'started', at: T0 + 82_000 },
    ]);
  });

  test('fires once per Deviation, however long it lasts', () => {
    const { events, states } = run(hold(80, 0, 600));
    assert.deepEqual(events, [{ event: 'started', at: T0 + 31_000 }]);
    // The Deviation keeps the time it started.
    const last = states[states.length - 1];
    assert.ok(isDeviation(last) && last.startedMs === T0 + 31_000 && last.sinceMs === T0);
  });

  test('gaps of up to 60 s count as time off the Trail', () => {
    // Off at 0, then nothing until 45 s, still off: 45 s off.
    const { events } = run([{ offTrailM: 50, timestamp: T0 }, { offTrailM: 50, timestamp: T0 + 45_000 }]);
    assert.deepEqual(events, [{ event: 'started', at: T0 + 45_000 }]);
    // Exactly 60 s still counts.
    const sixty = run([{ offTrailM: 50, timestamp: T0 }, { offTrailM: 50, timestamp: T0 + 60_000 }]);
    assert.deepEqual(sixty.events, [{ event: 'started', at: T0 + 60_000 }]);
  });

  test('a gap over 60 s restarts the 30 s from the first position after it', () => {
    const fixes = [{ offTrailM: 50, timestamp: T0 }, ...hold(50, 61, 91)];
    assert.deepEqual(run(fixes).events, [], '61 to 91 is 30 s, not more');
    assert.deepEqual(run([...fixes, ...hold(50, 92, 92)]).events, [{ event: 'started', at: T0 + 92_000 }]);
  });

  test('a gap never clears a Deviation; only a position near the Trail does', () => {
    const { state } = run(hold(50, 0, 31));
    const after = run([{ offTrailM: 45, timestamp: T0 + 600_000 }], state);
    assert.deepEqual(after.events, []);
    assert.ok(isDeviation(after.state));
  });

  test('repeated, out-of-order and broken positions are ignored', () => {
    const { state } = run(hold(50, 0, 20));
    const stale = run(
      [
        { offTrailM: 0, timestamp: T0 + 20_000 },
        { offTrailM: 0, timestamp: T0 + 5_000 },
        { offTrailM: Number.NaN, timestamp: T0 + 25_000 },
        { offTrailM: 50, timestamp: Number.NaN },
      ],
      state,
    );
    assert.deepEqual(stale.state, state);
    assert.deepEqual(run(hold(50, 21, 31), state).events, [{ event: 'started', at: T0 + 31_000 }]);
  });
});

describe('the back-to-trail direction', () => {
  test('eight compass points, each 45° wide', () => {
    assert.equal(compassPoint(0), 'n');
    assert.equal(compassPoint(22), 'n');
    assert.equal(compassPoint(23), 'ne');
    assert.equal(compassPoint(90), 'e');
    assert.equal(compassPoint(180), 's');
    assert.equal(compassPoint(225), 'sw');
    assert.equal(compassPoint(292), 'w');
    assert.equal(compassPoint(338), 'n');
    assert.equal(compassPoint(359.9), 'n');
  });

  test('the arrow turns by the bearing, minus however far the map is turned', () => {
    assert.equal(arrowRotationDeg(45, 0), 45);
    assert.equal(arrowRotationDeg(45, 90), 315);
    assert.equal(arrowRotationDeg(10, 350), 20);
    assert.equal(arrowRotationDeg(null, 0), null);
  });
});

// --- #7's simulated walk through the detector -----------------------------------------------

/** The placeholder Batulao Old Trail from the seed, the Trail on the phone today. */
function seedTrail(): PreparedTrail {
  const sql = readFileSync(join(import.meta.dirname, '..', '..', '..', 'supabase', 'seed', 'batulao.sql'), 'utf8');
  const json = sql.match(/'(\{"type":"LineString"[^']+)'/)![1];
  return prepareTrail(JSON.parse(json).coordinates)!;
}

const START = { latitude: 14.05, longitude: 120.8 };
const eastEnd = destinationPoint(START, 1000, 90);
const east = prepareTrail([
  [START.longitude, START.latitude],
  [eastEnd.longitude, eastEnd.latitude],
])!;

/** Runs positions through the detector the way the Hike screen does. */
function detect(trail: PreparedTrail, samples: readonly WalkSample[]) {
  return run(
    samples.map((sample) => ({
      offTrailM: locateOnTrail(sample, trail)!.offTrailM,
      timestamp: T0 + Math.round(sample.tS * 1000),
    })),
  );
}

/** The walk as the player emits it: one position every 250 ms of real time at this speed. */
function played(samples: readonly WalkSample[], speed: number): WalkSample[] {
  const stepS = 0.25 * speed;
  const out: WalkSample[] = [];
  for (let t = 0; t <= walkDurationS(samples); t += stepS) out.push(sampleAt(samples, t));
  return out;
}

for (const [name, trail] of [['Batulao Old Trail', seedTrail()], ['a straight Trail', east]] as const) {
  describe(`#7's simulated walk on ${name} through the detector`, () => {
    const samples = buildSimulatedWalk(trail);
    const excursionAt = (at: number) => samples[Math.round((at - T0) / 1000)].excursion;

    test('the long excursion starts exactly one Deviation, and the short one none', () => {
      const { events } = detect(trail, samples);
      assert.deepEqual(
        events.map((e) => e.event),
        ['started', 'cleared'],
      );
      assert.equal(excursionAt(events[0].at), 'long');
      assert.equal(excursionAt(events[1].at), 'long', 'cleared on the way back, before reaching the Trail');
    });

    for (const speed of [...SPEEDS, 120]) {
      test(`the same at ${speed}× playback (a position every ${0.25 * speed} simulated s)`, () => {
        const { events } = detect(trail, played(samples, speed));
        assert.deepEqual(
          events.map((e) => e.event),
          ['started', 'cleared'],
        );
        const startS = (events[0].at - T0) / 1000;
        assert.equal(sampleAt(samples, startS).excursion, 'long');
      });
    }

    test('"Go off the Trail" on a walk without excursions: exactly one Deviation', () => {
      const plain = buildSimulatedWalk(trail, { excursions: false });
      assert.deepEqual(detect(trail, plain).events, []);
      const { samples: withTrip } = insertExcursion(trail, plain, Math.round(walkDurationS(plain) * 0.3));
      assert.deepEqual(
        detect(trail, withTrip).events.map((e) => e.event),
        ['started', 'cleared'],
      );
    });

    test('"Go off the Trail" anywhere on the walk starts exactly one Deviation; a short excursion never does', () => {
      // Switchbacks bring other legs of the Trail close: the excursion must still end up more
      // than 40 m from the whole Trail, as the detector measures it.
      const plain = buildSimulatedWalk(trail, { excursions: false });
      const duration = walkDurationS(plain);
      for (let f = 0; f < 1; f += 0.01) {
        const at = Math.round(duration * f);
        // Only the stretch around the excursion: the rest of the walk is on the Trail.
        const around = (kind: 'long' | 'short') => {
          const { samples: walk, startS } = insertExcursion(trail, plain, at, kind);
          return walk.slice(Math.max(0, startS - 5), startS + 200);
        };
        assert.deepEqual(
          detect(trail, around('long')).events.map((e) => e.event),
          ['started', 'cleared'],
          `long excursion at ${f.toFixed(2)} of the walk`,
        );
        assert.deepEqual(detect(trail, around('short')).events, [], `short excursion at ${f.toFixed(2)} of the walk`);
      }
    });

    test('the short excursion alone never starts one', () => {
      const shortOnly = samples.filter((sample) => sample.excursion !== 'long');
      // Re-time so the walk stays continuous without the long excursion.
      const retimed = shortOnly.map((sample, i) => ({ ...sample, tS: i }));
      assert.deepEqual(detect(trail, retimed).events, []);
    });
  });
}
