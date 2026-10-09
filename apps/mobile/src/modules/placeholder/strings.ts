// This module's own UI text. Pure data with no imports (see src/i18n/types.ts).

const en = {
  title: 'The Assistant is on its way',
  body: 'Soon you can ask about the Trail, your gear and first aid, even with no signal.',
};

const fil: Record<keyof typeof en, string> = {
  title: 'Parating na ang Assistant',
  body: 'Malapit mo na itong matanong tungkol sa Trail, sa gamit mo at sa first aid, kahit walang signal.',
};

export default { en, fil };
