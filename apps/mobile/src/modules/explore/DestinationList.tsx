import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { EmptyState } from '../../shell/EmptyState';
import { useStrings, useTheme } from '../../settings/preferences';
import { textStyles } from '../../theme/typography';
import { listCatalog, listDownloaded, type Destination } from '../destination-pack';
import { fill } from './format';
import { destinationRows, type DestinationRow } from './rows';
import strings from './strings';
import { WorksOfflineIcon } from './WorksOfflineIcon';

type Listing = { rows: DestinationRow[]; offline: boolean };

/**
 * Destinations from Supabase while online. When the catalog can't be reached, the
 * Destinations already on the phone instead of an error (ADR 0002).
 */
async function loadListing(): Promise<Listing> {
  const [catalog, downloaded] = await Promise.allSettled([listCatalog(), listDownloaded()]);
  const onPhone = downloaded.status === 'fulfilled' ? downloaded.value : [];
  const online = catalog.status === 'fulfilled' ? catalog.value : null;
  return { rows: destinationRows(online, onPhone), offline: online === null };
}

export function DestinationList({ onOpen }: { onOpen: (destination: Destination) => void }) {
  const s = useStrings(strings);
  const { colors } = useTheme();
  const [listing, setListing] = useState<Listing | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setListing(await loadListing());
    setRefreshing(false);
  }, []);

  useEffect(() => {
    let live = true;
    loadListing().then((next) => {
      if (live) setListing(next);
    });
    return () => {
      live = false;
    };
  }, []);

  if (!listing) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} />
        <Text style={[textStyles.body, { color: colors.muted }]}>{s.loading}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={listing.rows}
      keyExtractor={(row) => row.destination.id}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[colors.primary]} />}
      ListHeaderComponent={
        listing.offline && listing.rows.length > 0 ? (
          <Text style={[textStyles.label, styles.note, { color: colors.muted }]}>{s.offlineNote}</Text>
        ) : null
      }
      ListEmptyComponent={
        listing.offline ? (
          <EmptyState icon="cloud-off-outline" title={s.emptyOfflineTitle} body={s.emptyOfflineBody} />
        ) : (
          <EmptyState icon="map-marker-path" title={s.emptyTitle} body={s.emptyBody} />
        )
      }
      renderItem={({ item }) => (
        <Pressable
          accessibilityRole="button"
          onPress={() => onOpen(item.destination)}
          style={({ pressed }) => [
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.line, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <View style={styles.cardText}>
            <View style={styles.titleRow}>
              <Text style={[textStyles.heading, { color: colors.ink }]}>{item.destination.name}</Text>
              {item.downloaded ? <WorksOfflineIcon size={18} /> : null}
            </View>
            <Text style={[textStyles.body, { color: colors.muted }]}>
              {item.destination.elevationM === null
                ? item.destination.region
                : fill(s.regionElevation, {
                    region: item.destination.region,
                    elevation: item.destination.elevationM,
                  })}
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color={colors.muted} />
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  note: {
    marginBottom: 4,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  cardText: {
    flex: 1,
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
