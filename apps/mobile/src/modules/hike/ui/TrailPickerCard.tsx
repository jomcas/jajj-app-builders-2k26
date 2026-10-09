import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { useStrings, useTheme } from '../../../settings/preferences';
import { textStyles } from '../../../theme/typography';
import type { Trail } from '../../destination-pack';
import { fill, formatKm } from '../format';
import strings from '../strings';
import { Panel, PanelButton } from './parts';

/**
 * Before a Hike: the downloaded Destination's Trails (name and distance) to choose from, the
 * simulated-walk switch for demos, and a large olive Start Hike button. A Hike needs a Trail.
 */
export function TrailPickerCard({
  trails,
  selectedId,
  onSelect,
  simulate,
  onSimulateChange,
  onStart,
}: {
  trails: readonly Trail[];
  selectedId: string | null;
  onSelect: (trailId: string) => void;
  simulate: boolean;
  onSimulateChange: (simulate: boolean) => void;
  onStart: () => void;
}) {
  const s = useStrings(strings);
  const { colors } = useTheme();

  return (
    <Panel>
      <Text accessibilityRole="header" style={[textStyles.heading, { color: colors.ink }]}>
        {s.pickTrail}
      </Text>
      {trails.length === 0 ? (
        <Text style={[textStyles.body, { color: colors.ink }]}>{s.noTrails}</Text>
      ) : (
        <View accessibilityRole="radiogroup" style={styles.list}>
          {trails.map((trail) => {
            const selected = trail.id === selectedId;
            return (
              <Pressable
                key={trail.id}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                onPress={() => onSelect(trail.id)}
                style={({ pressed }) => [
                  styles.trail,
                  {
                    backgroundColor: selected ? colors.tint : colors.surface,
                    borderColor: selected ? colors.primary : colors.line,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={selected ? 'radiobox-marked' : 'radiobox-blank'}
                  size={22}
                  color={selected ? colors.onTint : colors.muted}
                />
                <View style={[styles.tile, { backgroundColor: colors.peach }]}>
                  <MaterialCommunityIcons name="map-marker-path" size={18} color={colors.onPeach} />
                </View>
                <Text style={[textStyles.bodyStrong, styles.grow, { color: colors.ink }]}>{trail.name}</Text>
                <Text style={[textStyles.bodyStrong, styles.numbers, { color: colors.ink }]}>
                  {fill(s.trailDistance, { km: formatKm(trail.distanceM) })}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      <View style={styles.simRow}>
        <MaterialCommunityIcons name="walk" size={22} color={colors.onSky} />
        <View style={styles.grow}>
          <Text style={[textStyles.bodyStrong, { color: colors.ink }]}>{s.simulatedWalk}</Text>
          <Text style={[textStyles.label, { color: colors.muted }]}>{s.simulatedWalkHint}</Text>
        </View>
        <Switch
          accessibilityLabel={s.simulatedWalk}
          value={simulate}
          onValueChange={onSimulateChange}
          trackColor={{ false: colors.line, true: colors.sky }}
          thumbColor={simulate ? colors.onSky : colors.surface}
        />
      </View>

      <PanelButton
        label={s.startHike}
        icon="hiking"
        large
        onPress={onStart}
        disabled={selectedId === null || trails.length === 0}
      />
    </Panel>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 8,
  },
  trail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 52,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  tile: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grow: {
    flex: 1,
  },
  numbers: {
    fontVariant: ['tabular-nums'],
  },
  simRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
});
