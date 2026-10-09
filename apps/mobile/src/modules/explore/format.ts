// Small display helpers for Explore. Pure, no runtime imports, tested under plain Node.

/** Replaces each {name} in a catalog string with its value. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in values ? String(values[name]) : match,
  );
}

/** A byte count for people: 4207071 → "4.2 MB", 850000 → "850 KB". Decimal units. */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '–';
  if (bytes < 1000) return `${Math.round(bytes)} B`;
  if (bytes < 1000 ** 2) return `${Math.round(bytes / 1000)} KB`;
  if (bytes < 1000 ** 3) return `${(bytes / 1000 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1000 ** 3).toFixed(1)} GB`;
}

/** Metres as kilometres with one decimal: 3211 → "3.2". */
export function formatKm(metres: number): string {
  return (metres / 1000).toFixed(1);
}

/** The calendar date of an ISO 8601 timestamp, in the phone's time zone: "2026-10-10". */
export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Turns anything thrown into a short message. */
export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
