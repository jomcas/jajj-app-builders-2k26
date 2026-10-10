import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useSyncExternalStore, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useStrings, useTheme } from '../../../settings/preferences';
import { textStyles } from '../../../theme/typography';
import { fill } from '../format';
import type { SimulatedWalk } from '../simulate/player';
import { SPEEDS } from '../simulate/simLink';
import { simulationLine } from '../simulate/simulationLine';
import strings from '../strings';

/**
 * Says, the whole time a simulated walk runs, that the position is simulated, at what speed,
 * and how far off the Trail the walk really is (see simulate/simulationLine.ts). Also changes
 * the speed and sends the walk off the Trail on demand (for #8's Deviation). Sky, the info
 * colour; never red.
 */
export function SimulationBar({
  walk,
  offTrailM,
  children,
}: {
  walk: SimulatedWalk;
  /** The real distance from the whole Trail, as the Deviation measures it; null before a position. */
  offTrailM: number | null;
  /** Extra demo controls on their own row (the simulated group member, #24). */
  children?: ReactNode;
}) {
  const s = useStrings(strings);
  const { colors } = useTheme();
  const sim = useSyncExternalStore(walk.subscribe, walk.getSnapshot);
  const nextSpeed = SPEEDS.find((speed) => speed > sim.speed) ?? SPEEDS[0];

  return (
    <View
      accessibilityLiveRegion="polite"
      style={[styles.bar, { backgroundColor: colors.sky, borderColor: colors.onSky }]}
    >
      <View style={styles.row}>
        <MaterialCommunityIcons name="walk" size={22} color={colors.onSky} />
        <View style={styles.grow}>
          <Text style={[textStyles.bodyStrong, styles.numbers, { color: colors.onSky }]}>
            {sim.paused
              ? `${s.simulationPausedNote} · ${Math.round(sim.speed)}×`
              : fill(s.simulationRunning, { speed: Math.round(sim.speed) })}
          </Text>
          <Text style={[textStyles.label, styles.numbers, { color: colors.onSky }]}>
            {simulationLine(offTrailM, s)}
          </Text>
        </View>
      </View>
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={sim.paused ? s.simulationResume : s.simulationPause}
          onPress={() => (sim.paused ? walk.resume() : walk.pause())}
          style={({ pressed }) => [styles.button, { backgroundColor: colors.surface, opacity: pressed ? 0.85 : 1 }]}
        >
          <MaterialCommunityIcons name={sim.paused ? 'play' : 'pause'} size={18} color={colors.ink} />
          <Text style={[textStyles.labelStrong, { color: colors.ink }]}>
            {sim.paused ? s.simulationResume : s.simulationPause}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityHint={s.simulationSpeedHint}
          onPress={() => walk.setSpeed(nextSpeed)}
          style={({ pressed }) => [styles.button, { backgroundColor: colors.surface, opacity: pressed ? 0.85 : 1 }]}
        >
          <MaterialCommunityIcons name="fast-forward" size={18} color={colors.ink} />
          <Text style={[textStyles.labelStrong, styles.numbers, { color: colors.ink }]}>
            {fill(s.simulationSpeed, { speed: nextSpeed })}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => walk.goOffTrail()}
          style={({ pressed }) => [styles.button, { backgroundColor: colors.surface, opacity: pressed ? 0.85 : 1 }]}
        >
          <MaterialCommunityIcons name="call-split" size={18} color={colors.ink} />
          <Text style={[textStyles.labelStrong, { color: colors.ink }]}>{s.goOffTrail}</Text>
        </Pressable>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 10,
    gap: 8,
    elevation: 3,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
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
    gap: 6,
    minHeight: 40,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
});
