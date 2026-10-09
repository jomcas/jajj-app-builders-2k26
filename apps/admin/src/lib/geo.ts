// Distances on the Earth's surface, for a Trail's length and a Waypoint's distance along it.

import type { LngLat } from './types';

/** Mean Earth radius in metres (IUGG). */
const EARTH_RADIUS_M = 6371008.8;

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

/** Great-circle distance between two points, in metres. */
export function haversineM(a: LngLat, b: LngLat): number {
  const dLat = toRadians(b[1] - a[1]);
  const dLon = toRadians(b[0] - a[0]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(a[1])) * Math.cos(toRadians(b[1])) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Length of a line through the coordinates, in metres. */
export function lineLengthM(coordinates: LngLat[]): number {
  let total = 0;
  for (let i = 1; i < coordinates.length; i++) {
    total += haversineM(coordinates[i - 1]!, coordinates[i]!);
  }
  return total;
}

/**
 * Where a point falls along a line: the distance from the line's start to the nearest point on
 * it, and how far the point is from the line. Each segment is projected in a local flat frame,
 * which is accurate to well under a metre at Trail scale.
 */
export function locateAlongLine(
  coordinates: LngLat[],
  point: LngLat,
): { alongM: number; offsetM: number } {
  let best = { alongM: 0, offsetM: Number.POSITIVE_INFINITY };
  let walked = 0;
  for (let i = 1; i < coordinates.length; i++) {
    const a = coordinates[i - 1]!;
    const b = coordinates[i]!;
    const segmentM = haversineM(a, b);
    // Local equirectangular frame centred on a, in metres.
    const kx = Math.cos(toRadians(a[1])) * toRadians(1) * EARTH_RADIUS_M;
    const ky = toRadians(1) * EARTH_RADIUS_M;
    const bx = (b[0] - a[0]) * kx;
    const by = (b[1] - a[1]) * ky;
    const px = (point[0] - a[0]) * kx;
    const py = (point[1] - a[1]) * ky;
    const lengthSquared = bx * bx + by * by;
    const t = lengthSquared === 0 ? 0 : Math.max(0, Math.min(1, (px * bx + py * by) / lengthSquared));
    const offsetM = Math.hypot(px - t * bx, py - t * by);
    if (offsetM < best.offsetM) best = { alongM: walked + t * segmentM, offsetM };
    walked += segmentM;
  }
  if (coordinates.length === 1) best = { alongM: 0, offsetM: haversineM(coordinates[0]!, point) };
  return best;
}
