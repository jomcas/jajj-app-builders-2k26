// This module's own UI text. Pure data with no imports (see src/i18n/types.ts).

const en = {
  // A simulated member is labelled as such everywhere it appears.
  simulatedName: '{name} (simulated)',
  memberOffTrail: '{name} is off the Trail · {distance}',
  memberOffTrailNoDistance: '{name} is off the Trail',
  memberFlare: '{name} fired the Flare',
  memberOffTrailHint: 'More than 40 m from the Trail for over 30 seconds.',
  memberFlareHint: 'They are signalling for help. Their position is on the map.',
  showOnMap: 'Show on map',
  memberDot: '{name} on the map. Tap to center on them.',
  memberDotAlert: '{name} on the map, needs attention. Tap to center on them.',
  // The notification, mirrored to a paired watch.
  notifyOffTrailBody: '{distance} off the Trail. Open Tahak to see where.',
  notifyFlareBody: 'Open Tahak to see where they are.',
  channelName: 'Group Alerts',
  channelDescription: 'When a member of your Group Hike goes off the Trail or fires the Flare.',
  // The demo controls.
  addMember: 'Add simulated member',
  addMemberHint: 'Demo: a pretend group member walks this Trail with you.',
  memberIncident: '{name}: off Trail, then Flare',
  memberIncidentRunning: '{name}: incident running…',
  removeMember: 'Remove',
  removeMemberHint: 'Remove the simulated member',
};

const fil = {
  simulatedName: '{name} (kunwari)',
  memberOffTrail: 'Lihis sa Trail si {name} · {distance}',
  memberOffTrailNoDistance: 'Lihis sa Trail si {name}',
  memberFlare: 'Pinaputok ni {name} ang Flare',
  memberOffTrailHint: 'Lampas 40 m mula sa Trail nang higit 30 segundo.',
  memberFlareHint: 'Humihingi siya ng tulong. Nasa mapa ang kinaroroonan niya.',
  showOnMap: 'Ipakita sa mapa',
  memberDot: 'Si {name} sa mapa. I-tap para itutok sa kanya.',
  memberDotAlert: 'Si {name} sa mapa, kailangan ng pansin. I-tap para itutok sa kanya.',
  notifyOffTrailBody: '{distance} ang layo niya sa Trail. Buksan ang Tahak para makita kung saan.',
  notifyFlareBody: 'Buksan ang Tahak para makita kung nasaan siya.',
  channelName: 'Mga alerto ng grupo',
  channelDescription: 'Kapag lumihis sa Trail o nagpaputok ng Flare ang kasama mo sa Group Hike.',
  addMember: 'Magdagdag ng kunwaring kasama',
  addMemberHint: 'Demo: may kunwaring kasama sa grupo na lalakad sa Trail na ito kasama mo.',
  memberIncident: '{name}: lilihis, saka Flare',
  memberIncidentRunning: '{name}: tumatakbo ang insidente…',
  removeMember: 'Alisin',
  removeMemberHint: 'Alisin ang kunwaring kasama',
};

export default { en, fil };
