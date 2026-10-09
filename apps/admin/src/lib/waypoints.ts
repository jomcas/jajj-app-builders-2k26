// A Trail's Waypoint list: ordering, ids, and how to save a reordered list.
//
// waypoints has unique (trail_id, position), checked row by row, so rewriting positions in
// place can collide halfway (moving 2 → 1 while 1 still exists). Saving goes in two steps:
// every Waypoint first moves to a temporary position far above the real ones, then to its
// final position 1..n. Neither step can collide, and a list left at the first step still has
// the right order.

import { slugify } from './validate';
import type { WaypointRow } from './types';

/** Added to positions during a save; real Trails have far fewer Waypoints than this. */
export const STAGING_OFFSET = 100000;

/** Moves the item at index by delta places, clamped to the list. Returns a new list. */
export function move<T>(list: readonly T[], index: number, delta: number): T[] {
  const target = Math.max(0, Math.min(list.length - 1, index + delta));
  const next = [...list];
  const [item] = next.splice(index, 1);
  if (item !== undefined) next.splice(target, 0, item);
  return next;
}

/** The list ordered by distance along the Trail, keeping the current order for ties. */
export function sortByDistance<T extends { distance_m: number }>(list: readonly T[]): T[] {
  return list
    .map((item, i) => ({ item, i }))
    .sort((a, b) => a.item.distance_m - b.item.distance_m || a.i - b.i)
    .map(({ item }) => item);
}

/** An id like 'ulap-eco-trail-summit' that is not taken yet. */
export function waypointId(trailId: string, name: string, type: string, taken: ReadonlySet<string>): string {
  const base = `${trailId}-${slugify(name) || slugify(type)}`;
  let id = base;
  for (let n = 2; taken.has(id); n++) id = `${base}-${n}`;
  return id;
}

export type WaypointSavePlan = {
  /** Waypoints that were on the Trail and are no longer in the list. */
  deleteIds: string[];
  /** Step 1: every Waypoint in the list, at a temporary position. */
  staged: Omit<WaypointRow, 'updated_at'>[];
  /** Step 2: every Waypoint in the list at its final position, 1..n in list order. */
  final: Omit<WaypointRow, 'updated_at'>[];
};

export function planWaypointSave(
  trailId: string,
  savedIds: readonly string[],
  list: readonly Omit<WaypointRow, 'updated_at' | 'position' | 'trail_id'>[],
): WaypointSavePlan {
  const kept = new Set(list.map((waypoint) => waypoint.id));
  if (kept.size !== list.length) throw new Error('Two Waypoints have the same id.');
  return {
    deleteIds: savedIds.filter((id) => !kept.has(id)),
    staged: list.map((waypoint, i) => ({ ...waypoint, trail_id: trailId, position: STAGING_OFFSET + i + 1 })),
    final: list.map((waypoint, i) => ({ ...waypoint, trail_id: trailId, position: i + 1 })),
  };
}
