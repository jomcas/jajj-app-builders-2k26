import { StyleSheet, View } from 'react-native';

import shellStrings from '../i18n/shell.strings';
import { modulesByTab, type TabId } from '../modules';
import { useStrings, useTheme } from '../settings/preferences';
import { EmptyState } from './EmptyState';
import { TABS } from './tabs';

function EmptyTab() {
  const s = useStrings(shellStrings);
  return <EmptyState title={s.emptyTitle} body={s.emptyBody} />;
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

function rootFor(tab: TabId) {
  function TabRoot() {
    return <TabScreen tab={tab} />;
  }
  return TabRoot;
}

// One stable component per tab, created once, so React Navigation never remounts a tab.
export const tabRoots = TABS.map((tab) => ({ id: tab.id, Root: rootFor(tab.id) }));

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
});
