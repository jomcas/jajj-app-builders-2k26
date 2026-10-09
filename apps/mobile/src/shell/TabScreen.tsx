import { StyleSheet, View } from 'react-native';

import shellStrings from '../i18n/shell.strings';
import { modulesByTab, type TabId } from '../modules';
import { useStrings, useTheme } from '../settings/preferences';
import { EmptyState } from './EmptyState';

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
});
