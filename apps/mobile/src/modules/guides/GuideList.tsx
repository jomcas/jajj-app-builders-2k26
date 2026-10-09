import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Pressable, SectionList, StyleSheet, Text, View } from 'react-native';

import { EmptyState } from '../../shell/EmptyState';
import { usePreferences, useStrings, useTheme } from '../../settings/preferences';
import { textStyles } from '../../theme/typography';
import { GuideIcon } from './GuideIcon';
import { library } from './store';
import strings from './strings';
import type { Guide } from './types';

/** The Guide Library, in the plan's three groups. */
export function GuideList({ onOpen }: { onOpen: (id: string) => void }) {
  const s = useStrings(strings);
  const { language } = usePreferences();
  const { colors } = useTheme();
  const sections = library.sections.map((section) => ({ key: section.category, data: section.guides }));

  return (
    <SectionList<Guide, { key: 'injury' | 'hazard' | 'camp'; data: Guide[] }>
      sections={sections}
      keyExtractor={(guide) => guide.id}
      contentContainerStyle={styles.content}
      stickySectionHeadersEnabled={false}
      ListEmptyComponent={<EmptyState icon="book-open-variant" title={s.emptyTitle} body={s.emptyBody} />}
      renderSectionHeader={({ section }) => (
        <Text accessibilityRole="header" style={[textStyles.heading, styles.sectionHeader, { color: colors.ink }]}>
          {s[section.key]}
        </Text>
      )}
      renderItem={({ item }) => (
        <Pressable
          accessibilityRole="button"
          onPress={() => onOpen(item.id)}
          style={({ pressed }) => [
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.line, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <GuideIcon id={item.id} kind={item.kind} />
          <View style={styles.cardText}>
            <Text style={[styles.title, { color: colors.ink }]}>{item.title[language]}</Text>
            <Text numberOfLines={2} style={[textStyles.body, { color: colors.muted }]}>
              {item.summary[language]}
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color={colors.muted} />
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 10,
  },
  sectionHeader: {
    marginTop: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  cardText: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...textStyles.heading,
    fontSize: 24,
    lineHeight: 28,
  },
});
