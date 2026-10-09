// The Assistant's "open the Flare" tool (issue #19, ADR 0001, ADR 0004): its intent match and
// the tool itself. Opening shows the Flare screen ready to fire; it NEVER fires the Flare.
// Firing still takes the deliberate 1.5 s hold on that screen, so a misread question or a
// pocket tap can't set it off. The tool is given only `open`, never fireFlare.
// Pure (type-only imports), tested under plain Node; ./index.ts wires `open`.

import type { AssistantTool } from '../../types';
import strings from '../strings.ts';

export const FLARE_TOOL_ID = 'flare.open';

/** Lower case, no accents or punctuation, hyphens as spaces, padded: " paano mag signal ". */
function normalize(question: string): string {
  return ` ${question
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9ñ]+/g, ' ')
    .trim()} `;
}

/**
 * Asking to signal for help or to open the Flare, in en, fil and Taglish. A bare "signal"
 * is phone reception ("May signal ba sa summit?"), so it never counts on its own.
 */
const SIGNAL_INTENTS = [
  // English
  / help (me|us) (to )?signal /,
  / signal (for )?(help|rescue|rescuers|attention|a rescuer|the rescuers) /,
  / signal (to )?(the )?(rescuers?|searchers?|search party|helicopter|people) /,
  / how (do|can|should) (i|we) signal /,
  / (send|make|give) (a |an )?(distress|sos|rescue) signal /,
  / (get|attract|catch) (the )?(rescuers?|searchers?|someones?|peoples?|their) attention /,
  / (rescuers?|searchers?|rescue team) (can |could |will )?(see|find|spot|hear) (me|us) /,
  / be (seen|found|spotted) by (the )?(rescuers?|searchers?|someone|people) /,
  / (open|start|use|turn on|show|ready|get|prepare) (the |my )?flare /,
  // Filipino and Taglish
  / mag ?signal /,
  / (humingi|humihingi|hihingi|manghingi|makahingi|hingi) (ng )?tulong (sa|mula sa) (mga )?(rescuers?|rescue|tagasagip|naghahanap) /,
  / (makita|mahanap|marinig) (kami|ako|tayo) ng (mga )?(rescuers?|rescue|tagasagip|naghahanap|tao) /,
  / (ma)?pansin(in)? (kami|ako|tayo) ng (mga )?(rescuers?|tagasagip|naghahanap) /,
  / (buksan|i ?open|gamitin|i ?on|ihanda) (mo |nyo |niyo |natin )?(na )?(ang |yung |ung )?flare /,
  / (sumenyas|senyasan|manenyas) /,
];

/** "Help me signal", "paano humingi ng tulong sa mga rescuer?": an empty argument list, or null. */
export function matchSignal(question: string): Record<string, never> | null {
  const text = normalize(question);
  return SIGNAL_INTENTS.some((intent) => intent.test(text)) ? {} : null;
}

/** The tool, given how to open the Flare screen. It has no way to fire the Flare. */
export function createFlareTool(open: () => boolean): AssistantTool {
  return {
    id: FLARE_TOOL_ID,
    description: { en: strings.en.toolDescription, fil: strings.fil.toolDescription },
    parameters: [],
    match: matchSignal,
    async run(_args, { language }) {
      const s = strings[language];
      const opened = open();
      return { title: s.toolTitle, text: opened ? s.toolOpened : s.toolNotOpened, data: { opened, fired: false } };
    },
  };
}
