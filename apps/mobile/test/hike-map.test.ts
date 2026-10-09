// The Hike map's pure parts: the style builder (theme -> colours and layers, nothing remote),
// Destination Pack -> GeoJSON sources, and which downloaded pack the Hike tab shows.
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

import type { DestinationPack, Trail, Waypoint } from '../src/modules/destination-pack/types.ts';
import { pickLatestPack, samePack } from '../src/modules/hike/latestPack.ts';
import { packToGeoJSON, positionToGeoJSON } from '../src/modules/hike/map/geojson.ts';
import {
  ATTRIBUTION,
  FONT_IDS,
  buildMapStyle,
  gpsLayers,
  hikeFlavor,
  trailLayers,
  waypointLayer,
} from '../src/modules/hike/map/mapStyle.ts';
import { palettes, type ThemeMode } from '../src/theme/tokens.ts';

const MODES: ThemeMode[] = ['day', 'night'];
const MAP_FILE = 'file:///data/user/0/com.tahak.app/files/destination-packs/batulao/map.pmtiles';
const ASSETS_DIR = join(import.meta.dirname, '..', 'assets', 'map');

/** Every string anywhere in a JSON value. */
function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings);
  return [];
}

/** Every value of a given key anywhere in a JSON value. */
function valuesOf(value: unknown, key: string): unknown[] {
  if (Array.isArray(value)) return value.flatMap((item) => valuesOf(item, key));
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([k, v]) => (k === key ? [v] : valuesOf(v, key)));
  }
  return [];
}

