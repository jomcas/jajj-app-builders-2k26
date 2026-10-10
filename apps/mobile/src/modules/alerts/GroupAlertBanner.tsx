import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useStrings, useTheme } from '../../settings/preferences';
import { textStyles } from '../../theme/typography';
import { fill, formatDistance } from '../hike/format';
import { useMembers } from './alertsStore';
import { memberDot, memberStatus, type Member } from './memberState';
import strings from './strings';
import type { AlertPosition } from './types';
import { memberLabel } from './useGroupAlerts';

/**
 * One banner per member in a Deviation or a Flare (ADR 0004: red with an icon and words).
 * Unlike this hiker's own Deviation banner (solid red), it is a light card with a thick red
 * border and the member's red initials badge, and it offers "Show on map". It goes away when
 * the member's Deviation clears or Flare stops.
 */
export function GroupAlertBanners({ onShowOnMap }: { onShowOnMap: (position: AlertPosition) => void }) {
  const members = useMembers();
  const alerting = Object.values(members).filter((member) => memberStatus(member) !== 'ok');
  if (alerting.length === 0) return null;
  return (
    <>
      {alerting.map((member) => (
        <MemberBanner key={member.id} member={member} onShowOnMap={onShowOnMap} />
      ))}
    </>
  );
}

function MemberBanner({ member, onShowOnMap }: { member: Member; onShowOnMap: (position: AlertPosition) => void }) {
  const s = useStrings(strings);
  const { colors } = useTheme();
  const status = memberStatus(member);
  const dot = memberDot(status);
  const name = memberLabel(member, s);
  const title =
    status === 'flare'
      ? fill(s.memberFlare, { name })
      : member.offTrailM === null
        ? fill(s.memberOffTrailNoDistance, { name })
        : fill(s.memberOffTrail, { name, distance: formatDistance(member.offTrailM) });
  const position = member.position;

  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
      style={[styles.banner, { backgroundColor: colors.surface, borderColor: colors.danger }]}
    >
      <View style={styles.row}>
        <View style={[styles.badge, { backgroundColor: colors.danger }]}>
          <MaterialCommunityIcons name={dot.icon ?? 'alert'} size={24} color={colors.onDanger} />
        </View>
        <View style={styles.grow}>
          <Text style={[textStyles.bodyStrong, styles.numbers, { color: colors.ink }]}>{title}</Text>
          <Text style={[textStyles.label, { color: colors.muted }]}>
            {status === 'flare' ? s.memberFlareHint : s.memberOffTrailHint}
          </Text>
        </View>
      </View>
      {position ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => onShowOnMap(position)}
          style={({ pressed }) => [styles.button, { backgroundColor: colors.danger, opacity: pressed ? 0.85 : 1 }]}
        >
          <MaterialCommunityIcons name="crosshairs-gps" size={18} color={colors.onDanger} />
          <Text style={[textStyles.labelStrong, { color: colors.onDanger }]}>{s.showOnMap}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: 14,
    borderWidth: 3,
    padding: 10,
    gap: 8,
    elevation: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  badge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grow: {
    flex: 1,
  },
  numbers: {
    fontVariant: ['tabular-nums'],
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    minHeight: 40,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
});
