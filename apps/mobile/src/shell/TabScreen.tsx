import { StyleSheet, Text, View } from 'react-native';

import shellStrings from '../i18n/shell.strings';
import { modulesByTab, type TabId } from '../modules';
import { useStrings, useTheme } from '../settings/preferences';
import { textStyles } from '../theme/typography';

function EmptyTab() {
  const { colors } = useTheme();
  const s = useStrings(shellStrings);
  return (
    <View style={styles.empty}>
      <Text style={[textStyles.heading, { color: colors.ink }]}>{s.emptyTitle}</Text>
      <Text style={[textStyles.body, styles.emptyBody, { color: colors.muted }]}>{s.emptyBody}</Text>
    </View>
  );
}

/** Shows the screen of the Feature Module registered for this tab, or an empty state. */
function TabScreen({ tab }: { tab: TabId }) {
  const { colors } = useTheme();
  const module = modulesByTab[tab];
  const Screen = module ? module.Screen : EmptyTab;
  return (
    <View style={[styles.screen, { backgroundColor: colors.page }]}>
      <Screen />
    </View>
  );
}

// Stable component per tab, so React Navigation never remounts a tab on re-render.
export const tabScreens: Record<TabId, () => React.JSX.Element> = {
  explore: () => <TabScreen tab="explore" />,
  hike: () => <TabScreen tab="hike" />,
  ask: () => <TabScreen tab="ask" />,
  guides: () => <TabScreen tab="guides" />,
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyBody: {
    marginTop: 8,
    textAlign: 'center',
  },
});
