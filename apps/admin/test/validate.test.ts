import { describe, expect, it } from 'vitest';
import {
  slugify,
  validateDestination,
  validatePassage,
  validateTrail,
  validateWaypoint,
  waypointForm,
  type DestinationForm,
} from '../src/lib/validate';

const destination: DestinationForm = {
  id: 'test-destination',
  name: ' Test Destination ',
  region: 'Itogon, Benguet',
  summary_en: 'A test.',
  summary_fil: 'Isang pagsubok.',
  latitude: '16.30',
  longitude: '120.64',
  elevation_m: '',
};

describe('slugify', () => {
  it('makes readable ids', () => {
    expect(slugify('Mt. Ulap Eco-Trail')).toBe('mt-ulap-eco-trail');
    expect(slugify('  Bundok Pulág!  ')).toBe('bundok-pulag');
  });
});

describe('validateDestination', () => {
  it('trims text and parses numbers; an empty elevation is null', () => {
    const result = validateDestination(destination);
    expect(result).toEqual({
      ok: true,
      value: {
        id: 'test-destination',
        name: 'Test Destination',
        region: 'Itogon, Benguet',
        summary_en: 'A test.',
        summary_fil: 'Isang pagsubok.',
        latitude: 16.3,
        longitude: 120.64,
        elevation_m: null,
      },
    });
  });

  it('reports every bad field', () => {
    const result = validateDestination(
      { ...destination, id: 'Test Destination', summary_fil: ' ', latitude: '95', longitude: 'east', elevation_m: '12.5' },
      new Set(),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(Object.keys(result.errors).sort()).toEqual(['elevation_m', 'id', 'latitude', 'longitude', 'summary_fil']);
    expect(result.errors.id).toMatch(/lower-case/);
    expect(result.errors.latitude).toMatch(/between -90 and 90/);
  });

  it('refuses an id that is already taken', () => {
    const result = validateDestination(destination, new Set(['test-destination']));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.id).toMatch(/Already used/);
  });
});

describe('validateTrail', () => {
  const line = { geometry: { type: 'LineString' as const, coordinates: [[1, 1], [1, 1.01]] as [number, number][] }, distanceM: 1111.6 };

  it('needs a GPX line, and stores the rounded distance', () => {
    const missing = validateTrail({ id: 't', name: 'T', name_fil: '' }, 'd', null);
    expect(missing.ok).toBe(false);
    if (!missing.ok) expect(missing.errors.geometry).toMatch(/GPX/);

    const result = validateTrail({ id: 'test-trail', name: 'Test Trail', name_fil: ' ' }, 'test-destination', line);
    expect(result).toEqual({
      ok: true,
      value: {
        id: 'test-trail',
        destination_id: 'test-destination',
        name: 'Test Trail',
        name_fil: null,
        distance_m: 1112,
        geometry: line.geometry,
      },
    });
  });
});

describe('validateWaypoint', () => {
  const form = { ...waypointForm(), type: 'summit', name: 'Summit', latitude: '16.29', longitude: '120.63', distance_m: '1500' };

  it('accepts a Waypoint within the Trail', () => {
    const result = validateWaypoint(form, 1600);
    expect(result.ok && result.value).toMatchObject({ type: 'summit', distance_m: 1500, elevation_m: null, note: null });
  });

  it('refuses a type outside the enum and a distance beyond the Trail', () => {
    const result = validateWaypoint({ ...form, type: 'viewpoint', distance_m: '1700' }, 1600);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.type).toBeDefined();
    expect(result.errors.distance_m).toMatch(/between 0 and 1600/);
  });

  it('needs a position', () => {
    const result = validateWaypoint({ ...form, latitude: '', longitude: '' }, 1600);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(Object.keys(result.errors).sort()).toEqual(['latitude', 'longitude']);
  });
});

describe('validatePassage', () => {
  const form = { id: 'test-destination-fees-en', topic: 'fees', language: 'en', text: 'Entrance fee.', source: 'Test', as_of: '2026-10' };

  it('accepts a passage with an as-of month', () => {
    const result = validatePassage(form, 'test-destination');
    expect(result.ok && result.value).toMatchObject({ language: 'en', as_of: '2026-10', destination_id: 'test-destination' });
  });

  it('only allows en and fil, and YYYY-MM(-DD) dates', () => {
    const result = validatePassage({ ...form, language: 'es', as_of: 'Oct 2026' }, 'test-destination');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(Object.keys(result.errors).sort()).toEqual(['as_of', 'language']);
  });
});
