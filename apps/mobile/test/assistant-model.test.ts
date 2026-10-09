// The Assistant model download (issue #13): the state machine against a fake filesystem and
// network, resume offsets, the size check, the "already present" check, the manifest switch.
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import {
  createModelDownloader,
  inspectFiles,
  type ModelDownloader,
  type ModelFs,
  type Transfer,
} from '../src/modules/assistant-model/downloader.ts';
import { formatBytes, percent } from '../src/modules/assistant-model/format.ts';
import {
  MANIFESTS,
  MODEL_MANIFEST,
  manifestBytes,
  TEST_MANIFEST,
  type ModelManifest,
} from '../src/modules/assistant-model/manifest.ts';
import { parseSetupLink } from '../src/modules/assistant-model/setupLink.ts';

// --- Fakes -----------------------------------------------------------------------------------

const ROOT = '/sdcard/Android/data/com.tahak.app/files';

const SMALL: ModelManifest = {
  id: 'test',
  folder: 'models',
  files: [
    { name: 'a.gguf', url: 'https://x/a', bytes: 1000, sha256: '' },
    { name: 'b.gguf', url: 'https://x/b', bytes: 500, sha256: '' },
  ],
};
const A = `${ROOT}/models/a.gguf`;
const B = `${ROOT}/models/b.gguf`;

type Call = { url: string; path: string; from: number };

/** Files are just sizes. Each download waits for the test to send bytes, finish or fail it. */
function fakeFs(initial: Record<string, number> = {}) {
  const sizes = new Map(Object.entries(initial));
  const calls: Call[] = [];
  const renames: [string, string][] = [];
  const removed: string[] = [];
  let active: {
    path: string;
    onProgress: (n: number) => void;
    resolve: (v: 'done' | 'paused') => void;
    reject: (e: Error) => void;
  } | null = null;

  const fs: ModelFs = {
    folder: (manifest) => `${ROOT}/${manifest.folder}`,
    size: (path) => sizes.get(path) ?? null,
    makeFolder() {},
    rename(from, to) {
      assert.ok(!sizes.has(to), `rename onto an existing file: ${to}`);
      sizes.set(to, sizes.get(from)!);
      sizes.delete(from);
      renames.push([from, to]);
    },
    removePart(path) {
      assert.ok(path.endsWith('.part'), `removed a non-.part file: ${path}`);
      sizes.delete(path);
      removed.push(path);
    },
    download(url, path, from, onProgress): Transfer {
      calls.push({ url, path, from });
      // Like the native task: a fresh start truncates, a resume keeps the first `from` bytes.
      sizes.set(path, from);
      const result = new Promise<'done' | 'paused'>((resolve, reject) => {
        active = { path, onProgress, resolve, reject };
      });
      return { result, pause: () => active?.resolve('paused') };
    },
  };

  return {
    fs,
    sizes,
    calls,
    renames,
    removed,
    /** The server sends n more bytes of the current file. */
    send(n: number) {
      assert.ok(active, 'no download running');
      const size = (sizes.get(active.path) ?? 0) + n;
      sizes.set(active.path, size);
      active.onProgress(size);
    },
    finish() {
      active!.resolve('done');
    },
    drop(message = 'Software caused connection abort') {
      active!.reject(new Error(message));
    },
  };
}

/** Timers the test fires by hand. */
function fakeTimers() {
  const pending: (() => void)[] = [];
  return {
    setTimer: (callback: () => void) => {
      pending.push(callback);
      return callback;
    },
    clearTimer: (timer: unknown) => {
      const i = pending.indexOf(timer as () => void);
      if (i >= 0) pending.splice(i, 1);
    },
    fire() {
      pending.splice(0).forEach((callback) => callback());
    },
    get count() {
      return pending.length;
    },
  };
}

const flush = () => new Promise((resolve) => setImmediate(resolve));

function downloader(fake: ReturnType<typeof fakeFs>, timers = fakeTimers(), log: string[] = []): ModelDownloader {
  return createModelDownloader({
    fs: fake.fs,
    manifest: SMALL,
    log: (line) => log.push(line),
    setTimer: timers.setTimer,
    clearTimer: timers.clearTimer,
    retryDelayMs: 1000,
    progressIntervalMs: 0,
  });
}

// --- State machine ---------------------------------------------------------------------------

