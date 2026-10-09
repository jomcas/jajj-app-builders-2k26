import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DarkTheme, DefaultTheme, NavigationContainer, type Theme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect, useMemo } from 'react';

import { useTheme } from '../settings/preferences';
import { Header } from './Header';
import { TabBar } from './TabBar';
import { tabScreens } from './TabScreen';
import { TABS } from './tabs';

const Tab = createBottomTabNavigator();

/**
 * The app shell (ADR 0001): owns the four tabs, the header and the SOS control.
 * Tab contents come from the Feature Module registry, never from edits here.
 */
export function AppShell() {
  const { mode, colors } = useTheme();

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors.page).catch(() => {});
  }, [colors.page]);

  const navigationTheme = useMemo<Theme>(() => {
    const base = mode === 'night' ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: colors.primary,
        background: colors.page,
        card: colors.surface,
        text: colors.ink,
        border: colors.line,
        notification: colors.primary,
      },
    };
  }, [mode, colors]);

  return (
    <NavigationContainer theme={navigationTheme}>
      <StatusBar style={mode === 'night' ? 'light' : 'dark'} />
      <Tab.Navigator
        tabBar={(props) => <TabBar {...props} />}
        screenOptions={{
          header: ({ route }) => <Header routeName={route.name} />,
          animation: 'none',
        }}
      >
        {TABS.map((tab) => (
          <Tab.Screen key={tab.id} name={tab.id} component={tabScreens[tab.id]} />
        ))}
      </Tab.Navigator>
    </NavigationContainer>
  );
}
