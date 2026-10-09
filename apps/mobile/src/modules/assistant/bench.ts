// The Assistant's adb bench: runs the test set (testSet.ts) on the phone and logs, per
// question, the best score, the gate decision, the chosen sources, the time to the first
// token and the answer, then a tally, to logcat under TAHAK_ASSISTANT_BENCH.
//
//   adb shell am start -a android.intent.action.VIEW -d "tahak://assistant/bench?mode=full" com.tahak.app
//
// See benchLink.ts for the options. Read the log with:
//   adb logcat -d -s TAHAK_ASSISTANT_BENCH:I
import { Linking } from 'react-native';

import diagnostics from '../../../modules/tahak-diagnostics';
import { answer, setPassageLanguage, testFlags } from './assistant';
import {
  parseAssistantBenchUrl,
  parseSpikeBenchUrl,
  parseTestUrl,
  sweepThresholds,
  type AssistantBenchOptions,
} from './benchLink';
import { logChunks, memorySampler, round } from './benchLog';
import { gateDecision } from './gate';
import { DEFAULT_EMBED_MODEL, embedModelByFile } from './embedModels';
import { DEFAULT_THREADS, engineStore } from './llm';
import type { Reply } from './pipeline';
import { runSpikeBench } from './spikeBench';
import { TEST_SET } from './testSet';
import { appIndex, createVectorIndex, type VectorIndex } from './vectorIndex';

export const BENCH_TAG = 'TAHAK_ASSISTANT_BENCH';

function log(record: Record<string, unknown>) {
  diagnostics.log(BENCH_TAG, JSON.stringify(record));
}

const top = (hits: { chunk: { id: string }; score: number }[], n = 5) =>
  hits.slice(0, n).map((h) => [h.chunk.id, round(h.score, 3)]);

function verdictOf(reply: Reply): string {
  if (reply.kind === 'answer') return 'answer';
  if (reply.kind === 'emergency') return reply.distress ? 'distress' : `emergency:${reply.guideId}`;
  return `off-topic-${reply.reason}`;
}

let running = false;

