// One Destination Pack: its details, Trails, Waypoints, reference passages, and publishing.

import { useCallback, useEffect, useState } from 'react';
import { loadPack } from '../lib/api';
import type { PackContent } from '../lib/types';
import { DestinationDetails } from './DestinationDetails';
import { errorMessage, Notice } from './Field';
import { PassagesPanel } from './PassagesPanel';
import { PublishPanel } from './PublishPanel';
import { TrailsPanel } from './TrailsPanel';
import { WaypointsPanel } from './WaypointsPanel';

const TABS = ['Details', 'Trails', 'Waypoints', 'Reference passages', 'Publish'] as const;
type Tab = (typeof TABS)[number];

export function DestinationEditor({ destinationId, onChanged }: { destinationId: string; onChanged: () => void }) {
  const [pack, setPack] = useState<PackContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('Details');

  const reload = useCallback(async () => {
    try {
      setPack(await loadPack(destinationId));
      setError(null);
    } catch (failure) {
      setError(errorMessage(failure));
    }
  }, [destinationId]);

  useEffect(() => void reload(), [reload]);

  /** After a save: re-read the pack, and the Destination list if names or versions moved. */
  const saved = useCallback(() => {
    void reload();
    onChanged();
  }, [reload, onChanged]);

  if (error) return <Notice tone="caution">{error}</Notice>;
  if (!pack) return <p className="muted">Loading the Destination Pack…</p>;

  return (
    <>
      <h1>{pack.destination.name}</h1>
      <p className="muted">
        {pack.destination.region} · Destination Pack version {pack.destination.pack_version} ·{' '}
        {pack.trails.length} Trail{pack.trails.length === 1 ? '' : 's'} · {pack.waypoints.length} Waypoint
        {pack.waypoints.length === 1 ? '' : 's'} · {pack.passages.length} reference passage
        {pack.passages.length === 1 ? '' : 's'}
      </p>
      <div className="tabs" role="tablist">
        {TABS.map((name) => (
          <button key={name} role="tab" className={tab === name ? 'active' : ''} onClick={() => setTab(name)}>
            {name}
          </button>
        ))}
      </div>
      {tab === 'Details' ? <DestinationDetails key={pack.destination.updated_at} destination={pack.destination} onSaved={saved} /> : null}
      {tab === 'Trails' ? <TrailsPanel pack={pack} onSaved={saved} /> : null}
      {tab === 'Waypoints' ? <WaypointsPanel pack={pack} onSaved={saved} /> : null}
      {tab === 'Reference passages' ? <PassagesPanel pack={pack} onSaved={saved} /> : null}
      {tab === 'Publish' ? <PublishPanel pack={pack} onPublished={saved} /> : null}
    </>
  );
}
