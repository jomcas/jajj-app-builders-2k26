import { useEffect, useState } from 'react';
import { BackHandler } from 'react-native';

import type { Destination } from '../destination-pack';
import { DestinationList } from './DestinationList';
import { DestinationScreen } from './DestinationScreen';

/**
 * The Explore tab: the Destination list, and a Destination's screen on top of it. A plain
 * two-level stack held in state; Android's back button returns to the list.
 */
export function ExploreScreen() {
  const [open, setOpen] = useState<Destination | null>(null);

  useEffect(() => {
    if (!open) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      setOpen(null);
      return true;
    });
    return () => subscription.remove();
  }, [open]);

  return open ? (
    <DestinationScreen destination={open} onBack={() => setOpen(null)} />
  ) : (
    <DestinationList onOpen={setOpen} />
  );
}
