import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { ComponentProps } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { usePreferences, useStrings, useTheme } from '../../settings/preferences';
import { fonts, textStyles } from '../../theme/typography';
import { GuideIcon } from './GuideIcon';
import { localizeGuide } from './library';
import strings from './strings';
import type { Guide } from './types';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, name: string) => values[name] ?? match);
}

/**
 * One Guide, in the UI language, sized to read outdoors: title, summary, "Call for help",
 * numbered steps, "Do not", "Watch for", then the sources and the review note.
 */
export function GuideScreen({ guide, onBack }: { guide: Guide; onBack: () => void }) {
  const s = useStrings(strings);
  const { language } = usePreferences();
  const { colors } = useTheme();
  const g = localizeGuide(guide, language);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Pressable accessibilityRole="button" onPress={onBack} hitSlop={8} style={styles.back}>
        <MaterialCommunityIcons name="chevron-left" size={26} color={colors.primary} />
        <Text style={[textStyles.bodyStrong, styles.backText, { color: colors.primary }]}>{s.back}</Text>
      </Pressable>

      <View style={styles.titleRow}>
        <GuideIcon id={g.id} kind={g.kind} size={56} />
        <Text accessibilityRole="header" style={[textStyles.title, styles.title, { color: colors.ink }]}>
          {g.title}
        </Text>
      </View>
      <Text style={[styles.lead, { color: colors.ink }]}>{g.summary}</Text>

      <View style={[styles.callBox, { backgroundColor: colors.surface, borderColor: colors.primary }]}>
        <View style={styles.boxHeading}>
          <MaterialCommunityIcons name="phone-outline" size={24} color={colors.primary} />
          <Text style={[textStyles.heading, { color: colors.ink }]}>{s.callForHelp}</Text>
        </View>
        <Text style={[styles.text, { color: colors.ink }]}>{g.callForHelp}</Text>
      </View>

      <Text accessibilityRole="header" style={[textStyles.heading, styles.section, { color: colors.ink }]}>
        {s.steps}
      </Text>
      {g.steps.map((step, index) => (
        <View key={index} style={styles.step}>
          <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
            <Text style={[styles.stepNumberText, { color: colors.onPrimary }]}>{index + 1}</Text>
          </View>
          <Text style={[styles.text, styles.flex, { color: colors.ink }]}>{step}</Text>
        </View>
      ))}

      <BulletSection title={s.doNot} icon="close-circle-outline" items={g.doNot} />
      <BulletSection title={s.watchFor} icon="eye-outline" items={g.watchFor} />

      {g.sources.length > 0 ? (
        <View style={[styles.sources, { borderTopColor: colors.line }]}>
          <Text style={[textStyles.labelStrong, { color: colors.muted }]}>{s.sources}</Text>
          {g.sources.map((source, index) => (
            <Text key={index} style={[textStyles.label, { color: colors.muted }]}>
              {fill(s.sourceAccessed, { org: source.org, title: source.title, accessed: source.accessed })}
            </Text>
          ))}
        </View>
      ) : null}

      {g.review.redCrossChecked ? null : (
        <View style={[styles.review, { backgroundColor: colors.butter }]}>
          <MaterialCommunityIcons name="alert-outline" size={18} color={colors.onButter} />
          <Text style={[textStyles.label, styles.flex, { color: colors.onButter }]}>{s.notChecked}</Text>
        </View>
      )}
    </ScrollView>
  );
}

function BulletSection({ title, icon, items }: { title: string; icon: IconName; items: string[] }) {
  const { colors } = useTheme();
  if (items.length === 0) return null;
  return (
    <>
      <Text accessibilityRole="header" style={[textStyles.heading, styles.section, { color: colors.ink }]}>
        {title}
      </Text>
      {items.map((item, index) => (
        <View key={index} style={styles.step}>
          <MaterialCommunityIcons name={icon} size={24} color={colors.muted} style={styles.bulletIcon} />
          <Text style={[styles.text, styles.flex, { color: colors.ink }]}>{item}</Text>
        </View>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 12,
  },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    minHeight: 44,
    marginLeft: -6,
  },
  backText: {
    fontSize: 18,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  title: {
    flex: 1,
    fontSize: 32,
    lineHeight: 36,
  },
  lead: {
    fontFamily: fonts.bodyMedium,
    fontSize: 19,
    lineHeight: 27,
  },
  text: {
    fontFamily: fonts.body,
    fontSize: 18,
    lineHeight: 26,
  },
  flex: {
    flex: 1,
  },
  callBox: {
    gap: 6,
    padding: 14,
    borderRadius: 16,
    borderWidth: 2,
  },
  boxHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  section: {
    marginTop: 12,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontFamily: fonts.headingBold,
    fontSize: 20,
    fontVariant: ['tabular-nums'],
  },
  bulletIcon: {
    width: 32,
    textAlign: 'center',
    marginTop: 1,
  },
  sources: {
    marginTop: 20,
    paddingTop: 12,
    gap: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  review: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
});
