import { useEffect } from 'react';
import { BackHandler } from 'react-native';

import { GuideList } from './GuideList';
import { GuideScreen } from './GuideScreen';
import { closeGuide, library, openGuide, useOpenGuideId } from './store';

/**
 * The Guides tab: the Guide Library list, and a Guide on top of it. Which Guide is open lives
 * in the module's store, so openGuide() and tahak://guides/<id> work from any tab. Android's
 * back button returns to the list.
 */
export function GuidesScreen() {
  const openId = useOpenGuideId();
  const guide = openId ? library.getGuide(openId) : undefined;

  useEffect(() => {
    if (!guide) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      closeGuide();
      return true;
    });
    return () => subscription.remove();
  }, [guide]);

  return guide ? (
    <GuideScreen key={guide.id} guide={guide} onBack={closeGuide} />
  ) : (
    <GuideList onOpen={openGuide} />
  );
}
