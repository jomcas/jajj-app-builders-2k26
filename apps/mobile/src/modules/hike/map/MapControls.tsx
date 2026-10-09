import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { ReactNode } from 'react';
import { Linking, Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';

import { useStrings, useTheme } from '../../../settings/preferences';
import type { Palette } from '../../../theme/tokens';
import { textStyles } from '../../../theme/typography';
import type { LocationPermission } from '../location/useHikerPosition';
import strings from '../strings';

type Strings = Record<keyof (typeof strings)['en'], string>;

/** The licence notice, always visible on the map, offline too. Tapping it does nothing. */
function AttributionChip({ s, colors }: { s: Strings; colors: Palette }) {
  return (
    <View style={[styles.attribution, { backgroundColor: colors.surface, borderColor: colors.line }]}>
      <Text style={[styles.attributionText, { color: colors.muted }]} numberOfLines={2}>
        {s.attribution}
      </Text>
    </View>
  );
}

/** An olive button for the bottom panel. */
function PanelButton({
  label,
  onPress,
  colors,
}: {
  label: string;
  onPress: () => void;
  colors: Palette;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.textButton,
        { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <Text style={[textStyles.bodyStrong, { color: colors.onPrimary }]}>{label}</Text>
    </Pressable>
  );
}

/**
 * The controls over the Hike map. Buttons sit on an opaque panel, never directly on the map
 * (docs/plan.md). Shows the location explanation before Android's permission dialog, the
 * re-center button, a note when there is no GPS position yet, and the attribution. `children`
 * (the Trail picker, or the Hike panel during a Hike) go underneath, at the bottom.
 */
export function MapControls({
  permission,
  onAllowLocation,
  onRecenter,
  notice,
  children,
  onLayout,
}: {
  permission: LocationPermission;
  onAllowLocation: () => void;
  onRecenter: () => void;
  /** A short message about the last re-center, e.g. that there is no GPS position yet. */
  notice: string | null;
  children?: ReactNode;
  onLayout?: (event: LayoutChangeEvent) => void;
}) {
  const { colors } = useTheme();
  const s = useStrings(strings);

  const message =
    permission === 'ask' ? s.locationAsk : permission === 'blocked' ? s.locationBlocked : notice;

  return (
    <View style={styles.bottom} pointerEvents="box-none" onLayout={onLayout}>
      {message ? (
        <View
          accessibilityLiveRegion="polite"
          style={[styles.panel, styles.messagePanel, { backgroundColor: colors.surface, borderColor: colors.line }]}
        >
          <Text style={[textStyles.body, { color: colors.ink }]}>{message}</Text>
          {permission === 'ask' ? (
            <PanelButton label={s.allowLocation} onPress={onAllowLocation} colors={colors} />
          ) : null}
          {permission === 'blocked' ? (
            <PanelButton label={s.openSettings} onPress={() => Linking.openSettings()} colors={colors} />
          ) : null}
        </View>
      ) : null}
      <View style={styles.row} pointerEvents="box-none">
        <AttributionChip s={s} colors={colors} />
        <View style={[styles.panel, styles.recenterPanel, { backgroundColor: colors.surface, borderColor: colors.line }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={s.recenter}
            onPress={onRecenter}
            hitSlop={6}
            style={({ pressed }) => [
              styles.recenter,
              { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <MaterialCommunityIcons name="crosshairs-gps" size={26} color={colors.onPrimary} />
          </Pressable>
        </View>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  bottom: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  panel: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    elevation: 3,
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  messagePanel: {
    padding: 14,
    gap: 12,
  },
  recenterPanel: {
    padding: 6,
  },
  recenter: {
    width: 52,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textButton: {
    alignSelf: 'flex-start',
    minHeight: 48,
    paddingHorizontal: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attribution: {
    flexShrink: 1,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  attributionText: {
    ...textStyles.label,
    fontSize: 11,
    lineHeight: 14,
  },
});
