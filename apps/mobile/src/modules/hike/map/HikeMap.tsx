import {
  Camera,
  GeoJSONSource,
  Layer,
  Map,
  type CameraRef,
  type InitialViewState,
  type ViewStateChangeEvent,
} from '@maplibre/maplibre-react-native';
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState, type RefObject } from 'react';
import type { NativeSyntheticEvent } from 'react-native';
import { StyleSheet } from 'react-native';

import { useStrings, useTheme } from '../../../settings/preferences';
import type { DestinationPack } from '../../destination-pack';
import type { HikerPosition } from '../location/useHikerPosition';
import strings from '../strings';
import { packToGeoJSON, positionToGeoJSON } from './geojson';
import {
  activeTrailFilter,
  buildMapStyle,
  gpsLayers,
  hiddenFilter,
  nextWaypointFilter,
  nextWaypointRingLayers,
  trailLayers,
  waypointLayer,
} from './mapStyle';
import { MemberMarkers, type MapMember } from './MemberMarkers';

export type HikeMapHandle = {
  /** Moves the map to the hiker's position. */
  centerOn(position: Pick<HikerPosition, 'latitude' | 'longitude'>): void;
};

type Inset = { top: number; bottom: number };

type HikeMapProps = {
  pack: DestinationPack;
  position: HikerPosition | null;
  trailDashed?: boolean;
  /** During a Hike: show only this Trail and its Waypoints. */
  activeTrailId?: string | null;
  /** During a Hike: the Waypoint that gets the orange ring. */
  nextWaypointId?: string | null;
  /** Keep the hiker in view: the camera follows every new position. */
  follow?: boolean;
  /** Called when the hiker drags or zooms the map themselves (to pause following). */
  onUserMove?: () => void;
  /** Called with the map's bearing (degrees from north-up) whenever it settles. */
  onBearingChange?: (bearingDeg: number) => void;
  /** Space taken by panels over the map, so the camera centres in what is left. */
  inset?: Inset;
  /** Group Hike members (#24), drawn above the hiker's dot. */
  members?: readonly MapMember[];
  /** A member's dot was tapped. */
  onMemberPress?: (member: MapMember) => void;
};

const NO_MEMBERS: readonly MapMember[] = [];

// The PMTiles files are cut to zoom 15; MapLibre overzooms them up to MAX_ZOOM.
const MIN_ZOOM = 8;
const MAX_ZOOM = 18;
const RECENTER_ZOOM = 15;
const FOLLOW_ZOOM = 16;
const FIT_PADDING = { top: 48, right: 48, bottom: 140, left: 48 };
const NO_INSET: Inset = { top: 0, bottom: 0 };

/**
 * The Destination's offline map: the pack's PMTiles basemap, its Trails, Waypoint pins and the
 * hiker's GPS dot, in the day or night style. Everything comes from the phone (ADR 0002).
 */
