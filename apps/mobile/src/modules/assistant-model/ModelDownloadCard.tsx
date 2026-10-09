import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useStrings, useTheme } from '../../settings/preferences';
import { textStyles } from '../../theme/typography';
import type { ModelState } from './downloader';
import { fill, formatBytes, percent } from './format';
import { getModelSource, pauseDownload, startDownload, useModelState } from './store';
import strings from './strings';

type Strings = Record<keyof (typeof strings)['en'], string>;

function statusText(s: Strings, state: ModelState): string {
  const values = {
    done: formatBytes(state.bytesDone),
    total: formatBytes(state.bytesTotal),
    percent: percent(state.bytesDone, state.bytesTotal),
  };
  switch (state.status) {
    case 'missing':
      return s.statusMissing;
    case 'downloading':
      return fill(s.statusDownloading, values);
    case 'paused':
      return fill(s.statusPaused, values);
    case 'error':
      return fill(s.statusError, values);
    case 'ready':
      return s.statusReady;
  }
}

function buttonFor(s: Strings, state: ModelState): { label: string; onPress: () => void } | null {
  switch (state.status) {
    case 'missing':
      return { label: s.download, onPress: startDownload };
    case 'downloading':
      return { label: s.pause, onPress: pauseDownload };
    case 'paused':
      return { label: s.resume, onPress: startDownload };
    case 'error':
      return { label: s.retryNow, onPress: startDownload };
    case 'ready':
      return null;
  }
}

/**
 * The model download: size, Wi-Fi advice, a progress bar and one button (download, pause,
 * resume or retry). Used by the setup screen and by <ModelGate>.
 */
export function ModelDownloadCard() {
  const { colors } = useTheme();
  const s = useStrings(strings);
  const state = useModelState();
  const button = buttonFor(s, state);
  const done = percent(state.bytesDone, state.bytesTotal);

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
      {getModelSource() === 'test' ? (
        <Text style={[textStyles.labelStrong, { color: colors.onButter, backgroundColor: colors.butter }, styles.badge]}>
          {s.testSource}
        </Text>
      ) : null}
      <Text style={[textStyles.bodyStrong, { color: colors.ink }]}>
        {fill(s.sizeNote, { size: formatBytes(state.bytesTotal) })}
      </Text>
      <View
        accessibilityRole="progressbar"
        accessibilityLabel={s.progressLabel}
        accessibilityValue={{ min: 0, max: 100, now: done }}
        style={[styles.track, { backgroundColor: colors.tint }]}
      >
        <View style={[styles.fill, { width: `${done}%`, backgroundColor: colors.trail }]} />
      </View>
      <Text style={[textStyles.body, { color: colors.muted }]}>{statusText(s, state)}</Text>
      {state.status === 'error' ? (
        <Text style={[textStyles.label, { color: colors.muted }]}>{fill(s.errorDetail, { message: state.message })}</Text>
      ) : null}
      {state.status === 'downloading' ? (
        <Text style={[textStyles.label, { color: colors.muted }]}>{s.keepsRunning}</Text>
      ) : null}
      {button ? (
        <Pressable
          accessibilityRole="button"
          onPress={button.onPress}
          style={[styles.button, { backgroundColor: colors.primary }]}
        >
          <Text style={[textStyles.bodyStrong, { color: colors.onPrimary }]}>{button.label}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
  },
  track: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 5,
  },
  button: {
    minHeight: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
