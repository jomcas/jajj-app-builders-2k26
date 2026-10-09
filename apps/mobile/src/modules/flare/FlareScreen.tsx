import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useEffect, useReducer, useState } from 'react';
import { Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useStrings, useTheme } from '../../settings/preferences';
import { textStyles } from '../../theme/typography';
import { fireFlare, setStrobeBrightness, stopFlare, useFlareState } from './flareStore';
import { IDLE, holdProgress, stepHold } from './gesture';
import { strobeHalfPeriodMs } from './strobe';
import flareStrings from './strings';

type Strings = Record<keyof typeof flareStrings.en, string>;

// The top Emergency Guides, opened through the Guides module's deep link (tahak://guides/<id>)
// so this module never imports the Guides module's code (ADR 0001, ADR 0003).
const GUIDES = [
  { id: 'lost-on-the-trail', key: 'guideLost' },
  { id: 'bleeding-wounds', key: 'guideBleeding' },
  { id: 'snakebite', key: 'guideSnakebite' },
  { id: 'sprains-fractures', key: 'guideSprains' },
  { id: 'hypothermia', key: 'guideHypothermia' },
] as const satisfies readonly { id: string; key: keyof Strings }[];

const EMERGENCY_NUMBER = '911';
/** The strobe's two frames. Red is allowed here: this is the Flare (ADR 0004). */
const STROBE_LIGHT = '#FFFFFF';
const TICK_MS = 50;

/**
 * The Flare screen, opened by the shell's SOS control on every tab. Shown as a full-screen
 * modal. Firing takes a 1.5 s hold, never a tap (ADR 0004); stopping is one tap on Stop Flare
 * or the back button. Hiding the screen (Close, or opening a Guide) leaves the Flare running.
 */
export function FlareScreen({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { active } = useFlareState();
  const s = useStrings(flareStrings);

  const openGuide = (id: string) => {
    onClose();
    Linking.openURL(`tahak://guides/${id}`).catch(() => undefined);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      statusBarTranslucent
      navigationBarTranslucent
      // Back stops a running Flare (one press, like Stop Flare); otherwise it closes the screen.
      onRequestClose={active ? stopFlare : onClose}
    >
      {active ? (
        <ActiveFlare s={s} openGuide={openGuide} />
      ) : (
        <IdleFlare s={s} onClose={onClose} openGuide={openGuide} />
      )}
    </Modal>
  );
}

function IdleFlare({ s, onClose, openGuide }: { s: Strings; onClose: () => void; openGuide: (id: string) => void }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.fill, { backgroundColor: colors.page }]}>
      <ScrollView
        contentContainerStyle={[styles.idleContent, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24 }]}
      >
        <View style={styles.headerRow}>
          <Text accessibilityRole="header" style={[textStyles.title, styles.flex, { color: colors.ink }]}>
            {s.title}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={s.close}
            hitSlop={8}
            onPress={onClose}
            style={styles.iconButton}
          >
            <MaterialCommunityIcons name="close" size={26} color={colors.muted} />
          </Pressable>
        </View>
        <Text style={[textStyles.body, { color: colors.muted }]}>{s.intro}</Text>
        <HoldToFire s={s} />
        <GuideLinks s={s} openGuide={openGuide} />
        <EmergencyNumber s={s} />
      </ScrollView>
    </View>
  );
}

/** The big red button. A press starts a 1.5 s bar; letting go early only shows a hint. */
function HoldToFire({ s }: { s: Strings }) {
  const { colors } = useTheme();
  const [hold, dispatch] = useReducer(stepHold, IDLE);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (hold.phase !== 'holding') return;
    const timer = setInterval(() => {
      const at = Date.now();
      setNow(at);
      dispatch({ type: 'tick', at });
    }, TICK_MS);
    return () => clearInterval(timer);
  }, [hold.phase]);

  useEffect(() => {
    if (hold.phase !== 'fired') return;
    fireFlare();
    dispatch({ type: 'reset' });
  }, [hold.phase]);

  const progress = holdProgress(hold, now);
  return (
    <View style={styles.holdBlock}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={s.hold}
        accessibilityHint={s.holdA11yHint}
        onPressIn={() => {
          const at = Date.now();
          setNow(at);
          dispatch({ type: 'press', at });
        }}
        onPressOut={() => dispatch({ type: 'release', at: Date.now() })}
        style={[styles.holdButton, { backgroundColor: colors.danger }]}
      >
        <MaterialCommunityIcons name="alarm-light-outline" size={32} color={colors.onDanger} />
        <Text style={[textStyles.heading, { color: colors.onDanger }]}>
          {hold.phase === 'holding' ? s.holding : s.hold}
        </Text>
        <View style={[styles.holdTrack, { backgroundColor: 'rgba(255,255,255,0.3)' }]}>
          <View style={[styles.holdBar, { width: `${progress * 100}%`, backgroundColor: colors.onDanger }]} />
        </View>
      </Pressable>
      {hold.phase === 'hint' ? (
        <Text accessibilityLiveRegion="polite" style={[textStyles.bodyStrong, styles.center, { color: colors.ink }]}>
          {s.holdHint}
        </Text>
      ) : null}
    </View>
  );
}

