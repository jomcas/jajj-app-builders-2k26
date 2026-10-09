import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DarkTheme, DefaultTheme, NavigationContainer, type Theme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect, useMemo } from 'react';

import { useTheme } from '../settings/preferences';
import { Header } from './Header';
import { LaunchGates } from './LaunchGates';
import { TabBar } from './TabBar';
import { tabRoots } from './TabScreen';
import type { TabParamList } from './tabs';

const Tab = createBottomTabNavigator<TabParamList>();

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
      <LaunchGates>
        {(initialTab) => (
          <Tab.Navigator
            initialRouteName={initialTab}
            tabBar={(props) => <TabBar {...props} />}
            screenOptions={({ route }) => ({
              header: () => <Header tab={route.name} />,
              animation: 'none',
            })}
          >
            {tabRoots.map(({ id, Root }) => (
              <Tab.Screen key={id} name={id} component={Root} />
            ))}
          </Tab.Navigator>
        )}
      </LaunchGates>
    </NavigationContainer>
  );
}
