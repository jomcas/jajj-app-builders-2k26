import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useIsFocused } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import shellStrings from '../i18n/shell.strings';
import { sosAction } from '../modules';
import { useStrings, useTheme } from '../settings/preferences';
import { textStyles } from '../theme/typography';

const useNeverActive = () => false;
// Picked once at load, so the hook below is always the same one.
const useSosActive = sosAction?.useActive ?? useNeverActive;
const SosScreen = sosAction?.Screen;

/**
 * The always-visible SOS control at the top right of the header (docs/plan.md U2, ADR 0004).
 * The shell owns where it sits; the module that supplies `sos` (the Flare) owns what it does:
 * a tap opens its screen. Neutral with a red icon, and fully red only while that module says
 * its signal is active.
 */
export function SosControl() {
  const { colors } = useTheme();
  const s = useStrings(shellStrings);
  const active = useSosActive();
  const [open, setOpen] = useState(false);
  // Each tab has its own header, so only the focused tab's control answers a request to open
  // the screen without a tap (the Assistant's Flare tool, issue #19).
  const focused = useIsFocused();
  useEffect(() => (focused ? sosAction?.onOpenRequest?.(() => setOpen(true)) : undefined), [focused]);

  const fill = active ? colors.danger : colors.surface;
  const border = active ? colors.danger : colors.line;
  const ink = active ? colors.onDanger : colors.dangerIcon;

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={active ? s.sosActiveLabel : s.sosLabel}
        accessibilityHint={s.sosHint}
        hitSlop={6}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: fill, borderColor: border, opacity: pressed ? 0.7 : 1 },
        ]}
      >
        <MaterialCommunityIcons name={active ? 'alert-octagon' : 'alert-octagon-outline'} size={20} color={ink} />
        <Text style={[textStyles.signal, styles.label, { color: ink }]}>{s.sosLabel}</Text>
      </Pressable>
      {SosScreen ? <SosScreen visible={open} onClose={() => setOpen(false)} /> : null}
    </>
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
