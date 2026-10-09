import { useIsFocused } from '@react-navigation/native';
import { useKeepAwake } from 'expo-keep-awake';
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';

import { EmptyState } from '../../shell/EmptyState';
import { useStrings, useTheme } from '../../settings/preferences';
import { textStyles } from '../../theme/typography';
import type { DestinationPack, Trail } from '../destination-pack';
import {
  isDeviation,
  startDeviationDetector,
  stepDeviation,
  type DeviationState,
} from './deviation/detector';
import { useDeviationAlerts } from './deviation/useDeviationAlerts';
import { clearPendingSimulation, endHike, hikeStore, startHike, type RunningHike } from './hikeStore';
import { useHikerPosition, type HikerPosition } from './location/useHikerPosition';
import { HikeMap, type HikeMapHandle } from './map/HikeMap';
import { MapControls } from './map/MapControls';
import strings from './strings';
import { locateOnTrail, prepareTrail, type PreparedTrail, type TrailLocation } from './trail/geometry';
import {
  dismissEndSuggestion,
  placeWaypoints,
  startTracker,
  trackPosition,
  type HikeTracker,
  type HikeView,
  type PlacedWaypoint,
} from './trail/progress';
import { DeviationBanner } from './ui/DeviationBanner';
import { EndSuggestion } from './ui/EndSuggestion';
import { HikePanel } from './ui/HikePanel';
import { SimulationBar } from './ui/SimulationBar';
import { TrailPickerCard } from './ui/TrailPickerCard';
import { useLatestPack } from './useLatestPack';

const NOTICE_MS = 5000;

/** A Trail with its line prepared for lookups and its Waypoints placed along it. */
type TrailEntry = { trail: Trail; line: PreparedTrail; placed: PlacedWaypoint[] };

function trailEntries(pack: DestinationPack): Map<string, TrailEntry> {
  const entries = new Map<string, TrailEntry>();
  for (const trail of pack.trails) {
    const line = prepareTrail(trail.geometry?.coordinates ?? []);
    if (!line) continue;
    const waypoints = pack.waypoints.filter((waypoint) => waypoint.trailId === trail.id);
    entries.set(trail.id, { trail, line, placed: placeWaypoints(line, waypoints, trail.distanceM) });
  }
  return entries;
}

/** Keeps the screen on while mounted (during a Hike). */
function KeepScreenOn() {
  useKeepAwake('tahak-hike');
  return null;
}

/** A Deviation in progress, as the Hike screen shows it. */
type DeviationView = {
  startedMs: number;
  startedOffM: number;
  /** Where the hiker is now relative to the nearest point of the whole Trail. */
  toTrail: TrailLocation;
};

/**
 * The running Hike's progress and Deviation: one tracker and one Deviation detector per Hike,
 * fed every new position.
 */
function useHikeTracking(hikeId: number | null, entry: TrailEntry | null, position: HikerPosition | null) {
  type Tracked = {
    hikeId: number;
    position: HikerPosition;
    tracker: HikeTracker;
    view: HikeView;
    detector: DeviationState;
    toTrail: TrailLocation;
  };
  const [state, setState] = useState<Tracked | null>(null);

  // Updated while rendering when a new position or Hike arrives (React's pattern for state
  // derived from changing props), so the panel never shows a stale position for a frame.
  if (
    hikeId !== null &&
    entry &&
    position &&
    (state === null || state.hikeId !== hikeId || state.position !== position)
  ) {
    const same = state !== null && state.hikeId === hikeId;
    const tracker = same ? state.tracker : startTracker();
    const result = trackPosition(tracker, entry.line, entry.placed, position);
    // The Deviation is measured to the nearest point of the whole Trail. The progress view's
    // location prefers the leg the hiker was on, which near a switchback can be further away.
    const toTrail = locateOnTrail(position, entry.line);
    if (result && toTrail) {
      const detector = stepDeviation(same ? state.detector : startDeviationDetector(), {
        offTrailM: toTrail.offTrailM,
        timestamp: position.timestamp,
      }).state;
      setState({ hikeId, position, ...result, detector, toTrail });
    }
  }

  const dismiss = useCallback(() => {
    setState((previous) =>
      previous && {
        ...previous,
        tracker: dismissEndSuggestion(previous.tracker),
        view: { ...previous.view, suggestEnd: false },
      },
    );
  }, []);

  const current = state && state.hikeId === hikeId ? state : null;
  const detector = current?.detector;
  const deviation: DeviationView | null =
    current && detector && isDeviation(detector)
      ? { startedMs: detector.startedMs, startedOffM: detector.startedOffM, toTrail: current.toTrail }
      : null;
  // The simulation bar shows the same distance the Deviation is measured on.
  const offTrailM = current?.toTrail.offTrailM ?? null;
  return { view: current?.view ?? null, deviation, offTrailM, dismiss };
}

