// What the Assistant needs on the phone, and where it comes from. Pure data with no imports,
// so the tests can load it with plain Node.

export type ModelFile = {
  /** File name on the phone, inside the manifest's folder. */
  name: string;
  /** Public download URL (no auth). The server must honour Range requests for resume. */
  url: string;
  /** Exact size in bytes: the download is complete, and the file usable, only at this size. */
  bytes: number;
  /** sha256 from Hugging Face, for reference. The app checks the size, not the hash. */
  sha256: string;
};

export type ModelManifest = {
  id: 'real' | 'test';
  /**
   * Folder under the app's external files directory. The app writes it itself: files pushed
   * with adb belong to the shell user and the app cannot open them (Wave 0).
   */
  folder: string;
  files: readonly ModelFile[];
};

/**
 * The Assistant model (Wave 0 decision): Qwen3.5-4B Q4_K_M from unsloth/Qwen3.5-4B-GGUF, its
 * vision file in Q8_0 (Vision, #18), and the embedding model for the Assistant's search (#14).
 */
export const MODEL_MANIFEST: ModelManifest = {
  id: 'real',
  folder: 'assistant-models',
  files: [
    {
      name: 'Qwen3.5-4B-Q4_K_M.gguf',
      url: 'https://huggingface.co/unsloth/Qwen3.5-4B-GGUF/resolve/main/Qwen3.5-4B-Q4_K_M.gguf',
      bytes: 2_740_937_888,
      sha256: '00fe7986ff5f6b463e62455821146049db6f9313603938a70800d1fb69ef11a4',
    },
    {
      // The vision file, Q8_0 (#18): a photo is read ~30% faster than with unsloth's F16
      // (672 MB) and it takes half the memory. unsloth publishes no Q8_0, so this one comes
      // from prithivMLmods/Qwen3.5-4B-f32-GGUF (converted from Qwen/Qwen3.5-4B).
      name: 'Qwen3.5-4B-mmproj-Q8_0.gguf',
      url: 'https://huggingface.co/prithivMLmods/Qwen3.5-4B-f32-GGUF/resolve/main/Qwen3.5-4B.mmproj-q8_0.gguf',
      bytes: 366_894_656,
      sha256: '40a4f07d7bbdbb43011d6cf35ef751e4b1829ff47ee8aa4964c6296f571725ad',
    },
    {
      // The Assistant's embedding model (#14): turns passages and questions into vectors for
      // search and the relevance gate. Multilingual (English, Filipino, Taglish), 768 dims.
      name: 'embeddinggemma-300M-Q8_0.gguf',
      url: 'https://huggingface.co/ggml-org/embeddinggemma-300M-GGUF/resolve/main/embeddinggemma-300M-Q8_0.gguf',
      bytes: 333_590_944,
      sha256: 'b5ce9d77a3fc4b3b39ccb5643c36777911cc4eb46a66962eadfa3f5f60490d63',
    },
  ],
};

/**
 * A small stand-in for testing the download on the phone without fetching 3.4 GB again
 * (dev deep link tahak://setup/test-download). Its own folder, never assistant-models.
 */
export const TEST_MANIFEST: ModelManifest = {
  id: 'test',
  folder: 'assistant-models-test',
  files: [
    {
      name: 'nomic-embed-text-v1.5.Q8_0.gguf',
      url: 'https://huggingface.co/nomic-ai/nomic-embed-text-v1.5-GGUF/resolve/main/nomic-embed-text-v1.5.Q8_0.gguf',
      bytes: 146_146_432,
      sha256: '3e24342164b3d94991ba9692fdc0dd08e3fd7362e0aacc396a9a5c54a544c3b7',
    },
    {
      name: 'stories15M-q4_0.gguf',
      url: 'https://huggingface.co/ggml-org/models/resolve/main/tinyllamas/stories15M-q4_0.gguf',
      bytes: 19_077_344,
      sha256: '66967fbece6dbe97886593fdbb73589584927e29119ec31f08090732d1861739',
    },
  ],
};

export const MANIFESTS = { real: MODEL_MANIFEST, test: TEST_MANIFEST } as const;

export type ModelSource = keyof typeof MANIFESTS;

export function manifestBytes(manifest: ModelManifest): number {
  return manifest.files.reduce((sum, file) => sum + file.bytes, 0);
}

/** The suffix of a file still being downloaded. It is renamed only once complete. */
export const PART_SUFFIX = '.part';
