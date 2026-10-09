import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { usePreferences, useStrings, useTheme } from '../../settings/preferences';
import type { Palette } from '../../theme/tokens';
import { textStyles } from '../../theme/typography';
import { DistressCard, EmergencyGuideCard } from '../emergency';
import { openGuide } from '../guides';
import { answer, testFlags } from './assistant';
import type { Chunk } from './corpus';
import { errorMessage, fill } from './format';
import { engineStore, loadModel } from './llm';
import { answerPhoto, photoActivity, readPhotoAhead, type PhotoTiming } from './photoAssistant';
import type { PhotoReply } from './photoPipeline';
import type { Reply } from './pipeline';
import { chipGroups, chipLabel, inLanguage } from './sources';
import strings from './strings';
import { appIndex } from './vectorIndex';

type Strings = Record<keyof (typeof strings)['en'], string>;

type Photo = { uri: string; width: number; height: number };

type Message =
  | { id: string; role: 'user'; text: string; photo?: string }
  | { id: string; role: 'assistant'; text: string; reply?: Reply | (PhotoReply & { timing: PhotoTiming }); error?: string };

let nextId = 0;
const newId = () => String(++nextId);

/** The Ask tab (U4): a chat with the on-device Assistant, answering from the search corpus. */
export function AskScreen() {
  const s = useStrings(strings);
  const { colors } = useTheme();
  const { language } = usePreferences();
  const engine = useSyncExternalStore(engineStore.subscribe, engineStore.getSnapshot);
  const index = useSyncExternalStore(appIndex.subscribe, appIndex.status);
  const ignorePacks = useSyncExternalStore(testFlags.subscribe, testFlags.ignorePacks);

  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState('');
  const [busy, setBusy] = useState(false);
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [photoSheet, setPhotoSheet] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const activity = useSyncExternalStore(photoActivity.subscribe, photoActivity.getSnapshot);
  const [now, setNow] = useState(() => Date.now());
  const [sheet, setSheet] = useState<Chunk[] | null>(null);
  const [topOffset, setTopOffset] = useState(0);
  const containerRef = useRef<View>(null);
  const listRef = useRef<FlatList<Message>>(null);

  // Load the chat model when the Ask tab first opens, so the first question doesn't also wait
  // for the ~6 s load. A failure shows up on the first question instead.
  useEffect(() => {
    void loadModel('cpu').catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 5000);
    return () => clearTimeout(timer);
  }, [notice]);

  // Ticks the seconds in the "Reading the photo… n s" status while the photo path works.
  useEffect(() => {
    if (activity.phase === 'idle') return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [activity]);

  async function pickPhoto(source: 'camera' | 'gallery') {
    setPhotoSheet(false);
    if (source === 'camera') {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setNotice(s.cameraDenied);
        return;
      }
    }
    // Full quality: anything lower re-encodes the 12 MP photo first (slower). llama.cpp scales
    // it down to the vision token cap itself (vision.ts).
    const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 1 };
    const result = source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
    const asset = result.canceled ? undefined : result.assets[0];
    if (!asset) return;
    setPhoto({ uri: asset.uri, width: asset.width, height: asset.height });
    // Read the photo now, while the hiker types: the answer then starts much sooner.
    void readPhotoAhead(asset.uri, language).catch(() => undefined);
  }

  const update = (id: string, patch: Partial<Extract<Message, { role: 'assistant' }>>) =>
    setMessages((all) => all.map((m) => (m.id === id && m.role === 'assistant' ? { ...m, ...patch } : m)));

  async function send(text = question) {
    const q = text.trim();
    const attached = photo;
    if ((!q && !attached) || busy) return;
    const answerId = newId();
    setMessages((all) => [...all, { id: newId(), role: 'user', text: q, photo: attached?.uri }, { id: answerId, role: 'assistant', text: '' }]);
    setQuestion('');
    setPhoto(null);
    setBusy(true);
    try {
      const onDisplay = (shown: string) => update(answerId, { text: shown });
      const reply = attached
        ? await answerPhoto(q || s.photoDefaultQuestion, attached.uri, { language, onDisplay, size: attached })
        : await answer(q, { language, onDisplay });
      update(answerId, { reply, text: reply.kind === 'answer' || reply.kind === 'photo-answer' ? reply.text : '' });
      // The source chips arrive with the final reply; bring them into view.
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 150);
    } catch (error) {
      update(answerId, { error: errorMessage(error) });
    } finally {
      setBusy(false);
    }
  }

  function openSource(chunks: Chunk[]) {
    const first = chunks[0];
    if (first.target.type === 'guide') openGuide(first.target.guideId);
    else setSheet(chunks);
  }

  const seconds = activity.phase === 'idle' ? 0 : Math.max(0, Math.round((now - activity.since) / 1000));
  const status =
    engine.status === 'loading'
      ? fill(s.loadingModel, { percent: Math.round(engine.percent) })
      : activity.phase === 'reading'
        ? fill(s.readingPhoto, { seconds })
        : activity.phase === 'answering'
          ? fill(s.answeringPhoto, { seconds })
          : index.phase === 'indexing'
            ? fill(s.indexing, { done: index.done, total: index.total })
            : null;
  const canSend = !busy && (!!question.trim() || !!photo);

  const ink = { color: colors.ink };
  const muted = { color: colors.muted };

  return (
    <View
      ref={containerRef}
      style={styles.fill}
      onLayout={() => containerRef.current?.measureInWindow((_x, y) => setTopOffset(y))}
    >
      <KeyboardAvoidingView
        style={styles.fill}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={topOffset}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          ListHeaderComponent={
            <View style={styles.intro}>
              <Text style={[textStyles.heading, ink]}>{s.introTitle}</Text>
              <Text style={[textStyles.body, muted]}>{s.introBody}</Text>
              {messages.length === 0 ? (
                <View style={styles.chips}>
                  {[s.exampleWater, s.exampleFood, s.exampleDownload].map((example) => (
                    <Chip key={example} label={example} onPress={() => send(example)} colors={colors} disabled={busy} />
                  ))}
                </View>
              ) : null}
              {ignorePacks ? <Text style={[textStyles.label, { color: colors.onButter, backgroundColor: colors.butter }, styles.banner]}>{s.packsIgnored}</Text> : null}
            </View>
          }
          renderItem={({ item }) =>
            item.role === 'user' ? (
              <View accessibilityLabel={s.you} style={[styles.bubble, styles.userBubble, { backgroundColor: colors.tint }]}>
                {item.photo ? <Image source={{ uri: item.photo }} accessibilityLabel={s.yourPhoto} style={styles.sentPhoto} /> : null}
                {item.text ? <Text selectable style={[textStyles.body, { color: colors.onTint }]}>{item.text}</Text> : null}
              </View>
            ) : (
              <AssistantBubble message={item} s={s} colors={colors} onSource={openSource} />
            )
          }
        />

        {status ? <Text style={[textStyles.label, muted, styles.status]}>{status}</Text> : null}
        {notice ? <Text style={[textStyles.label, muted, styles.status]}>{notice}</Text> : null}

        {photo ? (
          <View style={[styles.attachment, { borderTopColor: colors.line, backgroundColor: colors.page }]}>
            <Image source={{ uri: photo.uri }} accessibilityLabel={s.yourPhoto} style={styles.thumb} />
            <Text style={[textStyles.label, muted, styles.fill]}>{s.photoAttached}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={s.removePhoto}
              disabled={busy}
              onPress={() => setPhoto(null)}
              style={[styles.removeButton, { backgroundColor: colors.tint }]}
            >
              <MaterialCommunityIcons name="close" size={22} color={colors.onTint} />
            </Pressable>
          </View>
        ) : null}

        <View style={[styles.inputBar, { borderTopColor: colors.line, backgroundColor: colors.page }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={s.camera}
            accessibilityState={{ disabled: busy }}
            disabled={busy}
            onPress={() => setPhotoSheet(true)}
            style={[styles.iconButton, { backgroundColor: colors.tint, opacity: busy ? 0.5 : 1 }]}
          >
            <MaterialCommunityIcons name="camera-outline" size={24} color={colors.onTint} />
          </Pressable>
          <TextInput
            value={question}
            onChangeText={setQuestion}
            placeholder={photo ? s.photoPlaceholder : s.inputPlaceholder}
            placeholderTextColor={colors.muted}
            multiline
            maxLength={500}
            style={[styles.input, textStyles.body, ink, { backgroundColor: colors.surface, borderColor: colors.line }]}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={s.send}
            accessibilityState={{ disabled: !canSend }}
            disabled={!canSend}
            onPress={() => send()}
            style={[styles.iconButton, { backgroundColor: colors.primary, opacity: canSend ? 1 : 0.5 }]}
          >
            <MaterialCommunityIcons name="send" size={22} color={colors.onPrimary} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <SourceSheet chunks={sheet} onClose={() => setSheet(null)} s={s} colors={colors} />
      <PhotoSheet visible={photoSheet} onPick={pickPhoto} onClose={() => setPhotoSheet(false)} s={s} colors={colors} />
    </View>
  );
}

/** Take a photo or choose one from the gallery. */
function PhotoSheet({
  visible,
  onPick,
  onClose,
  s,
  colors,
}: {
  visible: boolean;
  onPick: (source: 'camera' | 'gallery') => void;
  onClose: () => void;
  s: Strings;
  colors: Palette;
}) {
  const insets = useSafeAreaInsets();
  const option = (source: 'camera' | 'gallery', icon: 'camera-outline' | 'image-outline', label: string) => (
    <Pressable accessibilityRole="button" onPress={() => onPick(source)} style={[styles.sheetOption, { backgroundColor: colors.tint }]}>
      <MaterialCommunityIcons name={icon} size={24} color={colors.onTint} />
      <Text style={[textStyles.bodyStrong, { color: colors.onTint }]}>{label}</Text>
    </Pressable>
  );
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable accessibilityRole="button" accessibilityLabel={s.cancel} style={[styles.scrim, { backgroundColor: colors.scrim }]} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: colors.surface, paddingBottom: 16 + insets.bottom }]}>
        <Text style={[textStyles.heading, { color: colors.ink }]}>{s.camera}</Text>
        <Text style={[textStyles.body, { color: colors.muted }]}>{s.photoSheetBody}</Text>
        {option('camera', 'camera-outline', s.takePhoto)}
        {option('gallery', 'image-outline', s.choosePhoto)}
        <Pressable accessibilityRole="button" onPress={onClose} style={[styles.closeButton, { borderWidth: 1, borderColor: colors.line }]}>
          <Text style={[textStyles.bodyStrong, { color: colors.ink }]}>{s.cancel}</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

