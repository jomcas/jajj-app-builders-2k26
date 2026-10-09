// Explore's display helpers and the online/offline Destination list.
import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { Destination, Trail, Waypoint } from '../src/modules/destination-pack/types.ts';
import { fill, formatBytes, formatDate, formatKm } from '../src/modules/explore/format.ts';
import { destinationRows, waypointGroups } from '../src/modules/explore/rows.ts';

function destination(id: string, name: string, packVersion = 1): Destination {
  return {
    id,
    name,
    region: 'Batangas',
    summary: { en: '', fil: '' },
    latitude: 14,
    longitude: 120,
    elevationM: null,
    packVersion,
    mapPath: `${id}.pmtiles`,
    mapBytes: 1,
    isPlaceholder: false,
  };
}

test('formatBytes uses decimal units', () => {
  assert.equal(formatBytes(0), '0 B');
  assert.equal(formatBytes(999), '999 B');
  assert.equal(formatBytes(850_000), '850 KB');
  assert.equal(formatBytes(4_207_071), '4.2 MB');
  assert.equal(formatBytes(3_413_361_504), '3.4 GB');
  assert.equal(formatBytes(Number.NaN), '–');
});

test('formatKm gives one decimal', () => {
  assert.equal(formatKm(3211), '3.2');
  assert.equal(formatKm(0), '0.0');
});

test('formatDate gives the calendar date', () => {
  assert.match(formatDate('2026-10-10T03:00:00.000Z'), /^2026-10-1[01]$/);
  assert.equal(formatDate('not a date'), 'not a date');
});

test('fill replaces known placeholders only', () => {
  assert.equal(fill('{done} of {total} {x}', { done: '1 MB', total: '4 MB' }), '1 MB of 4 MB {x}');
});

test('online: every catalog Destination, marked when downloaded', () => {
  const rows = destinationRows(
    [destination('talamitam', 'Mt. Talamitam'), destination('batulao', 'Mt. Batulao', 2)],
    [destination('batulao', 'Mt. Batulao', 1)],
  );
  assert.deepEqual(
    rows.map((row) => [row.destination.id, row.downloaded, row.destination.packVersion]),
    [
      ['batulao', true, 2],
      ['talamitam', false, 1],
    ],
  );
});

test('online: a downloaded Destination the catalog dropped still shows', () => {
  const rows = destinationRows([], [destination('batulao', 'Mt. Batulao')]);
  assert.deepEqual(rows.map((row) => [row.destination.id, row.downloaded]), [['batulao', true]]);
});

test('offline: only the downloaded Destinations', () => {
  assert.deepEqual(destinationRows(null, []), []);
  const rows = destinationRows(null, [destination('batulao', 'Mt. Batulao')]);
  assert.deepEqual(rows.map((row) => [row.destination.id, row.downloaded]), [['batulao', true]]);
});

test('Waypoints are grouped by Trail, in the pack Trail order', () => {
  const trail = (id: string, name: string): Trail => ({
    id,
    destinationId: 'batulao',
    name,
    distanceM: 3000,
    geometry: { type: 'LineString', coordinates: [] },
  });
  const waypoint = (id: string, trailId: string, position: number): Waypoint => ({
    id,
    trailId,
    type: position === 1 ? 'jump_off' : 'summit',
    name: position === 1 ? 'Jump-off' : 'Summit',
    latitude: 14,
    longitude: 120,
    elevationM: null,
    position,
    distanceM: 0,
  });
  const groups = waypointGroups({
    trails: [trail('batulao-new-trail', 'New Trail'), trail('batulao-old-trail', 'Old Trail'), trail('empty', 'Empty')],
    waypoints: [
      waypoint('n1', 'batulao-new-trail', 1),
      waypoint('n2', 'batulao-new-trail', 2),
      waypoint('o1', 'batulao-old-trail', 1),
      waypoint('o2', 'batulao-old-trail', 2),
      waypoint('x', 'gone', 1),
    ],
  });
  assert.deepEqual(
    groups.map((group) => [group.trailName, group.waypoints.map((w) => w.id)]),
    [
      ['New Trail', ['n1', 'n2']],
      ['Old Trail', ['o1', 'o2']],
      [null, ['x']],
    ],
  );
});
