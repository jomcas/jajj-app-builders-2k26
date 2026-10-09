import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { StyleSheet, Text, View } from 'react-native';

import { useStrings, useTheme } from '../../../settings/preferences';
import { textStyles } from '../../../theme/typography';
import strings from '../strings';
import { Panel, PanelButton } from './parts';

/**
 * Back near the jump-off: suggests ending the Hike. Non-blocking: the map and the Hike panel
 * keep working, and the Hike only ends if the hiker says so.
 */
export function EndSuggestion({ onEnd, onDismiss }: { onEnd: () => void; onDismiss: () => void }) {
  const s = useStrings(strings);
  const { colors } = useTheme();
  return (
    <Panel style={{ borderColor: colors.primary, borderWidth: 1.5 }}>
      <View style={styles.row} accessibilityLiveRegion="polite">
        <MaterialCommunityIcons name="home-map-marker" size={24} color={colors.onTint} />
        <Text style={[textStyles.bodyStrong, styles.grow, { color: colors.ink }]}>{s.endSuggestion}</Text>
      </View>
      <View style={styles.row}>
        <View style={styles.grow}>
          <PanelButton label={s.keepHiking} kind="tint" onPress={onDismiss} />
        </View>
        <View style={styles.grow}>
          <PanelButton label={s.endHike} onPress={onEnd} />
        </View>
      </View>
    </Panel>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  grow: {
    flex: 1,
  },
});
