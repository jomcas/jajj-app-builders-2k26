// This module's own UI text. Pure data with no imports (see src/i18n/types.ts).

const en = {
  title: 'Welcome to Tahak',
  intro: 'Set up once, while you have signal. After this, Tahak works on the trail with no signal.',
  languageHeading: 'Language',
  languageEnglish: 'English',
  languageFilipino: 'Filipino',
  permissionsHeading: 'Permissions',
  locationTitle: 'Location',
  locationReason: 'To show where you are on the trail map and warn you when you leave the Trail.',
  notificationsTitle: 'Notifications',
  notificationsReason: 'To alert you when you leave the Trail, even with the screen off.',
  allow: 'Allow',
  allowed: 'Allowed',
  denied: 'Not allowed. You can change this in the phone settings.',
  modelHeading: 'The Assistant',
  modelReason: 'The Assistant answers your questions on the trail, with no signal. It needs a one-time download.',
  browseGuides: 'Browse Guides while you wait',
  continueWhileDownloading: 'Continue (the download keeps going)',
  continue: 'Continue',
  done: 'Done',
};

const fil: Record<keyof typeof en, string> = {
  title: 'Maligayang pagdating sa Tahak',
  intro: 'Isang beses lang ito, habang may signal ka. Pagkatapos nito, gagana ang Tahak sa trail kahit walang signal.',
  languageHeading: 'Wika',
  languageEnglish: 'Ingles',
  languageFilipino: 'Filipino',
  permissionsHeading: 'Mga pahintulot',
  locationTitle: 'Lokasyon',
  locationReason: 'Para makita kung nasaan ka sa mapa ng trail at para mabalaan ka kapag lumihis ka sa Trail.',
  notificationsTitle: 'Mga notification',
  notificationsReason: 'Para maabisuhan ka kapag lumihis ka sa Trail, kahit nakapatay ang screen.',
  allow: 'Payagan',
  allowed: 'Pinayagan',
  denied: 'Hindi pinayagan. Mababago mo ito sa settings ng phone.',
  modelHeading: 'Ang Assistant',
  modelReason: 'Sinasagot ng Assistant ang mga tanong mo sa trail, kahit walang signal. Kailangan muna itong i-download nang isang beses.',
  browseGuides: 'Basahin muna ang mga gabay habang naghihintay',
  continueWhileDownloading: 'Magpatuloy (tuloy pa rin ang download)',
  continue: 'Magpatuloy',
  done: 'Tapos na',
};

export default { en, fil };
