// The fixed emergency-routing test sets (issue #15). Pure data. test/emergency.test.ts runs
// them, and the Assistant's bench (#14) can reuse them.
//
// expected: the Guide id the question must open, or null when it must not trigger the
// emergency card (the question then goes on to the relevance gate and the Assistant).

export type RoutingCase = { question: string; expected: string | null; note?: string };

/** Emergencies in English, Filipino and Taglish: every Emergency Guide at least once. */
export const EMERGENCY_QUESTIONS: readonly RoutingCase[] = [
  // Snakebite
  { question: 'Nakagat ng ahas yung kasama ko, ano gagawin?', expected: 'snakebite' },
  { question: 'My friend got bitten by a snake on the trail, what do we do?', expected: 'snakebite' },
  { question: 'na-bite ng snake si bro sa paa help', expected: 'snakebite' },
  { question: 'Tinuklaw ako ng ahas!!', expected: 'snakebite' },
  { question: 'snkebite what to do', expected: 'snakebite', note: 'typo' },
  { question: 'A snake bit my leg', expected: 'snakebite' },
  // Bleeding wounds
  { question: 'Dumudugo ang tuhod ko, ayaw tumigil', expected: 'bleeding-wounds' },
  { question: 'May sugat na malalim sa braso niya', expected: 'bleeding-wounds' },
  { question: "My friend cut his hand with a knife and it won't stop bleeding", expected: 'bleeding-wounds' },
  { question: 'nahiwa ng itak, nagbi-bleed nang malala', expected: 'bleeding-wounds' },
  { question: 'BLEEDING HEAVILY HELP', expected: 'bleeding-wounds' },
  // Sprains and fractures
  { question: 'Nabalian yata siya ng binti', expected: 'sprains-fractures' },
  { question: 'Na-sprain ang ankle ko pababa ng summit', expected: 'sprains-fractures' },
  { question: 'I think I broke my arm when I fell', expected: 'sprains-fractures' },
  { question: 'Nadulas ako, masakit ang tuhod ko at namamaga', expected: 'sprains-fractures' },
  // Hypothermia
  { question: 'Giniginaw at nanginginig si ate, basang-basa kami', expected: 'hypothermia' },
  { question: "We're soaked and he can't stop shivering", expected: 'hypothermia' },
  // Heat illness
  { question: 'Nahihilo sa init yung kasama ko', expected: 'heat-illness' },
  { question: 'Someone collapsed in the heat near the summit', expected: 'heat-illness' },
  { question: 'heatstroke ata to, hindi na pinagpapawisan', expected: 'heat-illness' },
  // Dehydration
  { question: 'Na-dehydrate ako, ano gagawin?', expected: 'dehydration' },
  { question: 'We ran out of water and I feel dizzy and thirsty', expected: 'dehydration' },
  { question: 'Naubusan kami ng tubig, uhaw na uhaw na kami', expected: 'dehydration' },
  // Lost on the trail
  { question: 'Naliligaw kami, saan kami pupunta?', expected: 'lost-on-the-trail' },
  { question: "I'm lost and it's getting dark", expected: 'lost-on-the-trail' },
  { question: 'Hindi ko na makita ang trail', expected: 'lost-on-the-trail' },
  { question: 'nahiwalay ako sa grupo, hindi ko alam kung nasaan ako', expected: 'lost-on-the-trail' },
  // Lightning
  { question: 'Kidlat! Nasa tuktok kami', expected: 'lightning' },
  { question: 'There is lightning and thunder close to us on the ridge, what should we do?', expected: 'lightning' },
  { question: 'Kumikidlat na, nasa summit pa kami', expected: 'lightning' },
  // Flash floods
  { question: 'Rumaragasang ilog, hindi kami makatawid', expected: 'flash-floods' },
  { question: 'Baha na sa trail, tumataas ang tubig', expected: 'flash-floods' },
  { question: 'The river is rising fast and we are stuck on the other side', expected: 'flash-floods' },
  // Altitude sickness
  { question: 'Hilo sa taas, sumasakit ulo ko', expected: 'altitude-sickness' },
  { question: 'Bad headache and nausea at the summit, is it altitude sickness?', expected: 'altitude-sickness' },
  // A held-out round written after the lexicon, then kept here: 10 of these 24 missed at first.
  { question: 'Natuklaw si papa ng ahas sa may sapa', expected: 'snakebite' },
  { question: 'Help, a cobra bit me', expected: 'snakebite' },
  { question: 'Ang lakas ng dugo sa ulo niya', expected: 'bleeding-wounds' },
  { question: "He hit his head on a rock and there's blood everywhere", expected: 'bleeding-wounds' },
  { question: 'nasugatan ako ng tinik, dumudugo', expected: 'bleeding-wounds' },
  { question: 'I think my ankle is broken', expected: 'sprains-fractures' },
  { question: 'napilayan ako', expected: 'sprains-fractures' },
  { question: 'Nahulog si kuya sa bangin', expected: 'sprains-fractures' },
  { question: "she fell and can't move her leg", expected: 'sprains-fractures' },
  { question: 'Basa kami lahat at nanginginig na sa lamig', expected: 'hypothermia' },
  { question: "My hands are numb and I'm shivering badly", expected: 'hypothermia' },
  { question: 'Ang init, parang hihimatayin ako', expected: 'heat-illness' },
  { question: "He's confused and his skin is hot and dry", expected: 'heat-illness' },
  { question: 'Kulang na kami sa tubig, nahihilo na', expected: 'dehydration' },
  { question: 'My urine is dark and I have a headache', expected: 'dehydration' },
  { question: 'Hindi namin alam kung saan na kami', expected: 'lost-on-the-trail' },
  { question: "We can't find the way back to camp", expected: 'lost-on-the-trail' },
  { question: 'May kulog at kidlat na, nasa ridge kami', expected: 'lightning' },
  { question: 'lightning struck near us', expected: 'lightning' },
  { question: 'Lumalaki ang ilog, paano kami tatawid', expected: 'flash-floods' },
  { question: 'The stream turned muddy and is rising', expected: 'flash-floods' },
  { question: 'Hirap huminga at masakit ulo sa summit ng Pulag', expected: 'altitude-sickness' },
  { question: 'Sumusuka siya at nahihilo sa taas ng bundok', expected: 'altitude-sickness' },
  // A second held-out round: 6 of these 21 missed, and 1 opened the wrong Guide, before fixes.
  { question: 'may tuklaw sa binti si ate, namamaga na', expected: 'snakebite' },
  { question: 'We saw a viper and it bit him on the hand', expected: 'snakebite' },
  { question: 'kinagat ng ulupong', expected: 'snakebite' },
  { question: 'Tumutulo ang dugo sa braso ko, malalim', expected: 'bleeding-wounds' },
  { question: 'cut my finger badly on a rock', expected: 'bleeding-wounds' },
  { question: "my nose won't stop bleeding", expected: 'bleeding-wounds' },
  { question: 'Parang nabali ang braso ko', expected: 'sprains-fractures' },
  { question: 'Na-twist ang tuhod ko, hindi ako makalakad', expected: 'sprains-fractures' },
  { question: "My knee popped and it's swelling", expected: 'sprains-fractures' },
  { question: 'Nanigas na sa lamig ang kamay ko', expected: 'hypothermia' },
  { question: 'Ang lamig, hindi na siya makapagsalita nang maayos', expected: 'hypothermia' },
  { question: 'Hindi na siya pinagpapawisan at mainit ang balat', expected: 'heat-illness' },
  { question: 'heat cramps and vomiting in the sun', expected: 'heat-illness' },
  { question: 'Wala na kaming tubig at pagod na pagod na', expected: 'dehydration' },
  { question: "I haven't peed in hours and feel weak", expected: 'dehydration' },
  { question: 'Saan na ba kami? Kanina pa kami paikot-ikot', expected: 'lost-on-the-trail' },
  { question: "We took a wrong turn and it's getting dark, no idea where we are", expected: 'lost-on-the-trail' },
  { question: 'Kumukulog na at nasa open field kami', expected: 'lightning' },
  { question: 'Flash flood sa creek!', expected: 'flash-floods' },
  { question: 'biglang tumaas ang tubig sa ilog', expected: 'flash-floods' },
  { question: 'Sobrang sakit ng ulo ko sa taas, hirap huminga', expected: 'altitude-sickness' },
];

