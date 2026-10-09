// Parses the benchmark deep link. Pure (type-only imports) so it can be tested with plain Node.
import type { Backend } from './engine';

export type BenchOptions = { backends: Backend[]; threads: number };

/**
 * Reads tahak://spike/bench?backend=cpu|gpu|both&threads=<n>. backend defaults to cpu and
 * threads to defaultThreads. Returns null for any other link.
 */
export function parseBenchUrl(url: string | null, defaultThreads: number): BenchOptions | null {
  if (!url || !/^tahak:\/\/spike\/bench(?=$|[/?#])/.test(url)) return null;
  // React Native's URL has no searchParams, so read the query by hand.
  const param = (name: string) => url.match(new RegExp(`[?&]${name}=([^&#]*)`))?.[1];
  const backend = param('backend');
  const backends: Backend[] = backend === 'both' ? ['cpu', 'gpu'] : backend === 'gpu' ? ['gpu'] : ['cpu'];
  const threads = Number(param('threads'));
  return { backends, threads: Number.isInteger(threads) && threads > 0 ? threads : defaultThreads };
}
