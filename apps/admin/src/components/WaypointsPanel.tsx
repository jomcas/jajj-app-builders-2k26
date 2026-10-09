// A Trail's Waypoints: add, edit, remove and reorder them, then save the whole list at once.
// A Waypoint's position comes from a click on the map or typed coordinates; its distance along
// the Trail is measured from that position and can be corrected by hand.

import { useMemo, useState, type FormEvent } from 'react';
import { saveWaypoints } from '../lib/api';
import { locateAlongLine } from '../lib/geo';
import { WAYPOINT_TYPE_LABELS, WAYPOINT_TYPES, type LngLat, type PackContent, type WaypointRow } from '../lib/types';
import { validateWaypoint, waypointForm, type FieldErrors, type WaypointForm } from '../lib/validate';
import { move, sortByDistance, waypointId } from '../lib/waypoints';
import { errorMessage, Field, formatDistance, Notice } from './Field';
import { TrailMap, type MapPoint } from './TrailMap';

type Draft = Omit<WaypointRow, 'updated_at' | 'position' | 'trail_id'>;

/** Warn when a Waypoint is this far from its Trail. */
const FAR_FROM_TRAIL_M = 150;

export function WaypointsPanel({ pack, onSaved }: { pack: PackContent; onSaved: () => void }) {
  const [trailId, setTrailId] = useState(pack.trails[0]?.id ?? '');
  const trail = pack.trails.find((t) => t.id === trailId);

  if (!trail) {
    return <p className="muted">Add a Trail first: Waypoints belong to a Trail.</p>;
  }
  return (
    <>
      {pack.trails.length > 1 ? (
        <Field label="Trail">
          <select value={trailId} onChange={(e) => setTrailId(e.target.value)}>
            {pack.trails.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </Field>
      ) : null}
      <TrailWaypoints key={trail.id} pack={pack} trailId={trail.id} onSaved={onSaved} />
    </>
  );
}

function toDraft({ updated_at: _u, position: _p, trail_id: _t, ...rest }: WaypointRow): Draft {
  return rest;
}

function TrailWaypoints({ pack, trailId, onSaved }: { pack: PackContent; trailId: string; onSaved: () => void }) {
  const trail = pack.trails.find((t) => t.id === trailId)!;
  const saved = useMemo(
    () => pack.waypoints.filter((w) => w.trail_id === trailId).sort((a, b) => a.position - b.position),
    [pack.waypoints, trailId],
  );
  const [list, setList] = useState<Draft[]>(() => saved.map(toDraft));
  const [dirty, setDirty] = useState(false);
  const [editing, setEditing] = useState<string | 'new' | null>(null);
  const [form, setForm] = useState<WaypointForm>(waypointForm());
  const [errors, setErrors] = useState<FieldErrors<WaypointForm>>({});
  const [status, setStatus] = useState<{ tone: 'ok' | 'caution'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const coordinates = trail.geometry.coordinates;
  const measure = (position: LngLat) => locateAlongLine(coordinates, position);

  function change(next: Draft[]) {
    setList(next);
    setDirty(true);
    setStatus(null);
  }

  function startNew() {
    setEditing('new');
    setForm(waypointForm());
    setErrors({});
  }

  function startEdit(waypoint: Draft) {
    setEditing(waypoint.id);
    setForm(waypointForm(waypoint));
    setErrors({});
  }

  /** A map click or typed coordinates: set the position and measure the distance along the Trail. */
  function place(position: LngLat) {
    const { alongM } = measure(position);
    setForm((current) => ({
      ...current,
      latitude: position[1].toFixed(6),
      longitude: position[0].toFixed(6),
      distance_m: String(Math.round(alongM)),
    }));
  }

  function measureTyped() {
    const position: LngLat = [Number(form.longitude), Number(form.latitude)];
    if (position.every(Number.isFinite)) place(position);
  }

  function apply(event: FormEvent) {
    event.preventDefault();
    const result = validateWaypoint(form, trail.distance_m);
    setErrors(result.ok ? {} : result.errors);
    if (!result.ok) return;
    if (editing === 'new') {
      const taken = new Set([...pack.waypoints.map((w) => w.id), ...list.map((w) => w.id)]);
      const id = waypointId(trailId, result.value.name, result.value.type, taken);
      change([...list, { id, ...result.value }]);
    } else {
      change(list.map((w) => (w.id === editing ? { ...w, ...result.value } : w)));
    }
    setEditing(null);
  }

  async function save() {
    setBusy(true);
    try {
      await saveWaypoints(trailId, saved.map((w) => w.id), list);
      setDirty(false);
      setStatus({ tone: 'ok', text: 'Waypoints saved. Publish the Destination Pack so phones download the change.' });
      onSaved();
    } catch (error) {
      setStatus({ tone: 'caution', text: errorMessage(error) });
    } finally {
      setBusy(false);
    }
  }

  function remeasureAll() {
    change(list.map((w) => ({ ...w, distance_m: Math.round(measure([w.longitude, w.latitude]).alongM) })));
  }

  const formPosition: LngLat | null =
    form.latitude && form.longitude && Number.isFinite(Number(form.latitude) + Number(form.longitude))
      ? [Number(form.longitude), Number(form.latitude)]
      : null;
  const offTrail = formPosition ? measure(formPosition).offsetM : 0;

  const points: MapPoint[] = list.map((w, i) => ({
    id: w.id,
    position: [w.longitude, w.latitude] as LngLat,
    label: String(i + 1),
    kind: w.type,
    selected: editing === w.id,
    title: `${i + 1}. ${w.name}`,
  }));
  if (editing === 'new' && formPosition) points.push({ id: 'new', position: formPosition, label: '+', kind: form.type || 'jump_off', selected: true, title: 'New Waypoint' });
  else if (editing && editing !== 'new' && formPosition) {
    const point = points.find((p) => p.id === editing);
    if (point) point.position = formPosition;
  }

  return (
    <div className="split">
      <div>
        <div className="card">
          <h2>Waypoints on {trail.name}</h2>
          {list.length === 0 ? <p className="muted">No Waypoints yet.</p> : null}
          <table>
            <thead>
              <tr><th>#</th><th>Type</th><th>Name</th><th>Along the Trail</th><th /></tr>
            </thead>
            <tbody>
              {list.map((w, i) => (
                <tr key={w.id} className={editing === w.id ? 'selected' : ''}>
                  <td>{i + 1}</td>
                  <td>{WAYPOINT_TYPE_LABELS[w.type]}</td>
                  <td>{w.name}</td>
                  <td>{formatDistance(w.distance_m)}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <button className="quiet" title="Move up" aria-label={`Move ${w.name} up`} onClick={() => change(move(list, i, -1))} disabled={i === 0}>↑</button>
                    <button className="quiet" title="Move down" aria-label={`Move ${w.name} down`} onClick={() => change(move(list, i, 1))} disabled={i === list.length - 1}>↓</button>
                    <button className="quiet" onClick={() => startEdit(w)}>Edit</button>
                    <button className="quiet" onClick={() => change(list.filter((x) => x.id !== w.id))}>Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="actions">
            <button className="secondary" onClick={startNew}>Add Waypoint</button>
            <button className="secondary" onClick={() => change(sortByDistance(list))} disabled={list.length < 2}>Order by distance</button>
            <button className="secondary" onClick={remeasureAll} disabled={list.length === 0}>Re-measure distances</button>
          </div>
          {dirty ? <Notice tone="info">Unsaved changes to this Trail's Waypoints.</Notice> : null}
          {status ? <Notice tone={status.tone}>{status.text}</Notice> : null}
          <div className="actions">
            <button onClick={save} disabled={!dirty || busy}>{busy ? 'Saving…' : 'Save Waypoints'}</button>
            {dirty ? (
              <button className="quiet" onClick={() => { setList(saved.map(toDraft)); setDirty(false); setEditing(null); }}>
                Discard changes
              </button>
            ) : null}
          </div>
        </div>

        {editing ? (
          <form className="card" onSubmit={apply}>
            <h3>{editing === 'new' ? 'New Waypoint' : 'Edit Waypoint'}</h3>
            <p className="muted small">Click the map to place it, or type its coordinates.</p>
            <div className="row">
              <Field label="Type" error={errors.type}>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  <option value="">Pick a type</option>
                  {WAYPOINT_TYPES.map((type) => (
                    <option key={type} value={type}>{WAYPOINT_TYPE_LABELS[type]}</option>
                  ))}
                </select>
              </Field>
              <Field label="Name" error={errors.name}>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </Field>
            </div>
            <Field label="Name in Filipino (optional)">
              <input value={form.name_fil} onChange={(e) => setForm({ ...form, name_fil: e.target.value })} />
            </Field>
            <Field label="Note (optional, e.g. treat the water before drinking)">
              <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
            </Field>
            <div className="row">
              <Field label="Latitude" error={errors.latitude}>
                <input value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} onBlur={measureTyped} inputMode="decimal" />
              </Field>
              <Field label="Longitude" error={errors.longitude}>
                <input value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} onBlur={measureTyped} inputMode="decimal" />
              </Field>
            </div>
            <div className="row">
              <Field label="Distance along the Trail (m)" error={errors.distance_m}>
                <input value={form.distance_m} onChange={(e) => setForm({ ...form, distance_m: e.target.value })} inputMode="numeric" />
              </Field>
              <Field label="Elevation (m, optional)" error={errors.elevation_m}>
                <input value={form.elevation_m} onChange={(e) => setForm({ ...form, elevation_m: e.target.value })} inputMode="numeric" />
              </Field>
            </div>
            {offTrail > FAR_FROM_TRAIL_M ? (
              <Notice tone="caution">This point is {Math.round(offTrail)} m from the Trail. Check its position.</Notice>
            ) : null}
            <div className="actions">
              <button type="submit">{editing === 'new' ? 'Add to the list' : 'Update in the list'}</button>
              <button type="button" className="secondary" onClick={() => setEditing(null)}>Cancel</button>
            </div>
          </form>
        ) : null}
      </div>
      <TrailMap
        center={[pack.destination.longitude, pack.destination.latitude]}
        lines={[{ id: trail.id, coordinates }]}
        points={points}
        onClick={editing ? place : undefined}
      />
    </div>
  );
}
