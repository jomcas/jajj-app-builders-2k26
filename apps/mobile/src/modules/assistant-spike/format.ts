/** Replaces each {name} in a catalog string with its value. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in values ? String(values[name]) : match,
  );
}

/** A tokens-per-second or similar figure with one decimal. */
export function rate(value: number): string {
  return Number.isFinite(value) ? value.toFixed(1) : '–';
}

/** Turns anything thrown into a short message. */
export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
