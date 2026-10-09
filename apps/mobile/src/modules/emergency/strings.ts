// This module's own UI text. Pure data with no imports (see src/i18n/types.ts).
// The Guide's title and summary on the card come from the Guide's content file, not here.

const en = {
  emergencyGuide: 'Emergency Guide',
  routedGuide: 'Guide for this situation',
  openGuide: 'Open Guide',
  openGuideHint: 'Opens the full Guide in the Guides tab',
  call911: 'Call 911',
  call911Hint: 'Opens the phone dialer with 911',
  flareHint: 'No signal? Tap SOS at the top of the screen, then press and hold to fire the Flare.',
  fromGuide: 'From the Guide Library',
  // Dev-only preview (tahak://emergency/preview/<id>, tahak://emergency/ask?q=…).
  previewTitle: 'Emergency card preview (dev only)',
  previewQuestion: 'Question: {question}',
  previewRouted: 'Routed to {id} · confidence {confidence}',
  previewMatched: 'Matched: {matched}',
  previewNotEmergency: 'Not an emergency: this question goes on to the Assistant.',
  previewUnknown: 'No Guide has the id "{id}".',
  previewLanguage: 'Switch to Filipino',
  previewThemeNight: 'Night theme',
  previewThemeDay: 'Day theme',
  previewClose: 'Close preview',
};

const fil: Record<keyof typeof en, string> = {
  emergencyGuide: 'Pang-emergency na Guide',
  routedGuide: 'Guide para sa sitwasyong ito',
  openGuide: 'Buksan ang Guide',
  openGuideHint: 'Binubuksan ang buong Guide sa tab ng mga Guide',
  call911: 'Tumawag sa 911',
  call911Hint: 'Binubuksan ang dialer ng phone na may 911',
  flareHint: 'Walang signal? Pindutin ang SOS sa itaas ng screen, saka pindutin nang matagal para paganahin ang Flare.',
  fromGuide: 'Mula sa Guide Library',
  previewTitle: 'Preview ng emergency card (dev lang)',
  previewQuestion: 'Tanong: {question}',
  previewRouted: 'Napunta sa {id} · kumpiyansa {confidence}',
  previewMatched: 'Tumugma: {matched}',
  previewNotEmergency: 'Hindi emergency: tutuloy ang tanong na ito sa Assistant.',
  previewUnknown: 'Walang Guide na may id na "{id}".',
  previewLanguage: 'Lumipat sa English',
  previewThemeNight: 'Panggabing tema',
  previewThemeDay: 'Pang-araw na tema',
  previewClose: 'Isara ang preview',
};

export default { en, fil };
