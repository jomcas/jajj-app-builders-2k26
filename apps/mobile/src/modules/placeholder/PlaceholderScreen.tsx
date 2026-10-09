import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { StyleSheet, Text, View } from 'react-native';

import { useStrings, useTheme } from '../../settings/preferences';
import { type } from '../../theme/typography';
import strings from './strings';

export function PlaceholderScreen() {
  const { colors } = useTheme();
  const s = useStrings(strings);
  return (
    <View style={styles.container}>
      <View style={[styles.tile, { backgroundColor: colors.tint }]}>
        <MaterialCommunityIcons name="message-outline" size={32} color={colors.onTint} />
      </View>
      <Text style={[type.heading, styles.title, { color: colors.ink }]}>{s.title}</Text>
      <Text style={[type.body, styles.body, { color: colors.muted }]}>{s.body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  tile: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginTop: 16,
    textAlign: 'center',
  },
  body: {
    marginTop: 8,
    textAlign: 'center',
  },
});
