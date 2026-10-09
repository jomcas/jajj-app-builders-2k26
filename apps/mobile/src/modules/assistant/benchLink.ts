// Parses the Assistant's adb deep links. Pure (type-only imports) so plain Node tests run it.
//
//   tahak://assistant/bench?mode=gate|full&ui=en|fil&packs=none&embed=<file>&threshold=<x>&ids=a,b
//       Runs the test set. mode=gate (default) only embeds, searches and gates each question,
//       which is fast and is what the threshold is tuned on. mode=full also runs the model.
//       ui overrides each question's own UI language; packs=none hides every Destination
//       Pack; embed picks another embedding model file; threshold overrides the model's.
//   tahak://assistant/test?packs=none|all
//       The chat's test switch for "no Destination Pack downloaded".
//   tahak://spike/bench?backend=cpu|gpu|both&threads=<n>&image_tokens=<n>
//       The Wave 0 model benchmark (spikeBench.ts), kept working.

import type { Language } from '../../i18n/types';
import type { Backend } from './llm';

export type AssistantBenchOptions = {
  mode: 'gate' | 'full';
  ui?: Language;
  ignorePacks: boolean;
  embed?: string;
  threshold?: number;
  ids?: string[];
};

export type SpikeBenchOptions = {
  backends: Backend[];
  threads: number;
  /** Cap on the tokens one photo may take; undefined keeps the engine's default. */
  imageMaxTokens?: number;
};

function param(url: string, name: string): string | undefined {
  // React Native's URL has no searchParams, so read the query by hand.
  const raw = url.match(new RegExp(`[?&]${name}=([^&#]*)`))?.[1];
  return raw === undefined ? undefined : decodeURIComponent(raw);
}

function matches(url: string | null, path: string): url is string {
  return !!url && new RegExp(`^tahak://${path}(?=$|[/?#])`).test(url);
}

export function parseAssistantBenchUrl(url: string | null): AssistantBenchOptions | null {
  if (!matches(url, 'assistant/bench')) return null;
  const ui = param(url, 'ui');
  const threshold = Number(param(url, 'threshold'));
  const ids = param(url, 'ids')?.split(',').filter(Boolean);
  return {
    mode: param(url, 'mode') === 'full' ? 'full' : 'gate',
    ui: ui === 'en' || ui === 'fil' ? ui : undefined,
    ignorePacks: param(url, 'packs') === 'none',
    embed: param(url, 'embed') || undefined,
    threshold: Number.isFinite(threshold) && param(url, 'threshold') ? threshold : undefined,
    ids: ids?.length ? ids : undefined,
  };
}

/** packs=none → true, packs=all → false, anything else → null (not a test link). */
export function parseTestUrl(url: string | null): { ignorePacks: boolean } | null {
  if (!matches(url, 'assistant/test')) return null;
  const packs = param(url, 'packs');
  return packs === 'none' ? { ignorePacks: true } : packs === 'all' ? { ignorePacks: false } : null;
}

export function parseSpikeBenchUrl(url: string | null, defaultThreads: number): SpikeBenchOptions | null {
  if (!matches(url, 'spike/bench')) return null;
  const backend = param(url, 'backend');
  const backends: Backend[] = backend === 'both' ? ['cpu', 'gpu'] : backend === 'gpu' ? ['gpu'] : ['cpu'];
  const positive = (name: string) => {
    const value = Number(param(url, name));
    return Number.isInteger(value) && value > 0 ? value : undefined;
  };
  return { backends, threads: positive('threads') ?? defaultThreads, imageMaxTokens: positive('image_tokens') };
}

/** Errors at each threshold: in-scope questions refused plus off-topic questions let through. */
export function sweepThresholds(
  results: readonly { best: number; expect: 'answer' | 'off-topic' }[],
  from = 0.2,
  to = 0.95,
  step = 0.01,
): { threshold: number; refused: number; passed: number }[] {
  const out = [];
  for (let t = from; t <= to + 1e-9; t += step) {
    const threshold = Math.round(t * 100) / 100;
    const refused = results.filter((r) => r.expect === 'answer' && r.best < threshold).length;
    const passed = results.filter((r) => r.expect === 'off-topic' && r.best >= threshold).length;
    out.push({ threshold, refused, passed });
  }
  return out;
}
