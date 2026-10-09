import { SafeAreaProvider } from 'react-native-safe-area-context';

import { PreferencesProvider } from './settings/preferences';
import { AppShell } from './shell/AppShell';

export default function App() {
  return (
    <SafeAreaProvider>
      <PreferencesProvider>
        <AppShell />
      </PreferencesProvider>
    </SafeAreaProvider>
  );
}
