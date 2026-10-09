// Small display helpers for the Hike screen. Pure, no runtime imports, tested under plain Node.

/** Replaces each {name} in a catalog string with its value. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in values ? String(values[name]) : match,
  );
}

/** A distance for a live readout: "850 m" under 1 km (rounded to 10 m), else "1.2 km". */
export function formatDistance(metres: number): string {
  if (!Number.isFinite(metres) || metres < 0) return '–';
  if (metres < 995) return `${Math.round(metres / 10) * 10} m`;
  return `${(metres / 1000).toFixed(1)} km`;
}

/** Kilometres with one decimal: 3392 → "3.4". */
export function formatKm(metres: number): string {
  return (metres / 1000).toFixed(1);
}

/** A duration split for the ETA: whole minutes, rounded up, as hours and minutes. */
export function splitDuration(seconds: number): { hours: number; minutes: number } {
  const total = Number.isFinite(seconds) && seconds > 0 ? Math.ceil(seconds / 60) : 0;
  return { hours: Math.floor(total / 60), minutes: total % 60 };
}

/** Two-digit minutes for "1 h 05 min". */
export function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** The ETA as the Hike panel and the Assistant's distance tool word it: "about 25 min". */
export function etaText(
  s: { etaUnderMinute: string; etaMinutes: string; etaHours: string },
  seconds: number,
): string {
  const { hours, minutes } = splitDuration(seconds);
  if (hours === 0) return minutes === 0 ? s.etaUnderMinute : fill(s.etaMinutes, { minutes });
  return fill(s.etaHours, { hours, minutes: pad2(minutes) });
}
