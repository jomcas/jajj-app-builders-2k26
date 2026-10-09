// The pack store against a fake filesystem and a fake catalog, the download progress maths,
// and the Supabase catalog against a fake fetch.
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { createCatalog, type Catalog } from '../src/modules/destination-pack/catalog.ts';
import {
  createPackStore,
  packProgress,
  progressPercent,
  type PackFiles,
} from '../src/modules/destination-pack/store.ts';
import type { Destination, DownloadState, PackContent } from '../src/modules/destination-pack/types.ts';

// --- Fakes -----------------------------------------------------------------------------------

/** An in-memory folder tree. Downloads write `size` bytes in chunks of `chunk`. */
function fakeFiles(options: { sizes?: Record<string, number>; chunk?: number; failAfter?: number } = {}) {
  const files = new Map<string, string>();
  const dirs = new Set<string>(['']);
  const parent = (path: string) => (path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : '');
  const under = (path: string, root: string) => path === root || path.startsWith(`${root}/`);

  const api: PackFiles = {
    async readText(path) {
      return files.get(path) ?? null;
    },
    async writeText(path, text) {
      assert.ok(dirs.has(parent(path)), `writeText into a missing folder: ${path}`);
      files.set(path, text);
    },
    async listDirectories(path) {
      if (!dirs.has(path)) return [];
      return [...dirs].filter((dir) => dir !== '' && parent(dir) === path).map((dir) => dir.split('/').pop()!);
    },
    async makeDirectory(path) {
      for (let p = path; p !== ''; p = parent(p)) dirs.add(p);
    },
    async remove(path) {
      for (const key of [...files.keys()]) if (under(key, path)) files.delete(key);
      for (const dir of [...dirs]) if (dir !== '' && under(dir, path)) dirs.delete(dir);
    },
    async move(from, to) {
      assert.ok(dirs.has(from), `move from a missing folder: ${from}`);
      assert.ok(!dirs.has(to) && ![...files.keys()].some((k) => under(k, to)), `move onto an existing path: ${to}`);
      for (const [key, value] of [...files]) {
        if (under(key, from)) {
          files.delete(key);
          files.set(to + key.slice(from.length), value);
        }
      }
      for (const dir of [...dirs]) {
        if (dir !== '' && under(dir, from)) {
          dirs.delete(dir);
          dirs.add(to + dir.slice(from.length));
        }
      }
    },
    async download(url, path, onProgress) {
      assert.ok(dirs.has(parent(path)), `download into a missing folder: ${path}`);
      const size = options.sizes?.[url];
      if (size === undefined) throw new Error(`404 ${url}`);
      const chunk = options.chunk ?? size;
      for (let written = chunk; ; written += chunk) {
        const now = Math.min(written, size);
        if (options.failAfter !== undefined && now > options.failAfter) throw new Error('Network lost');
        files.set(path, `${now} bytes from ${url}`);
        onProgress(now, size);
        if (now >= size) break;
      }
    },
    uri: (path) => `file:///data/packs/${path}`,
  };
  return { api, files, dirs };
}

function destination(overrides: Partial<Destination> = {}): Destination {
  return {
    id: 'batulao',
    name: 'Mt. Batulao',
    region: 'Nasugbu, Batangas',
    summary: { en: 'Sample', fil: 'Sample na' },
    latitude: 14.04,
    longitude: 120.8,
    elevationM: 811,
    packVersion: 1,
    mapPath: 'batulao.pmtiles',
    mapBytes: 4000,
    isPlaceholder: true,
    ...overrides,
  };
}

function content(dest: Destination): PackContent {
  return {
    destination: dest,
    trails: [
      {
        id: `${dest.id}-old-trail`,
        destinationId: dest.id,
        name: 'Old Trail',
        distanceM: 3211,
        geometry: { type: 'LineString', coordinates: [[120.81, 14.05], [120.80, 14.04]] },
      },
    ],
    waypoints: [
      {
        id: `${dest.id}-summit`,
        trailId: `${dest.id}-old-trail`,
        type: 'summit',
        name: 'Summit',
        latitude: 14.04,
        longitude: 120.8,
        elevationM: 811,
        position: 1,
        distanceM: 3204,
      },
    ],
    passages: [
      { id: `${dest.id}-water-en`, destinationId: dest.id, topic: 'water', language: 'en', text: 'Water', source: 'test' },
    ],
  };
}

