// Publishing the Destination Pack: bump its version (and optionally its map file) so phones
// that already have it download it again. Shows what changed since the last publish.

import { useEffect, useState } from 'react';
import { lastPublish, publishPack, type LastPublish } from '../lib/api';
import { diffPacks, packSnapshot, type Change } from '../lib/publish';
import type { PackContent } from '../lib/types';
import { errorMessage, Field, formatBytes, Notice } from './Field';

export function PublishPanel({ pack, onPublished }: { pack: PackContent; onPublished: () => void }) {
  const [previous, setPrevious] = useState<LastPublish | null | undefined>(undefined);
  const [map, setMap] = useState<File | null>(null);
  const [status, setStatus] = useState<{ tone: 'ok' | 'caution'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const { destination } = pack;

  useEffect(() => {
    lastPublish(destination.id).then(setPrevious, (error: unknown) => {
      setPrevious(null);
      setStatus({ tone: 'caution', text: `Could not read the last publish: ${errorMessage(error)}` });
    });
  }, [destination.id, destination.pack_version]);

  const changes = previous ? diffPacks(previous.content, packSnapshot(pack)) : null;

  async function publish() {
    const next = destination.pack_version + 1;
    if (!window.confirm(`Publish ${destination.name} as Destination Pack version ${next}? Phones will download it again.`)) return;
    setBusy(true);
    setStatus(null);
    try {
      const published = await publishPack(pack, map);
      setMap(null);
      setStatus({
        tone: 'ok',
        text: `Published version ${published.pack_version}. Phones download it the next time they open ${destination.name} online.`,
      });
      onPublished();
    } catch (error) {
      setStatus({ tone: 'caution', text: errorMessage(error) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <h2>Publish the Destination Pack</h2>
      <p>
        Now at version <strong>{destination.pack_version}</strong>, with the map file {destination.map_path} (
        {formatBytes(destination.map_bytes)}).
      </p>
      <Notice tone="info">
        Saved edits are already in the database, so a phone downloading {destination.name} for the first time gets them.
        Publishing raises the version so phones that already have this Destination Pack download it again.
      </Notice>

      <h3>What changed since the last publish</h3>
      {previous === undefined ? <p className="muted">Checking…</p> : null}
      {previous === null ? (
        <p className="muted">
          No publish from the Admin Portal is recorded for {destination.name} yet, so there is nothing to compare with.
        </p>
      ) : null}
      {previous ? (
        <p className="muted small">
          Version {previous.packVersion}, published {new Date(previous.publishedAt).toLocaleString()} by {previous.publishedBy}.
        </p>
      ) : null}
      {changes ? <ChangeList changes={changes} /> : null}

      <Field label="New map file (PMTiles, optional)">
        <input type="file" accept=".pmtiles" onChange={(e) => setMap(e.target.files?.[0] ?? null)} />
      </Field>
      {map ? (
        <p className="muted small">
          Uploads as {destination.id}-v{destination.pack_version + 1}.pmtiles ({formatBytes(map.size)}) and replaces{' '}
          {destination.map_path} in the pack.
        </p>
      ) : null}
      {status ? <Notice tone={status.tone}>{status.text}</Notice> : null}
      <div className="actions">
        <button onClick={publish} disabled={busy}>
          {busy ? 'Publishing…' : `Publish version ${destination.pack_version + 1}`}
        </button>
      </div>
    </div>
  );
}

function ChangeList({ changes }: { changes: Change[] }) {
  if (changes.length === 0) return <p className="muted">Nothing has changed since the last publish.</p>;
  return (
    <table>
      <tbody>
        {changes.map((change) => (
          <tr key={`${change.kind}:${change.id}`}>
            <td><span className={`chip ${change.change}`}>{change.change}</span></td>
            <td>{change.kind}</td>
            <td>{change.name}</td>
            <td className="muted small">{change.fields?.join(', ')}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
