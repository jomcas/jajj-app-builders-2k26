import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { EmptyState } from '../../shell/EmptyState';
import { useStrings, useTheme } from '../../settings/preferences';
import { textStyles } from '../../theme/typography';
import type { DestinationPack } from '../destination-pack';
import { useHikerPosition } from './location/useHikerPosition';
import { HikeMap, type HikeMapHandle } from './map/HikeMap';
import { MapControls } from './map/MapControls';
import strings from './strings';
import { useLatestPack } from './useLatestPack';

const NOTICE_MS = 5000;

/** The map of one Destination with the hiker's position and the map controls. */
function DestinationMap({ pack }: { pack: DestinationPack }) {
  const s = useStrings(strings);
  const { permission, position, requestPermission, retry } = useHikerPosition();
  const map = useRef<HikeMapHandle>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), NOTICE_MS);
    return () => clearTimeout(timer);
  }, [notice]);

  const recenter = useCallback(async () => {
    if (position) {
      map.current?.centerOn(position);
      return;
    }
    // Without permission the panel already explains how to allow location.
    if (permission !== 'granted') return;
    const { servicesEnabled } = await retry();
    setNotice(servicesEnabled ? s.noFix : s.servicesOff);
  }, [permission, position, retry, s.noFix, s.servicesOff]);

  return (
    <View style={styles.fill}>
      <HikeMap ref={map} pack={pack} position={position} />
      <MapControls
        permission={permission}
        onAllowLocation={requestPermission}
        onRecenter={recenter}
        // The note goes away as soon as a position arrives.
        notice={position ? null : notice}
      />
    </View>
  );
}

/**
 * The Hike tab (issue #6): the most recently downloaded Destination's map, full screen, or a
 * pointer to Explore when no pack is on the phone. #7 and #8 add the Hike itself on top.
 */
export function HikeScreen() {
  const s = useStrings(strings);
  const { colors } = useTheme();
  const latest = useLatestPack();

  if (latest.status === 'loading') {
    return (
      <View style={[styles.fill, styles.center]}>
        <ActivityIndicator color={colors.primary} />
        <Text style={[textStyles.body, { color: colors.muted }]}>{s.loading}</Text>
      </View>
    );
  }
  if (latest.status === 'none') {
    return <EmptyState icon="map-outline" title={s.emptyTitle} body={s.emptyBody} />;
  }
  return <DestinationMap key={latest.pack.destination.id} pack={latest.pack} />;
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
});
