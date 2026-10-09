import { describe, expect, it } from 'vitest';
import { buildPublishPayload, diffPacks, mapPathFor, packSnapshot } from '../src/lib/publish';
import type { PackContent } from '../src/lib/types';

const content: PackContent = {
  destination: {
    id: 'test-destination',
    name: 'Test Destination',
    region: 'Itogon, Benguet',
    summary_en: 'A test.',
    summary_fil: 'Isang pagsubok.',
    latitude: 16.3,
    longitude: 120.64,
    elevation_m: null,
    pack_version: 3,
    map_path: 'test-destination-v1.pmtiles',
    map_bytes: 1000,
    is_placeholder: false,
    updated_at: '2026-10-10T00:00:00Z',
  },
  trails: [
    {
      id: 'test-trail',
      destination_id: 'test-destination',
      name: 'Test Trail',
      name_fil: null,
      distance_m: 1600,
      geometry: { type: 'LineString', coordinates: [[120.645, 16.31], [120.638, 16.299]] },
      updated_at: '2026-10-10T00:00:00Z',
    },
  ],
  waypoints: [
    {
      id: 'test-trail-jump-off',
      trail_id: 'test-trail',
      type: 'jump_off',
      name: 'Jump-off',
      name_fil: null,
      note: null,
      latitude: 16.31,
      longitude: 120.645,
      elevation_m: null,
      position: 1,
      distance_m: 0,
    },
  ],
  passages: [],
};

describe('buildPublishPayload', () => {
  const now = new Date('2026-10-10T08:00:00Z');

  it('bumps pack_version and updated_at, guarded by the current version', () => {
    expect(buildPublishPayload(content.destination, null, now)).toEqual({
      update: { pack_version: 4, updated_at: '2026-10-10T08:00:00.000Z' },
      expectedVersion: 3,
    });
  });

  it('points the Destination at a new map file when one is uploaded', () => {
    const map = { path: mapPathFor('test-destination', 4), bytes: 2048 };
    expect(map.path).toBe('test-destination-v4.pmtiles');
    expect(buildPublishPayload(content.destination, map, now).update).toEqual({
      pack_version: 4,
      updated_at: '2026-10-10T08:00:00.000Z',
      map_path: 'test-destination-v4.pmtiles',
      map_bytes: 2048,
    });
  });

  it('refuses an empty map file', () => {
    expect(() => buildPublishPayload(content.destination, { path: 'x.pmtiles', bytes: 0 }, now)).toThrow(/empty/);
  });
});

describe('diffPacks', () => {
  it('finds nothing when only updated_at and pack_version moved', () => {
    const later = {
      ...content,
      destination: { ...content.destination, pack_version: 4, updated_at: '2026-10-11T00:00:00Z' },
      trails: content.trails.map((trail) => ({ ...trail, updated_at: '2026-10-11T00:00:00Z' })),
    };
    expect(diffPacks(packSnapshot(content), packSnapshot(later))).toEqual([]);
  });

  it('lists added, changed and removed rows by kind', () => {
    const later: PackContent = {
      ...content,
      destination: { ...content.destination, summary_en: 'A better test.' },
      trails: [{ ...content.trails[0]!, geometry: { type: 'LineString', coordinates: [[120.645, 16.31], [120.637, 16.298]] } }],
      waypoints: [],
      passages: [
        {
          id: 'test-destination-fees-en',
          destination_id: 'test-destination',
          topic: 'fees',
          language: 'en',
          text: 'Fees.',
          source: 'Test',
          sources: null,
          as_of: null,
        },
      ],
    };
    expect(diffPacks(packSnapshot(content), packSnapshot(later))).toEqual([
      { kind: 'Destination', id: 'test-destination', name: 'Test Destination', change: 'changed', fields: ['summary_en'] },
      { kind: 'Trail', id: 'test-trail', name: 'Test Trail', change: 'changed', fields: ['geometry'] },
      { kind: 'Waypoint', id: 'test-trail-jump-off', name: 'Jump-off', change: 'removed' },
      { kind: 'Reference passage', id: 'test-destination-fees-en', name: 'fees', change: 'added' },
    ]);
  });

  it('treats jsonb read back with another key order as unchanged', () => {
    const snapshot = packSnapshot(content);
    const reordered = JSON.parse(JSON.stringify(snapshot)) as typeof snapshot;
    reordered.trails[0]!.geometry = { coordinates: [[120.645, 16.31], [120.638, 16.299]], type: 'LineString' };
    expect(diffPacks(snapshot, reordered)).toEqual([]);
  });
});
