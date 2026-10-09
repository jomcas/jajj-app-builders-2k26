// The Forecast as the app sees it. Pure types, no imports at runtime, so plain Node tests can
// use them.

/** One day of a Forecast, in the place's own time zone. */
export type ForecastDay = {
  /** The calendar date at the place: "2026-10-10". */
  date: string;
  /** WMO weather code, as Open-Meteo gives it. */
  weatherCode: number;
  tempMaxC: number;
  tempMinC: number;
  /** The day's highest "feels like" temperature (heat index), when known. */
  feelsLikeMaxC: number | null;
  precipitationMm: number;
  /** Highest chance of rain in the day, 0–100, when known. */
  precipitationChance: number | null;
  windMaxKmh: number;
  gustMaxKmh: number | null;
};

/** A saved 7-day Forecast for one place, labelled with when it was fetched (CONTEXT.md). */
export type Forecast = {
  /** Which place: `destination:<id>` or `here` (the hiker's last known location). */
  key: string;
  latitude: number;
  longitude: number;
  /** When it was fetched, as an ISO 8601 timestamp. */
  fetchedAt: string;
  /** The place's offset from UTC, so "today" is the place's today, even offline. */
  utcOffsetSeconds: number;
  /** In date order, the fetch day first. */
  days: ForecastDay[];
};

/** A place to fetch a Forecast for. */
export type ForecastTarget = {
  key: string;
  latitude: number;
  longitude: number;
};

/** idle, a fetch running, or the last fetch failed (usually: offline). */
export type RefreshStatus = 'idle' | 'refreshing' | 'failed';

/** What a screen shows: the saved Forecast (undefined while it's read) and the refresh state. */
export type ForecastEntry = {
  forecast: Forecast | null | undefined;
  status: RefreshStatus;
};

export type WarningKind = 'thunderstorm' | 'heavyRain' | 'strongWind' | 'heat';

/** Coarse sky conditions, one icon and label each. */
export type Condition =
  | 'clear'
  | 'partlyCloudy'
  | 'cloudy'
  | 'fog'
  | 'drizzle'
  | 'rain'
  | 'showers'
  | 'snow'
  | 'thunderstorm';
