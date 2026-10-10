// The Forecast: Open-Meteo parsing, age text, staleness and the days left, the refresh rule,
// the weather warning thresholds, and the store against fake storage, fetch and packs.
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { ageText, asOfText, dayLabel, rainText, tempsText } from '../src/modules/forecast/format.ts';
import { forecastUrl, parseForecast } from '../src/modules/forecast/openMeteo.ts';
import {
  REFRESH,
  STALE_AFTER_MS,
  conditionOf,
  dayWarnings,
  forecastAge,
  isStale,
  remainingDays,
  shouldRefresh,
} from '../src/modules/forecast/rules.ts';
import { createForecastStore, destinationKey, HERE_KEY, RETRY_DELAYS_MS } from '../src/modules/forecast/store.ts';
import strings from '../src/modules/forecast/strings.ts';
import type { ForecastDay } from '../src/modules/forecast/types.ts';

const BATULAO = { key: 'destination:batulao', latitude: 14.0397, longitude: 120.8027 };

/** Open-Meteo's daily response, as fetched for Batulao on 2026-10-10. */
function openMeteoJson(overrides: Record<string, unknown[]> = {}) {
  return {
    latitude: 14.094903,
    longitude: 120.80258,
    utc_offset_seconds: 28800,
    timezone: 'Asia/Manila',
    daily: {
      time: ['2026-10-10', '2026-10-11', '2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15', '2026-10-16'],
      weather_code: [95, 96, 95, 95, 95, 55, 51],
      temperature_2m_max: [25.7, 25.7, 26.4, 26.3, 26.4, 25.3, 25.8],
      temperature_2m_min: [20.4, 20.3, 20.5, 20.2, 19.3, 19.9, 20.5],
      apparent_temperature_max: [30.0, 30.0, 31.9, 31.2, 31.8, 28.7, 28.8],
      precipitation_sum: [6.8, 9.4, 6.3, 12.2, 7.8, 5.1, 0.6],
      precipitation_probability_max: [100, 100, 100, 100, 100, 75, 72],
      wind_speed_10m_max: [16.4, 16.8, 14.8, 9.4, 15.3, 15.2, 18.2],
      wind_gusts_10m_max: [35.6, 37.1, 30.6, 24.1, 31.0, 35.3, 41.8],
      ...overrides,
    },
  };
}

// 2026-10-10 09:00 in Manila (UTC+8).
const FETCHED = new Date('2026-10-10T01:00:00Z');
const at = (iso: string) => new Date(iso);

const calm: ForecastDay = {
  date: '2026-10-10',
  weatherCode: 2,
  tempMaxC: 27,
  tempMinC: 20,
  feelsLikeMaxC: 30,
  precipitationMm: 0,
  precipitationChance: 10,
  windMaxKmh: 12,
  gustMaxKmh: 25,
};

describe('Open-Meteo', () => {
  test('asks for 7 daily days in the place’s time zone, no key', () => {
    const url = forecastUrl(BATULAO);
    assert.match(url, /^https:\/\/api\.open-meteo\.com\/v1\/forecast\?/);
    assert.match(url, /latitude=14\.0397&longitude=120\.8027/);
    assert.match(url, /timezone=auto/);
    assert.match(url, /forecast_days=7/);
    assert.match(url, /daily=weather_code,temperature_2m_max,.*wind_gusts_10m_max/);
    assert.doesNotMatch(url, /apikey/i);
  });

  test('parses the daily columns into days, with the fetch time and UTC offset', () => {
    const forecast = parseForecast(openMeteoJson(), BATULAO, FETCHED);
    assert.equal(forecast.key, 'destination:batulao');
    assert.equal(forecast.fetchedAt, '2026-10-10T01:00:00.000Z');
    assert.equal(forecast.utcOffsetSeconds, 28800);
    assert.equal(forecast.days.length, 7);
    assert.deepEqual(forecast.days[0], {
      date: '2026-10-10',
      weatherCode: 95,
      tempMaxC: 25.7,
      tempMinC: 20.4,
      feelsLikeMaxC: 30,
      precipitationMm: 6.8,
      precipitationChance: 100,
      windMaxKmh: 16.4,
      gustMaxKmh: 35.6,
    });
  });

  test('optional columns may be missing or null', () => {
    const json = openMeteoJson();
    delete (json.daily as Record<string, unknown>).wind_gusts_10m_max;
    (json.daily.precipitation_probability_max as unknown[])[0] = null;
    const forecast = parseForecast(json, BATULAO, FETCHED);
    assert.equal(forecast.days[0].gustMaxKmh, null);
    assert.equal(forecast.days[0].precipitationChance, null);
  });

  test('rejects an error reply, a missing column, a bad number or a bad date', () => {
    assert.throws(() => parseForecast({ error: true, reason: 'Bad latitude' }, BATULAO, FETCHED), /Bad latitude/);
    assert.throws(() => parseForecast({ daily: {} }, BATULAO, FETCHED), /no time/);
    assert.throws(() => parseForecast(openMeteoJson({ temperature_2m_max: [null] }), BATULAO, FETCHED), /temperature_2m_max/);
    assert.throws(() => parseForecast(openMeteoJson({ time: ['10/10/2026'] }), BATULAO, FETCHED), /bad date/);
    assert.throws(() => parseForecast(openMeteoJson({ time: [] }), BATULAO, FETCHED), /no days/);
    assert.throws(() => parseForecast('<html>', BATULAO, FETCHED), /not an object/);
  });
});

