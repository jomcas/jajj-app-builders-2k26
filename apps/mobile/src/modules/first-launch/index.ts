// First-launch setup (issue #13): language, permissions and the Assistant model download, on
// one screen shown before the tabs until it is completed once. No tab of its own.
// Dev only: tahak://setup/reset shows it again without uninstalling (see resetLink.ts).
import type { FeatureModule } from '../types';
import { listenForResetLinks } from './resetLink';
import { SetupScreen } from './SetupScreen';

listenForResetLinks();

export default {
  id: 'first-launch',
  launchGate: SetupScreen,
  hikeModes: ['solo', 'group'],
  offlineNeeds: [],
} satisfies FeatureModule;