export async function runAssistantBench(options: AssistantBenchOptions): Promise<void> {
  if (running) return;
  running = true;
  const run = Date.now().toString(36);
  const spec = embedModelByFile(options.embed) ?? DEFAULT_EMBED_MODEL;
  const index: VectorIndex = spec.id === appIndex.spec.id ? appIndex : createVectorIndex(spec);
  const threshold = options.threshold ?? spec.threshold;
  // Grouped by UI language, as a hiker uses one language at a time: the system prompt (one per
  // language) can then come from llama.rn's prompt cache.
  const questions = TEST_SET.filter((q) => !options.ids || options.ids.includes(q.id)).sort(
    (a, b) => Number((options.ui ?? a.ui) === 'fil') - Number((options.ui ?? b.ui) === 'fil'),
  );
  const memory = memorySampler();
  setPassageLanguage(options.passagesInEnglish ? 'en' : 'ui');
  try {
    log({ type: 'start', run, mode: options.mode, model: spec.id, threshold, packs: options.ignorePacks ? 'none' : 'all', questions: questions.length, airplane_mode: diagnostics.airplaneMode() });
    const indexStart = Date.now();
    await index.sync();
    const embedder = await index.embedder();
    log({ type: 'index', run, ms: Date.now() - indexStart, embedder_load_ms: embedder.loadMs, parts: index.summary(), status: index.status() });

    const results: { id: string; best: number; expect: 'answer' | 'off-topic'; verdict: string }[] = [];
    const ttfts: number[] = [];
    for (const q of questions) {
      const ui = options.ui ?? q.ui;
      const started = Date.now();
      if (options.mode === 'gate') {
        const hits = await index.search(q.question, { ignorePacks: options.ignorePacks });
        const gate = gateDecision(hits, threshold);
        const verdict = gate.pass ? 'pass' : 'off-topic-gate';
        results.push({ id: q.id, best: gate.best, expect: q.expect, verdict });
        log({ type: 'q', run, id: q.id, lang: q.lang, expect: q.expect, best: round(gate.best, 3), gate: gate.pass ? 'pass' : 'refuse', top: top(hits), source_ok: !q.source || hits[0]?.chunk.id.startsWith(q.source), search_ms: Date.now() - started });
        continue;
      }
      const reply = await answer(q.question, { language: ui, index, threshold, ignorePacks: options.ignorePacks });
      const verdict = verdictOf(reply);
      const best = reply.kind === 'emergency' ? 1 : reply.gate.best;
      results.push({ id: q.id, best, expect: q.expect, verdict });
      const gen = reply.kind === 'answer' ? reply.generation : reply.kind === 'off-topic' ? reply.generation : undefined;
      if (gen) ttfts.push(gen.ttftMs);
      log({
        type: 'q',
        run,
        id: q.id,
        lang: q.lang,
        ui,
        expect: q.expect,
        verdict,
        correct: q.expect === 'answer' ? verdict === 'answer' : verdict.startsWith('off-topic'),
        best: round(best, 3),
        top: reply.kind === 'emergency' ? [] : top(reply.hits),
        sources: reply.kind === 'answer' ? reply.sources.map((s) => s.id) : [],
        given: reply.kind === 'answer' ? reply.passages.map((s) => s.id) : [],
        llm_ran: !!gen,
        ttft_ms: gen?.ttftMs ?? null,
        gen_tps: gen ? round(gen.generationTps) : null,
        prompt_tokens: gen?.promptTokens ?? null,
        cached_tokens: gen?.cachedTokens ?? null,
        gen_tokens: gen?.generatedTokens ?? null,
        truncated: gen?.truncated ?? null,
        total_ms: Date.now() - started,
        pss_kb: diagnostics.memoryKb().pss ?? null,
      });
      logChunks(log, { type: 'a', run, id: q.id, question: q.question }, reply.kind === 'answer' ? reply.text : reply.kind === 'off-topic' ? `(off-topic reply; model said: ${reply.raw ?? 'not run'})` : '(emergency)');
    }

    const inScope = results.filter((r) => r.expect === 'answer');
    const offTopic = results.filter((r) => r.expect === 'off-topic');
    const refused = inScope.filter((r) => (options.mode === 'gate' ? r.best < threshold : r.verdict !== 'answer'));
    const passed = offTopic.filter((r) => (options.mode === 'gate' ? r.best >= threshold : !r.verdict.startsWith('off-topic')));
    const sweep = sweepThresholds(results).filter((s) => s.refused + s.passed <= 6);
    const minInScope = Math.min(...inScope.map((r) => r.best));
    const maxOffTopic = Math.max(...offTopic.map((r) => r.best));
    log({
      type: 'summary',
      run,
      mode: options.mode,
      model: spec.id,
      threshold,
      in_scope: inScope.length,
      in_scope_refused: refused.length,
      refused_ids: refused.map((r) => r.id),
      off_topic: offTopic.length,
      off_topic_passed: passed.length,
      passed_ids: passed.map((r) => r.id),
      min_in_scope_best: round(minInScope, 3),
      max_off_topic_best: round(maxOffTopic, 3),
      mean_ttft_ms: ttfts.length ? Math.round(ttfts.reduce((a, b) => a + b, 0) / ttfts.length) : null,
      peak_pss_kb: memory.stop(),
      chat_model: engineStore.getSnapshot().status,
      airplane_mode: diagnostics.airplaneMode(),
    });
    log({ type: 'sweep', run, best: sweep });
  } catch (error) {
    log({ type: 'error', run, error: error instanceof Error ? error.stack ?? error.message : String(error) });
  } finally {
    setPassageLanguage('ui');
    memory.stop();
    running = false;
  }
}

// Kept on globalThis so a Fast Refresh, which re-runs this file, replaces the listener
// instead of adding another one (each extra listener would start another bench).
type BenchGlobals = { tahakAssistantLinks?: { remove(): void }; tahakAssistantInitialUrlSeen?: boolean };
const benchGlobals = globalThis as BenchGlobals;

/** Handles the Assistant's adb links: the test-set bench, the test switch and the Wave 0 bench. */
export function listenForAssistantLinks() {
  const handle = (url: string | null) => {
    const bench = parseAssistantBenchUrl(url);
    if (bench) return void runAssistantBench(bench);
    const test = parseTestUrl(url);
    if (test) {
      testFlags.setIgnorePacks(test.ignorePacks);
      log({ type: 'test-flag', ignore_packs: test.ignorePacks });
      return;
    }
    const spike = parseSpikeBenchUrl(url, DEFAULT_THREADS);
    if (spike) void runSpikeBench(spike);
  };
  if (!benchGlobals.tahakAssistantInitialUrlSeen) {
    benchGlobals.tahakAssistantInitialUrlSeen = true;
    void Linking.getInitialURL().then(handle);
  }
  benchGlobals.tahakAssistantLinks?.remove();
  benchGlobals.tahakAssistantLinks = Linking.addEventListener('url', ({ url }) => handle(url));
}
