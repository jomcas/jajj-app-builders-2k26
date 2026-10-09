import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Pressable, StyleSheet, Text } from 'react-native';

import shellStrings from '../i18n/shell.strings';
import { useStrings, useTheme } from '../settings/preferences';
import { textStyles } from '../theme/typography';

/**
 * The always-visible SOS control at the top right of the header (docs/plan.md U2, ADR 0004):
 * a neutral button with a red icon. The shell owns where it sits; the Flare module will supply
 * what it does. Until then a tap does nothing.
 */
export function SosControl() {
  const { colors } = useTheme();
  const s = useStrings(shellStrings);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={s.sosLabel}
      accessibilityHint={s.sosHint}
      hitSlop={6}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: colors.surface, borderColor: colors.line, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <MaterialCommunityIcons name="alert-octagon-outline" size={20} color={colors.dangerIcon} />
      <Text style={[textStyles.signal, styles.label, { color: colors.dangerIcon }]}>{s.sosLabel}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  label: {
    includeFontPadding: false,
  },
});
