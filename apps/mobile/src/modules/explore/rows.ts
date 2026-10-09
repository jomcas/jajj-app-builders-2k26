// What the Explore list shows. Pure, type-only imports, tested under plain Node.

import type { Destination, DestinationPack, Waypoint } from '../destination-pack';

export type DestinationRow = {
  destination: Destination;
  /** A complete pack is on the phone. */
  downloaded: boolean;
};

/**
 * Online (catalog is a list): every catalog Destination, marked if it is downloaded, plus any
 * downloaded one the catalog no longer lists. Offline (catalog is null): the downloaded
 * Destinations only. Sorted by name.
 */
export function destinationRows(
  catalog: readonly Destination[] | null,
  downloaded: readonly Destination[],
): DestinationRow[] {
  const downloadedIds = new Set(downloaded.map((destination) => destination.id));
  const rows = new Map<string, DestinationRow>();
  for (const destination of downloaded) rows.set(destination.id, { destination, downloaded: true });
  // The catalog entry wins: it carries the latest pack version, which shows an update.
  for (const destination of catalog ?? []) {
    rows.set(destination.id, { destination, downloaded: downloadedIds.has(destination.id) });
  }
  return [...rows.values()].sort((a, b) => a.destination.name.localeCompare(b.destination.name));
}

export type WaypointGroup = { trailId: string; trailName: string | null; waypoints: Waypoint[] };

/**
 * The pack's Waypoints grouped by Trail, in the pack's Trail order, so a jump-off or summit
 * shared by two Trails shows once under each Trail's name rather than twice in one list.
 * Waypoints of a Trail the pack doesn't list come last, without a name. Empty groups are left out.
 */
export function waypointGroups(pack: Pick<DestinationPack, 'trails' | 'waypoints'>): WaypointGroup[] {
  const groups: WaypointGroup[] = pack.trails.map((trail) => ({
    trailId: trail.id,
    trailName: trail.name,
    waypoints: pack.waypoints.filter((waypoint) => waypoint.trailId === trail.id),
  }));
  const known = new Set(pack.trails.map((trail) => trail.id));
  const others = pack.waypoints.filter((waypoint) => !known.has(waypoint.trailId));
  if (others.length > 0) groups.push({ trailId: '', trailName: null, waypoints: others });
  return groups.filter((group) => group.waypoints.length > 0);
}
