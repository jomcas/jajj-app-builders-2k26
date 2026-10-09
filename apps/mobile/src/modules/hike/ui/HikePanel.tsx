import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { StyleSheet, Text, View } from 'react-native';

import { useStrings, useTheme } from '../../../settings/preferences';
import { textStyles } from '../../../theme/typography';
import { fill, formatDistance, pad2, splitDuration } from '../format';
import strings from '../strings';
import type { HikeView } from '../trail/progress';
import { Panel, PanelButton, WAYPOINT_ICONS } from './parts';

type Strings = Record<keyof (typeof strings)['en'], string>;

function etaText(s: Strings, seconds: number): string {
  const { hours, minutes } = splitDuration(seconds);
  if (hours === 0) return minutes === 0 ? s.etaUnderMinute : fill(s.etaMinutes, { minutes });
  return fill(s.etaHours, { hours, minutes: pad2(minutes) });
}

/**
 * During a Hike: the next Waypoint (type icon and name), a peach chip with the distance along
 * the Trail and the ETA, the orange progress bar, and End Hike (docs/plan.md, U3). The space
 * under the progress bar is where Wave 3's Forecast and water chips go.
 */
export function HikePanel({
  trailName,
  view,
  onEnd,
}: {
  trailName: string;
  /** null until the first position arrives. */
  view: HikeView | null;
  onEnd: () => void;
}) {
  const s = useStrings(strings);
  const { colors } = useTheme();
  const percent = view ? Math.round(view.progress * 100) : 0;
  const next = view?.next ?? null;
  const water = next?.waypoint.type === 'water';

  return (
    <Panel>
      <Text style={[textStyles.labelStrong, { color: colors.muted }]} numberOfLines={1}>
        {fill(s.hikeOn, { trail: trailName })}
      </Text>

      {!view ? (
        <Text accessibilityLiveRegion="polite" style={[textStyles.body, { color: colors.ink }]}>
          {s.waitingForPosition}
        </Text>
      ) : next ? (
        <View style={styles.next} accessibilityLiveRegion="polite">
          <View style={[styles.tile, { backgroundColor: water ? colors.sky : colors.tint, borderColor: colors.trail }]}>
            <MaterialCommunityIcons
              name={WAYPOINT_ICONS[next.waypoint.type]}
              size={26}
              color={water ? colors.onSky : colors.onTint}
            />
          </View>
          <View style={styles.grow}>
            <Text style={[textStyles.label, { color: colors.muted }]}>
              {fill(s.nextWaypoint, { type: s[next.waypoint.type] })}
            </Text>
            <Text style={[textStyles.heading, { color: colors.ink }]} numberOfLines={2}>
              {next.waypoint.name}
            </Text>
          </View>
        </View>
      ) : (
        <Text accessibilityLiveRegion="polite" style={[textStyles.bodyStrong, { color: colors.ink }]}>
          {view.leg === 'up' ? s.atTop : s.atJumpOff}
        </Text>
      )}

      {next ? (
        <View style={[styles.chip, { backgroundColor: colors.peach }]}>
          <MaterialCommunityIcons name="map-marker-distance" size={20} color={colors.onPeach} />
          <Text style={[styles.chipText, { color: colors.onPeach }]}>
            {fill(s.distanceEta, { distance: formatDistance(next.distanceM), eta: etaText(s, next.etaS) })}
          </Text>
        </View>
      ) : null}

      {view ? (
        <View style={styles.progress}>
          <Text style={[textStyles.labelStrong, styles.numbers, { color: colors.ink }]}>
            {fill(view.leg === 'up' ? s.progressUp : s.progressDown, { percent })}
          </Text>
          <View
            accessibilityRole="progressbar"
            accessibilityLabel={s.progressLabel}
            accessibilityValue={{ min: 0, max: 100, now: percent }}
            style={[styles.track, { backgroundColor: colors.peach, borderColor: colors.trailOutline }]}
          >
            <View style={[styles.bar, { backgroundColor: colors.trail, width: `${percent}%` }]} />
          </View>
        </View>
      ) : null}

      <PanelButton label={s.endHike} icon="flag-checkered" onPress={onEnd} />
    </Panel>
  );
}

const styles = StyleSheet.create({
  next: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tile: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grow: {
    flex: 1,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  chipText: {
    ...textStyles.number,
    fontSize: 22,
    lineHeight: 26,
  },
  progress: {
    gap: 6,
  },
  track: {
    height: 12,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 6,
  },
  numbers: {
    fontVariant: ['tabular-nums'],
  },
});
