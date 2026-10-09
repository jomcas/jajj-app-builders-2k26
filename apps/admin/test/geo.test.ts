import { describe, expect, it } from 'vitest';
import { haversineM, lineLengthM, locateAlongLine } from '../src/lib/geo';
import type { LngLat } from '../src/lib/types';

describe('distances', () => {
  it('measures one degree of latitude as about 111.195 km', () => {
    expect(haversineM([0, 0], [0, 1])).toBeCloseTo(111195.08, 1);
  });

  it('measures a degree of longitude shorter away from the equator', () => {
    const atEquator = haversineM([120, 0], [121, 0]);
    const atUlap = haversineM([120, 16.3], [121, 16.3]);
    expect(atUlap / atEquator).toBeCloseTo(Math.cos((16.3 * Math.PI) / 180), 3);
  });

  it('adds up the segments of a line', () => {
    const line: LngLat[] = [[0, 0], [0, 1], [0, 2]];
    expect(lineLengthM(line)).toBeCloseTo(2 * 111195.08, 0);
    expect(lineLengthM([[0, 0]])).toBe(0);
  });

  it('finds how far along a line a nearby point is, and how far off it', () => {
    // A 2 km line due south; a point 100 m east of its 1 km mark.
    const line: LngLat[] = [[120.64, 16.31], [120.64, 16.31 - 2000 / 111195.08]];
    const oneKmSouth = 16.31 - 1000 / 111195.08;
    const east = 100 / (111195.08 * Math.cos((oneKmSouth * Math.PI) / 180));
    const { alongM, offsetM } = locateAlongLine(line, [120.64 + east, oneKmSouth]);
    expect(alongM).toBeCloseTo(1000, -1);
    expect(offsetM).toBeCloseTo(100, -1);
  });

  it('clamps points beyond either end to that end', () => {
    const line: LngLat[] = [[0, 0], [0, 0.01]];
    expect(locateAlongLine(line, [0, -0.01]).alongM).toBe(0);
    expect(locateAlongLine(line, [0, 0.02]).alongM).toBeCloseTo(lineLengthM(line), 6);
  });
});
