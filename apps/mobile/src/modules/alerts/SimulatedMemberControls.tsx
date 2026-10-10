import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useStrings, useTheme } from '../../settings/preferences';
import { textStyles } from '../../theme/typography';
import { fill } from '../hike/format';
import strings from './strings';
import { removeSimulatedMember, SIMULATED_MEMBER, triggerSimulatedIncident, useSimulatedMember } from './simulatedMember';

/**
 * The demo controls for the simulated group member: add it, run its scripted incident (off
 * the Trail, back, then the Flare), remove it. Shown in the simulation bar, or on its own
 * card during a GPS Hike.
 */
export function SimulatedMemberControls({ onAdd, card = false }: { onAdd: () => void; card?: boolean }) {
  const s = useStrings(strings);
  const { colors } = useTheme();
  const { present, incident } = useSimulatedMember();
  const buttonStyle = ({ pressed }: { pressed: boolean }) => [
    styles.button,
    { backgroundColor: colors.surface, borderColor: colors.line, opacity: pressed ? 0.85 : 1 },
  ];

  return (
    <View style={[styles.row, card ? [styles.card, { backgroundColor: colors.surface, borderColor: colors.line }] : null]}>
      {present ? (
        <>
          <Pressable accessibilityRole="button" disabled={incident} onPress={triggerSimulatedIncident} style={buttonStyle}>
            <MaterialCommunityIcons name="account-alert" size={18} color={colors.ink} />
            <Text style={[textStyles.labelStrong, { color: colors.ink }]}>
              {fill(incident ? s.memberIncidentRunning : s.memberIncident, { name: SIMULATED_MEMBER.name })}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityHint={s.removeMemberHint}
            onPress={removeSimulatedMember}
            style={buttonStyle}
          >
            <MaterialCommunityIcons name="account-remove" size={18} color={colors.ink} />
            <Text style={[textStyles.labelStrong, { color: colors.ink }]}>{s.removeMember}</Text>
          </Pressable>
        </>
      ) : (
        <Pressable accessibilityRole="button" accessibilityHint={s.addMemberHint} onPress={onAdd} style={buttonStyle}>
          <MaterialCommunityIcons name="account-plus" size={18} color={colors.ink} />
          <Text style={[textStyles.labelStrong, { color: colors.ink }]}>{s.addMember}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 40,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
});