describe('age', () => {
  const fetchedAt = FETCHED.toISOString();
  const after = (ms: number) => new Date(FETCHED.getTime() + ms);
  const MIN = 60_000;
  const HOUR = 60 * MIN;
  const DAY = 24 * HOUR;

  test('just now, then minutes, hours and days, rounded down', () => {
    assert.deepEqual(forecastAge(fetchedAt, after(90_000)), { unit: 'justNow' });
    assert.deepEqual(forecastAge(fetchedAt, after(2 * MIN)), { unit: 'minutes', count: 2 });
    assert.deepEqual(forecastAge(fetchedAt, after(59 * MIN + 59_000)), { unit: 'minutes', count: 59 });
    assert.deepEqual(forecastAge(fetchedAt, after(HOUR)), { unit: 'hours', count: 1 });
    assert.deepEqual(forecastAge(fetchedAt, after(23 * HOUR + 59 * MIN)), { unit: 'hours', count: 23 });
    assert.deepEqual(forecastAge(fetchedAt, after(2 * DAY + 5 * HOUR)), { unit: 'days', count: 2 });
  });

  test('a clock behind the fetch time reads as just now', () => {
    assert.deepEqual(forecastAge(fetchedAt, after(-HOUR)), { unit: 'justNow' });
  });

  test('reads in English and Filipino, singular and plural', () => {
    assert.equal(asOfText(strings.en, fetchedAt, after(2 * DAY + HOUR)), 'As of 2 days ago');
    assert.equal(ageText(strings.en, fetchedAt, after(DAY)), '1 day ago');
    assert.equal(ageText(strings.en, fetchedAt, after(HOUR)), '1 hour ago');
    assert.equal(ageText(strings.en, fetchedAt, after(5 * MIN)), '5 minutes ago');
    assert.equal(ageText(strings.en, fetchedAt, after(0)), 'just now');
    assert.equal(asOfText(strings.fil, fetchedAt, after(2 * DAY)), 'Kuha 2 araw na ang nakalipas');
  });

  test('is stale from 12 hours on', () => {
    assert.equal(isStale(fetchedAt, after(STALE_AFTER_MS - 1)), false);
    assert.equal(isStale(fetchedAt, after(STALE_AFTER_MS)), true);
    assert.equal(isStale('not a date', after(0)), true);
  });
});

describe('days left', () => {
  const forecast = parseForecast(openMeteoJson(), BATULAO, FETCHED);

  test('on the fetch day: all 7 days, today first, days 3–6 after the fetch less reliable', () => {
    const days = remainingDays(forecast, at('2026-10-10T10:00:00Z'));
    assert.deepEqual(
      days.map((day) => [day.date, day.fromToday, day.lessReliable]),
      [
        ['2026-10-10', 0, false],
        ['2026-10-11', 1, false],
        ['2026-10-12', 2, false],
        ['2026-10-13', 3, true],
        ['2026-10-14', 4, true],
        ['2026-10-15', 5, true],
        ['2026-10-16', 6, true],
      ],
    );
  });

  test('"today" is the place’s date: 17:00 UTC is already tomorrow in Manila', () => {
    assert.equal(remainingDays(forecast, at('2026-10-10T17:00:00Z'))[0].date, '2026-10-11');
  });

  test('read offline two days later: the past days drop out, reliability stays tied to the fetch', () => {
    const days = remainingDays(forecast, at('2026-10-12T02:00:00Z'));
    assert.equal(days.length, 5);
    assert.deepEqual(days[0], { ...days[0], date: '2026-10-12', fromToday: 0, lessReliable: false });
    assert.equal(days[1].lessReliable, true);
  });

  test('expires once all 7 days have passed', () => {
    assert.deepEqual(remainingDays(forecast, at('2026-10-17T02:00:00Z')), []);
  });

  test('labels: Today, Tomorrow, then the weekday', () => {
    const days = remainingDays(forecast, at('2026-10-10T10:00:00Z'));
    assert.deepEqual(
      days.slice(0, 4).map((day) => dayLabel(strings.en, day)),
      ['Today', 'Tomorrow', 'Mon', 'Tue'],
    );
    assert.equal(dayLabel(strings.fil, days[2]), 'Lun');
  });

  test('temperatures round; rain shows the chance, else the millimetres, else nothing', () => {
    assert.equal(tempsText(strings.en, { tempMaxC: 25.7, tempMinC: 20.4 }), '26° / 20°');
    assert.equal(rainText(strings.en, { precipitationMm: 6.8, precipitationChance: 100 }), '100% rain');
    assert.equal(rainText(strings.en, { precipitationMm: 6.8, precipitationChance: null }), '7 mm rain');
    assert.equal(rainText(strings.en, { precipitationMm: 0, precipitationChance: 0 }), null);
  });
});