describe('model downloader', () => {
  test('nothing on the phone: missing, with the total size', () => {
    const d = downloader(fakeFs());
    assert.deepEqual(d.getState(), { status: 'missing', bytesDone: 0, bytesTotal: 1500 });
  });

  test('both files present at the right size: ready with no download', () => {
    const fake = fakeFs({ [A]: 1000, [B]: 500 });
    const d = downloader(fake);
    assert.equal(d.getState().status, 'ready');
    d.start();
    assert.equal(fake.calls.length, 0, 'no download when ready');
    assert.deepEqual(d.paths(), [A, B]);
  });

  test('downloads each file into .part, checks its size, then renames it', async () => {
    const fake = fakeFs();
    const log: string[] = [];
    const d = downloader(fake, fakeTimers(), log);
    const seen: string[] = [];
    d.subscribe(() => seen.push(`${d.getState().status}:${d.getState().bytesDone}`));

    d.start();
    assert.deepEqual(fake.calls, [{ url: 'https://x/a', path: `${A}.part`, from: 0 }]);
    fake.send(400);
    assert.deepEqual(d.getState(), { status: 'downloading', bytesDone: 400, bytesTotal: 1500 });
    fake.send(600);
    fake.finish();
    await flush();
    assert.deepEqual(fake.renames, [[`${A}.part`, A]]);
    assert.deepEqual(fake.calls[1], { url: 'https://x/b', path: `${B}.part`, from: 0 });
    assert.equal(d.getState().bytesDone, 1000);
    fake.send(500);
    fake.finish();
    await flush();
    assert.deepEqual(d.getState(), { status: 'ready', bytesDone: 1500, bytesTotal: 1500 });
    assert.deepEqual(fake.renames[1], [`${B}.part`, B]);
    assert.ok(seen.includes('downloading:400'));
    assert.equal(seen.at(-1), 'ready:1500');
    assert.ok(log.some((line) => line.includes('complete a.gguf: size 1000 checked')));
  });

  test('pause then resume continues from the .part file length', async () => {
    const fake = fakeFs();
    const d = downloader(fake);
    d.start();
    fake.send(300);
    d.pause();
    await flush();
    assert.deepEqual(d.getState(), { status: 'paused', bytesDone: 300, bytesTotal: 1500 });
    d.start();
    assert.deepEqual(fake.calls.at(-1), { url: 'https://x/a', path: `${A}.part`, from: 300 });
  });

  test('a dropped connection is an error, then resumes from the same byte offset', async () => {
    const fake = fakeFs();
    const timers = fakeTimers();
    const log: string[] = [];
    const d = downloader(fake, timers, log);
    d.start();
    fake.send(700);
    fake.drop();
    await flush();
    const state = d.getState();
    assert.equal(state.status, 'error');
    assert.equal(state.bytesDone, 700);
    assert.equal(timers.count, 1, 'an automatic retry is scheduled');
    timers.fire();
    assert.deepEqual(fake.calls.at(-1), { url: 'https://x/a', path: `${A}.part`, from: 700 });
    assert.equal(d.getState().status, 'downloading');
    assert.ok(log.includes('resume a.gguf from byte 700 of 1000'));
  });

  test('pausing while in error stops the automatic retry', async () => {
    const fake = fakeFs();
    const timers = fakeTimers();
    const d = downloader(fake, timers);
    d.start();
    fake.send(10);
    fake.drop();
    await flush();
    d.pause();
    assert.equal(timers.count, 0);
    assert.equal(d.getState().status, 'paused');
  });

  test('a partial file found at launch counts as paused and resumes from its length', () => {
    const fake = fakeFs({ [A]: 1000, [`${B}.part`]: 120 });
    const d = downloader(fake);
    assert.deepEqual(d.getState(), { status: 'paused', bytesDone: 1120, bytesTotal: 1500 });
    d.start();
    assert.deepEqual(fake.calls, [{ url: 'https://x/b', path: `${B}.part`, from: 120 }]);
  });

  test('size check: a short finish is an error that resumes; nothing is renamed', async () => {
    const fake = fakeFs();
    const timers = fakeTimers();
    const d = downloader(fake, timers);
    d.start();
    fake.send(900);
    fake.finish();
    await flush();
    const state = d.getState();
    assert.equal(state.status, 'error');
    assert.match(state.status === 'error' ? state.message : '', /900 bytes, expected 1000/);
    assert.deepEqual(fake.renames, []);
    timers.fire();
    assert.equal(fake.calls.at(-1)?.from, 900);
  });

  test('size check: an oversized .part is deleted and started again', async () => {
    const fake = fakeFs({ [`${A}.part`]: 5000 });
    const d = downloader(fake);
    d.start();
    assert.deepEqual(fake.removed, [`${A}.part`]);
    assert.equal(fake.calls[0].from, 0);
  });

  test('a complete .part left from before is renamed without downloading', () => {
    const fake = fakeFs({ [`${A}.part`]: 1000, [B]: 500 });
    const d = downloader(fake);
    d.start();
    assert.equal(fake.calls.length, 0);
    assert.equal(d.getState().status, 'ready');
  });

  test('a wrong-size file under the final name is never touched', () => {
    const fake = fakeFs({ [A]: 999 });
    const d = downloader(fake);
    d.start();
    assert.equal(d.getState().status, 'error');
    assert.equal(fake.calls.length, 0);
    assert.equal(fake.sizes.get(A), 999);
    assert.deepEqual(fake.removed, []);
  });

  test('dispose stops the transfer and ignores its result', async () => {
    const fake = fakeFs();
    const d = downloader(fake);
    d.start();
    fake.send(50);
    d.dispose();
    await flush();
    assert.equal(d.getState().status, 'downloading', 'no state change after dispose');
    d.start();
    assert.equal(fake.calls.length, 1, 'a disposed downloader never starts again');
  });
});

