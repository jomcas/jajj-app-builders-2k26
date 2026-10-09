import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { ComponentProps, ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '../../../settings/preferences';
import { textStyles } from '../../../theme/typography';
import type { WaypointType } from '../../destination-pack';

export type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

// Icons carry the Waypoint type (docs/plan.md): boot, tent, water drop, flag.
export const WAYPOINT_ICONS: Record<WaypointType, IconName> = {
  jump_off: 'shoe-print',
  campsite: 'tent',
  water: 'water',
  summit: 'flag-variant',
};

/** An opaque panel over the map. Buttons on the Hike screen always sit on one of these. */
export function Panel({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.line }, style]}>
      {children}
    </View>
  );
}

/** A full-width button: olive (`primary`) for the main action, olive tint for the other. */
export function PanelButton({
  label,
  onPress,
  kind = 'primary',
  icon,
  large = false,
  disabled = false,
  accessibilityHint,
}: {
  label: string;
  onPress: () => void;
  kind?: 'primary' | 'tint';
  icon?: IconName;
  large?: boolean;
  disabled?: boolean;
  accessibilityHint?: string;
}) {
  const { colors } = useTheme();
  const fill = kind === 'primary' ? colors.primary : colors.tint;
  const ink = kind === 'primary' ? colors.onPrimary : colors.onTint;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      accessibilityHint={accessibilityHint}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        large ? styles.large : null,
        { backgroundColor: fill, opacity: disabled ? 0.45 : pressed ? 0.85 : 1 },
      ]}
    >
      {icon ? <MaterialCommunityIcons name={icon} size={large ? 24 : 20} color={ink} /> : null}
      <Text style={[large ? styles.largeText : textStyles.bodyStrong, { color: ink }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    gap: 12,
    elevation: 3,
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 48,
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  large: {
    minHeight: 60,
    borderRadius: 14,
  },
  largeText: {
    ...textStyles.heading,
  },
});