describe('refresh rule', () => {
  const now = Date.parse('2026-10-10T05:00:00Z');
  const base = { fetchedAt: null, lastAttempt: null, inFlight: false, now };
  const ago = (ms: number) => new Date(now - ms).toISOString();

  test('fetches when there is no Forecast yet', () => {
    assert.equal(shouldRefresh(base), true);
  });

  test('leaves a Forecast under an hour old alone, refetches one older', () => {
    assert.equal(shouldRefresh({ ...base, fetchedAt: ago(REFRESH.freshForMs - 1) }), false);
    assert.equal(shouldRefresh({ ...base, fetchedAt: ago(REFRESH.freshForMs) }), true);
  });

  test('after a failed try (offline), tries again every 30 s: coming back online refreshes', () => {
    const failed = { at: now - 10_000, failed: true };
    assert.equal(shouldRefresh({ ...base, fetchedAt: ago(60_000), lastAttempt: failed }), false);
    const later = { at: now - REFRESH.retryEveryMs, failed: true };
    assert.equal(shouldRefresh({ ...base, fetchedAt: ago(60_000), lastAttempt: later }), true);
  });

  test('never while a fetch runs, even when forced', () => {
    assert.equal(shouldRefresh({ ...base, inFlight: true }), false);
    assert.equal(shouldRefresh({ ...base, inFlight: true, force: true }), false);
  });

  test('a tap forces it; a pack download lowers the age limit to a minute', () => {
    const justTried = { at: now - 1_000, failed: true };
    assert.equal(shouldRefresh({ ...base, fetchedAt: ago(1_000), lastAttempt: justTried, force: true }), true);
    const ok = { at: now - 5 * 60_000, failed: false };
    assert.equal(shouldRefresh({ ...base, fetchedAt: ago(5 * 60_000), lastAttempt: ok }), false);
    assert.equal(
      shouldRefresh({ ...base, fetchedAt: ago(5 * 60_000), lastAttempt: ok, freshForMs: REFRESH.afterPackDownloadMs }),
      true,
    );
  });
});

