// A Destination's reference passages: the facts the Assistant answers from, in English and
// Filipino, each with its source.

import { useState, type FormEvent } from 'react';
import { deletePassage, savePassage } from '../lib/api';
import type { PackContent, PassageRow } from '../lib/types';
import { passageForm, slugify, validatePassage, type FieldErrors, type PassageForm } from '../lib/validate';
import { errorMessage, Field, Notice } from './Field';

const LANGUAGE_LABELS = { en: 'English', fil: 'Filipino' } as const;

export function PassagesPanel({ pack, onSaved }: { pack: PackContent; onSaved: () => void }) {
  const [editing, setEditing] = useState<PassageRow | 'new' | null>(null);

  return (
    <>
      <div className="card">
        <h2>Reference passages</h2>
        <p className="muted small">What the Assistant knows about {pack.destination.name}: fees, rules, getting there, water.</p>
        {pack.passages.length === 0 ? <p className="muted">No reference passages yet.</p> : null}
        <table>
          <thead>
            <tr><th>Topic</th><th>Language</th><th>Text</th><th>Source</th><th /></tr>
          </thead>
          <tbody>
            {pack.passages.map((passage) => (
              <tr key={passage.id} className={editing !== 'new' && editing?.id === passage.id ? 'selected' : ''}>
                <td>{passage.topic}</td>
                <td>{LANGUAGE_LABELS[passage.language]}</td>
                <td className="small">{passage.text.length > 90 ? `${passage.text.slice(0, 90)}…` : passage.text}</td>
                <td className="small">{passage.source}</td>
                <td><button className="quiet" onClick={() => setEditing(passage)}>Edit</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="actions">
          <button className="secondary" onClick={() => setEditing('new')}>New reference passage</button>
        </div>
      </div>
      {editing ? (
        <PassageEditor
          key={editing === 'new' ? 'new' : editing.id}
          pack={pack}
          passage={editing === 'new' ? null : editing}
          onDone={(changed) => {
            setEditing(null);
            if (changed) onSaved();
          }}
        />
      ) : null}
    </>
  );
}

function PassageEditor({
  pack,
  passage,
  onDone,
}: {
  pack: PackContent;
  passage: PassageRow | null;
  onDone: (changed: boolean) => void;
}) {
  const isNew = passage === null;
  const destinationId = pack.destination.id;
  const [form, setForm] = useState<PassageForm>(() => passageForm(passage ?? undefined));
  const [errors, setErrors] = useState<FieldErrors<PassageForm>>({});
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const suggestedId = (f: PassageForm) => `${destinationId}-${slugify(f.topic)}-${f.language}`;
  function set(key: keyof PassageForm, value: string) {
    const next = { ...form, [key]: value };
    // Suggest an id from topic and language until the id is edited by hand.
    if (isNew && (key === 'topic' || key === 'language') && (form.id === '' || form.id === suggestedId(form))) {
      next.id = suggestedId(next);
    }
    setForm(next);
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    const taken = new Set(isNew ? pack.passages.map((p) => p.id) : []);
    const result = validatePassage(form, destinationId, taken);
    setErrors(result.ok ? {} : result.errors);
    if (!result.ok) return;
    setBusy(true);
    try {
      await savePassage(result.value, isNew);
      onDone(true);
    } catch (error) {
      setStatus(errorMessage(error));
      setBusy(false);
    }
  }

  async function remove() {
    if (!passage || !window.confirm(`Delete the reference passage "${passage.topic}" (${passage.language})?`)) return;
    setBusy(true);
    try {
      await deletePassage(passage.id);
      onDone(true);
    } catch (error) {
      setStatus(errorMessage(error));
      setBusy(false);
    }
  }

  return (
    <form className="card" onSubmit={save}>
      <h3>{isNew ? 'New reference passage' : `Edit ${passage.topic} (${LANGUAGE_LABELS[passage.language]})`}</h3>
      <div className="row">
        <Field label="Topic" error={errors.topic}>
          <input value={form.topic} onChange={(e) => set('topic', e.target.value)} placeholder="fees" />
        </Field>
        <Field label="Language" error={errors.language}>
          <select value={form.language} onChange={(e) => set('language', e.target.value)}>
            <option value="en">English</option>
            <option value="fil">Filipino</option>
          </select>
        </Field>
        <Field label="As of (YYYY-MM or YYYY-MM-DD, optional)" error={errors.as_of}>
          <input value={form.as_of} onChange={(e) => set('as_of', e.target.value)} placeholder="2026-10" />
        </Field>
      </div>
      <Field label="Text" error={errors.text}>
        <textarea value={form.text} onChange={(e) => set('text', e.target.value)} />
      </Field>
      <Field label="Source (a URL, a book, or who told you)" error={errors.source}>
        <input value={form.source} onChange={(e) => set('source', e.target.value)} />
      </Field>
      <Field label="Id" error={errors.id}>
        <input value={form.id} onChange={(e) => set('id', e.target.value)} disabled={!isNew} />
      </Field>
      {status ? <Notice tone="caution">{status}</Notice> : null}
      <div className="actions">
        <button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save reference passage'}</button>
        <button type="button" className="secondary" onClick={() => onDone(false)} disabled={busy}>Cancel</button>
        {!isNew ? <button type="button" className="quiet" onClick={remove} disabled={busy}>Delete</button> : null}
      </div>
    </form>
  );
}