function fakeCatalog(byId: Record<string, Destination>, options: { contentBytes?: number; failContent?: boolean } = {}) {
  let contentCalls = 0;
  const catalog: Catalog = {
    async listDestinations() {
      return Object.values(byId);
    },
    async fetchContent(id) {
      contentCalls += 1;
      if (options.failContent) throw new Error('Network request failed');
      const dest = byId[id];
      if (!dest) throw new Error(`No Destination "${id}".`);
      return { content: content(dest), bytes: options.contentBytes ?? 1000 };
    },
    mapUrl: (path) => `https://maps.test/${path}`,
  };
  return { catalog, contentCalls: () => contentCalls };
}

const NOW = () => new Date('2026-10-10T03:00:00.000Z');

// --- Progress maths --------------------------------------------------------------------------

describe('packProgress', () => {
  test('before the content arrives, only the expected map size is known', () => {
    assert.deepEqual(packProgress({ contentBytes: null, mapBytesWritten: 0, mapBytesTotal: 4000 }), {
      bytesDone: 0,
      bytesTotal: 4000,
      fraction: 0,
    });
  });

  test('the content counts as done once it has arrived, then the map bytes add up', () => {
    assert.deepEqual(packProgress({ contentBytes: 1000, mapBytesWritten: 0, mapBytesTotal: 4000 }), {
      bytesDone: 1000,
      bytesTotal: 5000,
      fraction: 0.2,
    });
    assert.deepEqual(packProgress({ contentBytes: 1000, mapBytesWritten: 2000, mapBytesTotal: 4000 }), {
      bytesDone: 3000,
      bytesTotal: 5000,
      fraction: 0.6,
    });
    assert.equal(packProgress({ contentBytes: 1000, mapBytesWritten: 4000, mapBytesTotal: 4000 }).fraction, 1);
  });

  test('a map larger than expected grows the total instead of passing 100%', () => {
    const progress = packProgress({ contentBytes: 0, mapBytesWritten: 5000, mapBytesTotal: 4000 });
    assert.deepEqual(progress, { bytesDone: 5000, bytesTotal: 5000, fraction: 1 });
  });

  test('nothing to download is 0, not NaN', () => {
    assert.equal(packProgress({ contentBytes: null, mapBytesWritten: 0, mapBytesTotal: 0 }).fraction, 0);
    assert.equal(packProgress({ contentBytes: null, mapBytesWritten: -5, mapBytesTotal: -1 }).fraction, 0);
  });

  test('progressPercent rounds down, so 100% means every byte is in', () => {
    assert.equal(progressPercent({ bytesDone: 9999, bytesTotal: 10000, fraction: 0.9999 }), 99);
    assert.equal(progressPercent({ bytesDone: 10000, bytesTotal: 10000, fraction: 1 }), 100);
    assert.equal(progressPercent({ bytesDone: 0, bytesTotal: 0, fraction: 0 }), 0);
    assert.equal(progressPercent({ bytesDone: 0, bytesTotal: 0, fraction: 1.5 }), 100);
  });
});

// --- Pack store ------------------------------------------------------------------------------

