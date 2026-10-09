// The embedding models the Assistant can search with. Each has its own query and passage
// prefixes (as its model card asks) and its own gate threshold, tuned against the test set
// (testSet.ts) on the phone. Pure.

import type { Chunk } from './corpus';

export type EmbedModelSpec = {
  /** Stored with the vectors: changing the model re-embeds everything. */
  id: string;
  file: string;
  /** For #13's download manifest. */
  url: string;
  bytes: number;
  sha256: string;
  query: (question: string) => string;
  passage: (chunk: Chunk) => string;
  /** Pooling, when the GGUF does not set it itself. */
  pooling?: 'mean' | 'cls' | 'last';
  /** Relevance gate (ADR 0005): the best cosine score a question needs to reach the model. */
  threshold: number;
};

export const EMBEDDING_GEMMA: EmbedModelSpec = {
  id: 'embeddinggemma-300m-q8_0',
  file: 'embeddinggemma-300M-Q8_0.gguf',
  url: 'https://huggingface.co/ggml-org/embeddinggemma-300M-GGUF/resolve/main/embeddinggemma-300M-Q8_0.gguf',
  bytes: 333590944,
  sha256: 'b5ce9d77a3fc4b3b39ccb5643c36777911cc4eb46a66962eadfa3f5f60490d63',
  query: (question) => `task: search result | query: ${question.trim()}`,
  passage: (chunk) => `title: ${chunk.title} | text: ${chunk.text}`,
  // Tuned on the phone (testSet.ts): in-scope questions scored 0.44 and up, off-topic ones
  // 0.37 at most; 0.40 sits in that gap.
  threshold: 0.4,
};

// Also tried on the Flip 6: multilingual-e5-small Q8_0 (keisuke-miyako/multilingual-e5-small-
// gguf-q8_0, 132 MB). Its third-party GGUF returned NaN vectors in llama.rn (it ships a BERT
// WordPiece tokenizer for an XLM-R model), so it is not listed. Add a spec here to bench
// another model with tahak://assistant/bench?embed=<file>.
export const EMBED_MODELS: readonly EmbedModelSpec[] = [EMBEDDING_GEMMA];

/** The model the app uses. */
export const DEFAULT_EMBED_MODEL: EmbedModelSpec = EMBEDDING_GEMMA;

export function embedModelByFile(file: string | undefined): EmbedModelSpec | undefined {
  return EMBED_MODELS.find((m) => m.file === file || m.id === file);
}