/** Ordinary questions that must not trigger the emergency card. */
export const ORDINARY_QUESTIONS: readonly RoutingCase[] = [
  // Batulao water, fees, transport, campsites
  { question: 'May tubig ba sa Batulao? Saan ang water source?', expected: null },
  { question: 'How much is the registration fee at Mt. Batulao?', expected: null },
  { question: 'Magkano ang environmental fee at guide fee sa Batulao?', expected: null },
  { question: 'How do I get to the Batulao jump-off from Manila by bus?', expected: null },
  { question: 'Where can we camp on the New Trail?', expected: null },
  { question: 'Is there water at Camp 1?', expected: null },
  // Gear and food
  { question: 'What shoes should I wear for Batulao?', expected: null },
  { question: 'Anong magandang baon para sa day hike?', expected: null },
  { question: 'What jacket should I bring for the cold at the summit?', expected: null },
  { question: 'Kailangan ba ng trekking pole?', expected: null },
  // The ordinary Guides
  { question: 'Paano gamutin ang paltos sa paa?', expected: null },
  { question: 'How do I get a leech off without pulling it?', expected: null },
  { question: 'Dumudugo yung kagat ng limatik, normal ba?', expected: null, note: 'a leech bite bleeding is in the Leech Guide' },
  { question: 'I got stung by a bee, what do I do?', expected: null, note: 'no anaphylaxis wording' },
  { question: 'Kinagat ako ng langgam, makati', expected: null },
  { question: 'How do I pitch a tent in the wind?', expected: null },
  { question: 'How do I purify water?', expected: null },
  { question: 'Puwede bang inumin ang tubig sa ilog?', expected: null },
  // Trail facts that use emergency words
  { question: 'What snake species live on Batulao?', expected: null },
  { question: 'Are there venomous snakes on Batulao?', expected: null },
  { question: 'Malamig ba ngayon sa summit?', expected: null },
  { question: 'Is it hot on the trail at noon?', expected: null },
  { question: 'Madalas bang kumidlat sa Batulao tuwing hapon?', expected: null },
  { question: 'Is there a river crossing on the Old Trail?', expected: null },
  { question: 'What is the altitude of Mt. Batulao?', expected: null },
  { question: 'Madulas ba ang trail kapag umuulan?', expected: null },
  { question: 'Nabali ang tent pole namin, paano ayusin?', expected: null },
  { question: 'I lost my phone signal, is that normal here?', expected: null },
  // Off-topic
  { question: 'Sino ang presidente?', expected: null },
  { question: 'Write me a poem about love', expected: null },
  { question: 'What is the capital of France?', expected: null },
  // The same held-out round: none of these fired.
  { question: 'Paano makarating sa Batulao mula Cubao?', expected: null },
  { question: 'Saan pwede bumili ng tubig sa jump-off?', expected: null },
  { question: 'How many hours to Peak 8?', expected: null },
  { question: "What's the elevation gain?", expected: null },
  { question: 'Are there toilets at the campsite?', expected: null },
  { question: 'Paano maglagay ng tent kapag mahangin?', expected: null },
  { question: 'How do I boil water at camp?', expected: null },
  { question: 'Gaano kainit sa summit ng tanghali?', expected: null },
  { question: 'Paano iwasan ang limatik?', expected: null },
  { question: 'How do I treat a small blister?', expected: null },
  { question: 'Malakas ba ang ulan sa Batulao tuwing Agosto?', expected: null },
  { question: 'Saan pwede umihi sa trail?', expected: null },
  { question: 'Are the rocks slippery at the summit?', expected: null },
  { question: 'Is there a cliff on the Old Trail?', expected: null },
  { question: 'Grabe ba ang akyat sa Batulao?', expected: null },
  // The second held-out round: only "How do I report a lost item?" fired, before fixes.
  { question: 'Ano ang dapat kainin bago mag-hike?', expected: null },
  { question: 'Is it okay to hike while on my period?', expected: null },
  { question: "Where's the nearest hospital to Batulao?", expected: null },
  { question: 'Can I cook at the summit?', expected: null },
  { question: 'How do I report a lost item?', expected: null },
  { question: 'How many liters of water should I bring?', expected: null },
  { question: 'Ano ang gamot sa sunburn?', expected: null },
  { question: 'How to avoid getting cold at camp', expected: null },
  { question: 'Is the trail muddy now?', expected: null },
  { question: 'Wala bang tubig sa summit?', expected: null },
  { question: 'Pagod na pagod na ako, malayo pa ba?', expected: null },
];