describe('pack store', () => {
  test('downloads a pack, then reads it back offline with the map file path', async () => {
    const dest = destination();
    const fs = fakeFiles({ sizes: { 'https://maps.test/batulao.pmtiles': 4000 }, chunk: 1000 });
    const { catalog } = fakeCatalog({ batulao: dest });
    const store = createPackStore({ files: fs.api, catalog, now: NOW });

    assert.equal(await store.getPack('batulao'), null);
    assert.deepEqual(await store.listDownloaded(), []);

    const pack = await store.downloadPack(dest);
    assert.equal(pack.mapFileUri, 'file:///data/packs/batulao/map.pmtiles');
    assert.equal(pack.downloadedAt, '2026-10-10T03:00:00.000Z');
    assert.equal(fs.files.get('batulao/map.pmtiles'), '4000 bytes from https://maps.test/batulao.pmtiles');

    // A fresh store over the same files (an app restart in airplane mode) sees the same pack.
    const offline = createPackStore({
      files: fs.api,
      catalog: fakeCatalog({}, { failContent: true }).catalog,
    });
    const read = await offline.getPack('batulao');
    assert.deepEqual(read, pack);
    assert.equal(read?.trails[0].geometry.coordinates.length, 2);
    assert.equal(read?.waypoints[0].type, 'summit');
    assert.equal(read?.passages[0].language, 'en');
    assert.deepEqual((await offline.listDownloaded()).map((d) => d.id), ['batulao']);
    // No leftovers from the download.
    assert.deepEqual(await fs.api.listDirectories(''), ['batulao']);
  });

  test('reports progress that only goes up and ends idle', async () => {
    const dest = destination();
    const fs = fakeFiles({ sizes: { 'https://maps.test/batulao.pmtiles': 4000 }, chunk: 1000 });
    const store = createPackStore({ files: fs.api, catalog: fakeCatalog({ batulao: dest }).catalog });
    const seen: DownloadState[] = [];
    const unsubscribe = store.subscribe(() => seen.push(store.getDownloadState('batulao')));

    await store.downloadPack(dest);
    unsubscribe();

    const fractions = seen.flatMap((state) => (state.status === 'downloading' ? [state.progress.fraction] : []));
    assert.deepEqual(fractions, [0, 0.2, 0.4, 0.6, 0.8, 1]);
    assert.deepEqual(seen.at(-1), { status: 'idle' });
    assert.equal(store.getDownloadState('batulao').status, 'idle');
  });

  test('the download state snapshot is stable between changes', async () => {
    const store = createPackStore({ files: fakeFiles().api, catalog: fakeCatalog({}).catalog });
    assert.equal(store.getDownloadState('batulao'), store.getDownloadState('batulao'));
  });

  test('a failed download leaves no pack and no partial files, and says why', async () => {
    const dest = destination();
    const fs = fakeFiles({ sizes: { 'https://maps.test/batulao.pmtiles': 4000 }, chunk: 1000, failAfter: 2000 });
    const store = createPackStore({ files: fs.api, catalog: fakeCatalog({ batulao: dest }).catalog });

    await assert.rejects(store.downloadPack(dest), /Network lost/);
    assert.deepEqual(store.getDownloadState('batulao'), { status: 'error', error: 'Network lost' });
    assert.equal(await store.getPack('batulao'), null);
    assert.deepEqual(await store.listDownloaded(), []);
    assert.deepEqual([...fs.files.keys()], []);
    assert.deepEqual(await fs.api.listDirectories(''), []);
  });

  test('a failed update keeps the pack already on the phone', async () => {
    const v1 = destination();
    const fs = fakeFiles({ sizes: { 'https://maps.test/batulao.pmtiles': 4000 } });
    const store = createPackStore({ files: fs.api, catalog: fakeCatalog({ batulao: v1 }).catalog, now: NOW });
    const first = await store.downloadPack(v1);

    const v2 = destination({ packVersion: 2 });
    const offline = createPackStore({ files: fs.api, catalog: fakeCatalog({ batulao: v2 }, { failContent: true }).catalog });
    await assert.rejects(offline.downloadPack(v2));
    assert.deepEqual(await offline.getPack('batulao'), first);
  });

  test('an update replaces the old pack', async () => {
    const fs = fakeFiles({
      sizes: { 'https://maps.test/batulao.pmtiles': 4000, 'https://maps.test/batulao-v2.pmtiles': 6000 },
    });
    await createPackStore({ files: fs.api, catalog: fakeCatalog({ batulao: destination() }).catalog }).downloadPack(
      destination(),
    );

    const v2 = destination({ packVersion: 2, mapPath: 'batulao-v2.pmtiles', mapBytes: 6000 });
    const store = createPackStore({ files: fs.api, catalog: fakeCatalog({ batulao: v2 }).catalog });
    const pack = await store.downloadPack(v2);
    assert.equal(pack.destination.packVersion, 2);
    assert.equal((await store.getPack('batulao'))?.destination.packVersion, 2);
    assert.equal(fs.files.get('batulao/map.pmtiles'), '6000 bytes from https://maps.test/batulao-v2.pmtiles');
  });

  test('asking twice while downloading joins the same download', async () => {
    const dest = destination();
    const fs = fakeFiles({ sizes: { 'https://maps.test/batulao.pmtiles': 4000 } });
    const fake = fakeCatalog({ batulao: dest });
    const store = createPackStore({ files: fs.api, catalog: fake.catalog });
    const [a, b] = await Promise.all([store.downloadPack(dest), store.downloadPack(dest)]);
    assert.equal(a, b);
    assert.equal(fake.contentCalls(), 1);
  });

  test('ignores unfinished downloads, unreadable packs and packs in another format', async () => {
    const fs = fakeFiles();
    await fs.api.makeDirectory('.incoming-batulao');
    await fs.api.writeText('.incoming-batulao/pack.json', '{}');
    await fs.api.makeDirectory('broken');
    await fs.api.writeText('broken/pack.json', 'not json');
    await fs.api.makeDirectory('old');
    await fs.api.writeText('old/pack.json', JSON.stringify({ format: 0, downloadedAt: '', content: {} }));
    await fs.api.makeDirectory('empty');
    const store = createPackStore({ files: fs.api, catalog: fakeCatalog({}).catalog });
    assert.deepEqual(await store.listDownloaded(), []);
    assert.equal(await store.getPack('broken'), null);
  });

  test('refuses ids that are not safe folder names', async () => {
    const store = createPackStore({ files: fakeFiles().api, catalog: fakeCatalog({}).catalog });
    await assert.rejects(store.getPack('../escape'), /Bad Destination id/);
    await assert.rejects(store.downloadPack(destination({ id: 'a/b' })), /Bad Destination id/);
  });
});

