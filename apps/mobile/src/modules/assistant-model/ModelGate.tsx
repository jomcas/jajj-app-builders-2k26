import type { ComponentType, ReactNode } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';

import { useStrings, useTheme } from '../../settings/preferences';
import { textStyles } from '../../theme/typography';
import { ModelDownloadCard } from './ModelDownloadCard';
import { useModelState } from './store';
import strings from './strings';

/**
 * Shows the model download (size, progress, pause and resume) until every model file is on
 * the phone, then renders its children. Wrap anything that needs the model in it.
 */
export function ModelGate({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  const s = useStrings(strings);
  const state = useModelState();
  if (state.status === 'ready') return <>{children}</>;
  return (
    <ScrollView style={{ backgroundColor: colors.page }} contentContainerStyle={styles.content}>
      <Text style={[textStyles.title, { color: colors.ink }]}>{s.gateTitle}</Text>
      <Text style={[textStyles.body, { color: colors.muted }]}>{s.gateBody}</Text>
      <ModelDownloadCard />
    </ScrollView>
  );
}

/** A screen that shows <ModelGate> until the model is ready, then the given screen. */
export function withModelGate(Screen: ComponentType): ComponentType {
  function GatedScreen() {
    return (
      <ModelGate>
        <Screen />
      </ModelGate>
    );
  }
  GatedScreen.displayName = `withModelGate(${Screen.displayName ?? Screen.name ?? 'Screen'})`;
  return GatedScreen;
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    gap: 12,
  },
});