describe('weather warnings', () => {
  test('a calm day has none', () => {
    assert.deepEqual(dayWarnings(calm), []);
  });

  test('thunderstorms: WMO 95, 96 and 99', () => {
    for (const weatherCode of [95, 96, 99]) assert.deepEqual(dayWarnings({ ...calm, weatherCode }), ['thunderstorm']);
    assert.deepEqual(dayWarnings({ ...calm, weatherCode: 63 }), []);
  });

  test('heavy rain: 20 mm in the day, or heavy rain and violent showers codes', () => {
    assert.deepEqual(dayWarnings({ ...calm, precipitationMm: 19.9 }), []);
    assert.deepEqual(dayWarnings({ ...calm, precipitationMm: 20 }), ['heavyRain']);
    assert.deepEqual(dayWarnings({ ...calm, weatherCode: 65 }), ['heavyRain']);
    assert.deepEqual(dayWarnings({ ...calm, weatherCode: 82 }), ['heavyRain']);
  });

  test('strong wind: 39 km/h sustained or 60 km/h gusts', () => {
    assert.deepEqual(dayWarnings({ ...calm, windMaxKmh: 38.9, gustMaxKmh: 59.9 }), []);
    assert.deepEqual(dayWarnings({ ...calm, windMaxKmh: 39 }), ['strongWind']);
    assert.deepEqual(dayWarnings({ ...calm, gustMaxKmh: 60 }), ['strongWind']);
    assert.deepEqual(dayWarnings({ ...calm, windMaxKmh: 39, gustMaxKmh: null }), ['strongWind']);
  });

  test('heat: feels like 41 °C, or the plain high when feels-like is missing', () => {
    assert.deepEqual(dayWarnings({ ...calm, feelsLikeMaxC: 40.9 }), []);
    assert.deepEqual(dayWarnings({ ...calm, feelsLikeMaxC: 41 }), ['heat']);
    assert.deepEqual(dayWarnings({ ...calm, feelsLikeMaxC: null, tempMaxC: 41 }), ['heat']);
  });

  test('several at once, in a fixed order', () => {
    assert.deepEqual(dayWarnings({ ...calm, weatherCode: 96, precipitationMm: 40, gustMaxKmh: 80, feelsLikeMaxC: 43 }), [
      'thunderstorm',
      'heavyRain',
      'strongWind',
      'heat',
    ]);
  });

  test('remainingDays attaches them', () => {
    const forecast = parseForecast(openMeteoJson(), BATULAO, FETCHED);
    const days = remainingDays(forecast, FETCHED);
    assert.deepEqual(days[0].warnings, ['thunderstorm']);
    assert.deepEqual(days[6].warnings, []);
  });

  test('weather codes map to coarse conditions', () => {
    assert.deepEqual(
      [0, 1, 2, 3, 45, 53, 63, 80, 95, 71, 999].map(conditionOf),
      ['clear', 'clear', 'partlyCloudy', 'cloudy', 'fog', 'drizzle', 'rain', 'showers', 'thunderstorm', 'snow', 'cloudy'],
    );
  });
});

