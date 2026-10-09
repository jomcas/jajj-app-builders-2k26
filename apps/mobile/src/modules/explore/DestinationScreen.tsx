import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useCallback, useEffect, useState, useSyncExternalStore, type ComponentProps, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { usePreferences, useStrings, useTheme } from '../../settings/preferences';
import type { Palette } from '../../theme/tokens';
import { textStyles } from '../../theme/typography';
import {
  downloadPack,
  getDownloadState,
  getPack,
  progressPercent,
  subscribe,
  type Destination,
  type DestinationPack,
  type WaypointType,
} from '../destination-pack';
import { fill, formatBytes, formatDate, formatKm } from './format';
import strings from './strings';
import { WorksOfflineIcon } from './WorksOfflineIcon';

type Strings = Record<keyof (typeof strings)['en'], string>;
type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

// Icons carry the Waypoint type (plan.md): boot, tent, water drop, flag.
const WAYPOINT_ICONS: Record<WaypointType, IconName> = {
  jump_off: 'shoe-print',
  campsite: 'tent',
  water: 'water',
  summit: 'flag-variant',
};

function Section({ title, colors, children }: { title: string; colors: Palette; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text accessibilityRole="header" style={[textStyles.heading, { color: colors.ink }]}>
        {title}
      </Text>
      {children}
    </View>
  );
}

function DownloadPanel({
  destination,
  pack,
  onDownloaded,
  s,
  colors,
}: {
  destination: Destination;
  pack: DestinationPack | null;
  onDownloaded: (pack: DestinationPack) => void;
  s: Strings;
  colors: Palette;
}) {
  const state = useSyncExternalStore(subscribe, () => getDownloadState(destination.id));
  const needsDownload = !pack || destination.packVersion > pack.destination.packVersion;
  const size = formatBytes(destination.mapBytes);

  const start = () => {
    downloadPack(destination).then(onDownloaded, () => undefined /* shown from the state */);
  };

  if (state.status === 'downloading') {
    const percent = progressPercent(state.progress);
    return (
      <View style={styles.panel} accessibilityLiveRegion="polite">
        <Text style={[textStyles.bodyStrong, { color: colors.ink }]}>{fill(s.downloading, { percent })}</Text>
        <View
          style={[styles.track, { backgroundColor: colors.tint }]}
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 0, max: 100, now: percent }}
        >
          <View style={[styles.bar, { backgroundColor: colors.primary, width: `${percent}%` }]} />
        </View>
        <Text style={[textStyles.label, styles.numbers, { color: colors.muted }]}>
          {fill(s.downloadingBytes, {
            done: formatBytes(state.progress.bytesDone),
            total: formatBytes(state.progress.bytesTotal),
          })}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.panel}>
      {state.status === 'error' ? (
        <Text style={[textStyles.body, { color: colors.ink }]}>{fill(s.downloadFailed, { error: state.error })}</Text>
      ) : pack ? (
        <Text style={[textStyles.body, { color: colors.muted }]}>
          {fill(s.downloaded, { date: formatDate(pack.downloadedAt), size: formatBytes(pack.destination.mapBytes) })}
        </Text>
      ) : (
        <Text style={[textStyles.body, { color: colors.muted }]}>{s.notDownloaded}</Text>
      )}
      {needsDownload ? (
        <Pressable
          accessibilityRole="button"
          onPress={start}
          style={({ pressed }) => [styles.button, { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 }]}
        >
          <MaterialCommunityIcons name="download" size={20} color={colors.onPrimary} />
          <Text style={[textStyles.bodyStrong, { color: colors.onPrimary }]}>
            {state.status === 'error' ? s.retry : fill(pack ? s.update : s.download, { size })}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function PackContents({ pack, s, colors }: { pack: DestinationPack; s: Strings; colors: Palette }) {
  const { language } = usePreferences();
  const inLanguage = pack.passages.filter((passage) => passage.language === language);
  const passages = inLanguage.length > 0 ? inLanguage : pack.passages;

  return (
    <>
      <Section title={s.trails} colors={colors}>
        {pack.trails.map((trail) => (
          <View key={trail.id} style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.line }]}>
            <View style={[styles.tile, { backgroundColor: colors.peach }]}>
              <MaterialCommunityIcons name="map-marker-path" size={20} color={colors.onPeach} />
            </View>
            <Text style={[textStyles.bodyStrong, styles.grow, { color: colors.ink }]}>{trail.name}</Text>
            <Text style={[textStyles.bodyStrong, styles.numbers, { color: colors.muted }]}>
              {fill(s.trailDistance, { km: formatKm(trail.distanceM) })}
            </Text>
          </View>
        ))}
      </Section>

      <Section title={s.waypoints} colors={colors}>
        {pack.waypoints.map((waypoint) => {
          const water = waypoint.type === 'water';
          const km = formatKm(waypoint.distanceM);
          return (
            <View key={waypoint.id} style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.line }]}>
              <View style={[styles.tile, { backgroundColor: water ? colors.sky : colors.tint }]}>
                <MaterialCommunityIcons
                  name={WAYPOINT_ICONS[waypoint.type]}
                  size={20}
                  color={water ? colors.onSky : colors.onTint}
                />
              </View>
              <View style={styles.grow}>
                <Text style={[textStyles.bodyStrong, { color: colors.ink }]}>{waypoint.name}</Text>
                <Text style={[textStyles.label, styles.numbers, { color: colors.muted }]}>
                  {[
                    s[waypoint.type],
                    waypoint.distanceM > 0 ? fill(s.waypointDistance, { km }) : null,
                    waypoint.elevationM === null ? null : fill(s.elevation, { elevation: waypoint.elevationM }),
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </Text>
              </View>
            </View>
          );
        })}
      </Section>

      <Section title={s.reference} colors={colors}>
        {passages.map((passage) => (
          <View key={passage.id} style={[styles.passage, { backgroundColor: colors.surface, borderColor: colors.line }]}>
            <Text style={[textStyles.body, { color: colors.ink }]}>{passage.text}</Text>
            <Text style={[textStyles.label, { color: colors.muted }]}>{fill(s.source, { source: passage.source })}</Text>
          </View>
        ))}
      </Section>
    </>
  );
}

