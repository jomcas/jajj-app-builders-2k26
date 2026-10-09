// The Assistant's UI text (the Ask tab). Pure data with no imports (see src/i18n/types.ts).
// {name} placeholders are filled in with fill() from ./format.

const en = {
  introTitle: 'Ask about the trail',
  introBody:
    'Ask about hiking and camping, your Destination, gear, trail food, getting to the jump-off, or using Tahak. It works offline, and every answer shows where it came from.',
  exampleWater: 'Is there water on the trail?',
  exampleFood: 'What should I eat before a climb?',
  exampleDownload: 'How do I download a Destination Pack?',
  inputPlaceholder: 'Ask the Assistant…',
  send: 'Send',
  camera: 'Ask about a photo',
  cameraNote: 'Photo questions are coming soon, with Vision.',
  you: 'Your question',
  assistant: "The Assistant's answer",
  // The fixed off-topic reply (ADR 0005). Shown without running the model.
  offTopic:
    'I can only help with hiking and camping, outdoor first aid, gear, weather on the trail, your Destination, food for the trail, getting to and from the jump-off, local culture, and using Tahak. Try asking about one of those.',
  answering: 'Answering…',
  loadingModel: 'Getting the Assistant ready… {percent}%',
  indexing: 'Preparing passages for search… {done} of {total}',
  answerError: 'The Assistant could not answer: {error}',
  sources: 'Sources',
  appHelp: 'App help',
  guideChip: 'Guide: {title}',
  sourceLine: 'Source: {source}',
  helpNote: 'General advice written by the Tahak team, not facts about a Destination.',
  close: 'Close',
  packsIgnored: 'Test mode: Destination Packs are ignored, so only the Guides and app help are used.',
  topicGettingThere: 'Getting there',
  topicRegistration: 'Registration and fees',
  topicWater: 'Water',
  topicCampsites: 'Campsites',
  topicHazards: 'Hazards',
};

const fil: Record<keyof typeof en, string> = {
  introTitle: 'Magtanong tungkol sa trail',
  introBody:
    'Magtanong tungkol sa hiking at camping, sa Destination mo, gamit, pagkain sa trail, pagpunta sa jump-off, o paggamit ng Tahak. Gumagana ito offline, at bawat sagot ay may nakalagay kung saan galing.',
  exampleWater: 'May tubig ba sa trail?',
  exampleFood: 'Ano ang kakainin bago umakyat?',
  exampleDownload: 'Paano mag-download ng Destination Pack?',
  inputPlaceholder: 'Magtanong sa Assistant…',
  send: 'Ipadala',
  camera: 'Magtanong tungkol sa litrato',
  cameraNote: 'Malapit na ang pagtatanong gamit ang litrato, kasama ng Vision.',
  you: 'Tanong mo',
  assistant: 'Sagot ng Assistant',
  offTopic:
    'Pasensya na, ang kaya ko lang sagutin ay tungkol sa hiking at camping, first aid sa labas, gamit, panahon sa trail, ang Destination mo, pagkain sa trail, pagpunta at pag-uwi mula sa jump-off, lokal na kultura, at paggamit ng Tahak. Subukan mong magtanong tungkol sa mga iyan.',
  answering: 'Sumasagot…',
  loadingModel: 'Inihahanda ang Assistant… {percent}%',
  indexing: 'Inihahanda ang mga passage para sa paghahanap… {done} sa {total}',
  answerError: 'Hindi nakasagot ang Assistant: {error}',
  sources: 'Pinagkunan',
  appHelp: 'Tulong sa app',
  guideChip: 'Gabay: {title}',
  sourceLine: 'Pinagkunan: {source}',
  helpNote: 'Pangkalahatang payo mula sa Tahak team, hindi impormasyon tungkol sa isang Destination.',
  close: 'Isara',
  packsIgnored: 'Test mode: hindi ginagamit ang mga Destination Pack, kaya Guides at tulong sa app lang ang gamit.',
  topicGettingThere: 'Paano pumunta',
  topicRegistration: 'Registration at bayad',
  topicWater: 'Tubig',
  topicCampsites: 'Mga campsite',
  topicHazards: 'Mga panganib',
};

export default { en, fil };
