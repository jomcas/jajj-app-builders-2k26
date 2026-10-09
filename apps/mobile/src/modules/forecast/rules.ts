// The Forecast's rules: how old it is, which days are left and how reliable they are, when to
// refresh, and which days carry a weather warning. Pure, no runtime imports, tested under
// plain Node.

import type { Condition, Forecast, ForecastDay, WarningKind } from './types';

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

// --- Age ---------------------------------------------------------------------------------------

/** How long ago a Forecast was fetched, for "as of 2 days ago". The unit picks a catalog string. */
export type Age =
  | { unit: 'justNow' }
  | { unit: 'minutes' | 'hours' | 'days'; count: number };

/** Under 2 minutes is "just now"; then whole minutes, hours, and days, rounded down. */
export function forecastAge(fetchedAt: string, now: Date): Age {
  const ms = Math.max(0, now.getTime() - Date.parse(fetchedAt));
  if (!Number.isFinite(ms) || ms < 2 * MINUTE_MS) return { unit: 'justNow' };
  if (ms < HOUR_MS) return { unit: 'minutes', count: Math.floor(ms / MINUTE_MS) };
  if (ms < DAY_MS) return { unit: 'hours', count: Math.floor(ms / HOUR_MS) };
  return { unit: 'days', count: Math.floor(ms / DAY_MS) };
}

/** Past this age the Forecast's age is shown as a caution (butter), not quietly. */
export const STALE_AFTER_MS = 12 * HOUR_MS;

export function isStale(fetchedAt: string, now: Date): boolean {
  const fetched = Date.parse(fetchedAt);
  return Number.isNaN(fetched) || now.getTime() - fetched >= STALE_AFTER_MS;
}

// --- Days ---------------------------------------------------------------------------------------

/** The calendar date at the Forecast's place for an instant: "2026-10-10". */
export function placeDate(instant: Date, utcOffsetSeconds: number): string {
  return new Date(instant.getTime() + utcOffsetSeconds * 1000).toISOString().slice(0, 10);
}

function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS);
}

/** Days this far after the fetch day or more are marked less reliable. */
export const RELIABLE_DAYS = 3;

export type ShownDay = ForecastDay & {
  /** 0 today, 1 tomorrow, … at the place. */
  fromToday: number;
  /** Far enough after the fetch that the forecast is a rough guide only. */
  lessReliable: boolean;
  warnings: WarningKind[];
};

/**
 * The days still worth showing: today (at the place) and later. A Forecast saved days ago and
 * read offline loses its past days; when none are left it has expired.
 */
export function remainingDays(forecast: Forecast, now: Date): ShownDay[] {
  const today = placeDate(now, forecast.utcOffsetSeconds);
  const fetchDay = placeDate(new Date(forecast.fetchedAt), forecast.utcOffsetSeconds);
  return forecast.days
    .filter((day) => day.date >= today)
    .map((day) => ({
      ...day,
      fromToday: daysBetween(today, day.date),
      lessReliable: daysBetween(fetchDay, day.date) >= RELIABLE_DAYS,
      warnings: dayWarnings(day),
    }));
}

/** 0–6 for Sunday–Saturday, from a calendar date. */
export function weekday(date: string): number {
  return new Date(`${date}T00:00:00Z`).getUTCDay();
}

// --- Refresh ----------------------------------------------------------------------------------

export const REFRESH = {
  /** A Forecast younger than this is left alone. Open-Meteo updates its models hourly. */
  freshForMs: HOUR_MS,
  /** After a failed fetch (usually: offline) try again this often, so coming back online refreshes. */
  retryEveryMs: 30_000,
  /** After a Destination Pack download, refetch a Forecast older than this. */
  afterPackDownloadMs: MINUTE_MS,
  /** The hiker's last known location moved this far from the saved Forecast's place. */
  movedM: 5_000,
} as const;

export type Attempt = { at: number; failed: boolean };

/**
 * Whether to fetch a place's Forecast now. Never while a fetch runs. A hiker's tap (force)
 * always fetches. Otherwise: no Forecast yet, or the last try failed, or it is older than
 * freshForMs; but never sooner than retryEveryMs after the last try, so an offline phone
 * isn't hammered.
 */
export function shouldRefresh(input: {
  fetchedAt: string | null;
  lastAttempt: Attempt | null;
  inFlight: boolean;
  now: number;
  force?: boolean;
  freshForMs?: number;
}): boolean {
  if (input.inFlight) return false;
  if (input.force) return true;
  if (input.lastAttempt && input.now - input.lastAttempt.at < REFRESH.retryEveryMs) return false;
  if (input.fetchedAt === null) return true;
  if (input.lastAttempt?.failed) return true;
  const fetched = Date.parse(input.fetchedAt);
  return Number.isNaN(fetched) || input.now - fetched >= (input.freshForMs ?? REFRESH.freshForMs);
}

/** Great-circle distance in metres. */
export function distanceM(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }): number {
  const rad = Math.PI / 180;
  const dLat = (b.latitude - a.latitude) * rad;
  const dLon = (b.longitude - a.longitude) * rad;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(a.latitude * rad) * Math.cos(b.latitude * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * 6_371_000 * Math.asin(Math.min(1, Math.sqrt(h)));
}

// --- Warnings ---------------------------------------------------------------------------------

/**
 * When a day gets a weather warning. Warnings are caution, shown in butter, never red
 * (ADR 0004). Wind follows Beaufort 6 ("strong breeze", 39 km/h); heat follows PAGASA's heat
 * index bands, one degree before "danger" (42 °C).
 */
export const WARNING_THRESHOLDS = {
  thunderstormCodes: [95, 96, 99],
  heavyRainMm: 20,
  heavyRainCodes: [65, 82],
  windKmh: 39,
  gustKmh: 60,
  feelsLikeC: 41,
} as const;

export function dayWarnings(day: ForecastDay): WarningKind[] {
  const t = WARNING_THRESHOLDS;
  const warnings: WarningKind[] = [];
  if ((t.thunderstormCodes as readonly number[]).includes(day.weatherCode)) warnings.push('thunderstorm');
  if (day.precipitationMm >= t.heavyRainMm || (t.heavyRainCodes as readonly number[]).includes(day.weatherCode)) {
    warnings.push('heavyRain');
  }
  if (day.windMaxKmh >= t.windKmh || (day.gustMaxKmh ?? 0) >= t.gustKmh) warnings.push('strongWind');
  if ((day.feelsLikeMaxC ?? day.tempMaxC) >= t.feelsLikeC) warnings.push('heat');
  return warnings;
}

// --- Conditions -------------------------------------------------------------------------------

/** WMO weather code to a coarse condition. Unknown codes read as cloudy. */
export function conditionOf(code: number): Condition {
  if (code <= 1) return 'clear';
  if (code === 2) return 'partlyCloudy';
  if (code === 3) return 'cloudy';
  if (code === 45 || code === 48) return 'fog';
  if (code >= 51 && code <= 57) return 'drizzle';
  if (code >= 61 && code <= 67) return 'rain';
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow';
  if (code >= 80 && code <= 82) return 'showers';
  if (code >= 95 && code <= 99) return 'thunderstorm';
  return 'cloudy';
}
