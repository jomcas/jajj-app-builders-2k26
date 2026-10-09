// The Assistant model (issue #13): downloads the on-device model once, with resume, and
// tells the rest of the app when it is ready. No tab of its own.
//
// Public interface:
//   useModelState() / getModelState()  missing | downloading | paused | error | ready, each with
//                                      bytesDone and bytesTotal (error adds a message)
//   getModelFiles()                    absolute paths of the model files, in manifest order
//   startDownload() / pauseDownload()  the download runs at app level, on any tab
//   <ModelGate>                        download progress until ready, then its children
//   withModelGate(Screen)              the same, for a tab screen
//   <ModelDownloadCard>                the size, progress and button, for the setup screen
//
// The files live in <external files dir>/assistant-models/ (MODEL_MANIFEST). To add a file
// (such as the embedding model), add it to MODEL_MANIFEST.files in manifest.ts.
//
// Dev-only deep links: tahak://setup/test-download[?fresh=1] switches to a small test download
// in its own folder; tahak://setup/real-download switches back. Logs: logcat tag TAHAK_MODEL.
import type { FeatureModule } from '../types';

export type { ModelState, ModelStatus } from './downloader';
export { formatBytes } from './format';
export { MODEL_MANIFEST, type ModelFile } from './manifest';
export { ModelDownloadCard } from './ModelDownloadCard';
export { ModelGate, withModelGate } from './ModelGate';
export { parseSetupLink } from './setupLink';
export {
  getModelBytes,
  getModelFiles,
  getModelSource,
  getModelState,
  pauseDownload,
  startDownload,
  useModelState,
} from './store';

export default {
  id: 'assistant-model',
  hikeModes: ['solo', 'group'],
  offlineNeeds: [],
} satisfies FeatureModule;
