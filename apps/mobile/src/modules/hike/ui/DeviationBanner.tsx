import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { StyleSheet, Text, View } from 'react-native';

import { useStrings, useTheme } from '../../../settings/preferences';
import { textStyles } from '../../../theme/typography';
import { arrowRotationDeg, compassPoint } from '../deviation/direction';
import { fill, formatDistance } from '../format';
import strings from '../strings';

/**
 * A Deviation (issue #8): brick red with white text at the top of the map (docs/plan.md, U3),
 * and never red alone (ADR 0004): a warning icon, the words "Off the Trail" with the distance,
 * the compass direction of the Trail, and an arrow pointing at the nearest point of the Trail
 * on the map (see deviation/direction.ts for why the arrow follows the map, not the phone).
 */
export function DeviationBanner({
  offTrailM,
  bearingDeg,
  mapBearingDeg,
}: {
  offTrailM: number;
  /** Compass bearing from the hiker to the nearest point of the Trail. */
  bearingDeg: number | null;
  /** How far the map is turned from north-up, in degrees. */
  mapBearingDeg: number;
}) {
  const s = useStrings(strings);
  const { colors } = useTheme();
  const rotation = arrowRotationDeg(bearingDeg, mapBearingDeg);
  const hint =
    bearingDeg === null
      ? s.deviationHintBack
      : fill(s.deviationHint, { direction: s[`dir_${compassPoint(bearingDeg)}`] });

  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
      style={[styles.banner, { backgroundColor: colors.danger, borderColor: colors.onDanger }]}
    >
      <MaterialCommunityIcons name="alert" size={30} color={colors.onDanger} />
      <View style={styles.grow}>
        <Text style={[textStyles.heading, styles.numbers, { color: colors.onDanger }]}>
          {fill(s.deviationTitle, { distance: formatDistance(offTrailM) })}
        </Text>
        <Text style={[textStyles.bodyStrong, { color: colors.onDanger }]}>{hint}</Text>
      </View>
      {rotation === null ? null : (
        <View
          accessible
          accessibilityLabel={s.deviationArrow}
          style={[styles.arrow, { backgroundColor: colors.onDanger }]}
        >
          <MaterialCommunityIcons
            name="arrow-up-bold"
            size={40}
            color={colors.danger}
            style={{ transform: [{ rotate: `${rotation}deg` }] }}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    borderWidth: 2,
    paddingVertical: 10,
    paddingHorizontal: 12,
    elevation: 4,
  },
  grow: {
    flex: 1,
  },
  numbers: {
    fontVariant: ['tabular-nums'],
  },
  arrow: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
