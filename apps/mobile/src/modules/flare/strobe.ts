// The Flare's screen strobe timing (issue #12). Pure, so it can be tested with plain Node.
//
// Photosensitivity: content must not flash more than 3 times in any one second (WCAG 2.3.1,
// "Three Flashes or Below Threshold"). The strobe flashes twice a second, half light and half
// dark, and refuses any rate above 3.

export const MAX_FLASHES_PER_SECOND = 3;
export const STROBE_HZ = 2;

/** How long each light and each dark phase lasts, in ms. Throws above 3 flashes a second. */
export function strobeHalfPeriodMs(hz = STROBE_HZ): number {
  if (!(hz > 0) || hz > MAX_FLASHES_PER_SECOND) {
    throw new Error(`The strobe must flash at most ${MAX_FLASHES_PER_SECOND} times a second, not ${hz}.`);
  }
  return 1000 / hz / 2;
}

/** Whether the strobe is in its light phase at a moment since it started. */
export function strobeLightAt(elapsedMs: number, hz = STROBE_HZ): boolean {
  const half = strobeHalfPeriodMs(hz);
  return Math.floor(elapsedMs / half) % 2 === 0;
}
