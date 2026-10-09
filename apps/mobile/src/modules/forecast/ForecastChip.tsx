import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { StyleSheet, Text, View } from 'react-native';

import { useStrings, useTheme } from '../../settings/preferences';
import { textStyles } from '../../theme/typography';
import { CONDITION_ICONS, useEntry, useNow } from './ForecastCard';
import { asOfText, conditionText, fill, tempsText, warningText } from './format';
import { conditionOf, isStale, remainingDays } from './rules';
import { destinationKey, type ForecastStore } from './store';
import strings from './strings';

/**
 * Today's Forecast for the Hike panel (docs/plan.md, U3): the sky, the high and low, and how
 * old the saved Forecast is. A weather warning turns it butter with an alert icon, never red
 * (ADR 0004). Reads only what was saved, so it works offline.
 */
export function createForecastChip(store: ForecastStore) {
  return function ForecastChip({ destinationId }: { destinationId: string }) {
    const s = useStrings(strings);
    const { colors } = useTheme();
    const { forecast } = useEntry(store, destinationKey(destinationId));
    const now = useNow();

    if (forecast === undefined) return null;
    const today = forecast ? (remainingDays(forecast, now)[0] ?? null) : null;

    if (!forecast || !today) {
      return (
        <View style={[styles.chip, { backgroundColor: colors.tint }]}>
          <MaterialCommunityIcons name="weather-cloudy-alert" size={20} color={colors.onTint} />
          <Text style={[textStyles.labelStrong, { color: colors.onTint }]}>{forecast ? s.chipExpired : s.chipNone}</Text>
        </View>
      );
    }

    const warned = today.warnings.length > 0;
    const background = warned ? colors.butter : colors.sky;
    const ink = warned ? colors.onButter : colors.onSky;
    const headline = warned
      ? today.warnings.map((kind) => warningText(s, kind)).join(', ')
      : conditionText(s, today.weatherCode);
    const temps = tempsText(s, today);
    const asOf = asOfText(s, forecast.fetchedAt, now);

    return (
      <View
        accessible
        accessibilityLabel={[warned ? fill(s.warningLabel, { warnings: headline }) : headline, temps, asOf].join('. ')}
        style={[styles.chip, { backgroundColor: background }]}
      >
        <MaterialCommunityIcons
          name={warned ? 'alert-outline' : CONDITION_ICONS[conditionOf(today.weatherCode)]}
          size={22}
          color={ink}
        />
        <View style={styles.text}>
          <Text style={[textStyles.bodyStrong, styles.numbers, { color: ink }]} numberOfLines={1}>
            {[headline, temps].join(' · ')}
          </Text>
          <Text
            style={[
              isStale(forecast.fetchedAt, now) ? textStyles.labelStrong : textStyles.label,
              { color: ink },
            ]}
            numberOfLines={1}
          >
            {asOf}
          </Text>
        </View>
      </View>
    );
  };
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    maxWidth: '100%',
  },
  text: {
    flexShrink: 1,
  },
  numbers: {
    fontVariant: ['tabular-nums'],
  },
});
