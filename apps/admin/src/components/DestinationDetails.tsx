// A Destination's details: name, region, summaries in English and Filipino, position and
// elevation. Used to add a Destination and to edit one.

import { useState, type FormEvent } from 'react';
import { createDestination, updateDestination } from '../lib/api';
import type { DestinationRow, LngLat } from '../lib/types';
import {
  destinationForm,
  slugify,
  validateDestination,
  type DestinationForm,
  type FieldErrors,
} from '../lib/validate';
import { errorMessage, Field, formatBytes, Notice } from './Field';
import { TrailMap } from './TrailMap';

/** Somewhere in Luzon, until a position is entered. */
const DEFAULT_CENTER: LngLat = [120.98, 14.6];

export function DestinationFields({
  form,
  errors,
  onChange,
  isNew,
}: {
  form: DestinationForm;
  errors: FieldErrors<DestinationForm>;
  onChange: (form: DestinationForm) => void;
  isNew: boolean;
}) {
  const set = (key: keyof DestinationForm) => (event: { target: { value: string } }) => {
    const next = { ...form, [key]: event.target.value };
    // Suggest an id from the name until the id is edited by hand.
    if (isNew && key === 'name' && (form.id === '' || form.id === slugify(form.name))) next.id = slugify(event.target.value);
    onChange(next);
  };
  const latitude = Number(form.latitude);
  const longitude = Number(form.longitude);
  const hasPosition = form.latitude.trim() !== '' && form.longitude.trim() !== '' && Number.isFinite(latitude + longitude);
  const position: LngLat | null = hasPosition ? [longitude, latitude] : null;

  return (
    <div className="split">
      <div>
        <Field label="Name" error={errors.name}>
          <input value={form.name} onChange={set('name')} placeholder="Mt. Batulao" />
        </Field>
        <Field label="Id (used in the phone's folder names; cannot change later)" error={errors.id}>
          <input value={form.id} onChange={set('id')} disabled={!isNew} placeholder="batulao" />
        </Field>
        <Field label="Region" error={errors.region}>
          <input value={form.region} onChange={set('region')} placeholder="Nasugbu, Batangas" />
        </Field>
        <Field label="Summary (English)" error={errors.summary_en}>
          <textarea value={form.summary_en} onChange={set('summary_en')} />
        </Field>
        <Field label="Summary (Filipino)" error={errors.summary_fil}>
          <textarea value={form.summary_fil} onChange={set('summary_fil')} />
        </Field>
      </div>
      <div>
        <div className="row">
          <Field label="Latitude" error={errors.latitude}>
            <input value={form.latitude} onChange={set('latitude')} inputMode="decimal" placeholder="14.0396" />
          </Field>
          <Field label="Longitude" error={errors.longitude}>
            <input value={form.longitude} onChange={set('longitude')} inputMode="decimal" placeholder="120.8011" />
          </Field>
          <Field label="Elevation (m)" error={errors.elevation_m}>
            <input value={form.elevation_m} onChange={set('elevation_m')} inputMode="numeric" placeholder="811" />
          </Field>
        </div>
        <p className="muted small">Click the map to set the Destination's position.</p>
        <TrailMap
          center={position ?? DEFAULT_CENTER}
          lines={[]}
          points={position ? [{ id: 'destination', position, label: '★', kind: 'destination', title: form.name }] : []}
          onClick={([lon, lat]) => onChange({ ...form, latitude: lat.toFixed(6), longitude: lon.toFixed(6) })}
        />
      </div>
    </div>
  );
}

/** Edits an existing Destination's details. */
export function DestinationDetails({ destination, onSaved }: { destination: DestinationRow; onSaved: () => void }) {
  const [form, setForm] = useState(() => destinationForm(destination));
  const [errors, setErrors] = useState<FieldErrors<DestinationForm>>({});
  const [status, setStatus] = useState<{ tone: 'ok' | 'caution'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function save(event: FormEvent) {
    event.preventDefault();
    const result = validateDestination(form);
    setErrors(result.ok ? {} : result.errors);
    if (!result.ok) return;
    setBusy(true);
    try {
      await updateDestination(result.value);
      setStatus({ tone: 'ok', text: 'Saved. Publish the Destination Pack so phones download the change.' });
      onSaved();
    } catch (error) {
      setStatus({ tone: 'caution', text: errorMessage(error) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save}>
      <DestinationFields form={form} errors={errors} onChange={setForm} isNew={false} />
      <p className="muted small">
        Map file: {destination.map_path} ({formatBytes(destination.map_bytes)}). Upload a new map file when you publish.
      </p>
      {status ? <Notice tone={status.tone}>{status.text}</Notice> : null}
      <div className="actions">
        <button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save details'}</button>
      </div>
    </form>
  );
}

/** Adds a Destination. Its map file is required from the start (map_path and map_bytes are). */
export function NewDestinationForm({ takenIds, onCreated }: { takenIds: ReadonlySet<string>; onCreated: (id: string) => void }) {
  const [form, setForm] = useState(() => destinationForm());
  const [errors, setErrors] = useState<FieldErrors<DestinationForm & { map: string }>>({});
  const [map, setMap] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function create(event: FormEvent) {
    event.preventDefault();
    const result = validateDestination(form, takenIds);
    const mapError = !map ? 'Choose the PMTiles map file.' : map.size === 0 ? 'The map file is empty.' : undefined;
    setErrors({ ...(result.ok ? {} : result.errors), ...(mapError ? { map: mapError } : {}) });
    if (!result.ok || !map || mapError) return;
    setBusy(true);
    setStatus(null);
    try {
      const created = await createDestination(result.value, map);
      onCreated(created.id);
    } catch (error) {
      setStatus(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={create}>
      <h2>New Destination</h2>
      <Notice tone="info">
        A new Destination shows up in the phone's Explore list as soon as it is added. Add its Trails, Waypoints and
        reference passages, then publish.
      </Notice>
      <DestinationFields form={form} errors={errors} onChange={setForm} isNew />
      <Field label="Map file (PMTiles, for offline use on the phone)" error={errors.map}>
        <input type="file" accept=".pmtiles" onChange={(e) => setMap(e.target.files?.[0] ?? null)} />
      </Field>
      {status ? <Notice tone="caution">{status}</Notice> : null}
      <div className="actions">
        <button type="submit" disabled={busy}>{busy ? 'Adding…' : 'Add Destination'}</button>
      </div>
    </form>
  );
}
