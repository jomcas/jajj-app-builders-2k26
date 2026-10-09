// Open-Meteo's free 7-day forecast API (no key): the request URL and the parser for its daily
// response. Pure, no runtime imports, tested under plain Node.
// https://open-meteo.com/en/docs

import type { Forecast, ForecastDay, ForecastTarget } from './types';

const DAILY = [
  'weather_code',
  'temperature_2m_max',
  'temperature_2m_min',
  'apparent_temperature_max',
  'precipitation_sum',
  'precipitation_probability_max',
  'wind_speed_10m_max',
  'wind_gusts_10m_max',
] as const;

export const FORECAST_DAYS = 7;

/** The request for a place's 7-day daily Forecast, in the place's own time zone. */
export function forecastUrl(target: ForecastTarget): string {
  const params = [
    `latitude=${target.latitude.toFixed(4)}`,
    `longitude=${target.longitude.toFixed(4)}`,
    `daily=${DAILY.join(',')}`,
    'timezone=auto',
    `forecast_days=${FORECAST_DAYS}`,
  ];
  return `https://api.open-meteo.com/v1/forecast?${params.join('&')}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Turns Open-Meteo's JSON into a Forecast. Throws when the shape is wrong or a day misses a
 * required number; optional values (feels-like, rain chance, gusts) may be null.
 */
export function parseForecast(json: unknown, target: ForecastTarget, fetchedAt: Date): Forecast {
  if (!isRecord(json)) throw new Error('Forecast: not an object');
  if (json.error === true) throw new Error(`Forecast: ${String(json.reason ?? 'error')}`);
  const daily = json.daily;
  if (!isRecord(daily)) throw new Error('Forecast: no daily data');

  const column = (name: string): unknown[] => {
    const values = daily[name];
    if (!Array.isArray(values)) throw new Error(`Forecast: no ${name}`);
    return values;
  };
  const dates = column('time');
  const required = (name: string, i: number): number => {
    const value = column(name)[i];
    if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error(`Forecast: bad ${name}[${i}]`);
    return value;
  };
  const optional = (name: string, i: number): number | null => {
    const values = daily[name];
    const value = Array.isArray(values) ? values[i] : null;
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
  };

  const days: ForecastDay[] = dates.map((date, i) => {
    if (typeof date !== 'string' || !DATE.test(date)) throw new Error(`Forecast: bad date [${i}]`);
    return {
      date,
      weatherCode: required('weather_code', i),
      tempMaxC: required('temperature_2m_max', i),
      tempMinC: required('temperature_2m_min', i),
      feelsLikeMaxC: optional('apparent_temperature_max', i),
      precipitationMm: required('precipitation_sum', i),
      precipitationChance: optional('precipitation_probability_max', i),
      windMaxKmh: required('wind_speed_10m_max', i),
      gustMaxKmh: optional('wind_gusts_10m_max', i),
    };
  });
  if (days.length === 0) throw new Error('Forecast: no days');

  const offset = json.utc_offset_seconds;
  return {
    key: target.key,
    latitude: target.latitude,
    longitude: target.longitude,
    fetchedAt: fetchedAt.toISOString(),
    utcOffsetSeconds: typeof offset === 'number' && Number.isFinite(offset) ? offset : 0,
    days,
  };
}
