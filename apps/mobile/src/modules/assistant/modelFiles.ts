// Where the Assistant's model files are on the phone: the assistant-model module (#13)
// downloads them and knows their paths (getModelFiles(), in MODEL_MANIFEST order). This file
// only picks each one out by name.

import { File } from 'expo-file-system';

import { getModelFiles } from '../assistant-model';

/** The chat model: Qwen3.5-4B, Q4_K_M (unsloth/Qwen3.5-4B-GGUF). */
export const LLM_FILE = 'Qwen3.5-4B-Q4_K_M.gguf';
/** Its vision file (mmproj), Q8_0: attached for photo questions (Vision, #18; vision.ts). */
export const MMPROJ_FILE = 'Qwen3.5-4B-mmproj-Q8_0.gguf';

export type ModelFiles = { llm: string; mmproj: string };

export function assistantModelFiles(): ModelFiles {
  return { llm: modelFilePath(LLM_FILE), mmproj: modelFilePath(MMPROJ_FILE) };
}

/** Absolute path of a model file by name, e.g. the embedding model. */
export function modelFilePath(fileName: string): string {
  const paths = getModelFiles();
  const path = paths.find((p) => p.endsWith(`/${fileName}`));
  if (path) return path;
  // Not in the manifest (another embedding model under test): same folder as the others.
  const dir = paths[0]?.replace(/\/[^/]*$/, '');
  if (!dir) throw new Error('The model folder is not known.');
  return `${dir}/${fileName}`;
}

export function fileExists(path: string): boolean {
  try {
    return new File(path.startsWith('file://') ? path : `file://${path}`).exists;
  } catch {
    return false;
  }
}
