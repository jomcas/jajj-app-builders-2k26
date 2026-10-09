import { DevSettings, Linking } from 'react-native';

import { parseSetupLink } from '../assistant-model';
import { resetSetup } from './setupFlag';

type ResetGlobals = { tahakSetupLinks?: { remove(): void } };
const globals = globalThis as ResetGlobals;

const isReset = (url: string | null) => __DEV__ && parseSetupLink(url)?.kind === 'reset';

/**
 * Settles once a launch from the reset link has been handled, so the setup screen reads the
 * flag after the reset. A launch from the link resets without reloading (a reload would see
 * the same launch link again and loop).
 */
export const launchLinkHandled: Promise<void> = Linking.getInitialURL()
  .then((url) => (isReset(url) ? resetSetup() : undefined))
  .catch(() => undefined);

/**
 * Dev only: `adb shell am start -a android.intent.action.VIEW -d "tahak://setup/reset" com.tahak.app`
 * forgets that setup was done and shows it again, so first launch is tested without uninstalling.
 * While the app is running, it reloads the JS.
 */
export function listenForResetLinks() {
  if (!__DEV__) return;
  globals.tahakSetupLinks?.remove();
  globals.tahakSetupLinks = Linking.addEventListener('url', ({ url }) => {
    if (isReset(url)) void resetSetup().then(() => DevSettings.reload());
  });
}
