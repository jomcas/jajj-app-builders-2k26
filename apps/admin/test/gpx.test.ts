import { describe, expect, it } from 'vitest';
import { lineLengthM } from '../src/lib/geo';
import { GpxError, parseGpx } from '../src/lib/gpx';
import fixture from './fixtures/test-trail.gpx?raw';

describe('parseGpx', () => {
  it('turns every track segment into one LineString of [lon, lat], in file order', () => {
    const parsed = parseGpx(fixture);
    expect(parsed.line.type).toBe('LineString');
    expect(parsed.line.coordinates).toEqual([
      [120.645, 16.31],
      [120.644, 16.308],
      [120.6425, 16.306],
      [120.641, 16.304],
      [120.6395, 16.3015],
      [120.638, 16.299],
    ]);
  });

  it('drops repeated points but counts them, and ignores <wpt> points', () => {
    const parsed = parseGpx(fixture);
    expect(parsed.pointCount).toBe(7);
    expect(parsed.line.coordinates).toHaveLength(6);
  });

  it('reads the name of the <trk>, not of a point or the file', () => {
    expect(parseGpx(fixture).name).toBe('Test Trail & Ridge');
  });

  it('computes the distance in whole metres from the line', () => {
    const parsed = parseGpx(fixture);
    expect(parsed.distanceM).toBe(Math.round(lineLengthM(parsed.line.coordinates)));
    expect(parsed.distanceM).toBe(1436);
  });

  it('falls back to <rtept> points when there are no <trkpt> points', () => {
    const gpx = `<gpx><rte><name>R</name><rtept lat="1" lon="2"/><rtept lat="1.001" lon="2"/></rte></gpx>`;
    const parsed = parseGpx(gpx);
    expect(parsed.line.coordinates).toEqual([[2, 1], [2, 1.001]]);
    expect(parsed.name).toBe('R');
  });

  it('handles namespace prefixes and a missing name', () => {
    const gpx = `<gpx:gpx><gpx:trk><gpx:trkseg><gpx:trkpt lat="1" lon="2"/><gpx:trkpt lat="1" lon="2.001"/></gpx:trkseg></gpx:trk></gpx:gpx>`;
    const parsed = parseGpx(gpx);
    expect(parsed.line.coordinates).toHaveLength(2);
    expect(parsed.name).toBeNull();
  });

  it('rejects files that are not GPX, lines with fewer than two different points, and bad coordinates', () => {
    expect(() => parseGpx('{"type":"LineString"}')).toThrow(GpxError);
    expect(() => parseGpx('<gpx><trk><trkseg><trkpt lat="1" lon="2"/><trkpt lat="1" lon="2"/></trkseg></trk></gpx>')).toThrow(
      /at least two different points/,
    );
    expect(() => parseGpx('<gpx><trk><trkseg><trkpt lat="91" lon="2"/><trkpt lat="1" lon="2"/></trkseg></trk></gpx>')).toThrow(
      GpxError,
    );
    expect(() => parseGpx('<gpx><trk><trkseg><trkpt lon="2"/></trkseg></trk></gpx>')).toThrow(GpxError);
  });
});