describe('inspectFiles', () => {
  test('counts complete files and .part bytes', () => {
    const fake = fakeFs({ [A]: 1000, [`${B}.part`]: 200 });
    assert.deepEqual(inspectFiles(fake.fs, SMALL), { bytesDone: 1200, complete: false });
  });
});

// --- Manifests and links ---------------------------------------------------------------------

describe('manifests', () => {
  test('the real model is the Wave 0 pair in assistant-models, 3.4 GB in all', () => {
    assert.equal(MODEL_MANIFEST.folder, 'assistant-models');
    assert.deepEqual(
      MODEL_MANIFEST.files.map((file) => [file.name, file.bytes]),
      [
        ['Qwen3.5-4B-Q4_K_M.gguf', 2_740_937_888],
        ['Qwen3.5-4B-mmproj-F16.gguf', 672_423_616],
      ],
    );
    assert.equal(formatBytes(manifestBytes(MODEL_MANIFEST)), '3.4 GB');
  });

  test('the test download lives in its own folder and is 50-200 MB', () => {
    assert.notEqual(TEST_MANIFEST.folder, MODEL_MANIFEST.folder);
    const bytes = manifestBytes(TEST_MANIFEST);
    assert.ok(bytes > 50e6 && bytes < 200e6, `${bytes}`);
    assert.equal(MANIFESTS.test, TEST_MANIFEST);
    assert.equal(MANIFESTS.real, MODEL_MANIFEST);
  });
});

describe('setup links', () => {
  test('reset, test download (fresh or not) and real download', () => {
    assert.deepEqual(parseSetupLink('tahak://setup/reset'), { kind: 'reset' });
    assert.deepEqual(parseSetupLink('tahak://setup/test-download'), { kind: 'source', source: 'test', fresh: false });
    assert.deepEqual(parseSetupLink('tahak://setup/test-download?fresh=1'), {
      kind: 'source',
      source: 'test',
      fresh: true,
    });
    assert.deepEqual(parseSetupLink('tahak://setup/real-download'), { kind: 'source', source: 'real', fresh: false });
  });

  test('other links are not setup links', () => {
    assert.equal(parseSetupLink(null), null);
    assert.equal(parseSetupLink('tahak://spike/bench'), null);
    assert.equal(parseSetupLink('tahak://setup/unknown'), null);
    assert.equal(parseSetupLink('exp+tahak://expo-development-client/?url=x'), null);
  });
});

describe('format', () => {
  test('sizes and percent', () => {
    assert.equal(formatBytes(146_146_432), '146 MB');
    assert.equal(percent(0, 0), 0);
    assert.equal(percent(999, 1000), 99);
    assert.equal(percent(1000, 1000), 100);
  });
});
