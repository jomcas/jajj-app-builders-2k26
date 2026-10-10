import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Marker } from '@maplibre/maplibre-react-native';
import { useEffect, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../../settings/preferences';
import { textStyles } from '../../../theme/typography';

/** A Group Hike member's dot, as the Hike screen hands it to the map (from the alerts module). */
export type MapMember = {
  id: string;
  /** Two letters on the dot, e.g. "AN". */
  initials: string;
  /** The caption under the dot, e.g. "Ana (simulated)". */
  label: string;
  /** What a screen reader says for the dot. */
  accessibilityLabel: string;
  latitude: number;
  longitude: number;
  /** ADR 0004: olive, or red with an icon only during a Deviation or a Flare. */
  dot: { fill: 'olive' | 'danger'; icon: 'map-marker-alert' | 'alarm-light' | null; pulse: boolean };
};

/**
 * Group Hike members on the map (#24, docs/plan.md): olive dots with initials and a name
 * caption; red with an icon during a Deviation, and a pulsing red ring during a Flare. A tap
 * centres the map on the member.
 */
export function MemberMarkers({
  members,
  onPress,
}: {
  members: readonly MapMember[];
  onPress: (member: MapMember) => void;
}) {
  return (
    <>
      {members.map((member) => (
        <Marker key={member.id} id={`member-${member.id}`} lngLat={[member.longitude, member.latitude]} anchor="top">
          <MemberDotView member={member} onPress={onPress} />
        </Marker>
      ))}
    </>
  );
}

const DOT = 36;
const RING = 64;

function MemberDotView({ member, onPress }: { member: MapMember; onPress: (member: MapMember) => void }) {
  const { colors } = useTheme();
  const danger = member.dot.fill === 'danger';
  const fill = danger ? colors.danger : colors.primary;
  const ink = danger ? colors.onDanger : colors.onPrimary;
  const [pulse] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!member.dot.pulse) return;
    const loop = Animated.loop(
      Animated.timing(pulse, { toValue: 1, duration: 1200, useNativeDriver: true }),
    );
    loop.start();
    return () => {
      loop.stop();
      pulse.setValue(0);
    };
  }, [member.dot.pulse, pulse]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={member.accessibilityLabel}
      onPress={() => onPress(member)}
      style={styles.wrap}
      hitSlop={8}
    >
      <View style={styles.ringBox}>
        {member.dot.pulse ? (
          <Animated.View
            style={[
              styles.ring,
              {
                borderColor: colors.danger,
                opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.9, 0] }),
                transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.4] }) }],
              },
            ]}
          />
        ) : null}
        <View style={[styles.dot, { backgroundColor: fill, borderColor: colors.surface }]}>
          <Text style={[styles.initials, { color: ink }]}>{member.initials}</Text>
        </View>
        {member.dot.icon ? (
          <View style={[styles.icon, { backgroundColor: colors.surface, borderColor: colors.danger }]}>
            <MaterialCommunityIcons name={member.dot.icon} size={14} color={colors.danger} />
          </View>
        ) : null}
      </View>
      <View style={[styles.caption, { backgroundColor: colors.surface, borderColor: danger ? colors.danger : colors.line }]}>
        <Text style={[textStyles.label, styles.captionText, { color: colors.ink }]}>{member.label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    // The marker anchors at its top, so the dot's centre sits on the member's position.
    marginTop: -RING / 2,
  },
  ringBox: {
    width: RING,
    height: RING,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: RING,
    height: RING,
    borderRadius: RING / 2,
    borderWidth: 4,
  },
  dot: {
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontSize: 13,
    fontWeight: '700',
  },
  icon: {
    position: 'absolute',
    top: 8,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  caption: {
    marginTop: -6,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    borderWidth: 1,
  },
  captionText: {
    fontSize: 12,
  },
});
