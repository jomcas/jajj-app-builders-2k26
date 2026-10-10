import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useState, type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useStrings, useTheme } from '../../../settings/preferences';
import { textStyles } from '../../../theme/typography';
import type { Trail } from '../../destination-pack';
import { fill, formatKm } from '../format';
import type { DestinationChoice } from '../latestPack';
import strings from '../strings';
import { Panel, PanelButton } from './parts';

/** A small sheet from the bottom of the screen, over a scrim that closes it. */
function Sheet({
  visible,
  onClose,
  title,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const s = useStrings(strings);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={s.close}
        style={[styles.grow, { backgroundColor: colors.scrim }]}
        onPress={onClose}
      />
      <View style={[styles.sheet, { backgroundColor: colors.surface, paddingBottom: 16 + insets.bottom }]}>
        <Text accessibilityRole="header" style={[textStyles.title, { color: colors.ink }]}>
          {title}
        </Text>
        {children}
        <PanelButton label={s.close} onPress={onClose} />
      </View>
    </Modal>
  );
}

/**
 * Which downloaded Destination the Hike tab shows ("Mt. Batulao ▾"), with a sheet listing
 * every downloaded one (issue #52). Locked during a Hike.
 */
function DestinationChooser({
  destinationId,
  destinations,
  onChoose,
  locked,
}: {
  destinationId: string;
  destinations: readonly DestinationChoice[];
  onChoose: (destinationId: string) => void;
  locked: boolean;
}) {
  const s = useStrings(strings);
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const current = destinations.find((choice) => choice.id === destinationId);
  const canSwitch = !locked && destinations.length > 1;

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={fill(s.destinationCurrent, { name: current?.name ?? '' })}
        accessibilityHint={locked ? s.destinationLockedHint : s.destinationHint}
        accessibilityState={{ disabled: !canSwitch }}
        disabled={!canSwitch}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          styles.chooser,
          { borderColor: colors.line, backgroundColor: colors.surface, opacity: pressed ? 0.85 : 1 },
        ]}
      >
        <MaterialCommunityIcons name="terrain" size={22} color={colors.primary} />
        <Text style={[textStyles.bodyStrong, styles.grow, { color: colors.ink }]}>{current?.name}</Text>
        {canSwitch ? <MaterialCommunityIcons name="chevron-down" size={24} color={colors.ink} /> : null}
      </Pressable>
      <Sheet visible={open} onClose={() => setOpen(false)} title={s.chooseDestination}>
        <View accessibilityRole="radiogroup" style={styles.list}>
          {destinations.map((choice) => {
            const selected = choice.id === destinationId;
            return (
              <Pressable
                key={choice.id}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                onPress={() => {
                  setOpen(false);
                  if (!selected) onChoose(choice.id);
                }}
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
                <Text style={[textStyles.bodyStrong, styles.grow, { color: colors.ink }]}>{choice.name}</Text>
              </Pressable>
            );
          })}
        </View>
      </Sheet>
    </>
  );
}

/**
 * Solo | Group (issue #24). Solo Hike is the default and the only one that starts; Group is
 * marked "Coming soon" and only opens a sheet saying so. Olive only, never red.
 */
function HikeModeChoice() {
  const s = useStrings(strings);
  const { colors } = useTheme();
  const [groupInfo, setGroupInfo] = useState(false);

  return (
    <>
      <View
        accessibilityRole="radiogroup"
        accessibilityLabel={s.hikeModeLabel}
        style={[styles.segmented, { borderColor: colors.line }]}
      >
        <Pressable
          accessibilityRole="radio"
          accessibilityState={{ checked: true }}
          style={[styles.segment, { backgroundColor: colors.primary }]}
        >
          <MaterialCommunityIcons name="account" size={18} color={colors.onPrimary} />
          <Text style={[textStyles.bodyStrong, { color: colors.onPrimary }]}>{s.soloHike}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="radio"
          accessibilityState={{ checked: false }}
          accessibilityHint={s.comingSoon}
          onPress={() => setGroupInfo(true)}
          style={({ pressed }) => [styles.segment, { opacity: pressed ? 0.85 : 1 }]}
        >
          <MaterialCommunityIcons name="account-group" size={18} color={colors.muted} />
          <Text style={[textStyles.bodyStrong, { color: colors.muted }]}>{s.groupHike}</Text>
          <View style={[styles.badge, { backgroundColor: colors.tint }]}>
            <Text style={[textStyles.label, { color: colors.onTint }]}>{s.comingSoon}</Text>
          </View>
        </Pressable>
      </View>
      <Sheet visible={groupInfo} onClose={() => setGroupInfo(false)} title={s.groupSheetTitle}>
        <View style={styles.simRow}>
          <MaterialCommunityIcons name="qrcode" size={28} color={colors.primary} />
          <Text style={[textStyles.body, styles.grow, { color: colors.ink }]}>{s.groupSheetBody}</Text>
        </View>
      </Sheet>
    </>
  );
}

/**
 * Before a Hike: the Destination choice, Solo | Group, the downloaded Destination's Trails (name and distance) to choose from, the
 * simulated-walk switch for demos, and a large olive Start Hike button. A Hike needs a Trail.
 */
export function TrailPickerCard({
  destinationId,
  destinations,
  onChooseDestination,
  destinationLocked,
  trails,
  selectedId,
  onSelect,
  simulate,
  onSimulateChange,
  onStart,
}: {
  destinationId: string;
  destinations: readonly DestinationChoice[];
  onChooseDestination: (destinationId: string) => void;
  destinationLocked: boolean;
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
      <DestinationChooser
        destinationId={destinationId}
        destinations={destinations}
        onChoose={onChooseDestination}
        locked={destinationLocked}
      />
      <HikeModeChoice />
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
  chooser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 48,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  segmented: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 6,
    minHeight: 48,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  badge: {
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 14,
  },
  simRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
});
