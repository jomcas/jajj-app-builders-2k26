// Trail geometry: where a position is relative to a Trail line. Pure, no imports, tested under
// plain Node. Part of the hike module's public interface (see ../index.ts); #8's Deviation
// uses locateOnTrail for the off-Trail distance and the back-to-trail arrow.
//
// Maths: a local equirectangular projection centred on the Trail. At the scale of one Trail
// (a few km) it is within a fraction of a metre of the true geodesic distance, and it keeps
// segment projection simple and exact in the plane.

/** [longitude, latitude] in WGS 84, as in the pack's GeoJSON. */
export type LngLat = readonly [number, number];

export type LatLon = { latitude: number; longitude: number };

/** A Trail line ready for repeated lookups. Build once per Trail with prepareTrail. */
export type PreparedTrail = {
  /** The line's points, jump-off first. Points that repeat the previous one are dropped. */
  coordinates: readonly LngLat[];
  /** Planar x/y in metres around the projection origin, one per coordinate. */
  xy: readonly (readonly [number, number])[];
  /** Distance along the Trail at each coordinate, in metres. cumulativeM[0] is 0. */
  cumulativeM: readonly number[];
  /** Length of the whole line, in metres. */
  lengthM: number;
  /** Projection origin. */
  origin: { latRad: number; lonRad: number; cosLat: number };
};

export type TrailLocation = {
  /** Distance along the Trail from the jump-off to the nearest point, in metres. */
  distanceAlongM: number;
  /** Straight-line distance from the position to the nearest point on the Trail, in metres. */
  offTrailM: number;
  /** The nearest point on the Trail. */
  nearestPoint: LatLon;
  /**
   * Compass bearing from the position to the nearest point, in degrees clockwise from north
   * (0 to 360). null when the position is on the line (closer than 1 cm).
   */
  bearingToNearestDeg: number | null;
  /** Whether the nearest point is the very start or end of the line (the position is past it). */
  beyond: 'start' | 'end' | null;
  /** Index of the segment holding the nearest point (from coordinates[i] to [i + 1]). */
  segmentIndex: number;
  /** distanceAlongM / lengthM, 0 to 1. */
  fraction: number;
};

export type LocateOptions = {
  /**
   * Where the hiker was along the Trail last time, in metres. Where the Trail doubles back on
   * itself (switchbacks), several segments can be about as close; this picks the one nearest
   * this distance, so the position does not jump to the other leg.
   */
  nearAlongM?: number;
  /** How much further (in metres) a candidate may be than the closest and still win on nearAlongM. */
  toleranceM?: number;
};

/** Mean Earth radius in metres (IUGG). */
export const EARTH_RADIUS_M = 6371008.8;
const DEG = Math.PI / 180;
const DEFAULT_TOLERANCE_M = 20;

/** Great-circle (haversine) distance between two positions, in metres. */
export function distanceM(a: LatLon, b: LatLon): number {
  const dLat = (b.latitude - a.latitude) * DEG;
  const dLon = (b.longitude - a.longitude) * DEG;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.latitude * DEG) * Math.cos(b.latitude * DEG) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Initial compass bearing from a to b, degrees clockwise from north, 0 to 360. */
export function bearingDeg(a: LatLon, b: LatLon): number {
  const lat1 = a.latitude * DEG;
  const lat2 = b.latitude * DEG;
  const dLon = (b.longitude - a.longitude) * DEG;
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return (Math.atan2(y, x) / DEG + 360) % 360;
}

/** The point at a distance and compass bearing from a start point (spherical Earth). */
export function destinationPoint(start: LatLon, distance: number, bearing: number): LatLon {
  const delta = distance / EARTH_RADIUS_M;
  const theta = bearing * DEG;
  const lat1 = start.latitude * DEG;
  const lon1 = start.longitude * DEG;
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(delta) + Math.cos(lat1) * Math.sin(delta) * Math.cos(theta),
  );
  const lon2 =
    lon1 +
    Math.atan2(
      Math.sin(theta) * Math.sin(delta) * Math.cos(lat1),
      Math.cos(delta) - Math.sin(lat1) * Math.sin(lat2),
    );
  return { latitude: lat2 / DEG, longitude: ((lon2 / DEG + 540) % 360) - 180 };
}

function isLngLat(value: unknown): value is LngLat {
  return (
    Array.isArray(value) &&
    value.length >= 2 &&
    Number.isFinite(value[0]) &&
    Number.isFinite(value[1]) &&
    Math.abs(value[0]) <= 180 &&
    Math.abs(value[1]) <= 90
  );
}

/**
 * Prepares a Trail line ([longitude, latitude] pairs, jump-off first) for lookups. Invalid and
 * repeated points are dropped. Returns null if fewer than two distinct points remain.
 */
export function prepareTrail(line: readonly (readonly number[])[]): PreparedTrail | null {
  const coordinates: LngLat[] = [];
  for (const point of line) {
    if (!isLngLat(point)) continue;
    const last = coordinates[coordinates.length - 1];
    if (last && last[0] === point[0] && last[1] === point[1]) continue;
    coordinates.push([point[0], point[1]]);
  }
  if (coordinates.length < 2) return null;

  let latSum = 0;
  let lonSum = 0;
  for (const [lon, lat] of coordinates) {
    latSum += lat;
    lonSum += lon;
  }
  const latRad = (latSum / coordinates.length) * DEG;
  const lonRad = (lonSum / coordinates.length) * DEG;
  const origin = { latRad, lonRad, cosLat: Math.cos(latRad) };

  const xy = coordinates.map(([lon, lat]) => project(origin, lat, lon));
  const cumulativeM = [0];
  for (let i = 1; i < xy.length; i++) {
    cumulativeM.push(cumulativeM[i - 1] + Math.hypot(xy[i][0] - xy[i - 1][0], xy[i][1] - xy[i - 1][1]));
  }
  return { coordinates, xy, cumulativeM, lengthM: cumulativeM[cumulativeM.length - 1], origin };
}

