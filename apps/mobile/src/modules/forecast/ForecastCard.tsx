import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Fragment, useEffect, useState, useSyncExternalStore, type ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useStrings, useTheme } from '../../settings/preferences';
import type { Palette } from '../../theme/tokens';
import { textStyles } from '../../theme/typography';
import { asOfText, conditionText, dayLabel, rainText, tempsText, warningText, type Strings } from './format';
import { conditionOf, isStale, remainingDays, type ShownDay } from './rules';
import { destinationKey, type ForecastStore } from './store';
import strings from './strings';
import type { Condition, ForecastEntry } from './types';

export type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

export const CONDITION_ICONS: Record<Condition, IconName> = {
  clear: 'weather-sunny',
  partlyCloudy: 'weather-partly-cloudy',
  cloudy: 'weather-cloudy',
  fog: 'weather-fog',
  drizzle: 'weather-rainy',
  rain: 'weather-pouring',
  showers: 'weather-rainy',
  snow: 'weather-snowy',
  thunderstorm: 'weather-lightning-rainy',
};

/** The saved Forecast for a key, kept current. */
export function useEntry(store: ForecastStore, key: string): ForecastEntry {
  return useSyncExternalStore(store.subscribe, () => store.getEntry(key));
}

/** The time now, ticking every minute, so "as of 5 minutes ago" moves on by itself. */
export function useNow(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);
  return now;
}

/** A butter tag: weather warnings and an old Forecast's age. Caution, never red (ADR 0004). */
function CautionTag({ icon, text, colors }: { icon: IconName; text: string; colors: Palette }) {
  return (
    <View style={[styles.tag, { backgroundColor: colors.butter }]}>
      <MaterialCommunityIcons name={icon} size={16} color={colors.onButter} />
      <Text style={[textStyles.labelStrong, { color: colors.onButter }]}>{text}</Text>
    </View>
  );
}

function DayRow({ day, label, s, colors }: { day: ShownDay; label: string; s: Strings; colors: Palette }) {
  const rain = rainText(s, day);
  const details = [conditionText(s, day.weatherCode), rain].filter(Boolean).join(' · ');
  return (
    <View
      style={[
        styles.day,
        { backgroundColor: colors.surface, borderColor: colors.line },
        day.lessReliable ? styles.lessReliable : null,
      ]}
    >
      <View style={[styles.tile, { backgroundColor: colors.sky }]}>
        <MaterialCommunityIcons name={CONDITION_ICONS[conditionOf(day.weatherCode)]} size={22} color={colors.onSky} />
      </View>
      <View style={styles.grow}>
        <Text style={[textStyles.bodyStrong, { color: colors.ink }]}>{label}</Text>
        <Text style={[textStyles.label, { color: colors.muted }]}>{details}</Text>
        {day.warnings.length > 0 ? (
          <View style={styles.tags}>
            {day.warnings.map((kind) => (
              <CautionTag key={kind} icon="alert-outline" text={warningText(s, kind)} colors={colors} />
            ))}
          </View>
        ) : null}
      </View>
      <Text style={[textStyles.bodyStrong, styles.numbers, { color: colors.ink }]}>{tempsText(s, day)}</Text>
    </View>
  );
}

/**
 * A Destination's saved Forecast, for its screen in Explore: how old it is, then a row per day
 * left (today first). Days well after the fetch are dimmed under a "less reliable" note.
 * Weather warnings are butter tags. Works offline: it only reads what was saved.
 */
export function createForecastCard(store: ForecastStore) {
  return function ForecastCard({ destinationId }: { destinationId: string }) {
    const s = useStrings(strings);
    const { colors } = useTheme();
    const key = destinationKey(destinationId);
    const { forecast, status } = useEntry(store, key);
    const now = useNow();

    const days = forecast ? remainingDays(forecast, now) : [];
    const firstLessReliable = days.findIndex((day) => day.lessReliable);

    return (
      <View style={styles.section}>
        <Text accessibilityRole="header" style={[textStyles.heading, { color: colors.ink }]}>
          {s.title}
        </Text>

        {forecast ? (
          <View style={styles.ageRow}>
            {isStale(forecast.fetchedAt, now) ? (
              <CautionTag icon="clock-alert-outline" text={asOfText(s, forecast.fetchedAt, now)} colors={colors} />
            ) : (
              <Text style={[textStyles.label, { color: colors.muted }]}>{asOfText(s, forecast.fetchedAt, now)}</Text>
            )}
            {status === 'refreshing' ? (
              <Text style={[textStyles.label, { color: colors.muted }]}>{s.refreshing}</Text>
            ) : null}
          </View>
        ) : null}

        {forecast === undefined ? (
          <Text style={[textStyles.body, { color: colors.muted }]}>{s.loading}</Text>
        ) : forecast === null ? (
          <Text style={[textStyles.body, { color: colors.muted }]}>
            {status === 'refreshing' ? s.refreshing : s.none}
          </Text>
        ) : days.length === 0 ? (
          <Text style={[textStyles.body, { color: colors.muted }]}>{s.expired}</Text>
        ) : (
          days.map((day, i) => (
            <Fragment key={day.date}>
              {i === firstLessReliable ? (
                <Text style={[textStyles.label, { color: colors.muted }]}>{s.lessReliable}</Text>
              ) : null}
              <DayRow
                day={day}
                label={day.lessReliable ? [dayLabel(s, day), s.lessReliableTag].join(' · ') : dayLabel(s, day)}
                s={s}
                colors={colors}
              />
            </Fragment>
          ))
        )}

        {status === 'failed' ? (
          <Text style={[textStyles.label, { color: colors.muted }]}>{s.refreshFailed}</Text>
        ) : null}

        {forecast !== undefined && status !== 'refreshing' ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => store.refreshKey(key)}
            hitSlop={8}
            style={({ pressed }) => [styles.refresh, { backgroundColor: colors.tint, opacity: pressed ? 0.8 : 1 }]}
          >
            <MaterialCommunityIcons name="refresh" size={18} color={colors.onTint} />
            <Text style={[textStyles.labelStrong, { color: colors.onTint }]}>{s.refresh}</Text>
          </Pressable>
        ) : null}
      </View>
    );
  };
}

const styles = StyleSheet.create({
  section: {
    gap: 8,
  },
  ageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  day: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  lessReliable: {
    opacity: 0.6,
    borderStyle: 'dashed',
  },
  tile: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grow: {
    flex: 1,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  numbers: {
    fontVariant: ['tabular-nums'],
  },
  refresh: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    gap: 6,
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
