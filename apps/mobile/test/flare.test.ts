// The Flare (issue #12): Morse timing for the flashlight, the strobe's photosensitivity limit,
// and the hold-to-fire gesture (a tap never fires, ADR 0004).
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { HOLD_TO_FIRE_MS, IDLE, holdProgress, stepHold, type HoldEvent, type HoldState } from '../src/modules/flare/gesture.ts';
import { MORSE_UNIT_MS, morseLightAt, morseTimeline } from '../src/modules/flare/morse.ts';
import { MAX_FLASHES_PER_SECOND, STROBE_HZ, strobeHalfPeriodMs, strobeLightAt } from '../src/modules/flare/strobe.ts';

const U = MORSE_UNIT_MS;

test('SOS is dot dot dot, dash dash dash, dot dot dot, with Morse unit lengths and gaps', () => {
  assert.deepEqual(morseTimeline('SOS', U), [
    // S: three 1-unit dots, 1-unit gaps inside the letter, 3-unit gap after it
    U, U, U, U, U, 3 * U,
    // O: three 3-unit dashes
    3 * U, U, 3 * U, U, 3 * U, 3 * U,
    // S, then the 7-unit gap between words
    U, U, U, U, U, 7 * U,
  ]);
});

test('the timeline alternates on and off, starts on, and has an even length for the native loop', () => {
  const timeline = morseTimeline();
  assert.equal(timeline.length % 2, 0);
  assert.ok(timeline.every((ms) => Number.isInteger(ms) && ms > 0));
  assert.equal(morseLightAt(timeline, 0), true);
  // One SOS is 34 units: 5+3 (S) + 11+3 (O) + 5+7 (S).
  assert.equal(timeline.reduce((a, b) => a + b, 0), 34 * U);
});

test('the Morse light loops: the second SOS starts after the word gap and matches the first', () => {
  const timeline = morseTimeline();
  const cycle = 34 * U;
  for (let t = 0; t < cycle; t += U / 2) {
    assert.equal(morseLightAt(timeline, t + cycle), morseLightAt(timeline, t), `at ${t} ms`);
    assert.equal(morseLightAt(timeline, t + 5 * cycle), morseLightAt(timeline, t), `at ${t} ms, 5 loops on`);
  }
  // The last 7 units are dark (the word gap), then the light comes back.
  assert.equal(morseLightAt(timeline, cycle - 1), false);
  assert.equal(morseLightAt(timeline, cycle - 7 * U), false);
  assert.equal(morseLightAt(timeline, cycle), true);
});

test('the Morse unit scales every duration', () => {
  assert.deepEqual(
    morseTimeline('SOS', 100),
    morseTimeline('SOS', 1).map((ms) => ms * 100),
  );
});

test('unknown letters are refused rather than skipped', () => {
  assert.throws(() => morseTimeline('SOX'), /No Morse code for "X"/);
  assert.throws(() => morseTimeline(''), /at least one letter/);
});

function maxFlashesInAnySecond(lightAt: (ms: number) => boolean, spanMs: number): number {
  // A flash is a dark-to-light change. Sample every 5 ms and slide a 1 s window.
  const onsets: number[] = [];
  let was = lightAt(0);
  if (was) onsets.push(0);
  for (let t = 5; t < spanMs; t += 5) {
    const now = lightAt(t);
    if (now && !was) onsets.push(t);
    was = now;
  }
  let max = 0;
  for (const start of onsets) {
    max = Math.max(max, onsets.filter((t) => t >= start && t < start + 1000).length);
  }
  return max;
}

test('the screen strobe flashes at most 3 times in any one second', () => {
  assert.ok(STROBE_HZ <= MAX_FLASHES_PER_SECOND);
  assert.equal(MAX_FLASHES_PER_SECOND, 3);
  assert.ok(maxFlashesInAnySecond((t) => strobeLightAt(t), 10_000) <= 3);
  assert.equal(maxFlashesInAnySecond((t) => strobeLightAt(t), 10_000), STROBE_HZ);
});

test('the strobe refuses any rate above 3 flashes a second', () => {
  assert.equal(strobeHalfPeriodMs(2), 250);
  assert.equal(strobeHalfPeriodMs(3), 1000 / 6);
  assert.throws(() => strobeHalfPeriodMs(3.5), /at most 3 times a second/);
  assert.throws(() => strobeHalfPeriodMs(10), /at most 3 times a second/);
  assert.throws(() => strobeHalfPeriodMs(0));
});

test('the flashlight Morse also stays at or under 3 flashes a second', () => {
  const timeline = morseTimeline();
  assert.ok(maxFlashesInAnySecond((t) => morseLightAt(timeline, t), 34 * U * 3) <= 3);
});

function run(events: HoldEvent[]): HoldState {
  return events.reduce(stepHold, IDLE);
}

test('a tap does not fire the Flare: it shows the hint', () => {
  assert.deepEqual(run([{ type: 'press', at: 0 }, { type: 'release', at: 120 }]), { phase: 'hint' });
});

test('letting go just before 1.5 s does not fire, even after ticks', () => {
  const state = run([
    { type: 'press', at: 1000 },
    { type: 'tick', at: 1500 },
    { type: 'tick', at: 2000 },
    { type: 'tick', at: 1000 + HOLD_TO_FIRE_MS - 1 },
    { type: 'release', at: 1000 + HOLD_TO_FIRE_MS - 1 },
  ]);
  assert.deepEqual(state, { phase: 'hint' });
});

test('holding for 1.5 s fires, on a tick, without waiting for the release', () => {
  const holding = run([{ type: 'press', at: 0 }, { type: 'tick', at: 700 }]);
  assert.equal(holding.phase, 'holding');
  assert.deepEqual(stepHold(holding, { type: 'tick', at: HOLD_TO_FIRE_MS }), { phase: 'fired' });
});

test('a long press released late fires even if no tick came (a stalled timer)', () => {
  assert.deepEqual(run([{ type: 'press', at: 0 }, { type: 'release', at: 2000 }]), { phase: 'fired' });
});

test('many quick taps never add up to a fire', () => {
  const events: HoldEvent[] = [];
  for (let i = 0; i < 20; i++) events.push({ type: 'press', at: i * 200 }, { type: 'release', at: i * 200 + 100 });
  assert.deepEqual(run(events), { phase: 'hint' });
});

test('after the hint, a new press starts a fresh hold; reset returns to idle', () => {
  const hinted = run([{ type: 'press', at: 0 }, { type: 'release', at: 100 }]);
  const again = stepHold(hinted, { type: 'press', at: 5000 });
  assert.deepEqual(again, { phase: 'holding', since: 5000 });
  assert.deepEqual(stepHold(again, { type: 'tick', at: 5000 + HOLD_TO_FIRE_MS }), { phase: 'fired' });
  assert.deepEqual(stepHold({ phase: 'fired' }, { type: 'reset' }), IDLE);
});

test('the hold bar fills from 0 to 1 over 1.5 s', () => {
  const holding: HoldState = { phase: 'holding', since: 1000 };
  assert.equal(holdProgress(IDLE, 5000), 0);
  assert.equal(holdProgress(holding, 1000), 0);
  assert.equal(holdProgress(holding, 1000 + HOLD_TO_FIRE_MS / 2), 0.5);
  assert.equal(holdProgress(holding, 99_999), 1);
  assert.equal(holdProgress({ phase: 'fired' }, 0), 1);
});