/** Negation, the distant past, and questions about the app. */
export const EDGE_CASES: readonly RoutingCase[] = [
  { question: 'I was bitten by a snake last year, is the trail safe?', expected: null, note: 'distant past' },
  { question: 'Nakagat ako ng ahas noong isang taon, ligtas ba ngayon ang trail?', expected: null, note: 'distant past; "ngayon" asks about the trail' },
  { question: 'Natuklaw ako ng ahas kahapon, masakit pa rin', expected: 'snakebite', note: 'yesterday still counts' },
  { question: 'Hindi naman dumudugo pero masakit ang bukung-bukong ko', expected: 'sprains-fractures', note: 'negated bleeding' },
  { question: "I'm not lost, just asking how long to the summit", expected: null, note: 'negation' },
  { question: 'Paano hindi maligaw sa Batulao?', expected: null, note: 'negation: how not to get lost' },
  { question: 'How do I use the Flare?', expected: null, note: 'app help' },
  { question: 'Paano gamitin ang SOS?', expected: null, note: 'app help' },
  { question: 'Does the app work offline in an emergency?', expected: null, note: 'app help' },
  { question: 'Where is the snakebite Guide?', expected: 'snakebite', note: 'app help, but opening the Guide is what was asked' },
  { question: 'What should I do if someone is bitten by a snake?', expected: 'snakebite', note: 'hypothetical first aid counts' },
  { question: 'Bleeding from a snakebite on the ankle', expected: 'snakebite', note: 'tie-break' },
  { question: 'Stung by a bee and now her face is swelling and she can’t breathe', expected: 'insect-stings', note: 'anaphylaxis wording' },
  { question: 'kidlat', expected: 'lightning', note: 'one-word question' },
  { question: 'naligaw kami walang signal', expected: 'lost-on-the-trail', note: '"walang signal" is not a negation of "naligaw"' },
  { question: 'What should I do if I see a snake on the trail?', expected: 'snakebite', note: 'accepted false positive: a snake encounter opens the Snakebite Guide' },
  { question: 'Is the current strong at the river crossing?', expected: 'flash-floods', note: 'accepted: the Guide covers river crossings' },
  { question: 'is it bad if a snake bit my dog', expected: 'snakebite', note: 'accepted: no Guide for animals; the human Guide is the closest' },
];
