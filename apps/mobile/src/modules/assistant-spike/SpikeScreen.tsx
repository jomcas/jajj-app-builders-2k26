import * as ImagePicker from 'expo-image-picker';
import { useState, useSyncExternalStore } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { useStrings, useTheme } from '../../settings/preferences';
import type { Palette } from '../../theme/tokens';
import { textStyles } from '../../theme/typography';
import { benchStore, type BenchState } from './bench';
import { ask, engineStore, loadModel, type AnswerMetrics, type Backend, type EngineState } from './engine';
import { errorMessage, fill, rate } from './format';
import strings from './strings';

type Strings = Record<keyof (typeof strings)['en'], string>;

function statusText(s: Strings, engine: EngineState): string {
  switch (engine.status) {
    case 'idle':
      return s.statusIdle;
    case 'loading':
      return engine.phase === 'mmproj' ? s.statusLoadingVision : fill(s.statusLoading, { percent: engine.percent });
    case 'ready':
      return engine.model.backend === 'gpu'
        ? fill(s.statusReadyGpu, { layers: engine.model.nGpuLayers })
        : fill(s.statusReadyCpu, { threads: engine.model.threads });
    case 'error':
      return fill(s.statusError, { error: engine.error });
  }
}

function benchText(s: Strings, bench: BenchState): string | null {
  switch (bench.status) {
    case 'idle':
      return null;
    case 'running':
      return fill(s.benchRunning, { step: bench.step, steps: bench.steps });
    case 'done':
      return s.benchDone;
    case 'error':
      return fill(s.benchFailed, { error: bench.error });
  }
}

function Button({
  label,
  onPress,
  disabled,
  colors,
  kind = 'primary',
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  colors: Palette;
  kind?: 'primary' | 'tint';
}) {
  const fillColor = kind === 'primary' ? colors.primary : colors.tint;
  const inkColor = kind === 'primary' ? colors.onPrimary : colors.onTint;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.button, { backgroundColor: fillColor, opacity: disabled ? 0.5 : 1 }]}
    >
      <Text style={[textStyles.bodyStrong, { color: inkColor }]}>{label}</Text>
    </Pressable>
  );
}

/** Test screen for the on-device model: load it, ask a question, attach a photo. */
export function SpikeScreen() {
  const s = useStrings(strings);
  const { colors } = useTheme();
  const engine = useSyncExternalStore(engineStore.subscribe, engineStore.getSnapshot);
  const bench = useSyncExternalStore(benchStore.subscribe, benchStore.getSnapshot);

  const [question, setQuestion] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [answer, setAnswer] = useState('');
  const [metrics, setMetrics] = useState<AnswerMetrics | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const benchRunning = bench.status === 'running';
  const loading = engine.status === 'loading';

  async function load(backend: Backend) {
    setNotice(null);
    await loadModel(backend).catch(() => undefined); // The status line shows the error.
  }

  async function takePhoto() {
    setNotice(null);
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setNotice(s.cameraDenied);
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (!result.canceled && result.assets[0]) setPhoto(result.assets[0].uri);
  }

  async function send() {
    const text = question.trim();
    if (!text) return;
    setBusy(true);
    setNotice(null);
    setAnswer('');
    setMetrics(null);
    try {
      const model = engine.status === 'ready' ? engine.model : await loadModel('cpu');
      const result = await ask(model, { question: text, photo: photo ?? undefined }, setAnswer);
      setAnswer(result.text);
      setMetrics(result);
      setPhoto(null);
    } catch (error) {
      setNotice(fill(s.answerError, { error: errorMessage(error) }));
    } finally {
      setBusy(false);
    }
  }

  const benchLine = benchText(s, bench);
  const ink = { color: colors.ink };
  const muted = { color: colors.muted };

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={[textStyles.heading, ink]}>{s.title}</Text>
      <Text style={[textStyles.body, muted]}>{s.intro}</Text>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
        <Text style={[textStyles.bodyStrong, ink]}>{statusText(s, engine)}</Text>
        {engine.status === 'ready' ? (
          <Text style={[textStyles.label, muted]}>
            {fill(s.loadTimes, { model: engine.model.modelLoadMs, mmproj: engine.model.mmprojLoadMs })}
          </Text>
        ) : null}
        {benchLine ? <Text style={[textStyles.label, muted]}>{benchLine}</Text> : null}
        <View style={styles.row}>
          <Button label={s.loadCpu} onPress={() => load('cpu')} disabled={loading || busy || benchRunning} colors={colors} kind="tint" />
          <Button label={s.loadGpu} onPress={() => load('gpu')} disabled={loading || busy || benchRunning} colors={colors} kind="tint" />
        </View>
      </View>

      <TextInput
        value={question}
        onChangeText={setQuestion}
        placeholder={s.questionPlaceholder}
        placeholderTextColor={colors.muted}
        multiline
        style={[styles.input, textStyles.body, ink, { backgroundColor: colors.surface, borderColor: colors.line }]}
      />

      {photo ? (
        <View style={styles.photoRow}>
          <Image source={{ uri: photo }} accessibilityLabel={s.photoPreview} style={styles.thumb} />
          <View style={styles.photoText}>
            <Text style={[textStyles.label, ink]}>{s.photoAttached}</Text>
            <Pressable accessibilityRole="button" onPress={() => setPhoto(null)}>
              <Text style={[textStyles.labelStrong, { color: colors.primary }]}>{s.removePhoto}</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      <View style={styles.row}>
        <Button label={s.takePhoto} onPress={takePhoto} disabled={busy || benchRunning} colors={colors} kind="tint" />
        <Button label={s.send} onPress={send} disabled={busy || loading || benchRunning || !question.trim()} colors={colors} />
      </View>

      {notice ? <Text style={[textStyles.body, ink]}>{notice}</Text> : null}
      {busy && !answer ? <Text style={[textStyles.body, muted]}>{s.answering}</Text> : null}
      {answer ? (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
          <Text selectable style={[textStyles.body, ink]}>{answer}</Text>
          {metrics ? (
            <Text style={[textStyles.label, muted]}>
              {fill(s.speed, {
                tps: rate(metrics.generationTps),
                ptps: rate(metrics.promptTps),
                ttft: metrics.ttftMs,
              })}
            </Text>
          ) : null}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    gap: 12,
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  input: {
    minHeight: 88,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    textAlignVertical: 'top',
  },
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 8,
  },
  photoText: {
    flex: 1,
    gap: 4,
  },
});
