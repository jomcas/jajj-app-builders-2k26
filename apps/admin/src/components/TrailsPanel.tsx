// A Destination's Trails. A Trail comes from a GPX file, previewed on the map before saving;
// it is stored as a GeoJSON LineString with its computed distance.

import { useState, type ChangeEvent, type FormEvent } from 'react';
import { deleteTrail, saveTrail } from '../lib/api';
import { GpxError, parseGpx, type ParsedGpx } from '../lib/gpx';
import type { PackContent, TrailRow } from '../lib/types';
import { slugify, validateTrail, type FieldErrors, type TrailForm } from '../lib/validate';
import { errorMessage, Field, formatDistance, Notice } from './Field';
import { TrailMap } from './TrailMap';

export function TrailsPanel({ pack, onSaved }: { pack: PackContent; onSaved: () => void }) {
  const [editing, setEditing] = useState<TrailRow | 'new' | null>(pack.trails.length === 0 ? 'new' : null);

  return (
    <>
      <div className="card">
        <h2>Trails</h2>
        {pack.trails.length === 0 ? <p className="muted">No Trails yet. Upload a GPX file to add one.</p> : null}
        <table>
          <tbody>
            {pack.trails.map((trail) => (
              <tr key={trail.id} className={editing !== 'new' && editing?.id === trail.id ? 'selected' : ''}>
                <td>
                  <strong>{trail.name}</strong>
                  {trail.name_fil ? <span className="muted"> · {trail.name_fil}</span> : null}
                  <br />
                  <span className="muted small">{trail.id}</span>
                </td>
                <td>{formatDistance(trail.distance_m)}</td>
                <td>{pack.waypoints.filter((w) => w.trail_id === trail.id).length} Waypoints</td>
                <td>
                  <button className="quiet" onClick={() => setEditing(trail)}>Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="actions">
          <button className="secondary" onClick={() => setEditing('new')}>New Trail from GPX</button>
        </div>
      </div>
      {editing ? (
        <TrailEditor
          key={editing === 'new' ? 'new' : editing.id}
          pack={pack}
          trail={editing === 'new' ? null : editing}
          onDone={() => {
            setEditing(null);
            onSaved();
          }}
        />
      ) : (
        <TrailMap
          center={[pack.destination.longitude, pack.destination.latitude]}
          lines={pack.trails.map((trail) => ({ id: trail.id, coordinates: trail.geometry.coordinates }))}
        />
      )}
    </>
  );
}

function TrailEditor({ pack, trail, onDone }: { pack: PackContent; trail: TrailRow | null; onDone: () => void }) {
  const isNew = trail === null;
  const [form, setForm] = useState<TrailForm>({ id: trail?.id ?? '', name: trail?.name ?? '', name_fil: trail?.name_fil ?? '' });
  const [gpx, setGpx] = useState<ParsedGpx | null>(null);
  const [gpxFile, setGpxFile] = useState<string | null>(null);
  const [errors, setErrors] = useState<FieldErrors<TrailForm & { geometry: string }>>({});
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const line = gpx
    ? { geometry: gpx.line, distanceM: gpx.distanceM }
    : trail
      ? { geometry: trail.geometry, distanceM: trail.distance_m }
      : null;

  async function readGpx(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setGpxFile(file.name);
    try {
      const parsed = parseGpx(await file.text());
      setGpx(parsed);
      setErrors((current) => ({ ...current, geometry: undefined }));
      if (isNew && !form.name && parsed.name) {
        const id = form.id || `${pack.destination.id}-${slugify(parsed.name)}`;
        setForm({ ...form, name: parsed.name, id });
      }
    } catch (error) {
      setGpx(null);
      setErrors((current) => ({ ...current, geometry: error instanceof GpxError ? error.message : errorMessage(error) }));
    }
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    const taken = new Set(isNew ? pack.trails.map((t) => t.id) : []);
    const result = validateTrail(form, pack.destination.id, line, taken);
    setErrors(result.ok ? {} : result.errors);
    if (!result.ok) return;
    setBusy(true);
    setStatus(null);
    try {
      await saveTrail(result.value, isNew);
      onDone();
    } catch (error) {
      setStatus(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!trail) return;
    const count = pack.waypoints.filter((w) => w.trail_id === trail.id).length;
    if (!window.confirm(`Delete the Trail "${trail.name}" and its ${count} Waypoints?`)) return;
    setBusy(true);
    try {
      await deleteTrail(trail.id);
      onDone();
    } catch (error) {
      setStatus(errorMessage(error));
      setBusy(false);
    }
  }

  const others = pack.trails.filter((t) => t.id !== trail?.id);
  const set = (key: keyof TrailForm) => (event: { target: { value: string } }) => {
    const next = { ...form, [key]: event.target.value };
    if (isNew && key === 'name' && (form.id === '' || form.id === `${pack.destination.id}-${slugify(form.name)}`)) {
      next.id = `${pack.destination.id}-${slugify(event.target.value)}`;
    }
    setForm(next);
  };

  return (
    <form className="card" onSubmit={save}>
      <h2>{isNew ? 'New Trail' : `Edit ${trail.name}`}</h2>
      <div className="split">
        <div>
          <Field label={isNew ? 'GPX file' : 'Replace the Trail with a GPX file (optional)'} error={errors.geometry}>
            <input type="file" accept=".gpx,application/gpx+xml" onChange={readGpx} />
          </Field>
          {gpx ? (
            <Notice tone="info">
              Preview of {gpxFile}: {gpx.line.coordinates.length} points, {formatDistance(gpx.distanceM)}. The dashed line
              on the map is not saved until you press Save Trail.
            </Notice>
          ) : null}
          <Field label="Name" error={errors.name}>
            <input value={form.name} onChange={set('name')} />
          </Field>
          <Field label="Name in Filipino (optional)">
            <input value={form.name_fil} onChange={set('name_fil')} />
          </Field>
          <Field label="Id" error={errors.id}>
            <input value={form.id} onChange={set('id')} disabled={!isNew} />
          </Field>
          <p className="muted">Distance: {line ? formatDistance(line.distanceM) : '—'} (computed from the line)</p>
          {!isNew && gpx ? (
            <Notice tone="caution">
              Replacing the line can move where Waypoints fall along the Trail. Check their distances on the Waypoints tab.
            </Notice>
          ) : null}
          {status ? <Notice tone="caution">{status}</Notice> : null}
          <div className="actions">
            <button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save Trail'}</button>
            <button type="button" className="secondary" onClick={onDone} disabled={busy}>Cancel</button>
            {!isNew ? (
              <button type="button" className="quiet" onClick={remove} disabled={busy}>Delete Trail</button>
            ) : null}
          </div>
        </div>
        <TrailMap
          center={[pack.destination.longitude, pack.destination.latitude]}
          lines={[
            ...others.map((t) => ({ id: t.id, coordinates: t.geometry.coordinates })),
            ...(gpx
              ? [{ id: 'preview', coordinates: gpx.line.coordinates, preview: true }]
              : trail
                ? [{ id: trail.id, coordinates: trail.geometry.coordinates }]
                : []),
          ]}
        />
      </div>
    </form>
  );
}