describe('store', () => {
  function setup(
    options: {
      online?: boolean;
      here?: { latitude: number; longitude: number } | null;
      retryDelaysMs?: readonly number[];
      failFirst?: number;
    } = {},
  ) {
    const saved = new Map<string, string>();
    const fetched: string[] = [];
    const packListeners = new Set<() => void>();
    const timers: (() => void)[] = [];
    const slept: number[] = [];
    let failuresLeft = options.failFirst ?? 0;
    const state = {
      online: options.online ?? true,
      now: new Date('2026-10-10T01:00:00Z'),
      downloaded: [{ id: 'batulao', latitude: 14.0397, longitude: 120.8027 }],
    };
    const store = createForecastStore({
      storage: {
        read: async (key) => saved.get(key) ?? null,
        write: async (key, text) => {
          saved.set(key, text);
        },
      },
      fetchJson: async (url) => {
        fetched.push(url);
        if (!state.online) throw new TypeError('Network request failed');
        if (failuresLeft > 0) {
          failuresLeft--;
          throw new TypeError('Network request failed');
        }
        return openMeteoJson();
      },
      packs: {
        listDownloaded: async () => state.downloaded,
        subscribe: (listener) => {
          packListeners.add(listener);
          return () => packListeners.delete(listener);
        },
      },
      lastKnownLocation: async () => options.here ?? null,
      now: () => state.now,
      retryDelaysMs: options.retryDelaysMs ?? [],
      sleep: async (ms) => {
        slept.push(ms);
      },
      setTimer: (run) => {
        timers.push(run);
        return () => {
          const i = timers.indexOf(run);
          if (i >= 0) timers.splice(i, 1);
        };
      },
    });
    const advance = (ms: number) => {
      state.now = new Date(state.now.getTime() + ms);
    };
    /** Fires the pending settle timer and waits for the refresh it starts. */
    const settle = async () => {
      const run = timers.splice(0).at(-1);
      run?.();
      await new Promise((resolve) => setTimeout(resolve, 0));
      await new Promise((resolve) => setTimeout(resolve, 0));
    };
    const notifyPacks = () => packListeners.forEach((listener) => listener());
    return { store, saved, fetched, slept, state, advance, settle, notifyPacks };
  }

  const key = destinationKey('batulao');

  test('saves a Forecast for each downloaded Destination and the last known location', async () => {
    const t = setup({ here: { latitude: 14.6, longitude: 121.0 } });
    await t.store.refreshDue();
    assert.equal(t.fetched.length, 2);
    assert.ok(t.saved.has(key));
    assert.ok(t.saved.has(HERE_KEY));
    const entry = t.store.getEntry(key);
    assert.equal(entry.status, 'idle');
    assert.equal(entry.forecast?.fetchedAt, '2026-10-10T01:00:00.000Z');
    assert.equal(entry.forecast?.days.length, 7);
  });

  test('offline, the saved Forecast still reads back after a restart, with its fetch time', async () => {
    const first = setup();
    await first.store.refreshDue();
    const second = setup({ online: false });
    for (const [k, v] of first.saved) second.saved.set(k, v);
    second.advance(2 * 24 * 60 * 60_000);
    assert.equal(second.store.getEntry(key).forecast, undefined); // reading
    await second.store.refreshDue();
    const entry = second.store.getEntry(key);
    assert.equal(entry.forecast?.fetchedAt, '2026-10-10T01:00:00.000Z');
    assert.equal(entry.status, 'failed');
  });

  test('downloading a Destination Pack saves its Forecast', async () => {
    const t = setup();
    t.state.downloaded = [];
    t.store.start();
    await t.store.refreshDue();
    assert.equal(t.fetched.length, 0);

    // The download: progress ticks, then the pack lands.
    t.notifyPacks();
    t.notifyPacks();
    t.state.downloaded = [{ id: 'batulao', latitude: 14.0397, longitude: 120.8027 }];
    t.notifyPacks();
    await t.settle();
    assert.equal(t.fetched.length, 1);
    assert.ok(t.saved.has(key));
  });

  test('a first fetch after a pack download that fails once is retried, not shown as failed', async () => {
    const t = setup({ failFirst: 1, retryDelaysMs: [...RETRY_DELAYS_MS] });
    t.state.downloaded = [];
    t.store.start();
    t.state.downloaded = [{ id: 'batulao', latitude: 14.0397, longitude: 120.8027 }];
    t.notifyPacks();
    await t.settle();
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.equal(t.fetched.length, 2);
    assert.deepEqual(t.slept, [RETRY_DELAYS_MS[0]]);
    assert.equal(t.store.getEntry(key).status, 'idle');
    assert.ok(t.saved.has(key));
  });

  test('offline, a fetch gives up after its retries and says it failed', async () => {
    const t = setup({ online: false, retryDelaysMs: [...RETRY_DELAYS_MS] });
    await t.store.refreshDue();
    assert.equal(t.fetched.length, 1 + RETRY_DELAYS_MS.length);
    assert.deepEqual(t.slept, [...RETRY_DELAYS_MS]);
    assert.equal(t.store.getEntry(key).status, 'failed');
  });

  test('re-downloading a pack refetches a Forecast older than a minute', async () => {
    const t = setup();
    t.store.start();
    await t.store.refreshDue();
    assert.equal(t.fetched.length, 1);

    t.advance(30_000);
    t.notifyPacks();
    await t.settle();
    assert.equal(t.fetched.length, 1, 'a 30 s old Forecast is kept');

    t.advance(REFRESH.afterPackDownloadMs);
    t.notifyPacks();
    await t.settle();
    assert.equal(t.fetched.length, 2);
  });

  test('refreshes by itself once the phone is back online', async () => {
    const t = setup();
    await t.store.refreshDue();
    t.state.online = false;
    t.advance(REFRESH.freshForMs);
    await t.store.refreshDue();
    assert.equal(t.store.getEntry(key).status, 'failed');
    const before = t.store.getEntry(key).forecast?.fetchedAt;

    // Ticks inside the retry interval don't try again.
    t.advance(REFRESH.retryEveryMs - 1);
    await t.store.refreshDue();
    assert.equal(t.fetched.length, 2);

    t.state.online = true;
    t.advance(1);
    await t.store.refreshDue();
    assert.equal(t.fetched.length, 3);
    const entry = t.store.getEntry(key);
    assert.equal(entry.status, 'idle');
    assert.notEqual(entry.forecast?.fetchedAt, before);
  });

  test('a hiker’s tap refreshes at once; a failure keeps the saved Forecast', async () => {
    const t = setup();
    await t.store.refreshDue();
    const saved = t.store.getEntry(key).forecast;
    t.state.online = false;
    await t.store.refreshKey(key);
    assert.equal(t.fetched.length, 2);
    assert.equal(t.store.getEntry(key).forecast, saved);
    assert.equal(t.store.getEntry(key).status, 'failed');
  });

  test('the location Forecast refetches when the hiker has moved 5 km', async () => {
    const here = { latitude: 14.6, longitude: 121.0 };
    const t = setup({ here });
    await t.store.refreshDue();
    assert.equal(t.fetched.length, 2);
    here.latitude += 0.1; // about 11 km north
    t.advance(REFRESH.retryEveryMs);
    await t.store.refreshDue();
    assert.equal(t.fetched.length, 3);
    assert.match(t.fetched[2], /latitude=14\.7000/);
  });

  test('getEntry returns the same object until it changes', async () => {
    const t = setup();
    await t.store.refreshDue();
    assert.equal(t.store.getEntry(key), t.store.getEntry(key));
  });
});
