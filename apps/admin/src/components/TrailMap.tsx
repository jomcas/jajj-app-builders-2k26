// A MapLibre map of a Destination: saved Trails as solid lines, a GPX preview as a dashed line,
// and Waypoints as numbered points. The portal is online, so it uses OpenStreetMap's raster
// tiles as the basemap; the phone uses its own offline PMTiles map instead.

import * as maplibregl from 'maplibre-gl';
import type { GeoJSONSource, StyleSpecification } from 'maplibre-gl';
import { useEffect, useRef, useState } from 'react';
import type { LngLat } from '../lib/types';

export type MapLine = { id: string; coordinates: LngLat[]; preview?: boolean };
export type MapPoint = { id: string; position: LngLat; label: string; kind: string; selected?: boolean; title?: string };

const STYLE: StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      maxzoom: 19,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
    trails: { type: 'geojson', data: { type: 'FeatureCollection', features: [] } },
  },
  layers: [
    { id: 'osm', type: 'raster', source: 'osm' },
    {
      id: 'trail-outline',
      type: 'line',
      source: 'trails',
      filter: ['!=', ['get', 'preview'], true],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': '#3B1F0E', 'line-width': 7 },
    },
    {
      id: 'trail',
      type: 'line',
      source: 'trails',
      filter: ['!=', ['get', 'preview'], true],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': '#D9661F', 'line-width': 4 },
    },
    {
      id: 'trail-preview',
      type: 'line',
      source: 'trails',
      filter: ['==', ['get', 'preview'], true],
      layout: { 'line-join': 'round' },
      paint: { 'line-color': '#D9661F', 'line-width': 4, 'line-dasharray': [2, 1.5] },
    },
  ],
};

export function TrailMap({
  center,
  lines,
  points = [],
  onClick,
}: {
  center: LngLat;
  lines: MapLine[];
  points?: MapPoint[];
  onClick?: (position: LngLat) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [ready, setReady] = useState(false);
  const clickHandler = useRef(onClick);
  clickHandler.current = onClick;

  useEffect(() => {
    const instance = new maplibregl.Map({ container: container.current!, style: STYLE, center, zoom: 13 });
    instance.addControl(new maplibregl.NavigationControl({ showCompass: false }));
    instance.on('load', () => setReady(true));
    instance.on('click', (event) => clickHandler.current?.([event.lngLat.lng, event.lngLat.lat]));
    map.current = instance;
    return () => {
      instance.remove();
      map.current = null;
      setReady(false);
    };
    // The map is created once; center only seeds it.
  }, []);

  // Lines: replace the data and fit the view to them when they change.
  const linesKey = JSON.stringify(lines);
  useEffect(() => {
    const instance = map.current;
    if (!ready || !instance) return;
    (instance.getSource('trails') as GeoJSONSource).setData({
      type: 'FeatureCollection',
      features: lines.map((line) => ({
        type: 'Feature',
        properties: { id: line.id, preview: line.preview === true },
        geometry: { type: 'LineString', coordinates: line.coordinates },
      })),
    });
    const all = lines.flatMap((line) => line.coordinates);
    if (all.length >= 2) {
      const bounds = all.reduce(
        (box, point) => box.extend(point),
        new maplibregl.LngLatBounds(all[0]!, all[0]!),
      );
      instance.fitBounds(bounds, { padding: 48, maxZoom: 16, duration: 0 });
    } else {
      instance.jumpTo({ center });
    }
  }, [ready, linesKey]);

  // Pins: plain HTML elements, so they need no glyphs or sprites.
  const pointsKey = JSON.stringify(points);
  useEffect(() => {
    const instance = map.current;
    if (!ready || !instance) return;
    const markers = points.map((point) => {
      const element = document.createElement('div');
      element.className = `point ${point.kind}${point.selected ? ' selected' : ''}`;
      element.textContent = point.label;
      element.title = point.title ?? point.label;
      return new maplibregl.Marker({ element }).setLngLat(point.position).addTo(instance);
    });
    return () => markers.forEach((marker) => marker.remove());
  }, [ready, pointsKey]);

  return <div ref={container} className={`map${onClick ? ' clickable' : ''}`} />;
}
