import { describe, expect, it } from 'vitest';
import { move, planWaypointSave, sortByDistance, STAGING_OFFSET, waypointId } from '../src/lib/waypoints';

const base = { name_fil: null, note: null, latitude: 16.3, longitude: 120.64, elevation_m: null };
const jumpOff = { ...base, id: 't-jump-off', type: 'jump_off' as const, name: 'Jump-off', distance_m: 0 };
const water = { ...base, id: 't-spring', type: 'water' as const, name: 'Spring', distance_m: 900 };
const summit = { ...base, id: 't-summit', type: 'summit' as const, name: 'Summit', distance_m: 1600 };

describe('reordering', () => {
  it('moves an item up or down, clamped to the list', () => {
    expect(move(['a', 'b', 'c'], 2, -1)).toEqual(['a', 'c', 'b']);
    expect(move(['a', 'b', 'c'], 0, -1)).toEqual(['a', 'b', 'c']);
    expect(move(['a', 'b', 'c'], 0, 5)).toEqual(['b', 'c', 'a']);
  });

  it('sorts by distance along the Trail', () => {
    expect(sortByDistance([summit, jumpOff, water]).map((w) => w.id)).toEqual(['t-jump-off', 't-spring', 't-summit']);
  });
});

describe('waypointId', () => {
  it('derives an id from the Trail and name, avoiding taken ones', () => {
    expect(waypointId('test-trail', 'Camp 1', 'campsite', new Set())).toBe('test-trail-camp-1');
    expect(waypointId('test-trail', 'Camp 1', 'campsite', new Set(['test-trail-camp-1']))).toBe('test-trail-camp-1-2');
    expect(waypointId('test-trail', '!!', 'jump_off', new Set())).toBe('test-trail-jump-off');
  });
});

describe('planWaypointSave', () => {
  it('deletes removed Waypoints, stages positions out of the way, then numbers them 1..n', () => {
    const plan = planWaypointSave('t', ['t-jump-off', 't-old', 't-summit'], [summit, jumpOff, water]);
    expect(plan.deleteIds).toEqual(['t-old']);
    expect(plan.staged.map((w) => [w.id, w.position])).toEqual([
      ['t-summit', STAGING_OFFSET + 1],
      ['t-jump-off', STAGING_OFFSET + 2],
      ['t-spring', STAGING_OFFSET + 3],
    ]);
    expect(plan.final.map((w) => [w.id, w.position, w.trail_id])).toEqual([
      ['t-summit', 1, 't'],
      ['t-jump-off', 2, 't'],
      ['t-spring', 3, 't'],
    ]);
  });

  it('refuses two Waypoints with one id', () => {
    expect(() => planWaypointSave('t', [], [water, water])).toThrow(/same id/);
  });
});