/** One Destination: what it is, its download, and once downloaded everything in its pack. */
export function DestinationScreen({ destination, onBack }: { destination: Destination; onBack: () => void }) {
  const s = useStrings(strings);
  const { colors } = useTheme();
  const { language } = usePreferences();
  const [pack, setPack] = useState<DestinationPack | null | undefined>(undefined);

  const reload = useCallback(() => {
    getPack(destination.id).then(setPack, () => setPack(null));
  }, [destination.id]);

  useEffect(reload, [reload]);

  // Prefer the downloaded copy: it is what works offline.
  const shown = pack?.destination ?? destination;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Pressable accessibilityRole="button" onPress={onBack} hitSlop={8} style={styles.back}>
        <MaterialCommunityIcons name="chevron-left" size={24} color={colors.muted} />
        <Text style={[textStyles.bodyStrong, { color: colors.muted }]}>{s.back}</Text>
      </Pressable>

      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text accessibilityRole="header" style={[textStyles.title, { color: colors.ink }]}>
            {shown.name}
          </Text>
          {pack ? <WorksOfflineIcon /> : null}
        </View>
        <Text style={[textStyles.body, { color: colors.muted }]}>
          {shown.elevationM === null
            ? shown.region
            : fill(s.regionElevation, { region: shown.region, elevation: shown.elevationM })}
        </Text>
        {shown.isPlaceholder ? (
          <View style={[styles.chip, { backgroundColor: colors.butter }]}>
            <MaterialCommunityIcons name="alert-outline" size={16} color={colors.onButter} />
            <Text style={[textStyles.labelStrong, { color: colors.onButter }]}>{s.placeholder}</Text>
          </View>
        ) : null}
        <Text style={[textStyles.body, { color: colors.ink }]}>{shown.summary[language]}</Text>
      </View>

      {pack === undefined ? null : (
        <DownloadPanel destination={destination} pack={pack} onDownloaded={setPack} s={s} colors={colors} />
      )}

      {pack ? <PackContents pack={pack} s={s} colors={colors} /> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 20,
  },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    minHeight: 44,
    marginLeft: -6,
  },
  header: {
    gap: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  panel: {
    gap: 10,
  },
  track: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 5,
  },
  numbers: {
    fontVariant: ['tabular-nums'],
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 52,
    paddingHorizontal: 20,
    borderRadius: 14,
  },
  section: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  tile: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grow: {
    flex: 1,
  },
  passage: {
    gap: 6,
    padding: 12,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
