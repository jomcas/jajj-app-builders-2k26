// Display helpers for the Forecast. Pure (no React Native imports), tested under plain Node.

import { conditionOf, forecastAge, weekday, type ShownDay } from './rules.ts';
import type strings from './strings';
import type { Condition, WarningKind } from './types';

export type Strings = Record<keyof (typeof strings)['en'], string>;

/** Replaces each {name} in a catalog string with its value. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, name: string) => (name in values ? String(values[name]) : match));
}

/** "2 days ago", "just now", from the catalog. */
export function ageText(s: Strings, fetchedAt: string, now: Date): string {
  const age = forecastAge(fetchedAt, now);
  switch (age.unit) {
    case 'justNow':
      return s.ageJustNow;
    case 'minutes':
      return age.count === 1 ? s.ageMinute : fill(s.ageMinutes, { count: age.count });
    case 'hours':
      return age.count === 1 ? s.ageHour : fill(s.ageHours, { count: age.count });
    case 'days':
      return age.count === 1 ? s.ageDay : fill(s.ageDays, { count: age.count });
  }
}

/** "As of 2 days ago". */
export function asOfText(s: Strings, fetchedAt: string, now: Date): string {
  return fill(s.asOf, { age: ageText(s, fetchedAt, now) });
}

/** "Today", "Tomorrow", then the weekday. */
export function dayLabel(s: Strings, day: ShownDay): string {
  if (day.fromToday === 0) return s.today;
  if (day.fromToday === 1) return s.tomorrow;
  return s[`day${weekday(day.date)}` as `day${0 | 1 | 2 | 3 | 4 | 5 | 6}`];
}

const CONDITION_KEYS: Record<Condition, keyof Strings> = {
  clear: 'clear',
  partlyCloudy: 'partlyCloudy',
  cloudy: 'cloudy',
  fog: 'fog',
  drizzle: 'drizzle',
  rain: 'rainy',
  showers: 'showers',
  snow: 'snow',
  thunderstorm: 'thunderstorm',
};

export function conditionText(s: Strings, weatherCode: number): string {
  return s[CONDITION_KEYS[conditionOf(weatherCode)]];
}

const WARNING_KEYS: Record<WarningKind, keyof Strings> = {
  thunderstorm: 'warnThunderstorm',
  heavyRain: 'warnHeavyRain',
  strongWind: 'warnStrongWind',
  heat: 'warnHeat',
};

export function warningText(s: Strings, kind: WarningKind): string {
  return s[WARNING_KEYS[kind]];
}

/** "26° / 20°", rounded. */
export function tempsText(s: Strings, day: { tempMaxC: number; tempMinC: number }): string {
  return fill(s.temps, { max: Math.round(day.tempMaxC), min: Math.round(day.tempMinC) });
}

/** "70% rain" when the chance is known, else "6 mm rain"; null when it's dry. */
export function rainText(s: Strings, day: { precipitationMm: number; precipitationChance: number | null }): string | null {
  if (day.precipitationChance !== null) return day.precipitationChance > 0 ? fill(s.rainChance, { chance: day.precipitationChance }) : null;
  return day.precipitationMm > 0 ? fill(s.rain, { mm: Math.round(day.precipitationMm) }) : null;
}
