// Vector maths for the Assistant's search: brute-force cosine similarity over every stored
// vector (docs/plan.md, RAG row: no vector database). Pure, so plain Node tests can run it.

export type Vector = ArrayLike<number>;

export function dot(a: Vector, b: Vector): number {
  if (a.length !== b.length) throw new Error(`Vector lengths differ: ${a.length} and ${b.length}.`);
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
  return sum;
}

export function norm(v: Vector): number {
  return Math.sqrt(dot(v, v));
}

/** Cosine similarity, from -1 to 1. A zero vector scores 0 against anything. */
export function cosine(a: Vector, b: Vector): number {
  const n = norm(a) * norm(b);
  return n === 0 ? 0 : dot(a, b) / n;
}

/** Scales a vector to length 1 (a zero vector stays zero). Stored vectors are kept unit length. */
export function normalize(v: Vector): Float32Array {
  const n = norm(v);
  const out = new Float32Array(v.length);
  for (let i = 0; i < v.length; i++) out[i] = n === 0 ? 0 : v[i] / n;
  return out;
}

export type Scored<T> = { item: T; score: number };

/**
 * The k items whose vectors are most similar to the query, best first, with their cosine
 * scores. Ties keep the items' original order.
 */
export function topK<T>(query: Vector, items: readonly T[], vectorOf: (item: T) => Vector, k: number): Scored<T>[] {
  if (k <= 0) return [];
  const scored = items.map((item, index) => ({ item, score: cosine(query, vectorOf(item)), index }));
  scored.sort((a, b) => b.score - a.score || a.index - b.index);
  return scored.slice(0, k).map(({ item, score }) => ({ item, score }));
}