function project(origin: PreparedTrail['origin'], latitude: number, longitude: number): [number, number] {
  return [
    EARTH_RADIUS_M * (longitude * DEG - origin.lonRad) * origin.cosLat,
    EARTH_RADIUS_M * (latitude * DEG - origin.latRad),
  ];
}

function unproject(origin: PreparedTrail['origin'], x: number, y: number): LatLon {
  return {
    latitude: (y / EARTH_RADIUS_M + origin.latRad) / DEG,
    longitude: (x / (EARTH_RADIUS_M * origin.cosLat) + origin.lonRad) / DEG,
  };
}

const prepared = new WeakMap<object, PreparedTrail | null>();

/** A PreparedTrail as is, or a raw line prepared once and cached. */
export function asPreparedTrail(trail: PreparedTrail | readonly (readonly number[])[]): PreparedTrail | null {
  if (!Array.isArray(trail)) return trail as PreparedTrail;
  if (!prepared.has(trail)) prepared.set(trail, prepareTrail(trail));
  return prepared.get(trail) ?? null;
}

/**
 * Where a position is relative to a Trail: how far along it the nearest point is, how far off
 * the Trail the position is, that nearest point, and the bearing to walk back to it. A
 * position before the start or after the end of the line snaps to that end (`beyond` says
 * which), and its off-Trail distance is the distance to that end.
 *
 * `trail` is a PreparedTrail or the raw [longitude, latitude] line. Returns null for a line
 * with fewer than two usable points.
 */
export function locateOnTrail(
  position: LatLon,
  trail: PreparedTrail | readonly (readonly number[])[],
  options: LocateOptions = {},
): TrailLocation | null {
  const line = asPreparedTrail(trail);
  if (!line) return null;
  const [px, py] = project(line.origin, position.latitude, position.longitude);

  type Candidate = { i: number; t: number; d: number; along: number };
  const candidates: Candidate[] = [];
  let best: Candidate | null = null;
  for (let i = 0; i < line.xy.length - 1; i++) {
    const [ax, ay] = line.xy[i];
    const [bx, by] = line.xy[i + 1];
    const dx = bx - ax;
    const dy = by - ay;
    const lengthSq = dx * dx + dy * dy;
    const t = lengthSq === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lengthSq));
    const d = Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
    const candidate = { i, t, d, along: line.cumulativeM[i] + t * Math.sqrt(lengthSq) };
    candidates.push(candidate);
    if (!best || d < best.d) best = candidate;
  }
  if (!best) return null;

  let chosen = best;
  if (options.nearAlongM !== undefined && Number.isFinite(options.nearAlongM)) {
    const hint = options.nearAlongM;
    const limit = best.d + (options.toleranceM ?? DEFAULT_TOLERANCE_M);
    for (const candidate of candidates) {
      if (candidate.d > limit) continue;
      if (Math.abs(candidate.along - hint) < Math.abs(chosen.along - hint)) chosen = candidate;
    }
  }

  const [ax, ay] = line.xy[chosen.i];
  const [bx, by] = line.xy[chosen.i + 1];
  const nearestPoint = unproject(line.origin, ax + chosen.t * (bx - ax), ay + chosen.t * (by - ay));
  const lastSegment = line.xy.length - 2;
  const beyond =
    chosen.i === 0 && chosen.t === 0 ? 'start' : chosen.i === lastSegment && chosen.t === 1 ? 'end' : null;

  return {
    distanceAlongM: chosen.along,
    offTrailM: chosen.d,
    nearestPoint,
    bearingToNearestDeg: chosen.d < 0.01 ? null : bearingDeg(position, nearestPoint),
    beyond,
    segmentIndex: chosen.i,
    fraction: line.lengthM > 0 ? chosen.along / line.lengthM : 0,
  };
}

/** The point at a distance along the Trail (clamped to its ends), and the local direction there. */
export function pointAlongTrail(
  trail: PreparedTrail,
  alongM: number,
): { point: LatLon; bearingDeg: number } {
  const target = Math.max(0, Math.min(trail.lengthM, alongM));
  let i = 0;
  // Last segment whose start is at or before the target; skips zero-length segments.
  while (i < trail.cumulativeM.length - 2 && trail.cumulativeM[i + 1] <= target) i++;
  const segment = trail.cumulativeM[i + 1] - trail.cumulativeM[i];
  const t = segment > 0 ? (target - trail.cumulativeM[i]) / segment : 0;
  const [ax, ay] = trail.xy[i];
  const [bx, by] = trail.xy[i + 1];
  const point = unproject(trail.origin, ax + t * (bx - ax), ay + t * (by - ay));
  // atan2(east, north) gives the compass bearing in the plane.
  const bearing = (Math.atan2(bx - ax, by - ay) / DEG + 360) % 360;
  return { point, bearingDeg: bearing };
}
