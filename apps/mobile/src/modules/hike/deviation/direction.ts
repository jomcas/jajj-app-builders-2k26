// Which way the Trail is during a Deviation, for the banner's arrow and text. Pure, tested
// under plain Node.
//
// The arrow is drawn on the map, so it turns with the map, not with the phone: it points at the
// nearest point of the Trail as the map shows it. The map is north-up unless the hiker turns
// it, and then the arrow turns with it. The phone's compass is not used (a follow-up); the text
// gives the compass direction ("to the north-east") for a hiker who knows which way north is.

export type CompassPoint = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw';

const POINTS: readonly CompassPoint[] = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];

/** The nearest of eight compass points to a bearing in degrees clockwise from north. */
export function compassPoint(bearingDeg: number): CompassPoint {
  const index = Math.round((((bearingDeg % 360) + 360) % 360) / 45) % 8;
  return POINTS[index];
}

/**
 * How far to turn an up-pointing arrow, clockwise in degrees (0 to 360), so it points at
 * `bearingDeg` on a map turned `mapBearingDeg` from north-up. null when there is no direction
 * (the position is on the Trail line).
 */
export function arrowRotationDeg(bearingDeg: number | null, mapBearingDeg: number): number | null {
  if (bearingDeg === null) return null;
  return (((bearingDeg - mapBearingDeg) % 360) + 360) % 360;
}
