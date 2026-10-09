// The Hike map's style: the Protomaps basemap for the Destination Pack's PMTiles file, plus
// the Trail, Waypoint and GPS layers drawn on top. Pure (type-only imports apart from the
// Protomaps style package), so plain Node tests can check it.
//
// Nothing here may point at the network (ADR 0002). The map file is the pack's local PMTiles
// file, and the glyphs and sprites are bundled in the APK (assets/map/, copied by
// plugins/withMapAssets.js) and read through asset:// URLs.

import { layers, namedFlavor, type Flavor } from '@protomaps/basemaps';
import type {
  CircleLayerSpecification,
  FilterSpecification,
  LayerSpecification,
  LineLayerSpecification,
  StyleSpecification,
  SymbolLayerSpecification,
} from '@maplibre/maplibre-react-native';

import type { Palette, ThemeMode } from '../../../theme/tokens';

/** Required wherever the map appears, offline too. Also set on the vector source. */
export const ATTRIBUTION = '© OpenStreetMap contributors · © Protomaps';

const BASEMAP_SOURCE = 'protomaps';
const ASSETS = 'asset://map';

// Font ids are the folder names in assets/map/glyphs/. They replace the Protomaps names
// ("Noto Sans Regular") so the glyph URLs have no spaces to encode.
export const FONT_IDS = {
  'Noto Sans Regular': 'noto-sans-regular',
  'Noto Sans Medium': 'noto-sans-medium',
  'Noto Sans Italic': 'noto-sans-italic',
} as const;
const FALLBACK_FONT = FONT_IDS['Noto Sans Regular'];

// The basemap is muted so the Trail and Waypoints are the only strong colours on the map
// (docs/plan.md, "Map style"). Day: earth tones, greens pulled towards sage. Night: the
// Protomaps dark flavor on near-black.
const DAY_FLAVOR: Partial<Flavor> = {
  background: '#E6E0D2',
  earth: '#EEE9DD',
  park_a: '#DFE1CD',
  park_b: '#CDD3B8',
  wood_a: '#DCDFC9',
  wood_b: '#C6CDAE',
  scrub_a: '#E0E1CE',
  scrub_b: '#CACFB4',
  glacier: '#F4F2EC',
  sand: '#E9E1CE',
  beach: '#EDE3CB',
  zoo: '#DCDCC8',
  pedestrian: '#E8E3D6',
  hospital: '#E8E0D8',
  industrial: '#E0DDD5',
  school: '#E8E1D6',
  aerodrome: '#E1DED6',
  water: '#B9CCD0',
  buildings: '#D9D2C4',
  boundaries: '#A69E8E',
  ocean_label: '#5D7A82',
};

const NIGHT_FLAVOR: Partial<Flavor> = {
  background: '#0A0A0A',
  earth: '#121212',
  buildings: '#0A0A0A',
};

const LANDCOVER_DAY: Flavor['landcover'] = {
  grassland: 'rgba(222, 224, 202, 1)',
  barren: 'rgba(236, 228, 210, 1)',
  urban_area: 'rgba(228, 224, 214, 1)',
  farmland: 'rgba(228, 226, 206, 1)',
  glacier: 'rgba(244, 242, 236, 1)',
  scrub: 'rgba(226, 226, 205, 1)',
  forest: 'rgba(206, 213, 186, 1)',
};

/** The Protomaps flavor for a theme, toned down as above. */
export function hikeFlavor(mode: ThemeMode): Flavor {
  const base = namedFlavor(mode === 'day' ? 'light' : 'dark');
  const flavor: Flavor = { ...base, ...(mode === 'day' ? DAY_FLAVOR : NIGHT_FLAVOR) };
  if (mode === 'day') flavor.landcover = LANDCOVER_DAY;
  // POI names in one muted ink: Protomaps colours them by kind (green, pink, red), which
  // would compete with the Trail and the pins, and red means danger only.
  const poiInk = mode === 'day' ? '#5F5B4E' : '#9A9F95';
  flavor.pois = {
    blue: poiInk,
    green: poiInk,
    lapis: poiInk,
    pink: poiInk,
    red: poiInk,
    slategray: poiInk,
    tangerine: poiInk,
    turquoise: poiInk,
  };
  return flavor;
}

/** Replaces Protomaps font names with the bundled font ids, anywhere in a layer. */
function withBundledFonts<T>(value: T): T {
  if (typeof value === 'string') {
    if (!value.startsWith('Noto Sans')) return value;
    return ((FONT_IDS as Record<string, string>)[value] ?? FALLBACK_FONT) as T;
  }
  if (Array.isArray(value)) return value.map(withBundledFonts) as T;
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, inner]) => [key, withBundledFonts(inner)]),
    ) as T;
  }
  return value;
}

/**
 * The basemap style for a theme. `mapFileUri` is the pack's file:// URI; MapLibre Native
 * reads PMTiles from it directly through the pmtiles:// scheme.
 */
export function buildMapStyle({
  mode,
  mapFileUri,
}: {
  mode: ThemeMode;
  mapFileUri: string;
}): StyleSpecification {
  const basemap = layers(BASEMAP_SOURCE, hikeFlavor(mode), { lang: 'en' }) as LayerSpecification[];
  return {
    version: 8,
    name: `tahak-${mode}`,
    glyphs: `${ASSETS}/glyphs/{fontstack}/{range}.pbf`,
    sprite: [
      { id: 'default', url: `${ASSETS}/sprites/protomaps-${mode === 'day' ? 'light' : 'dark'}` },
      { id: 'tahak', url: `${ASSETS}/sprites/tahak-${mode}` },
    ],
    sources: {
      [BASEMAP_SOURCE]: {
        type: 'vector',
        url: `pmtiles://${mapFileUri}`,
        attribution: ATTRIBUTION,
      },
    },
    layers: withBundledFonts(basemap),
  };
}