// --- Supabase catalog ------------------------------------------------------------------------

describe('catalog', () => {
  const rows: Record<string, unknown[]> = {
    destinations: [
      {
        id: 'batulao',
        name: 'Mt. Batulao',
        region: 'Nasugbu, Batangas',
        summary_en: 'Sample',
        summary_fil: 'Sample na',
        latitude: 14.04,
        longitude: 120.8,
        elevation_m: 811,
        pack_version: 3,
        map_path: 'batulao.pmtiles',
        map_bytes: '4207071',
        is_placeholder: true,
      },
    ],
    trails: [
      {
        id: 'batulao-old-trail',
        destination_id: 'batulao',
        name: 'Old Trail',
        distance_m: 3211,
        geometry: { type: 'LineString', coordinates: [[120.81, 14.05], [120.8, 14.04]] },
      },
    ],
    waypoints: [
      {
        id: 'batulao-summit',
        trail_id: 'batulao-old-trail',
        type: 'summit',
        name: 'Summit',
        latitude: 14.04,
        longitude: 120.8,
        elevation_m: 811,
        position: 5,
        distance_m: 3204,
      },
    ],
    reference_passages: [
      { id: 'p', destination_id: 'batulao', topic: 'water', language: 'fil', text: 'Tubig', source: 'test' },
    ],
  };

  function fakeFetch(calls: { url: string; headers: Record<string, string> }[]): typeof fetch {
    return (async (input: string, init?: { headers?: Record<string, string> }) => {
      calls.push({ url: input, headers: init?.headers ?? {} });
      const table = new URL(input).pathname.split('/').pop()!;
      const body = JSON.stringify(rows[table] ?? []);
      return { ok: true, status: 200, text: async () => body };
    }) as unknown as typeof fetch;
  }

  test('maps rows to camelCase and counts the bytes', async () => {
    const calls: { url: string; headers: Record<string, string> }[] = [];
    const catalog = createCatalog({ url: 'https://x.supabase.co/', anonKey: 'eyJ.legacy.jwt', fetch: fakeFetch(calls) });
    const { content, bytes } = await catalog.fetchContent('batulao');

    assert.equal(content.destination.mapBytes, 4207071);
    assert.equal(content.destination.packVersion, 3);
    assert.deepEqual(content.destination.summary, { en: 'Sample', fil: 'Sample na' });
    assert.equal(content.trails[0].distanceM, 3211);
    assert.equal(content.waypoints[0].trailId, 'batulao-old-trail');
    assert.equal(content.passages[0].language, 'fil');
    assert.ok(bytes > 0);

    assert.ok(calls.every((call) => call.url.startsWith('https://x.supabase.co/rest/v1/')));
    assert.ok(calls.every((call) => call.headers.apikey === 'eyJ.legacy.jwt'));
    assert.ok(calls.every((call) => call.headers.Authorization === 'Bearer eyJ.legacy.jwt'));
    assert.ok(calls.some((call) => call.url.includes('waypoints?') && call.url.includes('batulao-old-trail')));
  });

  test('a publishable key is sent without a bearer token', async () => {
    const calls: { url: string; headers: Record<string, string> }[] = [];
    const catalog = createCatalog({ url: 'https://x.supabase.co', anonKey: 'sb_publishable_abc', fetch: fakeFetch(calls) });
    await catalog.listDestinations();
    assert.equal(calls[0].headers.Authorization, undefined);
  });

  test('the map URL points at the public maps bucket', () => {
    const catalog = createCatalog({ url: 'https://x.supabase.co', anonKey: 'k' });
    assert.equal(catalog.mapUrl('batulao.pmtiles'), 'https://x.supabase.co/storage/v1/object/public/maps/batulao.pmtiles');
  });

  test('without configuration it fails instead of calling a server', async () => {
    const catalog = createCatalog({ url: '', anonKey: '' });
    await assert.rejects(catalog.listDestinations(), /not configured/);
  });
});
