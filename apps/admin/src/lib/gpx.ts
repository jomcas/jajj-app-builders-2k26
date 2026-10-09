// Reads a GPX file into a Trail: a GeoJSON LineString and its length. Hand-written rather than
// a library: the line in a GPX file is a list of <trkpt lat lon> elements, and this keeps the
// portal small and testable without a DOM.

import { lineLengthM } from './geo';
import type { LineString, LngLat } from './types';

export type ParsedGpx = {
  /** The <name> of the GPX <trk> (or <rte>), if the file has one. */
  name: string | null;
  line: LineString;
  /** Length of the line in whole metres. */
  distanceM: number;
  /** How many points the file had before repeated points were dropped. */
  pointCount: number;
};

export class GpxError extends Error {}

const POINT = /<(?:\w+:)?(trkpt|rtept)\b([^>]*)>/g;
const NUMBER_ATTRIBUTE = (name: string) => new RegExp(`\\b${name}\\s*=\\s*["']\\s*(-?[\\d.]+(?:e-?\\d+)?)\\s*["']`, 'i');
const LAT = NUMBER_ATTRIBUTE('lat');
const LON = NUMBER_ATTRIBUTE('lon');

/**
 * Parses GPX text. Uses the <trkpt> points of every <trkseg>, in file order; if the file has
 * none, its <rtept> points. Repeated consecutive points are dropped.
 * Throws GpxError when the file holds no usable line.
 */
export function parseGpx(text: string): ParsedGpx {
  if (!/<(?:\w+:)?gpx\b/.test(text)) throw new GpxError('This is not a GPX file.');

  const trkpts: LngLat[] = [];
  const rtepts: LngLat[] = [];
  for (const match of text.matchAll(POINT)) {
    const attributes = match[2] ?? '';
    const lat = Number(LAT.exec(attributes)?.[1]);
    const lon = Number(LON.exec(attributes)?.[1]);
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
      throw new GpxError(`A point in the file has no valid lat/lon: <${match[1]}${attributes}>`);
    }
    (match[1] === 'trkpt' ? trkpts : rtepts).push([lon, lat]);
  }

  const points = trkpts.length > 0 ? trkpts : rtepts;
  const coordinates = points.filter(
    (point, i) => i === 0 || point[0] !== points[i - 1]![0] || point[1] !== points[i - 1]![1],
  );
  if (coordinates.length < 2) {
    throw new GpxError('The GPX file needs at least two different points for the Trail.');
  }

  const distanceM = Math.round(lineLengthM(coordinates));
  if (distanceM <= 0) throw new GpxError('The Trail in the GPX file has no length.');

  return {
    name: readName(text, trkpts.length > 0 ? 'trk' : 'rte'),
    line: { type: 'LineString', coordinates },
    distanceM,
    pointCount: points.length,
  };
}

function readName(text: string, element: 'trk' | 'rte'): string | null {
  const block = new RegExp(`<(?:\\w+:)?${element}\\b[^>]*>([\\s\\S]*?)<\\/(?:\\w+:)?${element}>`).exec(text)?.[1];
  // The first <name> before any point is the <trk>’s own name, not a point's.
  const head = block?.split(/<(?:\w+:)?(?:trkseg|rtept)\b/)[0] ?? '';
  const raw = /<(?:\w+:)?name>([\s\S]*?)<\/(?:\w+:)?name>/.exec(head)?.[1];
  const name = raw ? decodeXml(raw.replace(/^<!\[CDATA\[([\s\S]*)\]\]>$/, '$1')).trim() : '';
  return name || null;
}

function decodeXml(text: string): string {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&amp;/g, '&');
}
