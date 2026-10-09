import { useState, type ReactNode } from 'react';

import { featureModules, type TabId } from '../modules';

const gates = featureModules.flatMap((module) => (module.launchGate ? [module.launchGate] : []));

/**
 * Shows each Feature Module's launch gate in turn (for example first-launch setup), then the
 * tabs, opening the tab the last gate asked for.
 */
export function LaunchGates({ children }: { children: (initialTab: TabId | undefined) => ReactNode }) {
  const [index, setIndex] = useState(0);
  const [initialTab, setInitialTab] = useState<TabId>();
  const Gate = gates[index];
  if (Gate) {
    return (
      <Gate
        onDone={(next) => {
          if (next) setInitialTab(next.tab);
          setIndex((i) => i + 1);
        }}
      />
    );
  }
  return <>{children(initialTab)}</>;
}
