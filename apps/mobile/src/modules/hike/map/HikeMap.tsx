import {
  Camera,
  GeoJSONSource,
  Layer,
  Map,
  type CameraRef,
  type InitialViewState,
  type ViewStateChangeEvent,
} from '@maplibre/maplibre-react-native';
import { forwardRef, useImperativeHandle, useMemo, useRef, useState, type RefObject } from 'react';
import type { NativeSyntheticEvent } from 'react-native';
import { StyleSheet } from 'react-native';

import { useStrings, useTheme } from '../../../settings/preferences';
import type { DestinationPack } from '../../destination-pack';
import type { HikerPosition } from '../location/useHikerPosition';
import strings from '../strings';
import { packToGeoJSON, positionToGeoJSON } from './geojson';
import { buildMapStyle, gpsLayers, trailLayers, waypointLayer } from './mapStyle';

export type HikeMapHandle = {
  /** Moves the map to the hiker's position. */
  centerOn(position: HikerPosition): void;
};

// The PMTiles files are cut to zoom 15; MapLibre overzooms them up to MAX_ZOOM.
const MIN_ZOOM = 8;
const MAX_ZOOM = 18;
const RECENTER_ZOOM = 15;
const FIT_PADDING = { top: 48, right: 48, bottom: 140, left: 48 };

/**
 * The Destination's offline map: the pack's PMTiles basemap, its Trails, Waypoint pins and the
 * hiker's GPS dot, in the day or night style. Everything comes from the phone (ADR 0002).
 */
export const HikeMap = forwardRef<
  HikeMapHandle,
  { pack: DestinationPack; position: HikerPosition | null; trailDashed?: boolean }
>(function HikeMap({ pack, position, trailDashed = false }, ref) {
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
  const [trailOutline, trailLine] = trailLayers(colors, { dashed: trailDashed });
  const [gpsHalo, gpsDot] = gpsLayers(colors);

  const packView = useMemo<InitialViewState>(
    () =>
      geojson.bounds
        ? { bounds: geojson.bounds, padding: FIT_PADDING }
        : { center: [pack.destination.longitude, pack.destination.latitude], zoom: 13 },
    [geojson.bounds, pack.destination.latitude, pack.destination.longitude],
  );

  useImperativeHandle(
    ref,
    () => ({
      centerOn: ({ longitude, latitude }) =>
        camera.current?.easeTo({
          center: [longitude, latitude],
          zoom: RECENTER_ZOOM,
          duration: 600,
        }),
    }),
    [],
  );

  return (
    <Map
      // A new map per theme. MapLibre Native keeps the previous style's sprite images when
      // the style changes in place, so the day pins and icons would stay on the night map.
      key={mode}
      onRegionDidChange={(event: NativeSyntheticEvent<ViewStateChangeEvent>) => {
        const { center, zoom, bearing } = event.nativeEvent;
        lastView.current = { center, zoom, bearing };
      }}
      style={StyleSheet.absoluteFill}
      mapStyle={mapStyle}
      accessibilityLabel={s.mapLabel}
      // Tahak shows its own always-visible attribution chip (MapControls), which works offline.
      attribution={false}
      logo={false}
      compass
      compassPosition={{ top: 12, right: 12 }}
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
        <Layer {...trailOutline} />
        <Layer {...trailLine} />
      </GeoJSONSource>
      <GeoJSONSource id="waypoints" data={geojson.waypoints}>
        <Layer {...waypointLayer(colors)} />
      </GeoJSONSource>
      <GeoJSONSource id="hiker" data={hiker}>
        <Layer {...gpsHalo} />
        <Layer {...gpsDot} />
      </GeoJSONSource>
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