export const HikeMap = forwardRef<HikeMapHandle, HikeMapProps>(function HikeMap(
  {
    pack,
    position,
    trailDashed = false,
    activeTrailId = null,
    nextWaypointId = null,
    follow = false,
    onUserMove,
    onBearingChange,
    inset = NO_INSET,
    members = NO_MEMBERS,
    onMemberPress,
  },
  ref,
) {
  const { mode, colors } = useTheme();
  const s = useStrings(strings);
  const camera = useRef<CameraRef>(null);
  // Where the hiker last left the map, so a theme switch (which remounts the map) keeps it.
  const lastView = useRef<InitialViewState | null>(null);

  const mapStyle = useMemo(
    () => buildMapStyle({ mode, mapFileUri: pack.mapFileUri }),
    [mode, pack.mapFileUri],
  );
  const geojson = useMemo(() => packToGeoJSON(pack), [pack]);
  const hiker = useMemo(() => positionToGeoJSON(position), [position]);
  const [trailOutline, trailLine] = trailLayers(colors);
  const [, trailLineDashed] = trailLayers(colors, { dashed: true });
  const [gpsHalo, gpsDot] = gpsLayers(colors);
  const [ringOutline, ring] = nextWaypointRingLayers(colors);
  const trailFilter = activeTrailFilter(activeTrailId);
  const padding = useMemo(
    () => ({ top: inset.top, bottom: inset.bottom, left: 0, right: 0 }),
    [inset.top, inset.bottom],
  );

  // Follow mode: zoom in once when following starts, then keep the hiker centred (in the part
  // of the map the panels leave free) at whatever zoom the hiker chooses.
  const followStarted = useRef(false);
  useEffect(() => {
    if (!follow) {
      followStarted.current = false;
      return;
    }
    if (!position) return;
    const first = !followStarted.current;
    followStarted.current = true;
    camera.current?.easeTo({
      center: [position.longitude, position.latitude],
      padding,
      duration: first ? 600 : 400,
      ...(first ? { zoom: FOLLOW_ZOOM } : {}),
    });
  }, [follow, position, padding]);

  const packView = useMemo<InitialViewState>(
    () =>
      geojson.bounds
        ? { bounds: geojson.bounds, padding: FIT_PADDING }
        : { center: [pack.destination.longitude, pack.destination.latitude], zoom: 13 },
    [geojson.bounds, pack.destination.latitude, pack.destination.longitude],
  );

  // When a Hike ends, show the whole Destination again for picking the next Trail.
  const previousTrailId = useRef(activeTrailId);
  useEffect(() => {
    const ended = previousTrailId.current !== null && activeTrailId === null;
    previousTrailId.current = activeTrailId;
    if (!ended || !geojson.bounds) return;
    camera.current?.fitBounds(geojson.bounds, {
      padding: { top: 48, right: 48, left: 48, bottom: inset.bottom + 24 },
      duration: 800,
    });
  }, [activeTrailId, geojson.bounds, inset.bottom]);

  useImperativeHandle(
    ref,
    () => ({
      centerOn: ({ longitude, latitude }) =>
        camera.current?.easeTo({
          center: [longitude, latitude],
          zoom: RECENTER_ZOOM,
          padding,
          duration: 600,
        }),
    }),
    [padding],
  );

  return (
    <Map
      // A new map per theme. MapLibre Native keeps the previous style's sprite images when
      // the style changes in place, so the day pins and icons would stay on the night map.
      key={mode}
      onRegionWillChange={(event: NativeSyntheticEvent<ViewStateChangeEvent>) => {
        if (event.nativeEvent.userInteraction) onUserMove?.();
      }}
      onRegionDidChange={(event: NativeSyntheticEvent<ViewStateChangeEvent>) => {
        const { center, zoom, bearing } = event.nativeEvent;
        lastView.current = { center, zoom, bearing };
        onBearingChange?.(bearing ?? 0);
      }}
      style={StyleSheet.absoluteFill}
      mapStyle={mapStyle}
      accessibilityLabel={s.mapLabel}
      // Tahak shows its own always-visible attribution chip (MapControls), which works offline.
      attribution={false}
      logo={false}
      compass
      compassPosition={{ top: inset.top + 12, right: 12 }}
      scaleBar={false}
      touchPitch={false}
    >
      <MapCamera
        cameraRef={camera}
        lastView={lastView}
        packView={packView}
        minZoom={MIN_ZOOM}
        maxZoom={MAX_ZOOM}
      />
      <GeoJSONSource id="trails" data={geojson.trails}>
        <Layer {...trailOutline} filter={trailFilter} />
        {/* Both lines stay mounted; a Deviation shows the dashed one instead (#8). */}
        <Layer {...trailLine} filter={trailDashed ? hiddenFilter : trailFilter} />
        <Layer {...trailLineDashed} filter={trailDashed ? trailFilter : hiddenFilter} />
      </GeoJSONSource>
      <GeoJSONSource id="waypoints" data={geojson.waypoints}>
        <Layer {...ringOutline} filter={nextWaypointFilter(nextWaypointId)} />
        <Layer {...ring} filter={nextWaypointFilter(nextWaypointId)} />
        <Layer {...waypointLayer(colors)} filter={trailFilter} />
      </GeoJSONSource>
      <GeoJSONSource id="hiker" data={hiker}>
        <Layer {...gpsHalo} />
        <Layer {...gpsDot} />
      </GeoJSONSource>
      <MemberMarkers members={members} onPress={(member) => onMemberPress?.(member)} />
    </Map>
  );
});

/** The camera, starting where the previous map (before a theme switch) left off. */
function MapCamera({
  cameraRef,
  lastView,
  packView,
  minZoom,
  maxZoom,
}: {
  cameraRef: RefObject<CameraRef | null>;
  lastView: RefObject<InitialViewState | null>;
  packView: InitialViewState;
  minZoom: number;
  maxZoom: number;
}) {
  // Read once, when this map mounts.
  const [initialViewState] = useState(() => lastView.current ?? packView);
  return (
    <Camera ref={cameraRef} initialViewState={initialViewState} minZoom={minZoom} maxZoom={maxZoom} />
  );
}