for (const mode of MODES) {
  const style = buildMapStyle({ mode, mapFileUri: MAP_FILE });

  test(`${mode} style: nothing loads from the network`, () => {
    const all = strings(style).concat(strings(trailLayers(palettes[mode]))).concat(
      strings(waypointLayer(palettes[mode])),
    );
    for (const value of all) {
      assert.doesNotMatch(value, /https?:|\/\/[a-z0-9.-]+\.[a-z]{2,}\//i, `remote URL: ${value}`);
      if (/^[a-z]+:\/\//.test(value)) {
        assert.match(value, /^(asset:\/\/map\/|pmtiles:\/\/file:\/\/)/, `not local: ${value}`);
      }
    }
    assert.equal(style.glyphs, 'asset://map/glyphs/{fontstack}/{range}.pbf');
    assert.deepEqual(style.sources.protomaps, {
      type: 'vector',
      url: `pmtiles://${MAP_FILE}`,
      attribution: ATTRIBUTION,
    });
  });

  test(`${mode} style: uses the ${mode === 'day' ? 'light' : 'dark'} Protomaps layers`, () => {
    assert.equal(style.version, 8);
    assert.ok(style.layers.length > 50, 'expected the full Protomaps basemap');
    assert.ok(style.layers.every((layer) => layer.type === 'background' || 'source' in layer));
    const earth = style.layers.find((layer) => layer.id === 'earth');
    assert.equal(
      (earth as { paint: Record<string, unknown> }).paint['fill-color'],
      hikeFlavor(mode).earth,
    );
  });

  test(`${mode} style: every font and sprite it names is bundled`, () => {
    const fonts = new Set(
      [...valuesOf(style.layers, 'text-font'), waypointLayer(palettes[mode]).layout?.['text-font']]
        .flatMap(strings)
        .filter((value) => /^noto-sans-/.test(value) || /^Noto Sans/.test(value)),
    );
    assert.ok(fonts.size > 0);
    for (const font of fonts) {
      assert.ok(Object.values(FONT_IDS).includes(font as never), `font not bundled: ${font}`);
      assert.ok(existsSync(join(ASSETS_DIR, 'glyphs', font, '0-255.pbf')), `no glyphs for ${font}`);
    }
    assert.ok(Array.isArray(style.sprite));
    for (const sprite of style.sprite as { id: string; url: string }[]) {
      const base = join(ASSETS_DIR, sprite.url.replace('asset://map/', ''));
      for (const suffix of ['.json', '.png', '@2x.json', '@2x.png']) {
        assert.ok(existsSync(base + suffix), `missing ${sprite.url}${suffix}`);
      }
    }
  });

  test(`${mode} style: every Waypoint type has a pin in the tahak sprite`, () => {
    const sprite = (style.sprite as { id: string; url: string }[]).find((s) => s.id === 'tahak');
    assert.equal(sprite?.url, `asset://map/sprites/tahak-${mode}`);
    for (const suffix of ['.json', '@2x.json']) {
      const index = JSON.parse(readFileSync(join(ASSETS_DIR, `sprites/tahak-${mode}${suffix}`), 'utf8'));
      for (const type of ['jump_off', 'campsite', 'water', 'summit']) {
        assert.ok(index[`waypoint-${type}`], `no pin for ${type} in tahak-${mode}${suffix}`);
      }
    }
    assert.deepEqual(waypointLayer(palettes[mode]).layout?.['icon-image'], [
      'concat',
      'tahak:waypoint-',
      ['get', 'type'],
    ]);
  });

  test(`${mode} flavor: no red or pink POI text (red means danger only)`, () => {
    const pois = hikeFlavor(mode).pois;
    assert.ok(pois);
    assert.notEqual(pois.red.toUpperCase(), '#F2567A');
    assert.notEqual(pois.pink.toUpperCase(), '#EF56BA');
  });
}

test('the Trail line uses the plan colours: orange over a dark outline', () => {
  const expected = {
    day: { line: '#D9661F', outline: '#3B1F0E' },
    night: { line: '#FF8A3D', outline: '#2A1406' },
  };
  for (const mode of MODES) {
    const [outline, line] = trailLayers(palettes[mode]);
    assert.equal(outline.type, 'line');
    assert.equal(outline.paint?.['line-color'], expected[mode].outline);
    assert.equal(line.paint?.['line-color'], expected[mode].line);
    assert.equal(line.paint?.['line-dasharray'], undefined);
  }
});

test('the dashed Trail variant (for a Deviation) dashes the line, not the outline', () => {
  const [outline, line] = trailLayers(palettes.day, { dashed: true });
  assert.ok(Array.isArray(line.paint?.['line-dasharray']));
  assert.equal(outline.paint?.['line-dasharray'], undefined);
  assert.equal(line.paint?.['line-color'], '#D9661F');
});

test('the GPS dot is blue: #1A6FD6 by day, #5AA9FF at night', () => {
  assert.equal(gpsLayers(palettes.day)[1].paint?.['circle-color'], '#1A6FD6');
  assert.equal(gpsLayers(palettes.night)[1].paint?.['circle-color'], '#5AA9FF');
});

function trail(id: string, coordinates: [number, number][]): Trail {
  return {
    id,
    destinationId: 'batulao',
    name: `Trail ${id}`,
    distanceM: 1000,
    geometry: { type: 'LineString', coordinates },
  };
}

function waypoint(id: string, type: Waypoint['type'], longitude: number, latitude: number): Waypoint {
  return {
    id,
    trailId: 'a',
    type,
    name: `Waypoint ${id}`,
    latitude,
    longitude,
    elevationM: null,
    position: 1,
    distanceM: 0,
  };
}

test('pack -> GeoJSON: Trails as lines, Waypoints as typed points, with bounds', () => {
  const geojson = packToGeoJSON({
    trails: [
      trail('a', [
        [120.81, 14.06],
        [120.8, 14.04],
      ]),
    ],
    waypoints: [waypoint('w1', 'jump_off', 120.81, 14.06), waypoint('w2', 'water', 120.79, 14.05)],
  });
  assert.equal(geojson.trails.features.length, 1);
  assert.deepEqual(geojson.trails.features[0].geometry.coordinates, [
    [120.81, 14.06],
    [120.8, 14.04],
  ]);
  assert.deepEqual(geojson.trails.features[0].properties, { trailId: 'a', name: 'Trail a' });
  assert.deepEqual(
    geojson.waypoints.features.map((f) => [f.properties.type, f.geometry.coordinates]),
    [
      ['jump_off', [120.81, 14.06]],
      ['water', [120.79, 14.05]],
    ],
  );
  assert.deepEqual(geojson.bounds, [120.79, 14.04, 120.81, 14.06]);
});

test('pack -> GeoJSON: skips unusable Trails and Waypoints instead of failing', () => {
  const geojson = packToGeoJSON({
    trails: [
      trail('short', [[120.8, 14.0]]),
      trail('bad', [
        [Number.NaN, 14],
        [500, 14],
      ]),
      { ...trail('none', []), geometry: undefined as never },
    ],
    waypoints: [
      waypoint('nan', 'summit', Number.NaN, 14),
      waypoint('odd', 'viewpoint' as never, 120.8, 14),
    ],
  });
  assert.equal(geojson.trails.features.length, 0);
  assert.equal(geojson.waypoints.features.length, 0);
  assert.equal(geojson.bounds, null);
});

test('position -> GeoJSON: one point, or none without a fix', () => {
  assert.deepEqual(positionToGeoJSON(null).features, []);
  assert.deepEqual(positionToGeoJSON({ latitude: 14.04, longitude: 120.8 }).features[0].geometry, {
    type: 'Point',
    coordinates: [120.8, 14.04],
  });
});

function pack(id: string, name: string, downloadedAt: string): DestinationPack {
  return {
    destination: {
      id,
      name,
      region: '',
      summary: { en: '', fil: '' },
      latitude: 14,
      longitude: 120,
      elevationM: null,
      packVersion: 1,
      mapPath: `${id}.pmtiles`,
      mapBytes: 1,
      isPlaceholder: false,
    },
    trails: [],
    waypoints: [],
    passages: [],
    mapFileUri: `file:///packs/${id}/map.pmtiles`,
    downloadedAt,
  };
}

test('the Hike tab shows the most recently downloaded pack', () => {
  const batulao = pack('batulao', 'Mt. Batulao', '2026-10-10T01:00:00.000Z');
  const talamitam = pack('talamitam', 'Mt. Talamitam', '2026-10-10T02:00:00.000Z');
  assert.equal(pickLatestPack([batulao, null, talamitam])?.destination.id, 'talamitam');
  assert.equal(pickLatestPack([talamitam, batulao])?.destination.id, 'talamitam');
  assert.equal(pickLatestPack([]), null);
  assert.equal(pickLatestPack([null]), null);
  const broken = pack('broken', 'A broken date', 'not a date');
  assert.equal(pickLatestPack([broken, batulao])?.destination.id, 'batulao');
  assert.equal(pickLatestPack([broken])?.destination.id, 'broken');
});

test('samePack compares what the map shows', () => {
  const a = pack('batulao', 'Mt. Batulao', '2026-10-10T01:00:00.000Z');
  assert.ok(samePack(a, { ...a }));
  assert.ok(!samePack(a, { ...a, downloadedAt: '2026-10-11T01:00:00.000Z' }));
  assert.ok(!samePack(a, null));
  assert.ok(samePack(null, null));
});
