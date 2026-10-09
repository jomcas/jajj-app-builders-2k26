import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Language } from '../../i18n/types';
import { usePreferences, useStrings, useTheme } from '../../settings/preferences';
import { textStyles } from '../../theme/typography';
import { ModelDownloadCard, startDownload, useModelState } from '../assistant-model';
import type { LaunchGateProps } from '../types';
import { launchLinkHandled } from './resetLink';
import { isSetupComplete, markSetupComplete } from './setupFlag';
import strings from './strings';

type Permission = 'unknown' | 'granted' | 'denied';

const toPermission = ({ granted, canAskAgain }: { granted: boolean; canAskAgain: boolean }): Permission =>
  granted ? 'granted' : canAskAgain ? 'unknown' : 'denied';

function usePermission(get: () => Promise<{ granted: boolean; canAskAgain: boolean }>) {
  const [permission, setPermission] = useState<Permission>('unknown');
  useEffect(() => {
    get()
      .then((result) => setPermission(toPermission(result)))
      .catch(() => {});
  }, [get]);
  return [permission, setPermission] as const;
}

const getLocation = () => Location.getForegroundPermissionsAsync();
const getNotifications = () => Notifications.getPermissionsAsync();

function PermissionRow({
  title,
  reason,
  permission,
  onAllow,
}: {
  title: string;
  reason: string;
  permission: Permission;
  onAllow: () => void;
}) {
  const { colors } = useTheme();
  const s = useStrings(strings);
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
      <View style={styles.row}>
        <View style={styles.rowText}>
          <Text style={[textStyles.bodyStrong, { color: colors.ink }]}>{title}</Text>
          <Text style={[textStyles.label, { color: colors.muted }]}>{reason}</Text>
        </View>
        {permission === 'granted' ? (
          <Text style={[textStyles.labelStrong, { color: colors.onTint }]}>{s.allowed}</Text>
        ) : (
          <Pressable
            accessibilityRole="button"
            onPress={onAllow}
            style={[styles.smallButton, { backgroundColor: colors.tint }]}
          >
            <Text style={[textStyles.bodyStrong, { color: colors.onTint }]}>{s.allow}</Text>
          </Pressable>
        )}
      </View>
      {permission === 'denied' ? (
        <Text style={[textStyles.label, { color: colors.muted }]}>{s.denied}</Text>
      ) : null}
    </View>
  );
}

function LanguageChoice() {
  const { colors } = useTheme();
  const s = useStrings(strings);
  const { language, setLanguage } = usePreferences();
  const options: { value: Language; label: string }[] = [
    { value: 'en', label: s.languageEnglish },
    { value: 'fil', label: s.languageFilipino },
  ];
  return (
    <View accessibilityRole="radiogroup" style={[styles.segmented, { backgroundColor: colors.tint }]}>
      {options.map((option) => {
        const selected = option.value === language;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            onPress={() => setLanguage(option.value)}
            style={[styles.segment, selected && { backgroundColor: colors.surface, borderColor: colors.line }]}
          >
            <Text style={[textStyles.bodyStrong, { color: colors.onTint }]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/**
 * First-launch setup (issue #13), shown before the tabs until it is completed once:
 * language, permissions and the Assistant model download, in one screen.
 */
export function SetupScreen({ onDone }: LaunchGateProps) {
  const { colors } = useTheme();
  const s = useStrings(strings);
  const insets = useSafeAreaInsets();
  const model = useModelState();
  const [needed, setNeeded] = useState<boolean | null>(null);
  const [location, setLocation] = usePermission(getLocation);
  const [notifications, setNotifications] = usePermission(getNotifications);

  useEffect(() => {
    let live = true;
    launchLinkHandled
      .then(isSetupComplete)
      .then((complete) => {
        if (!live) return;
        if (complete) onDone();
        else setNeeded(true);
      });
    return () => {
      live = false;
    };
    // onDone is called at most once, for the first answer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!needed) return <View style={[styles.fill, { backgroundColor: colors.page }]} />;

  const finish = (next?: Parameters<LaunchGateProps['onDone']>[0]) => {
    void markSetupComplete().then(() => onDone(next));
  };
  const modelReady = model.status === 'ready';

  return (
    <ScrollView
      style={[styles.fill, { backgroundColor: colors.page }]}
      contentContainerStyle={[styles.content, { paddingTop: 24 + insets.top, paddingBottom: 24 + insets.bottom }]}
    >
      <Text style={[textStyles.title, { color: colors.ink }]}>{s.title}</Text>
      <Text style={[textStyles.body, { color: colors.muted }]}>{s.intro}</Text>

      <Text style={[textStyles.labelStrong, styles.section, { color: colors.muted }]}>{s.languageHeading}</Text>
      <LanguageChoice />

      <Text style={[textStyles.labelStrong, styles.section, { color: colors.muted }]}>{s.permissionsHeading}</Text>
      <PermissionRow
        title={s.locationTitle}
        reason={s.locationReason}
        permission={location}
        onAllow={() => {
          Location.requestForegroundPermissionsAsync()
            .then((result) => setLocation(toPermission(result)))
            .catch(() => {});
        }}
      />
      <PermissionRow
        title={s.notificationsTitle}
        reason={s.notificationsReason}
        permission={notifications}
        onAllow={() => {
          Notifications.requestPermissionsAsync()
            .then((result) => setNotifications(toPermission(result)))
            .catch(() => {});
        }}
      />

      <Text style={[textStyles.labelStrong, styles.section, { color: colors.muted }]}>{s.modelHeading}</Text>
      <Text style={[textStyles.body, { color: colors.muted }]}>{s.modelReason}</Text>
      <ModelDownloadCard />

      <View style={styles.actions}>
        {modelReady ? null : (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              // Waiting implies downloading: start it if the hiker has not yet.
              if (model.status === 'missing') startDownload();
              finish({ tab: 'guides' });
            }}
            style={[styles.button, { backgroundColor: colors.primary }]}
          >
            <Text style={[textStyles.bodyStrong, { color: colors.onPrimary }]}>{s.browseGuides}</Text>
          </Pressable>
        )}
        <Pressable
          accessibilityRole="button"
          onPress={() => finish()}
          style={[
            styles.button,
            modelReady
              ? { backgroundColor: colors.primary }
              : { backgroundColor: colors.surface, borderColor: colors.line, borderWidth: 1 },
          ]}
        >
          <Text style={[textStyles.bodyStrong, { color: modelReady ? colors.onPrimary : colors.ink }]}>
            {modelReady ? s.done : model.status === 'downloading' ? s.continueWhileDownloading : s.continue}
          </Text>
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
    gap: 10,
  },
  section: {
    marginTop: 14,
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  smallButton: {
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmented: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  segment: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  actions: {
    marginTop: 16,
    gap: 10,
  },
  button: {
    minHeight: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
});
