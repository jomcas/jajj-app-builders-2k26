import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../settings/preferences';
import { textStyles } from '../theme/typography';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

/**
 * A centred title and body, with an optional icon on an olive-tint tile. Used for empty tabs
 * and placeholder screens. Feature Modules may import it; they pass catalog strings.
 */
export function EmptyState({ icon, title, body }: { icon?: IconName; title: string; body: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.container}>
      {icon ? (
        <View style={[styles.tile, { backgroundColor: colors.tint }]}>
          <MaterialCommunityIcons name={icon} size={32} color={colors.onTint} />
        </View>
      ) : null}
      <Text style={[textStyles.heading, styles.title, { color: colors.ink }]}>{title}</Text>
      <Text style={[textStyles.body, styles.body, { color: colors.muted }]}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 8,
  },
  tile: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    textAlign: 'center',
  },
  body: {
    textAlign: 'center',
  },
});