function ActiveFlare({ s, openGuide }: { s: Strings; openGuide: (id: string) => void }) {
  const { colors } = useTheme();
  const { torch } = useFlareState();
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.fill}>
      <Strobe />
      <View
        style={[
          styles.activePanel,
          { backgroundColor: colors.surface, borderColor: colors.line, paddingBottom: insets.bottom + 16 },
        ]}
      >
        <Text accessibilityRole="header" style={[textStyles.title, { color: colors.ink }]}>
          {s.activeTitle}
        </Text>
        <Text style={[textStyles.body, { color: colors.muted }]}>{torch ? s.activeTorch : s.activeNoTorch}</Text>
        <Text style={[textStyles.body, { color: colors.muted }]}>{s.activeSound}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={stopFlare}
          style={({ pressed }) => [styles.stopButton, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}
        >
          <MaterialCommunityIcons name="stop-circle-outline" size={28} color={colors.onPrimary} />
          <Text style={[textStyles.heading, { color: colors.onPrimary }]}>{s.stop}</Text>
        </Pressable>
        <GuideLinks s={s} openGuide={openGuide} compact />
        <EmergencyNumber s={s} />
      </View>
    </View>
  );
}

/** White and red, twice a second (strobe.ts keeps it at 3 flashes a second or fewer). */
function Strobe() {
  const { colors } = useTheme();
  const [light, setLight] = useState(true);

  useEffect(() => {
    setStrobeBrightness(true);
    const timer = setInterval(() => setLight((was) => !was), strobeHalfPeriodMs());
    return () => {
      clearInterval(timer);
      setStrobeBrightness(false);
    };
  }, []);

  return (
    <View
      testID="flare-strobe"
      importantForAccessibility="no-hide-descendants"
      style={[styles.fill, { backgroundColor: light ? STROBE_LIGHT : colors.danger }]}
    />
  );
}

function GuideLinks({ s, openGuide, compact = false }: { s: Strings; openGuide: (id: string) => void; compact?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={compact ? styles.compactSection : styles.section}>
      <Text style={[textStyles.labelStrong, { color: colors.muted }]}>{s.guidesHeading}</Text>
      <View style={compact ? styles.chips : styles.rows}>
        {GUIDES.map((guide) => (
          <Pressable
            key={guide.id}
            accessibilityRole="link"
            accessibilityHint={s.openGuideHint}
            onPress={() => openGuide(guide.id)}
            style={({ pressed }) => [
              compact ? styles.chip : styles.row,
              { backgroundColor: colors.surface, borderColor: colors.line, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <MaterialCommunityIcons name="medical-bag" size={20} color={colors.dangerIcon} />
            <Text style={[compact ? textStyles.label : textStyles.bodyStrong, styles.flexShrink, { color: colors.ink }]}>
              {s[guide.key]}
            </Text>
            {compact ? null : <MaterialCommunityIcons name="chevron-right" size={22} color={colors.muted} />}
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function EmergencyNumber({ s }: { s: Strings }) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint={s.callHint}
      onPress={() => Linking.openURL(`tel:${EMERGENCY_NUMBER}`).catch(() => undefined)}
      style={({ pressed }) => [
        styles.numberRow,
        { backgroundColor: colors.tint, opacity: pressed ? 0.8 : 1 },
      ]}
    >
      <MaterialCommunityIcons name="phone-outline" size={24} color={colors.onTint} />
      <View style={styles.flex}>
        <Text style={[textStyles.labelStrong, { color: colors.onTint }]}>{s.emergencyHeading}</Text>
        <Text style={[textStyles.body, { color: colors.onTint }]}>{s.emergencyNote}</Text>
      </View>
      <Text style={[textStyles.number, { color: colors.onTint }]}>{s.emergencyNumber}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  flex: { flex: 1 },
  flexShrink: { flexShrink: 1 },
  center: { textAlign: 'center' },
  idleContent: { paddingHorizontal: 16, gap: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  holdBlock: { gap: 10 },
  holdButton: {
    minHeight: 120,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 22,
    overflow: 'hidden',
  },
  holdTrack: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 8 },
  holdBar: { height: 8 },
  section: { gap: 8 },
  compactSection: { gap: 6 },
  rows: { gap: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 52,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 40,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  numberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 64,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  activePanel: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 10,
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    minHeight: 64,
    borderRadius: 16,
    marginVertical: 4,
  },
});
