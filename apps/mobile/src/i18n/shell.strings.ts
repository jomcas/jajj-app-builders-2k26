// UI text owned by the app shell: tabs, header, SOS control, settings, empty tabs.
// Pure data with no imports, so the catalog-parity test can load it with plain Node.
// Sentence case. Filipino is written as hikers say it, not translated word for word.

const en = {
  tabExplore: 'Explore',
  tabHike: 'Hike',
  tabAsk: 'Ask',
  tabGuides: 'Guides',
  sosLabel: 'SOS',
  sosHint: 'Opens the Flare, the emergency signal.',
  sosActiveLabel: 'SOS, Flare on',
  settingsButton: 'Settings',
  settingsTitle: 'Settings',
  themeHeading: 'Theme',
  themeDay: 'Day',
  themeNight: 'Night',
  languageHeading: 'Language',
  languageEnglish: 'English',
  languageFilipino: 'Filipino',
  close: 'Close',
  emptyTitle: 'Nothing here yet',
  emptyBody: 'This part of Tahak is still being built.',
};

const fil: Record<keyof typeof en, string> = {
  tabExplore: 'Tuklasin',
  tabHike: 'Akyat',
  tabAsk: 'Magtanong',
  tabGuides: 'Mga gabay',
  // "SOS" is the same signal in both languages.
  sosLabel: 'SOS',
  sosHint: 'Bubuksan ang Flare, ang pang-emergency na senyas.',
  sosActiveLabel: 'SOS, bukas ang Flare',
  settingsButton: 'Mga setting',
  settingsTitle: 'Mga setting',
  themeHeading: 'Tema',
  themeDay: 'Araw',
  themeNight: 'Gabi',
  languageHeading: 'Wika',
  languageEnglish: 'Ingles',
  languageFilipino: 'Filipino',
  close: 'Isara',
  emptyTitle: 'Wala pang laman dito',
  emptyBody: 'Ginagawa pa ang bahaging ito ng Tahak.',
};

export default { en, fil };