/** The map of one Destination with the hiker's position, and the Hike on top of it. */
function DestinationMap({ pack }: { pack: DestinationPack }) {
  const s = useStrings(strings);
  const focused = useIsFocused();
  const { hike: anyHike, pendingSimulation } = useSyncExternalStore(hikeStore.subscribe, hikeStore.getSnapshot);
  const entries = useMemo(() => trailEntries(pack), [pack]);
  const hike: RunningHike | null =
    anyHike && anyHike.destinationId === pack.destination.id && entries.has(anyHike.trailId) ? anyHike : null;
  const entry = hike ? (entries.get(hike.trailId) ?? null) : null;

  // The GPS runs while the Hike tab is in use or a Hike is running, never otherwise.
  const { permission, position, source, requestPermission, retry } = useHikerPosition({
    gps: focused || hike !== null,
  });
  const { view, deviation, offTrailM, dismiss } = useHikeTracking(hike?.id ?? null, entry, position);
  useDeviationAlerts(hike?.id ?? null, deviation);

  const map = useRef<HikeMapHandle>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pickedTrailId, setSelectedTrailId] = useState<string | null>(null);
  const [simulate, setSimulate] = useState(false);
  // The Hike whose map the hiker moved by hand; following resumes on re-center. Every Hike
  // starts in follow mode.
  const [unfollowedHikeId, setUnfollowedHikeId] = useState<number | null>(null);
  const [measured, setInset] = useState({ top: 0, bottom: 0 });
  // How far the hiker has turned the map from north-up, for the back-to-trail arrow.
  const [mapBearingDeg, setMapBearingDeg] = useState(0);

  // The default pick is the first Trail, in the order the pack lists them; a picked Trail that
  // disappeared in a pack update falls back to it too.
  const pickable = useMemo(() => pack.trails.filter((trail) => entries.has(trail.id)), [pack.trails, entries]);
  const selectedTrailId = pickable.some((trail) => trail.id === pickedTrailId)
    ? pickedTrailId
    : (pickable[0]?.id ?? null);
  const follow = hike !== null && unfollowedHikeId !== hike.id;
  const showTop = hike !== null && (hike.simulation !== null || deviation !== null);
  const topInset = showTop ? measured.top : 0;
  const inset = useMemo(() => ({ top: topInset, bottom: measured.bottom }), [topInset, measured.bottom]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), NOTICE_MS);
    return () => clearTimeout(timer);
  }, [notice]);

  const start = useCallback(
    (trailId: string | null, options: { simulated: boolean; speed?: number; startFraction?: number }) => {
      const chosen = trailId ? entries.get(trailId) : undefined;
      if (!chosen) return;
      startHike({
        destinationId: pack.destination.id,
        trailId: chosen.trail.id,
        trail: chosen.line,
        ...options,
      });
    },
    [entries, pack.destination.id],
  );

  // tahak://hike/simulate: start the simulated walk on the requested (or first) Trail.
  useEffect(() => {
    if (!pendingSimulation) return;
    const trailId = pendingSimulation.trailId ?? pickable[0]?.id ?? null;
    if (trailId && entries.has(trailId)) {
      start(trailId, {
        simulated: true,
        speed: pendingSimulation.speed,
        startFraction: pendingSimulation.startFraction,
      });
    } else {
      clearPendingSimulation();
    }
  }, [pendingSimulation, entries, pickable, start]);

  const recenter = useCallback(async () => {
    setUnfollowedHikeId(null);
    if (position) {
      map.current?.centerOn(position);
      return;
    }
    // Without permission the panel already explains how to allow location.
    if (permission !== 'granted') return;
    const { servicesEnabled } = await retry();
    setNotice(servicesEnabled ? s.noFix : s.servicesOff);
  }, [permission, position, retry, s.noFix, s.servicesOff]);

  const confirmEnd = useCallback(() => {
    Alert.alert(s.endConfirmTitle, s.endConfirmBody, [
      { text: s.keepHiking, style: 'cancel' },
      { text: s.endHike, onPress: endHike },
    ]);
  }, [s.endConfirmBody, s.endConfirmTitle, s.endHike, s.keepHiking]);

  const onBottomLayout = useCallback((event: LayoutChangeEvent) => {
    const bottom = Math.round(event.nativeEvent.layout.height) + 12;
    setInset((current) => (current.bottom === bottom ? current : { ...current, bottom }));
  }, []);
  const onTopLayout = useCallback((event: LayoutChangeEvent) => {
    const top = Math.round(event.nativeEvent.layout.height) + 12;
    setInset((current) => (current.top === top ? current : { ...current, top }));
  }, []);

  return (
    <View style={styles.fill}>
      <HikeMap
        ref={map}
        pack={pack}
        position={position}
        activeTrailId={hike?.trailId ?? null}
        nextWaypointId={view?.next?.waypoint.id ?? null}
        // A Deviation dashes the Trail line until the hiker is back (ADR 0004: never red alone).
        trailDashed={deviation !== null}
        follow={follow}
        onUserMove={() => setUnfollowedHikeId(hike?.id ?? null)}
        onBearingChange={setMapBearingDeg}
        inset={inset}
      />
      {hike ? <KeepScreenOn /> : null}
      {showTop ? (
        <View style={styles.top} onLayout={onTopLayout}>
          {hike?.simulation ? <SimulationBar walk={hike.simulation} offTrailM={offTrailM} /> : null}
          {deviation ? (
            <DeviationBanner
              offTrailM={deviation.toTrail.offTrailM}
              bearingDeg={deviation.toTrail.bearingToNearestDeg}
              mapBearingDeg={mapBearingDeg}
            />
          ) : null}
        </View>
      ) : null}
      <MapControls
        // A simulated walk needs no location permission.
        permission={source === 'simulated' ? 'granted' : permission}
        onAllowLocation={requestPermission}
        onRecenter={recenter}
        // The note goes away as soon as a position arrives.
        notice={position ? null : notice}
        onLayout={onBottomLayout}
      >
        {hike && entry ? (
          <>
            {view?.suggestEnd ? <EndSuggestion onEnd={endHike} onDismiss={dismiss} /> : null}
            <HikePanel destinationId={pack.destination.id} trailName={entry.trail.name} view={view} onEnd={confirmEnd} />
          </>
        ) : (
          <TrailPickerCard
            trails={pickable}
            selectedId={selectedTrailId}
            onSelect={setSelectedTrailId}
            simulate={simulate}
            onSimulateChange={setSimulate}
            onStart={() => start(selectedTrailId, { simulated: simulate })}
          />
        )}
      </MapControls>
    </View>
  );
}

/**
 * The Hike tab: the most recently downloaded Destination's map, full screen, with the Trail
 * picker before a Hike and the Hike panel during one (issues #6 and #7), or a pointer to
 * Explore when no pack is on the phone.
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
  top: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    gap: 8,
  },
});
