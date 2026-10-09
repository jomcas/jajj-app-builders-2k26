import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { usePreferences, useStrings, useTheme } from '../../settings/preferences';
import { textStyles } from '../../theme/typography';
import { getGuide, GuideIcon, openGuide } from '../guides';
import strings from './strings';
import { cardSummary, helpOptions } from './summary';

/**
 * The card an emergency question gets instead of an answer (ADR 0003, issue #15): the Guide's
 * icon, title and at most two lines of its own summary, an olive "Open Guide" button, and the
 * Guide's way to call for help. Everything on it is reviewed Guide content or fixed, translated
 * text; nothing comes from the model.
 *
 * ADR 0004: the card is a normal surface. The only red is the Guide's icon on its blush tile,
 * as in the Guide Library list. No blush or red fills.
 *
 * onOpened runs after the Guide is opened (the Guides tab is brought to the front).
 */
export function EmergencyGuideCard({ guideId, onOpened }: { guideId: string; onOpened?: () => void }) {
  const s = useStrings(strings);
  const { language } = usePreferences();
  const { colors } = useTheme();
  const guide = getGuide(guideId);
  if (!guide) return null;

  const help = helpOptions(guide.callForHelp.en);
  const open = () => {
    if (openGuide(guide.id)) onOpened?.();
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
      <View style={styles.header}>
        <GuideIcon id={guide.id} kind={guide.kind} size={52} />
        <View style={styles.headerText}>
          <Text style={[textStyles.labelStrong, { color: colors.muted }]}>
            {guide.kind === 'emergency' ? s.emergencyGuide : s.routedGuide}
          </Text>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.ink }]}>
            {guide.title[language]}
          </Text>
        </View>
      </View>

      <Text numberOfLines={2} ellipsizeMode="tail" style={[textStyles.body, { color: colors.ink }]}>
        {cardSummary(guide.summary[language])}
      </Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={s.openGuide}
        accessibilityHint={s.openGuideHint}
        onPress={open}
        style={({ pressed }) => [styles.primary, { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 }]}
      >
        <MaterialCommunityIcons name="book-open-variant" size={22} color={colors.onPrimary} />
        <Text style={[textStyles.bodyStrong, styles.primaryText, { color: colors.onPrimary }]}>{s.openGuide}</Text>
      </Pressable>

      {help.call911 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={s.call911}
          accessibilityHint={s.call911Hint}
          onPress={() => void Linking.openURL('tel:911').catch(() => undefined)}
          style={({ pressed }) => [styles.secondary, { backgroundColor: colors.tint, opacity: pressed ? 0.8 : 1 }]}
        >
          <MaterialCommunityIcons name="phone" size={20} color={colors.onTint} />
          <Text style={[textStyles.bodyStrong, { color: colors.onTint }]}>{s.call911}</Text>
        </Pressable>
      ) : null}

      {help.flare ? (
        <View style={styles.hint}>
          <MaterialCommunityIcons name="alarm-light-outline" size={18} color={colors.muted} />
          <Text style={[textStyles.label, styles.hintText, { color: colors.muted }]}>{s.flareHint}</Text>
        </View>
      ) : null}

      <Text style={[textStyles.label, { color: colors.muted }]}>{s.fromGuide}</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  headerText: {
    flex: 1,
    gap: 2,
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
  secondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 48,
    borderRadius: 14,
    paddingHorizontal: 16,
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  hintText: {
    flex: 1,
  },
});
