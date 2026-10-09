import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import shellStrings from '../i18n/shell.strings';
import type { Language } from '../i18n/types';
import { usePreferences, useStrings, useTheme } from '../settings/preferences';
import type { ThemeMode } from '../theme/tokens';
import { fonts, type } from '../theme/typography';

type Option<T extends string> = { value: T; label: string };

function Segmented<T extends string>({
  options,
  selected,
  onSelect,
}: {
  options: Option<T>[];
  selected: T;
  onSelect: (value: T) => void;
}) {
  const { colors } = useTheme();
  return (
    <View accessibilityRole="radiogroup" style={[styles.segmented, { backgroundColor: colors.tint }]}>
      {options.map((option) => {
        const isSelected = option.value === selected;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ checked: isSelected }}
            onPress={() => onSelect(option.value)}
            style={[
              styles.segment,
              isSelected && { backgroundColor: colors.surface, borderColor: colors.line },
            ]}
          >
            <Text style={[styles.segmentLabel, { color: colors.onTint }]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Manual theme toggle and language switch. Both apply immediately and are remembered. */
export function SettingsSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { colors } = useTheme();
  const s = useStrings(shellStrings);
  const { themeMode, setThemeMode, language, setLanguage } = usePreferences();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={s.close}
        style={[styles.scrim, { backgroundColor: colors.scrim }]}
        onPress={onClose}
      />
      <View
        style={[
          styles.sheet,
          { backgroundColor: colors.surface, paddingBottom: 16 + insets.bottom },
        ]}
      >
        <Text style={[type.title, { color: colors.ink }]}>{s.settingsTitle}</Text>

        <Text style={[styles.sectionLabel, { color: colors.muted }]}>{s.themeHeading}</Text>
        <Segmented<ThemeMode>
          options={[
            { value: 'day', label: s.themeDay },
            { value: 'night', label: s.themeNight },
          ]}
          selected={themeMode}
          onSelect={setThemeMode}
        />

        <Text style={[styles.sectionLabel, { color: colors.muted }]}>{s.languageHeading}</Text>
        <Segmented<Language>
          options={[
            { value: 'en', label: s.languageEnglish },
            { value: 'fil', label: s.languageFilipino },
          ]}
          selected={language}
          onSelect={setLanguage}
        />

        <Pressable
          accessibilityRole="button"
          onPress={onClose}
          style={[styles.closeButton, { backgroundColor: colors.primary }]}
        >
          <Text style={[type.bodyStrong, { color: colors.onPrimary }]}>{s.close}</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  sectionLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    marginTop: 20,
    marginBottom: 8,
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
  segmentLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
  },
  closeButton: {
    marginTop: 24,
    minHeight: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
