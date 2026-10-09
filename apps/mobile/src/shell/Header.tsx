import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import shellStrings from '../i18n/shell.strings';
import { useStrings, useTheme } from '../settings/preferences';
import { textStyles } from '../theme/typography';
import { SettingsSheet } from './SettingsSheet';
import { SosControl } from './SosControl';
import type { TabId } from '../modules';
import { tabDefinition } from './tabs';

/** Screen title on the left; settings and the SOS control at the top right on every screen. */
export function Header({ tab }: { tab: TabId }) {
  const { colors } = useTheme();
  const s = useStrings(shellStrings);
  const insets = useSafeAreaInsets();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const title = s[tabDefinition(tab).labelKey];

  return (
    <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: colors.page }]}>
      <Text accessibilityRole="header" numberOfLines={1} style={[textStyles.title, styles.title, { color: colors.ink }]}>
        {title}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={s.settingsButton}
        hitSlop={8}
        onPress={() => setSettingsOpen(true)}
        style={styles.iconButton}
      >
        <MaterialCommunityIcons name="cog-outline" size={24} color={colors.muted} />
      </Pressable>
      <SosControl />
      <SettingsSheet visible={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  title: {
    flex: 1,
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
