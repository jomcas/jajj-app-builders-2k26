// The flare module's Assistant tools (issue #19, ADR 0001), listed in the module's `tools`.

import { openFlareScreen } from '../openRequest';
import { createFlareTool } from './signal';

/** "Help me signal": opens the Flare screen ready to fire, never firing it (ADR 0004). */
export const flareTool = createFlareTool(openFlareScreen);
