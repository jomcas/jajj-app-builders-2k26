// The relevance gate (ADR 0005): a question whose closest passage scores below the threshold
// gets the fixed off-topic reply, and the model never runs. Pure.

export type GateDecision = {
  pass: boolean;
  /** Cosine score of the closest passage, or -1 when the search corpus is empty. */
  best: number;
  threshold: number;
};

/** hits must be sorted best first, as topK returns them. */
export function gateDecision(hits: readonly { score: number }[], threshold: number): GateDecision {
  const best = hits.length > 0 ? hits[0].score : -1;
  return { pass: best >= threshold, best, threshold };
}
