// Where the Assistant's model files are on the phone. This is the only place that knows:
// when the assistant-model module from #13 merges, assistantModelFiles() becomes a one-line
// call to its getModelFiles().
//
// The files live in the app's external files directory, in assistant-models/. They must be
// owned by the app: files pushed with `adb push` are owned by the shell user and fail to open,
// so they are copied in with `adb shell run-as com.tahak.app cp …` (Wave 0).

import { File } from 'expo-file-system';

import diagnostics from '../../../modules/tahak-diagnostics';

export const MODEL_DIR = 'assistant-models';
/** The chat model: Qwen3.5-4B, Q4_K_M (unsloth/Qwen3.5-4B-GGUF). */
export const LLM_FILE = 'Qwen3.5-4B-Q4_K_M.gguf';
/** Its vision file, used only by the Wave 0 benchmark until Vision (#18). */
export const MMPROJ_FILE = 'Qwen3.5-4B-mmproj-F16.gguf';

export type ModelFiles = { llm: string; mmproj: string; dir: string };

export function assistantModelFiles(): ModelFiles {
  const root = diagnostics.externalFilesDir();
  if (!root) throw new Error('The external files directory is not available.');
  const dir = `${root}/${MODEL_DIR}`;
  return { llm: `${dir}/${LLM_FILE}`, mmproj: `${dir}/${MMPROJ_FILE}`, dir };
}

/** Absolute path of a file in the model folder, e.g. the embedding model. */
export function modelFilePath(fileName: string): string {
  return `${assistantModelFiles().dir}/${fileName}`;
}

export function fileExists(path: string): boolean {
  try {
    return new File(`file://${path}`).exists;
  } catch {
    return false;
  }
}
