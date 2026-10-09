// The simulation bar's second line. Pure, tested under plain Node.
//
// It shows the hiker's real distance from the Trail: the offTrailM the Deviation is measured
// on (locateOnTrail against the whole Trail), formatted as the Deviation banner formats it, so
// the bar and the banner never disagree. Not the distance the walk script planned: near
// switchbacks the two differ by over 15 m, and the planned one could read 39 m just as the
// Deviation cleared at 30 m.

import { fill, formatDistance } from '../format.ts';

export const SIMULATION_LINE = {
  /**
   * From this far off the Trail, in metres, the line gives the distance. The walk itself sits
   * on the Trail line (0 m), and a real GPS reading wanders by about 5 m, so below 10 m a
   * number would only be noise. 10 m is well under the Deviation's 30 m clear and 40 m start,
   * so the number is there from early in every excursion, the 25 m short one included.
   */
  showOffTrailFromM: 10,
} as const;

/** "60 m off the Trail" while the hiker is really that far off, else "Not your real position." */
export function simulationLine(
  offTrailM: number | null,
  s: { simulationNote: string; simulatedOffTrail: string },
): string {
  if (offTrailM === null || !Number.isFinite(offTrailM) || offTrailM < SIMULATION_LINE.showOffTrailFromM) {
    return s.simulationNote;
  }
  return fill(s.simulatedOffTrail, { distance: formatDistance(offTrailM) });
}
