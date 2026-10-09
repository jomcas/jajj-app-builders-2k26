// Destination Pack content as GeoJSON for the Hike map's sources. Pure (type-only imports), so
// plain Node tests can check it. Works with whatever getPack returns: Trails without a usable
// line and Waypoints without a usable position are left out rather than breaking the map.

import type { Feature, FeatureCollection, LineString, Point } from 'geojson';

import type { DestinationPack, WaypointType } from '../../destination-pack';

type Position = [number, number];

export type TrailFeature = Feature<LineString, { trailId: string; name: string }>;
export type WaypointFeature = Feature<
  Point,
  { waypointId: string; trailId: string; type: WaypointType; name: string; position: number }
>;

export type PackGeoJSON = {
  trails: FeatureCollection<LineString, TrailFeature['properties']>;
  waypoints: FeatureCollection<Point, WaypointFeature['properties']>;
  /** [west, south, east, north] around the Trails and Waypoints, or null if there are none. */
  bounds: [number, number, number, number] | null;
};

const WAYPOINT_TYPES: readonly WaypointType[] = ['jump_off', 'campsite', 'water', 'summit'];

function isLngLat(value: unknown): value is Position {
  return (
    Array.isArray(value) &&
    value.length >= 2 &&
    Number.isFinite(value[0]) &&
    Number.isFinite(value[1]) &&
    Math.abs(value[0]) <= 180 &&
    Math.abs(value[1]) <= 90
  );
}

export function packToGeoJSON(pack: Pick<DestinationPack, 'trails' | 'waypoints'>): PackGeoJSON {
  const points: Position[] = [];

  const trails: TrailFeature[] = [];
  for (const trail of pack.trails) {
    const coordinates = (trail.geometry?.coordinates ?? [])
      .filter(isLngLat)
      .map(([lon, lat]): Position => [lon, lat]);
    if (coordinates.length < 2) continue;
    points.push(...coordinates);
    trails.push({
      type: 'Feature',
      id: trail.id,
      geometry: { type: 'LineString', coordinates },
      properties: { trailId: trail.id, name: trail.name },
    });
  }

  const waypoints: WaypointFeature[] = [];
  for (const waypoint of pack.waypoints) {
    const coordinates: Position = [waypoint.longitude, waypoint.latitude];
    if (!isLngLat(coordinates) || !WAYPOINT_TYPES.includes(waypoint.type)) continue;
    points.push(coordinates);
    waypoints.push({
      type: 'Feature',
      id: waypoint.id,
      geometry: { type: 'Point', coordinates },
      properties: {
        waypointId: waypoint.id,
        trailId: waypoint.trailId,
        type: waypoint.type,
        name: waypoint.name,
        position: waypoint.position,
      },
    });
  }

  return {
    trails: { type: 'FeatureCollection', features: trails },
    waypoints: { type: 'FeatureCollection', features: waypoints },
    bounds: boundsOf(points),
  };
}

function boundsOf(points: readonly Position[]): PackGeoJSON['bounds'] {
  if (points.length === 0) return null;
  let [west, south] = points[0];
  let [east, north] = points[0];
  for (const [lon, lat] of points) {
    west = Math.min(west, lon);
    east = Math.max(east, lon);
    south = Math.min(south, lat);
    north = Math.max(north, lat);
  }
  return [west, south, east, north];
}

/** The hiker's position as a one-point FeatureCollection for the GPS dot. */
export function positionToGeoJSON(
  position: { latitude: number; longitude: number } | null,
): FeatureCollection<Point> {
  if (!position || !isLngLat([position.longitude, position.latitude])) {
    return { type: 'FeatureCollection', features: [] };
  }
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [position.longitude, position.latitude] },
        properties: {},
      },
    ],
  };
}
