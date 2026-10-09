// This module's own UI text. Pure data with no imports (see src/i18n/types.ts).
// The Guides' own text lives in content/<id>.json, not here.

const en = {
  injury: 'Injury and illness',
  hazard: 'Hazards',
  camp: 'Camp skills',
  emergency: 'Emergency Guide',
  back: 'All Guides',
  callForHelp: 'Call for help',
  steps: 'What to do',
  doNot: 'Do not',
  watchFor: 'Watch for',
  sources: 'Sources',
  sourceAccessed: '{org}, “{title}” (read {accessed})',
  notChecked: 'Not yet checked against Red Cross material',
  emptyTitle: 'No Guides yet',
  emptyBody: 'The Guide Library is empty in this build.',
};

const fil: Record<keyof typeof en, string> = {
  injury: 'Pinsala at sakit',
  hazard: 'Mga panganib',
  camp: 'Kaalaman sa camping',
  emergency: 'Pang-emergency na Guide',
  back: 'Lahat ng Guide',
  callForHelp: 'Humingi ng tulong',
  steps: 'Ang gagawin',
  doNot: 'Huwag',
  watchFor: 'Bantayan',
  sources: 'Mga pinagmulan',
  sourceAccessed: '{org}, “{title}” (binasa {accessed})',
  notChecked: 'Hindi pa naikukumpara sa materyales ng Red Cross',
  emptyTitle: 'Wala pang Guide',
  emptyBody: 'Walang laman ang Guide Library sa build na ito.',
};

export default { en, fil };