function Chip({ label, onPress, colors, disabled }: { label: string; onPress: () => void; colors: Palette; disabled?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={[styles.chip, { backgroundColor: colors.tint, opacity: disabled ? 0.5 : 1 }]}
    >
      <Text style={[textStyles.labelStrong, { color: colors.onTint }]}>{label}</Text>
    </Pressable>
  );
}

function AssistantBubble({
  message,
  s,
  colors,
  onSource,
}: {
  message: Extract<Message, { role: 'assistant' }>;
  s: Strings;
  colors: Palette;
  onSource: (chunks: Chunk[]) => void;
}) {
  const { language } = usePreferences();
  const { reply, error, text } = message;
  const corpus = appIndex.chunks();
  const box = [styles.bubble, styles.assistantBubble, { backgroundColor: colors.surface, borderColor: colors.line }];

  // ADR 0003: an emergency gets the Guide's own card (or the distress card), never model text.
  // The card is its own surface, so it is not wrapped in a bubble.
  if (!error && reply?.kind === 'emergency') {
    return (
      <View accessibilityLabel={s.assistant} style={styles.cardReply}>
        {reply.guideId ? <EmergencyGuideCard guideId={reply.guideId} /> : <DistressCard />}
      </View>
    );
  }

  let body: React.ReactNode;
  if (error) body = <Text style={[textStyles.body, { color: colors.ink }]}>{fill(s.answerError, { error })}</Text>;
  else if (reply?.kind === 'off-topic') {
    const photoNoAnswer = 'photo' in reply && reply.reason === 'no-source';
    body = <Text style={[textStyles.body, { color: colors.ink }]}>{photoNoAnswer ? s.photoOffTopic : s.offTopic}</Text>;
  }
  else if (text) body = <Text selectable style={[textStyles.body, { color: colors.ink }]}>{text}</Text>;
  else body = <Text style={[textStyles.body, { color: colors.muted }]}>{s.answering}</Text>;

  const chips =
    reply?.kind === 'answer' || reply?.kind === 'photo-answer'
      ? chipGroups(reply.sources.map((c) => inLanguage(c, language, corpus)), s)
      : [];
  const timing = reply?.kind === 'photo-answer' ? fill(s.photoTiming, { seconds: Math.round(reply.timing.firstWordMs / 1000) }) : null;

  return (
    <View accessibilityLabel={s.assistant} style={box}>
      {body}
      {timing ? <Text style={[textStyles.label, { color: colors.muted }]}>{timing}</Text> : null}
      {chips.length > 0 ? (
        <View style={styles.sources}>
          <Text style={[textStyles.label, { color: colors.muted }]}>{s.sources}</Text>
          <View style={styles.chips}>
            {chips.map(({ label, chunks }) => {
              const pack = chunks[0].target.type === 'passage';
              return (
                <Pressable
                  key={chunks[0].id}
                  accessibilityRole="button"
                  onPress={() => onSource(chunks)}
                  style={[styles.chip, { backgroundColor: pack ? colors.peach : colors.tint }]}
                >
                  <Text style={[textStyles.labelStrong, { color: pack ? colors.onPeach : colors.onTint }]}>{label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}
    </View>
  );
}

/** Pack passages or an app-help passage, shown in full with where they came from. */
function SourceSheet({ chunks, onClose, s, colors }: { chunks: Chunk[] | null; onClose: () => void; s: Strings; colors: Palette }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={!!chunks} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable accessibilityRole="button" accessibilityLabel={s.close} style={[styles.scrim, { backgroundColor: colors.scrim }]} onPress={onClose} />
      {chunks ? (
        <View style={[styles.sheet, { backgroundColor: colors.surface, paddingBottom: 16 + insets.bottom }]}>
          <ScrollView contentContainerStyle={styles.sheetContent}>
            <Text style={[textStyles.heading, { color: colors.ink }]}>{chipLabel(chunks[0], s)}</Text>
            {chunks.map((chunk) => (
              <View key={chunk.id} style={styles.sheetContent}>
                <Text selectable style={[textStyles.body, { color: colors.ink }]}>{chunk.text}</Text>
                {chunk.target.type === 'help' ? (
                  <Text style={[textStyles.label, { color: colors.muted }]}>{s.helpNote}</Text>
                ) : (
                  <Text style={[textStyles.label, { color: colors.muted }]}>{fill(s.sourceLine, { source: chunk.source })}</Text>
                )}
              </View>
            ))}
          </ScrollView>
          <Pressable accessibilityRole="button" onPress={onClose} style={[styles.closeButton, { backgroundColor: colors.primary }]}>
            <Text style={[textStyles.bodyStrong, { color: colors.onPrimary }]}>{s.close}</Text>
          </Pressable>
        </View>
      ) : null}
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  list: { padding: 16, gap: 12 },
  intro: { gap: 8, marginBottom: 4 },
  banner: { padding: 8, borderRadius: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: 36, borderRadius: 18, paddingHorizontal: 12, paddingVertical: 8, justifyContent: 'center' },
  bubble: { borderRadius: 14, padding: 12, gap: 10, maxWidth: '92%' },
  userBubble: { alignSelf: 'flex-end' },
  assistantBubble: { alignSelf: 'flex-start', borderWidth: 1 },
  cardReply: { alignSelf: 'stretch' },
  sources: { gap: 6 },
  status: { paddingHorizontal: 16, paddingBottom: 4 },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: 8, borderTopWidth: 1 },
  attachment: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 8, paddingTop: 8, borderTopWidth: 1 },
  thumb: { width: 56, height: 56, borderRadius: 8 },
  sentPhoto: { width: 180, height: 180, borderRadius: 10 },
  removeButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  sheetOption: { minHeight: 52, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16 },
  iconButton: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  input: { flex: 1, minHeight: 48, maxHeight: 120, borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 12 },
  scrim: { ...StyleSheet.absoluteFill },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, maxHeight: '75%', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, gap: 12 },
  sheetContent: { gap: 10 },
  closeButton: { minHeight: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
