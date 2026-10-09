// The simulation bar's second line: the hiker's real distance from the Trail, the same number
// the Deviation is measured on, never the distance the walk script planned.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, test } from 'node:test';

import { startDeviationDetector, stepDeviation, type DeviationState } from '../src/modules/hike/deviation/detector.ts';
import { SIMULATION_LINE, simulationLine } from '../src/modules/hike/simulate/simulationLine.ts';
import {
  buildSimulatedWalk,
  insertExcursion,
  sampleAt,
  walkDurationS,
  type WalkSample,
} from '../src/modules/hike/simulate/walkScript.ts';
import strings from '../src/modules/hike/strings.ts';
import { destinationPoint, locateOnTrail, prepareTrail, type PreparedTrail } from '../src/modules/hike/trail/geometry.ts';

const { en, fil } = strings;

describe('the simulation bar line', () => {
  test('on the Trail: the usual note', () => {
    assert.equal(simulationLine(0, en), 'Not your real position.');
    assert.equal(simulationLine(4, en), 'Not your real position.');
  });

  test('no position yet, or a broken one: the usual note', () => {
    assert.equal(simulationLine(null, en), 'Not your real position.');
    assert.equal(simulationLine(Number.NaN, en), 'Not your real position.');
  });

  test('just off the Trail', () => {
    assert.equal(simulationLine(12, en), '10 m off the Trail');
    assert.equal(simulationLine(26, en), '30 m off the Trail');
  });

  test('well off the Trail', () => {
    assert.equal(simulationLine(61, en), '60 m off the Trail');
    assert.equal(simulationLine(1240, en), '1.2 km off the Trail');
  });

  test('the threshold: 10 m shows the distance, just under it the note', () => {
    assert.equal(SIMULATION_LINE.showOffTrailFromM, 10);
    assert.equal(simulationLine(9.99, en), 'Not your real position.');
    assert.equal(simulationLine(10, en), '10 m off the Trail');
  });

  test('in Filipino', () => {
    assert.equal(simulationLine(0, fil), fil.simulationNote);
    assert.equal(simulationLine(61, fil), '60 m palayo sa Trail');
  });
});

// --- #7's scripted excursions -----------------------------------------------------------------

/** The Batulao Old Trail from the seed, the Trail on the phone today. */
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

/** The distance a line shows, in metres, or null for the note. */
function shownM(line: string): number | null {
  const match = line.match(/^([\d.]+) (m|km) off the Trail$/);
  if (!match) return null;
  return Number(match[1]) * (match[2] === 'km' ? 1000 : 1);
}

/** The walk as the player emits it at 15×: one position every 3.75 simulated seconds. */
function played(samples: readonly WalkSample[]): WalkSample[] {
  const out: WalkSample[] = [];
  for (let t = 0; t <= walkDurationS(samples); t += 3.75) out.push(sampleAt(samples, t));
  return out;
}

/** Each position as the Hike screen sees it: the real distance, the bar's line, the detector. */
function screen(trail: PreparedTrail, samples: readonly WalkSample[]) {
  let detector: DeviationState = startDeviationDetector();
  return samples.map((sample) => {
    const realM = locateOnTrail(sample, trail)!.offTrailM;
    const step = stepDeviation(detector, { offTrailM: realM, timestamp: Math.round(sample.tS * 1000) });
    detector = step.state;
    return { sample, realM, line: simulationLine(realM, en), event: step.event };
  });
}

for (const [name, trail] of [['Batulao Old Trail', seedTrail()], ['a straight Trail', east]] as const) {
  describe(`the bar during #7's simulated walk on ${name}`, () => {
    const seen = screen(trail, played(buildSimulatedWalk(trail)));

    test('on the Trail between excursions: the usual note', () => {
      for (const { sample, line } of seen) {
        if (sample.excursion === null) assert.equal(line, en.simulationNote, `at ${sample.tS} s`);
      }
    });

    for (const kind of ['short', 'long'] as const) {
      test(`the ${kind} excursion: the shown distance is the real one, to the nearest 10 m`, () => {
        const trip = seen.filter(({ sample }) => sample.excursion === kind);
        assert.ok(trip.length > 0);
        for (const { sample, realM, line } of trip) {
          const shown = shownM(line);
          if (realM < SIMULATION_LINE.showOffTrailFromM) {
            assert.equal(shown, null, `at ${sample.tS} s, ${realM.toFixed(1)} m off`);
          } else {
            assert.ok(shown !== null && Math.abs(shown - realM) <= 5, `at ${sample.tS} s: "${line}", really ${realM.toFixed(1)} m`);
          }
        }
        const furthest = Math.max(...trip.map(({ realM }) => realM));
        assert.equal(Math.max(...trip.map(({ line }) => shownM(line) ?? 0)), Math.round(furthest / 10) * 10);
      });
    }

    test('when the Deviation clears, the bar never says more than 30 m', () => {
      const cleared = seen.filter(({ event }) => event === 'cleared');
      assert.equal(cleared.length, 1);
      assert.ok(shownM(cleared[0].line)! <= 30, `"${cleared[0].line}" as the Deviation clears`);
    });

    test('"Go off the Trail" anywhere: the bar shows the real distance, whatever the script planned', () => {
      const plain = buildSimulatedWalk(trail, { excursions: false });
      const duration = walkDurationS(plain);
      for (let f = 0; f < 1; f += 0.05) {
        const { samples, startS } = insertExcursion(trail, plain, Math.round(duration * f), 'long');
        const around = samples.filter((sample) => sample.tS >= startS && sample.tS <= startS + 200);
        for (const { sample, realM, line } of screen(trail, around)) {
          const expected = realM < SIMULATION_LINE.showOffTrailFromM ? null : realM;
          const shown = shownM(line);
          if (expected === null) assert.equal(shown, null, `${f.toFixed(2)} of the walk, at ${sample.tS} s`);
          else assert.ok(shown !== null && Math.abs(shown - expected) <= 5, `${f.toFixed(2)}: "${line}", really ${realM.toFixed(1)} m`);
        }
      }
    });
  });
}
