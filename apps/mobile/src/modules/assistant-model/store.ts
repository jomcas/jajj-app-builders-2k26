// The app-wide model download. One downloader lives at module level, outside any screen, so
// the download keeps running while the hiker uses other tabs.
import { useSyncExternalStore } from 'react';
import { Linking } from 'react-native';

import diagnostics from '../../../modules/tahak-diagnostics';
import { loadSetting, saveSetting } from '../../settings/storage';
import { createModelDownloader, type ModelDownloader, type ModelState } from './downloader';
import { createExpoModelFs, removeTestFolder } from './expoModelFs';
import { MANIFESTS, MODEL_MANIFEST, type ModelManifest, type ModelSource } from './manifest';
import { parseSetupLink } from './setupLink';

/** Download log lines (offsets, resume, size check, rename) go to logcat under this tag. */
export const MODEL_LOG_TAG = 'TAHAK_MODEL';

const SOURCE_KEY = 'modelSource';
/** 'yes' while the hiker wants the download running, so it resumes after an app restart. */
const WANTED_KEY = 'modelDownloadWanted';

const fs = createExpoModelFs();
const log = (message: string) => diagnostics.log(MODEL_LOG_TAG, `[${current.manifest.id}] ${message}`);

let current: { manifest: ModelManifest; downloader: ModelDownloader } = {
  manifest: MODEL_MANIFEST,
  downloader: createModelDownloader({ fs, manifest: MODEL_MANIFEST, log: (m) => log(m) }),
};

const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());
let unsubscribe = current.downloader.subscribe(notify);

function switchTo(manifest: ModelManifest) {
  unsubscribe();
  current.downloader.dispose();
  current = { manifest, downloader: createModelDownloader({ fs, manifest, log: (m) => log(m) }) };
  unsubscribe = current.downloader.subscribe(notify);
  log(`source is now ${manifest.id}: ${current.downloader.getState().status}`);
  notify();
}

/** The model's current state. */
export function getModelState(): ModelState {
  return current.downloader.getState();
}

/** The model's state, re-rendering on every change. */
export function useModelState(): ModelState {
  return useSyncExternalStore(subscribeModelState, getModelState);
}

function subscribeModelState(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Absolute paths of the model files, in manifest order (model first, vision file second). */
export function getModelFiles(): string[] {
  return current.downloader.paths();
}

/** Total download size in bytes. */
export function getModelBytes(): number {
  return getModelState().bytesTotal;
}

/** Which manifest is in use: the real model, or the small dev test download. */
export function getModelSource(): ModelSource {
  return current.manifest.id;
}

/** Starts or resumes the download. It continues while the app is open, on any tab. */
export function startDownload(): void {
  saveSetting(WANTED_KEY, 'yes');
  current.downloader.start();
}

/** Pauses the download; the bytes so far are kept. */
export function pauseDownload(): void {
  saveSetting(WANTED_KEY, 'no');
  current.downloader.pause();
}

async function switchSource(source: ModelSource, fresh: boolean) {
  const manifest = MANIFESTS[source];
  if (manifest.id === current.manifest.id && !fresh) return;
  saveSetting(SOURCE_KEY, source);
  if (fresh && manifest.id === 'test') {
    current.downloader.dispose();
    removeTestFolder(fs, manifest);
    log('test folder deleted');
  }
  switchTo(manifest);
}

type StoreGlobals = { tahakModelLinks?: { remove(): void }; tahakModelInitialUrlSeen?: boolean };
const globals = globalThis as StoreGlobals;

async function restore() {
  if (__DEV__ && (await loadSetting(SOURCE_KEY, ['real', 'test'] as const)) === 'test') switchTo(MANIFESTS.test);
  if ((await loadSetting(WANTED_KEY, ['yes', 'no'] as const)) === 'yes') current.downloader.start();
}

function handleLink(url: string | null) {
  const link = parseSetupLink(url);
  if (link?.kind === 'source') void switchSource(link.source, link.fresh);
}

/** Reads the saved choices, resumes a wanted download, and (dev only) listens for setup links. */
function init() {
  void restore();
  if (!__DEV__) return;
  if (!globals.tahakModelInitialUrlSeen) {
    globals.tahakModelInitialUrlSeen = true;
    void Linking.getInitialURL().then(handleLink);
  }
  globals.tahakModelLinks?.remove();
  globals.tahakModelLinks = Linking.addEventListener('url', ({ url }) => handleLink(url));
}

init();
