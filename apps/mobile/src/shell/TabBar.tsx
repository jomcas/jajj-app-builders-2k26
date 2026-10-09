import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import shellStrings from '../i18n/shell.strings';
import { useStrings, useTheme } from '../settings/preferences';
import { textStyles } from '../theme/typography';
import { tabDefinition } from './tabs';

/** Four bottom tabs. The active tab gets an olive-tint pill with a trail-orange icon (plan U2). */
export function TabBar({ state, navigation }: BottomTabBarProps) {
  const { colors } = useTheme();
  const s = useStrings(shellStrings);
  const insets = useSafeAreaInsets();

  return (
    <View
      accessibilityRole="tablist"
      style={[
        styles.bar,
        {
          backgroundColor: colors.surface,
          borderTopColor: colors.line,
          paddingBottom: Math.max(insets.bottom, 12),
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const tab = tabDefinition(route.name);
        const focused = state.index === index;
        const label = s[tab.labelKey];

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
        };

        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityLabel={label}
            accessibilityState={{ selected: focused }}
            onPress={onPress}
            style={styles.tab}
          >
            <View style={[styles.pill, focused && { backgroundColor: colors.tint }]}>
              <MaterialCommunityIcons
                name={tab.icon}
                size={24}
                color={focused ? colors.trail : colors.muted}
              />
            </View>
            <Text
              numberOfLines={1}
              style={
                focused
                  ? [textStyles.labelStrong, { color: colors.onTint }]
                  : [textStyles.label, { color: colors.muted }]
              }
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 8,
    paddingHorizontal: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    minHeight: 48,
  },
  pill: {
    width: 60,
    height: 32,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
