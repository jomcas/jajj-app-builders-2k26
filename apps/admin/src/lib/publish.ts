// Publishing a Destination Pack: what the portal writes so phones download the new version,
// and what changed since the last publish.
//
// Phones compare the catalog's pack_version with the one they downloaded and download the pack
// again when it is higher (apps/mobile/src/modules/explore/DestinationScreen.tsx). Publishing
// therefore bumps pack_version, and points map_path/map_bytes at a new map file when there is
// one. Map files get a new path per version, so a phone never mixes an old file with a new size.

import type { DestinationRow, PackContent } from './types';

export type MapUpload = { path: string; bytes: number };

export type PublishPayload = {
  /** The update for the Destination row. */
  update: {
    pack_version: number;
    updated_at: string;
    map_path?: string;
    map_bytes?: number;
  };
  /** Only update when the row still has this version, so two publishes never collide. */
  expectedVersion: number;
};

/** Where a Destination's map file for a given pack version goes in the 'maps' bucket. */
export function mapPathFor(destinationId: string, packVersion: number): string {
  return `${destinationId}-v${packVersion}.pmtiles`;
}

export function buildPublishPayload(
  destination: Pick<DestinationRow, 'pack_version'>,
  map: MapUpload | null,
  now: Date,
): PublishPayload {
  if (map && !(map.bytes > 0)) throw new Error('The map file is empty.');
  return {
    update: {
      pack_version: destination.pack_version + 1,
      updated_at: now.toISOString(),
      ...(map ? { map_path: map.path, map_bytes: map.bytes } : {}),
    },
    expectedVersion: destination.pack_version,
  };
}

// Snapshots and changes -----------------------------------------------------------------------

/** A pack's content without updated_at, which changes on every save and says nothing. */
export type PackSnapshot = {
  destination: Record<string, unknown>;
  trails: Record<string, unknown>[];
  waypoints: Record<string, unknown>[];
  passages: Record<string, unknown>[];
};

const IGNORED = new Set(['updated_at', 'pack_version']);

function strip(row: object): Record<string, unknown> {
  return Object.fromEntries(Object.entries(row).filter(([key]) => !IGNORED.has(key)));
}

export function packSnapshot(content: PackContent): PackSnapshot {
  return {
    destination: strip(content.destination),
    trails: content.trails.map(strip),
    waypoints: content.waypoints.map(strip),
    passages: content.passages.map(strip),
  };
}

export type ContentKind = 'Destination' | 'Trail' | 'Waypoint' | 'Reference passage';

export type Change = {
  kind: ContentKind;
  id: string;
  name: string;
  change: 'added' | 'removed' | 'changed';
  /** For a change: the columns that differ. */
  fields?: string[];
};

/** What differs between the last published snapshot and the content now. */
export function diffPacks(previous: PackSnapshot, current: PackSnapshot): Change[] {
  return [
    ...diffRows('Destination', [previous.destination], [current.destination]),
    ...diffRows('Trail', previous.trails, current.trails),
    ...diffRows('Waypoint', previous.waypoints, current.waypoints),
    ...diffRows('Reference passage', previous.passages, current.passages),
  ];
}

function diffRows(
  kind: ContentKind,
  previous: Record<string, unknown>[],
  current: Record<string, unknown>[],
): Change[] {
  const before = new Map(previous.map((row) => [String(row.id), row]));
  const after = new Map(current.map((row) => [String(row.id), row]));
  const changes: Change[] = [];
  for (const [id, row] of after) {
    const old = before.get(id);
    if (!old) {
      changes.push({ kind, id, name: label(row), change: 'added' });
      continue;
    }
    const fields = [...new Set([...Object.keys(old), ...Object.keys(row)])].filter(
      (key) => !IGNORED.has(key) && stableJson(old[key]) !== stableJson(row[key]),
    );
    if (fields.length > 0) changes.push({ kind, id, name: label(row), change: 'changed', fields });
  }
  for (const [id, row] of before) {
    if (!after.has(id)) changes.push({ kind, id, name: label(row), change: 'removed' });
  }
  return changes;
}

function label(row: Record<string, unknown>): string {
  return String(row.name ?? row.topic ?? row.id);
}

/** JSON with object keys sorted, so jsonb read back in another key order compares equal. */
function stableJson(value: unknown): string {
  return JSON.stringify(value ?? null, (_, v: unknown) =>
    v && typeof v === 'object' && !Array.isArray(v)
      ? Object.fromEntries(Object.entries(v as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)))
      : v,
  );
}
