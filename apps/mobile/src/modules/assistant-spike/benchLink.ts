// Parses the benchmark deep link. Pure (type-only imports) so it can be tested with plain Node.
import type { Backend } from './engine';

export type BenchOptions = {
  backends: Backend[];
  threads: number;
  /** Cap on the tokens one photo may take; undefined keeps the engine's default. */
  imageMaxTokens?: number;
};

/**
 * Reads tahak://spike/bench?backend=cpu|gpu|both&threads=<n>&image_tokens=<n>. backend
 * defaults to cpu, threads to defaultThreads, image_tokens to the engine's default.
 * Returns null for any other link.
 */
export function parseBenchUrl(url: string | null, defaultThreads: number): BenchOptions | null {
  if (!url || !/^tahak:\/\/spike\/bench(?=$|[/?#])/.test(url)) return null;
  // React Native's URL has no searchParams, so read the query by hand.
  const param = (name: string) => url.match(new RegExp(`[?&]${name}=([^&#]*)`))?.[1];
  const backend = param('backend');
  const backends: Backend[] = backend === 'both' ? ['cpu', 'gpu'] : backend === 'gpu' ? ['gpu'] : ['cpu'];
  const positive = (name: string) => {
    const value = Number(param(name));
    return Number.isInteger(value) && value > 0 ? value : undefined;
  };
  return { backends, threads: positive('threads') ?? defaultThreads, imageMaxTokens: positive('image_tokens') };
}
