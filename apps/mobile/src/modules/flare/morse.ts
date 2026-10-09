// The flashlight's Morse code (issue #12). Pure, so it can be tested with plain Node.
//
// Standard Morse timing in units: a dot is 1 unit on, a dash 3; the gap inside a letter is 1
// unit off, between letters 3, and between words 7. The timeline ends with the word gap, so
// looping it gives "SOS SOS SOS" with the right spacing. 250 ms units make the whole SOS about
// 8.5 s, slow enough to read by eye from far off and well under 3 flashes a second.

export const MORSE_UNIT_MS = 250;

/** In units. */
export const MORSE_TIMING = { dot: 1, dash: 3, symbolGap: 1, letterGap: 3, wordGap: 7 } as const;

const CODE: Record<string, string> = {
  S: '...',
  O: '---',
};

/**
 * One word as alternating on and off durations in ms, starting with on and ending with the word
 * gap, so it always has an even length and loops cleanly.
 */
export function morseTimeline(word = 'SOS', unitMs = MORSE_UNIT_MS): number[] {
  const letters = [...word.toUpperCase()];
  if (letters.length === 0) throw new Error('Morse needs at least one letter.');
  const timeline: number[] = [];
  letters.forEach((letter, li) => {
    const code = CODE[letter];
    if (!code) throw new Error(`No Morse code for "${letter}".`);
    [...code].forEach((symbol, si) => {
      timeline.push((symbol === '.' ? MORSE_TIMING.dot : MORSE_TIMING.dash) * unitMs);
      const lastSymbol = si === code.length - 1;
      const lastLetter = li === letters.length - 1;
      const gap = !lastSymbol ? MORSE_TIMING.symbolGap : !lastLetter ? MORSE_TIMING.letterGap : MORSE_TIMING.wordGap;
      timeline.push(gap * unitMs);
    });
  });
  return timeline;
}

/** Whether the light is on at a moment of the looped timeline. */
export function morseLightAt(timeline: readonly number[], elapsedMs: number): boolean {
  const cycle = timeline.reduce((sum, ms) => sum + ms, 0);
  let t = ((elapsedMs % cycle) + cycle) % cycle;
  for (let i = 0; i < timeline.length; i++) {
    if (t < timeline[i]) return i % 2 === 0;
    t -= timeline[i];
  }
  return false;
}