// Overlay layers. They go inside a GeoJSONSource, which supplies `source`.
type Overlay<T> = Omit<T, 'source'>;

export const TRAIL_LAYER_IDS = {
  outline: 'trail-outline',
  line: 'trail-line',
  dashedLine: 'trail-line-dashed',
} as const;

const trailWidth = (base: number) =>
  ['interpolate', ['linear'], ['zoom'], 10, base * 0.5, 14, base, 18, base * 1.8] as const;

/**
 * The Trail: an orange line over a dark outline, so it stands out by lightness in sun glare
 * (docs/plan.md, sun and colorblind rules). `dashed` is for a Deviation (#8), which turns the
 * line dashed rather than changing its colour.
 */
export function trailLayers(
  colors: Palette,
  { dashed = false }: { dashed?: boolean } = {},
): [Overlay<LineLayerSpecification>, Overlay<LineLayerSpecification>] {
  const layout = { 'line-cap': 'round', 'line-join': 'round' } as const;
  return [
    {
      id: TRAIL_LAYER_IDS.outline,
      type: 'line',
      layout,
      paint: { 'line-color': colors.trailOutline, 'line-width': trailWidth(9) as never },
    },
    {
      // Its own layer: on the phone, setting line-dasharray on the drawn line later did not
      // redraw it dashed, so the map keeps both lines and shows one (see hiddenFilter).
      id: dashed ? TRAIL_LAYER_IDS.dashedLine : TRAIL_LAYER_IDS.line,
      type: 'line',
      layout: dashed ? { ...layout, 'line-cap': 'butt' } : layout,
      paint: {
        'line-color': colors.trail,
        'line-width': trailWidth(5) as never,
        ...(dashed ? { 'line-dasharray': [1.5, 1] } : {}),
      },
    },
  ];
}

/** Names show from this zoom; the pins themselves always show. */
export const WAYPOINT_LABEL_MIN_ZOOM = 13;

/**
 * Waypoint pins from the bundled tahak sprite (olive, blue for water, typed icon), with the
 * name under the pin from zoom 13.
 */
export function waypointLayer(colors: Palette): Overlay<SymbolLayerSpecification> {
  return {
    id: 'waypoints',
    type: 'symbol',
    layout: {
      'icon-image': ['concat', 'tahak:waypoint-', ['get', 'type']],
      'icon-anchor': 'bottom',
      'icon-allow-overlap': true,
      'icon-ignore-placement': true,
      'text-field': ['step', ['zoom'], '', WAYPOINT_LABEL_MIN_ZOOM, ['get', 'name']],
      'text-font': [FONT_IDS['Noto Sans Medium']],
      'text-size': 13,
      'text-anchor': 'top',
      'text-offset': [0, 0.4],
      'text-max-width': 9,
      'text-optional': true,
      'symbol-sort-key': ['get', 'position'],
    },
    paint: {
      'text-color': colors.ink,
      'text-halo-color': colors.surface,
      'text-halo-width': 1.6,
    },
  };
}

/** The hiker's GPS dot: a soft halo and a solid dot with a contrasting ring. */
export function gpsLayers(
  colors: Palette,
): [Overlay<CircleLayerSpecification>, Overlay<CircleLayerSpecification>] {
  return [
    {
      id: 'gps-halo',
      type: 'circle',
      paint: { 'circle-color': colors.gps, 'circle-opacity': 0.2, 'circle-radius': 18 },
    },
    {
      id: 'gps-dot',
      type: 'circle',
      paint: {
        'circle-color': colors.gps,
        'circle-radius': 7,
        'circle-stroke-color': colors.surface,
        'circle-stroke-width': 3,
      },
    },
  ];
}

// The Waypoint pins are 30 × 38 with the tip on the point, so the pin's head sits about
// 19 px above it; the ring is drawn around the head.
const PIN_CENTER_OFFSET_PX = -19;

/**
 * The orange ring around the next Waypoint's pin during a Hike (docs/plan.md, "Waypoints"):
 * a dark outline ring and the orange ring on top, so it reads by lightness in sun glare.
 * Goes under the pins, inside the waypoints source; show it with nextWaypointFilter.
 */
export function nextWaypointRingLayers(
  colors: Palette,
): [Overlay<CircleLayerSpecification>, Overlay<CircleLayerSpecification>] {
  const shared = {
    'circle-opacity': 0,
    'circle-radius': 22,
    'circle-translate': [0, PIN_CENTER_OFFSET_PX] as [number, number],
    'circle-translate-anchor': 'viewport' as const,
  };
  return [
    {
      id: 'next-waypoint-ring-outline',
      type: 'circle',
      paint: { ...shared, 'circle-stroke-color': colors.trailOutline, 'circle-stroke-width': 8 },
    },
    {
      id: 'next-waypoint-ring',
      type: 'circle',
      paint: { ...shared, 'circle-stroke-color': colors.trail, 'circle-stroke-width': 4.5 },
    },
  ];
}

/** Only the next Waypoint (or nothing when there is none). */
export function nextWaypointFilter(waypointId: string | null): FilterSpecification {
  return ['==', ['get', 'waypointId'], waypointId ?? ''];
}

/**
 * During a Hike, only the active Trail and its Waypoints; before one, everything. Always a
 * filter (never undefined), so going back to "everything" replaces the previous filter.
 */
export function activeTrailFilter(trailId: string | null): FilterSpecification {
  return trailId ? ['==', ['get', 'trailId'], trailId] : ['has', 'trailId'];
}

/** A filter that matches nothing, to hide a layer that stays mounted. */
export const hiddenFilter: FilterSpecification = ['==', ['get', 'trailId'], ''];
