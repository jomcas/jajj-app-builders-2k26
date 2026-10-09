import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { usePreferences, useStrings, useTheme } from '../../settings/preferences';
import { textStyles } from '../../theme/typography';
import { getGuide, GuideIcon, openGuide } from '../guides';
import { DISTRESS_GUIDES } from './lexicon';
import strings from './strings';

/**
 * The card a bare distress message gets ("help", "tulong po", "SOS"), when no Guide matches:
 * an olive Call 911 button, the Flare hint, and one tap to the top Emergency Guides. Only
 * fixed, translated text and Guide titles; nothing from the model.
 *
 * ADR 0004: a normal surface card; the only red is each Guide's icon on its blush tile. The
 * card never fires the Flare: that takes the deliberate hold on the Flare screen.
 *
 * onOpened runs after a Guide is opened (the Guides tab is brought to the front).
 */
export function DistressCard({ onOpened }: { onOpened?: () => void }) {
  const s = useStrings(strings);
  const { language } = usePreferences();
  const { colors } = useTheme();
  const guides = DISTRESS_GUIDES.flatMap((id) => {
    const guide = getGuide(id);
    return guide ? [guide] : [];
  });

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
      <Text accessibilityRole="header" style={[styles.title, { color: colors.ink }]}>
        {s.distressTitle}
      </Text>
      <Text style={[textStyles.body, { color: colors.ink }]}>{s.distressBody}</Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={s.call911}
        accessibilityHint={s.call911Hint}
        onPress={() => void Linking.openURL('tel:911').catch(() => undefined)}
        style={({ pressed }) => [styles.primary, { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 }]}
      >
        <MaterialCommunityIcons name="phone" size={22} color={colors.onPrimary} />
        <Text style={[textStyles.bodyStrong, styles.primaryText, { color: colors.onPrimary }]}>{s.call911}</Text>
      </Pressable>

      <View style={styles.hint}>
        <MaterialCommunityIcons name="alarm-light-outline" size={18} color={colors.muted} />
        <Text style={[textStyles.label, styles.hintText, { color: colors.muted }]}>{s.flareHint}</Text>
      </View>

      <Text style={[textStyles.labelStrong, { color: colors.muted }]}>{s.distressGuides}</Text>
      <View style={styles.list}>
        {guides.map((guide) => (
          <Pressable
            key={guide.id}
            accessibilityRole="button"
            accessibilityLabel={guide.title[language]}
            accessibilityHint={s.openGuideHint}
            onPress={() => {
              if (openGuide(guide.id)) onOpened?.();
            }}
            style={({ pressed }) => [styles.row, { borderColor: colors.line, opacity: pressed ? 0.7 : 1 }]}
          >
            <GuideIcon id={guide.id} kind={guide.kind} size={36} />
            <Text style={[textStyles.bodyStrong, styles.rowText, { color: colors.ink }]}>{guide.title[language]}</Text>
            <MaterialCommunityIcons name="chevron-right" size={22} color={colors.muted} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  title: {
    ...textStyles.heading,
    fontSize: 26,
    lineHeight: 30,
  },
  primary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    minHeight: 52,
    borderRadius: 14,
    paddingHorizontal: 16,
  },
  primaryText: {
    fontSize: 18,
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  hintText: {
    flex: 1,
  },
  list: {
    gap: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 52,
    paddingVertical: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  rowText: {
    flex: 1,
  },
});
