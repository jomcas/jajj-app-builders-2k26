// This module's own UI text. Pure data with no imports (see src/i18n/types.ts).

const en = {
  loading: 'Opening the map…',
  emptyTitle: 'No map on your phone yet',
  emptyBody: 'Download a Destination in Explore. Its map then works here on the trail, even without signal.',
  mapLabel: 'Trail map',
  recenter: 'Center the map on my position',
  noFix: 'No GPS position yet. Stay where you can see the sky, then try again.',
  locationAsk: 'Allow location to see where you are on the map. GPS works without signal.',
  allowLocation: 'Allow location',
  locationBlocked: 'Location is off for Tahak. Turn it on in the phone’s settings to see where you are.',
  openSettings: 'Open settings',
  // Required wherever the map appears (OpenStreetMap and Protomaps licences).
  attribution: '© OpenStreetMap contributors · © Protomaps',
};

const fil: Record<keyof typeof en, string> = {
  loading: 'Binubuksan ang mapa…',
  emptyTitle: 'Wala pang mapa sa phone mo',
  emptyBody: 'Mag-download ng Destination sa Tuklasin. Gagana rito ang mapa nito sa trail, kahit walang signal.',
  mapLabel: 'Mapa ng trail',
  recenter: 'Igitna ang mapa sa kinaroroonan ko',
  noFix: 'Wala pang GPS na posisyon. Pumunta kung saan kita ang langit, saka subukan ulit.',
  locationAsk: 'Payagan ang lokasyon para makita kung nasaan ka sa mapa. Gumagana ang GPS kahit walang signal.',
  allowLocation: 'Payagan ang lokasyon',
  locationBlocked: 'Naka-off ang lokasyon para sa Tahak. I-on ito sa settings ng phone para makita kung nasaan ka.',
  openSettings: 'Buksan ang settings',
  // The attribution is a licence notice and stays as written.
  attribution: '© OpenStreetMap contributors · © Protomaps',
};

export default { en, fil };
