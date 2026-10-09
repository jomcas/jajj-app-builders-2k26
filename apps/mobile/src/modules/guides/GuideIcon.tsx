import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';

import { useStrings, useTheme } from '../../settings/preferences';
import strings from './strings';
import type { GuideKind } from './types';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

const ICONS: Record<string, IconName> = {
  snakebite: 'snake',
  'bleeding-wounds': 'bandage',
  'sprains-fractures': 'bone',
  hypothermia: 'snowflake-thermometer',
  'heat-illness': 'weather-sunny-alert',
  dehydration: 'cup-water',
  'lost-on-the-trail': 'compass-outline',
  lightning: 'weather-lightning',
  'flash-floods': 'waves',
  'altitude-sickness': 'image-filter-hdr',
  'insect-stings': 'bee',
  'leech-bites': 'water-alert',
  blisters: 'shoe-print',
  'pitching-a-tent': 'tent',
  'purifying-water': 'water-check',
};

/**
 * A Guide's icon on its tile. ADR 0004: an Emergency Guide is set apart only here, by a red
 * icon on a blush tile; every other Guide gets the olive-tint tile. Nothing else is red.
 */
export function GuideIcon({ id, kind, size = 48 }: { id: string; kind: GuideKind; size?: number }) {
  const { colors } = useTheme();
  const s = useStrings(strings);
  const emergency = kind === 'emergency';
  return (
    <View
      accessible={emergency}
      accessibilityRole={emergency ? 'image' : undefined}
      accessibilityLabel={emergency ? s.emergency : undefined}
      style={[
        styles.tile,
        { width: size, height: size, borderRadius: size / 4, backgroundColor: emergency ? colors.blush : colors.tint },
      ]}
    >
      <MaterialCommunityIcons
        name={ICONS[id] ?? (emergency ? 'medical-bag' : 'book-open-variant')}
        size={Math.round(size * 0.55)}
        color={emergency ? colors.dangerIcon : colors.onTint}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
