import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { DevSettings, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { usePreferences, useStrings, useTheme } from '../../settings/preferences';
import { textStyles } from '../../theme/typography';
import { getGuide } from '../guides';
import type { LaunchGateProps } from '../types';
import { EmergencyGuideCard } from './EmergencyGuideCard';
import { parsePreviewLink, type PreviewRequest } from './previewLink';
import { routeEmergency } from './route';
import strings from './strings';

// DEV ONLY. A way to see and test <EmergencyGuideCard> on the phone before the Assistant chat
// (#14) shows it, without touching another module's screen:
//
//   adb shell am start -a android.intent.action.VIEW -d "tahak://emergency/preview/snakebite?lang=fil&theme=night" com.tahak.app
//   adb shell am start -a android.intent.action.VIEW -d "tahak://emergency/ask?q=nakagat%20ng%20ahas" com.tahak.app
//
// A module without a tab has no screen, so the preview is a launch gate: the link is saved and
// the JS reloads, and on the next launch the gate shows the preview until it is closed or
// "Open Guide" is tapped (which then lands on that Guide in the Guides tab). In a release
// build the gate is not registered at all (index.ts).

const PENDING = 'tahak.emergencyPreview';

type LinkGlobals = { tahakEmergencyPreviewLinks?: { remove(): void } };
const linkGlobals = globalThis as LinkGlobals;

export function listenForPreviewLinks() {
  if (!__DEV__) return;
  linkGlobals.tahakEmergencyPreviewLinks?.remove();
  linkGlobals.tahakEmergencyPreviewLinks = Linking.addEventListener('url', ({ url }) => {
    if (!parsePreviewLink(url)) return;
    void AsyncStorage.setItem(PENDING, url)
      .catch(() => undefined)
      .then(() => DevSettings.reload());
  });
}

async function takeRequest(): Promise<PreviewRequest | null> {
  const pending = await AsyncStorage.getItem(PENDING).catch(() => null);
  if (pending) {
    await AsyncStorage.removeItem(PENDING).catch(() => undefined);
    return parsePreviewLink(pending);
  }
  return parsePreviewLink(await Linking.getInitialURL().catch(() => null));
}

function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? '');
}

export function PreviewGate({ onDone }: LaunchGateProps) {
  const [request, setRequest] = useState<PreviewRequest | null | undefined>(undefined);
  const { language, setLanguage, themeMode, setThemeMode } = usePreferences();
  const { colors } = useTheme();
  const s = useStrings(strings);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    let live = true;
    void takeRequest().then((next) => {
      if (!live) return;
      if (!next) {
        onDone();
        return;
      }
      if (next.language) setLanguage(next.language);
      if (next.theme) setThemeMode(next.theme);
      setRequest(next);
    });
    return () => {
      live = false;
    };
    // Runs once, at launch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!request) return <View style={[styles.fill, { backgroundColor: colors.page }]} />;

  const route = request.kind === 'ask' ? routeEmergency(request.question, language) : null;
  const guideId = request.kind === 'guide' ? request.guideId : route?.guideId;

  return (
    <ScrollView
      style={[styles.fill, { backgroundColor: colors.page }]}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}
    >
      <Text style={[textStyles.title, { color: colors.ink }]}>{s.previewTitle}</Text>
      {request.kind === 'ask' ? (
        <View style={styles.block}>
          <Text style={[textStyles.bodyStrong, { color: colors.ink }]}>{fill(s.previewQuestion, { question: request.question })}</Text>
          <Text style={[textStyles.label, { color: colors.muted }]}>
            {route
              ? `${fill(s.previewRouted, { id: route.guideId, confidence: String(route.confidence) })}\n${fill(s.previewMatched, { matched: route.matched.join(', ') })}`
              : s.previewNotEmergency}
          </Text>
        </View>
      ) : null}
      {guideId && !getGuide(guideId) ? (
        <Text style={[textStyles.body, { color: colors.ink }]}>{fill(s.previewUnknown, { id: guideId })}</Text>
      ) : null}
      {guideId ? <EmergencyGuideCard guideId={guideId} onOpened={() => onDone({ tab: 'guides' })} /> : null}
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          onPress={() => setLanguage(language === 'en' ? 'fil' : 'en')}
          style={[styles.chip, { backgroundColor: colors.tint }]}
        >
          <Text style={[textStyles.labelStrong, { color: colors.onTint }]}>{s.previewLanguage}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => setThemeMode(themeMode === 'day' ? 'night' : 'day')}
          style={[styles.chip, { backgroundColor: colors.tint }]}
        >
          <Text style={[textStyles.labelStrong, { color: colors.onTint }]}>
            {themeMode === 'day' ? s.previewThemeNight : s.previewThemeDay}
          </Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => onDone()} style={[styles.chip, { backgroundColor: colors.tint }]}>
          <Text style={[textStyles.labelStrong, { color: colors.onTint }]}>{s.previewClose}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    gap: 16,
  },
  block: {
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
});
