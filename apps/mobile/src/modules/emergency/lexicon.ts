// The emergency-routing lexicon: which words point at which Guide, and how strongly. Pure data.
//
// How a question is scored (router.ts):
// - Each Guide has concepts. A concept scores its weight once, however many of its patterns
//   match. A Guide's score is the sum of its matched concepts.
// - Weight 1 is decisive on its own ("nakagat ng ahas", "dumudugo", "heatstroke").
// - Weight 0.5 is a topic word. It fires only with a second concept or, if it is an anchor, with
//   a distress cue ("help", "ano gagawin", "masakit") or as a very short question ("kidlat!").
//   Topic words that are not anchors ("malamig", "init", "walang tubig") never fire with a cue
//   alone, because ordinary questions ("Malamig ba ngayon sa summit?") use them all the time.
// - Every keyword in the Guide's own content file is added as a further 0.5 concept that is not
//   an anchor, so Guide authors widen routing without touching code.
// - Dampeners subtract when the question is plainly about something else (a leech, a blister,
//   a forecast, a broken trekking pole).
// - A Guide fires at a score of 1 or more. Ties go to PRIORITY.
//
// Patterns are written in plain words, as a hiker would type them. A word written as a root
// ("kagat", "dugo", "ligaw") also matches its affixed forms (kinagat, nakagat, makagat,
// dumudugo, duguan, naliligaw); an affixed word ("nilalamig") matches only that form. Small
// words such as "ng", "sa", "the" and "a" are ignored in patterns, and up to two words may sit
// between the words of a pattern ("nakagat ako ng ahas" matches "nakagat ahas").

export type Concept = {
  id: string;
  weight: number;
  /** A distress cue (or a one-to-three-word question) adds 0.5 to a Guide with a matched anchor. */
  anchor?: boolean;
  patterns: readonly string[];
};

export type Dampener = { weight: number; patterns: readonly string[] };

export type GuideRules = {
  guideId: string;
  concepts: readonly Concept[];
  dampeners?: readonly Dampener[];
  /** Whether distress cues and short questions can lift an anchor to a decision. */
  cueBoost: boolean;
  /** Whether the Guide's own content keywords take part (as 0.5 concepts, not anchors). */
  useGuideKeywords: boolean;
};

/** Ignored inside patterns. They still count as words in the question (and toward gaps). */
export const PATTERN_STOPWORDS: ReadonlySet<string> = new Set([
  'a', 'an', 'the', 'by', 'of', 'to', 'at', 'in', 'on', 'is', 'are', 'was', 'were', 'be', 'from', 'with',
  'ng', 'nang', 'sa', 'ang', 'mga', 'si', 'ni', 'na', 'ay', 'yung', 'ko', 'ako', 'ka', 'mo',
]);

// Shared wording.
const FORECAST: Dampener = {
  weight: 0.5,
  patterns: [
    'forecast', 'season', 'usually', 'often', 'common', 'chance', 'will there be', 'expected', 'month',
    'weekend', 'tomorrow', 'best time', 'what to bring', 'what to wear', 'should i bring', 'jacket',
    'madalas', 'tuwing', 'kadalasan', 'buwan', 'bukas', 'kailan', 'tag ulan', 'tagulan', 'tag init', 'taginit',
    'magdala', 'dalhin', 'isuot', 'damit',
  ],
};

export const RULES: readonly GuideRules[] = [
  {
    guideId: 'snakebite',
    cueBoost: true,
    useGuideKeywords: true,
    concepts: [
      {
        id: 'snakebite',
        weight: 1,
        patterns: [
          'snakebite', 'snake bite', 'snakebit', 'bitten snake', 'bit by snake', 'snake bit', 'kagat ahas',
          'ahas kumagat', 'tuklaw', 'kagat snake', 'bite snake', 'snake bite', 'kagat ulupong', 'kagat cobra',
        ],
      },
      {
        id: 'snake',
        weight: 0.5,
        anchor: true,
        patterns: [
          'snake', 'ahas', 'cobra', 'viper', 'ulupong', 'sawa', 'python', 'dahong palay', 'venom', 'venomous',
          'kamandag', 'makamandag', 'fang', 'fangs',
        ],
      },
      { id: 'bite', weight: 0.5, patterns: ['bite', 'bit', 'bitten', 'kagat', 'kinagat', 'nakagat'] },
    ],
  },
  {
    guideId: 'bleeding-wounds',
    cueBoost: true,
    useGuideKeywords: true,
    concepts: [
      {
        id: 'bleeding',
        weight: 1,
        patterns: [
          'bleeding', 'bleed', 'bled', 'dumudugo', 'dumugo', 'nagdurugo', 'nagdudugo', 'duguan', 'nagbleed',
          'nagbibleed', 'bumubulwak', 'pagdurugo', 'wont stop bleeding', 'ayaw tumigil dugo', 'hindi tumitigil dugo',
          'deep cut', 'deep wound', 'malalim sugat', 'sugat malalim', 'malalim hiwa', 'gash', 'laceration',
          'tourniquet', 'spurting blood', 'maraming dugo', 'lots of blood', 'clean wound', 'clean cut', 'linis sugat',
          'treat wound', 'treat cut', 'gamutin sugat', 'tumutulo dugo', 'dripping blood', 'blood dripping',
        ],
      },
      {
        id: 'wound',
        weight: 0.5,
        anchor: true,
        patterns: ['blood', 'dugo', 'cut', 'wound', 'sugat', 'nasugatan', 'hiwa', 'nahiwa', 'stab', 'saksak', 'itak', 'bolo', 'knife'],
      },
      { id: 'deep', weight: 0.5, patterns: ['deep', 'malalim', 'gaping', 'nakanganga', 'dripping', 'tumutulo'] },
    ],
    dampeners: [
      { weight: 0.75, patterns: ['leech', 'limatik', 'linta', 'bloodsucker'] },
      { weight: 0.5, patterns: ['blister', 'paltos', 'lintos', 'nosebleed', 'balinguyngoy', 'period', 'regla', 'menstruation'] },
      { weight: 0.5, patterns: ['cut through', 'shortcut', 'short cut', 'haircut'] },
    ],
  },
  {
    guideId: 'sprains-fractures',
    cueBoost: true,
    useGuideKeywords: true,
    concepts: [
      {
        id: 'injury',
        weight: 1,
        patterns: [
          'sprain', 'sprained', 'nasprain', 'fracture', 'fractured', 'nafracture', 'broken bone', 'broken leg',
          'broken arm', 'broken ankle', 'broken wrist', 'broke leg', 'broke arm', 'broke ankle', 'twisted ankle',
          'rolled ankle', 'dislocated', 'dislocation', 'natwist', 'nabali', 'nabalian', 'bali buto', 'baling buto',
          'pilay', 'napilay', 'natapilok', 'tapilok', 'nalinsad', 'linsad', 'cant walk', 'hindi makalakad',
          'hindi makatayo', 'cant stand',
        ],
      },
      {
        id: 'fall',
        weight: 0.5,
        anchor: true,
        patterns: ['fell', 'fallen', 'slipped', 'tripped', 'nadulas', 'nadapa', 'natumba', 'nahulog', 'bumagsak', 'nalaglag', 'gumulong'],
      },
      {
        id: 'joint',
        weight: 0.5,
        anchor: true,
        patterns: ['ankle', 'knee', 'wrist', 'tuhod', 'bukungbukong', 'bukong', 'balakang', 'collarbone', 'shin', 'hip'],
      },
      { id: 'broken', weight: 0.5, patterns: ['broken', 'broke', 'cracked', 'deformed', 'baluktot', 'wala sa lugar', 'cant move', 'hindi maigalaw', 'hindi magalaw'] },
      { id: 'height', weight: 0.5, patterns: ['cliff', 'ravine', 'bangin', 'drop off', 'rocks', 'bato', 'mataas na lugar'] },
      { id: 'swelling', weight: 0.5, patterns: ['swollen', 'swelling', 'namamaga', 'namaga', 'twisted', 'twist', 'natwist', 'purple', 'pasa', 'bruise', 'bruised'] },
      { id: 'limb', weight: 0.5, patterns: ['bali', 'leg', 'arm', 'paa', 'binti', 'braso', 'kamay', 'likod', 'back'] },
    ],
    dampeners: [
      // "Nabali ang tent pole": something broke, not someone.
      {
        weight: 1,
        patterns: [
          'bali pole', 'bali tungkod', 'bali stick', 'bali zipper', 'bali strap', 'bali sanga', 'bali swelas',
          'broken pole', 'broke pole', 'pole broke', 'pole broken', 'broken zipper', 'broken strap', 'broken buckle',
          'broken sole', 'broke sole', 'broken tent', 'broken shoe', 'broken headlamp', 'broken phone',
        ],
      },
      { weight: 1, patterns: ['blister', 'blisters', 'paltos', 'lintos', 'bee', 'bubuyog', 'leech', 'limatik', 'insect', 'insekto'] },
      { weight: 0.5, patterns: ['support', 'brace', 'which', 'recommend', 'best', 'magandang'] },
    ],
  },
  {
    guideId: 'hypothermia',
    cueBoost: true,
    useGuideKeywords: true,
    concepts: [
      {
        id: 'hypothermia',
        weight: 1,
        patterns: [
          'hypothermia', 'hypothermic', 'cant stop shivering', 'hindi tumitigil panginginig', 'nanginginig lamig',
          'nanigas lamig', 'giniginaw nanginginig', 'numb cold', 'blue lips', 'nangingitim labi', 'nangangasul labi',
          'nilalamig sobra', 'sobrang nilalamig', 'giniginaw sobra', 'sobrang giniginaw', 'im freezing', 'were freezing',
        ],
      },
      {
        id: 'shivering',
        weight: 0.5,
        anchor: true,
        patterns: ['shivering', 'shiver', 'nanginginig', 'giniginaw', 'nilalamig', 'chilled', 'freezing', 'wet cold', 'basa lamig', 'basang basa'],
      },
      { id: 'cold', weight: 0.5, patterns: ['cold', 'lamig', 'ginaw', 'malamig', 'wet', 'basa', 'ulan', 'rain', 'hangin', 'wind', 'soaked'] },
      {
        id: 'numb',
        weight: 0.5,
        patterns: [
          'numb', 'manhid', 'namamanhid', 'stiff', 'clumsy', 'slurred', 'confused', 'nalilito', 'antok', 'drowsy',
          'hindi makapagsalita', 'cant talk', 'cant speak', 'utal', 'nauutal',
        ],
      },
    ],
    dampeners: [FORECAST, { weight: 0.5, patterns: ['tent', 'sleeping bag', 'gear', 'pack', 'baon', 'water', 'tubig', 'inumin', 'drink'] }],
  },
  {
    guideId: 'heat-illness',
    cueBoost: true,
    useGuideKeywords: true,
    concepts: [
      {
        id: 'heatstroke',
        weight: 1,
        patterns: [
          'heatstroke', 'heat stroke', 'heat exhaustion', 'sunstroke', 'sun stroke', 'naheatstroke', 'hilo init',
          'nahilo init', 'nahihilo init', 'collapsed heat', 'hinimatay init', 'nawalan malay init', 'stopped sweating',
          'hindi pinagpapawisan', 'overheating', 'overheated', 'init na init', 'skin hot dry', 'hot dry skin', 'hot red skin',
          'mainit tuyo balat', 'balat mainit tuyo', 'hihimatayin init', 'heat cramps',
        ],
      },
      {
        id: 'faint',
        weight: 0.5,
        anchor: true,
        patterns: [
          'dizzy', 'lightheaded', 'faint', 'fainted', 'fainting', 'collapsed', 'passed out', 'unconscious', 'hilo',
          'nahihilo', 'nahilo', 'hinimatay', 'nahimatay', 'hihimatayin', 'nawalan malay', 'walang malay', 'nanghihina', 'weak',
          'confused', 'nalilito', 'disoriented', 'seizure', 'nangingisay',
        ],
      },
      { id: 'heat', weight: 0.5, patterns: ['heat', 'hot', 'sun', 'init', 'mainit', 'naiinitan', 'araw', 'tirik'] },
    ],
    dampeners: [FORECAST],
  },
  {
    guideId: 'dehydration',
    cueBoost: true,
    useGuideKeywords: true,
    concepts: [
      { id: 'dehydrated', weight: 1, patterns: ['dehydration', 'dehydrated', 'dehydrate', 'nadehydrate', 'uhaw na uhaw', 'severely thirsty'] },
      {
        id: 'thirst',
        weight: 0.5,
        anchor: true,
        patterns: [
          'thirsty', 'uhaw', 'nauuhaw', 'out of water', 'ran out water', 'naubusan tubig', 'naubos tubig', 'dry mouth',
          'tuyo bibig', 'dark urine', 'maitim ihi', 'not peeing', 'hindi umiihi', 'cramps', 'cramp', 'pulikat',
          'pinulikat', 'ors', 'wala tubig', 'no more water', 'no water left',
        ],
      },
      {
        id: 'symptom',
        weight: 0.5,
        patterns: [
          'headache', 'masakit ulo', 'sumasakit ulo', 'dizzy', 'hilo', 'nahihilo', 'vomiting', 'nagsusuka', 'diarrhea',
          'nagtatae', 'weak', 'nanghihina', 'exhausted', 'pagod na pagod', 'hapong hapo',
        ],
      },
      { id: 'water-loss', weight: 0.5, patterns: ['urine', 'pee', 'peed', 'peeing', 'ihi', 'umiihi', 'kulang tubig', 'konti tubig', 'little water', 'low on water', 'sweating a lot', 'pawis na pawis'] },
    ],
    dampeners: [
      { weight: 0.5, patterns: ['purify', 'purifying', 'boil', 'filter', 'linisin', 'pakuluan', 'salain', 'water source', 'refill', 'bukal', 'spring'] },
    ],
  },
  {
    guideId: 'lost-on-the-trail',
    cueBoost: true,
    useGuideKeywords: true,
    concepts: [
      {
        id: 'lost',
        weight: 1,
        patterns: [
          'im lost', 'we are lost', 'were lost', 'we lost', 'got lost', 'are lost', 'lost trail', 'lost way',
          'lost our way', 'lost on trail', 'cant find trail', 'cant find way', 'hindi makita trail', 'hindi mahanap trail',
          'naligaw', 'naliligaw', 'nawala trail', 'wala na trail', 'nalihis', 'nalost', 'naiwan grupo', 'nahiwalay grupo',
          'separated from group', 'missing hiker', 'saan na kami', 'nawawala grupo', 'nawala grupo', 'nawawala kasama',
          'hindi mahanap kasama', 'missing friend', 'missing companion', 'cant find friend', 'cant find companion',
          'no idea where we are', 'dont know where we are', 'hindi alam nasaan kami', 'hindi namin alam nasaan',
        ],
      },
      {
        id: 'lost-topic',
        weight: 0.5,
        anchor: true,
        patterns: [
          'lost', 'ligaw', 'nawawala', 'missing', 'nahiwalay', 'naiwan', 'off trail', 'wrong way', 'wrong trail', 'wrong turn',
          'maling daan', 'paikot ikot', 'paikotikot', 'going in circles',
        ],
      },
    ],
    dampeners: [
      // "I lost my phone", "nawawala ang phone ko": an object, not a hiker.
      {
        weight: 1,
        patterns: [
          'lost phone', 'lost cellphone', 'lost wallet', 'lost bottle', 'lost headlamp', 'lost keys', 'lost signal',
          'lost id', 'lost bag', 'lost jacket', 'nawawala phone', 'nawawala cellphone', 'nawawala wallet', 'nawawala susi',
          'nawawala bag', 'nawala phone', 'nawala cellphone', 'nawala wallet', 'nawala signal', 'naiwan phone',
          'naiwan cellphone', 'naiwan wallet', 'naiwan bag', 'lost item', 'lost and found', 'lost things', 'nawawala gamit',
          'nawala gamit', 'nawawalang gamit',
        ],
      },
    ],
  },
  {
    guideId: 'lightning',
    cueBoost: true,
    useGuideKeywords: true,
    concepts: [
      {
        id: 'struck',
        weight: 1,
        patterns: [
          'struck lightning', 'lightning strike', 'hit lightning', 'tinamaan kidlat', 'nakidlatan', 'kumikidlat',
          'kumukulog', 'lightning near', 'lightning close', 'thunder close', 'malapit kidlat', 'malapit kulog',
        ],
      },
      { id: 'lightning', weight: 0.5, anchor: true, patterns: ['lightning', 'kidlat', 'thunder', 'kulog', 'thunderstorm', 'electric storm'] },
      { id: 'exposed', weight: 0.5, patterns: ['summit', 'peak', 'ridge', 'tuktok', 'tagaytay', 'open field', 'open area'] },
      { id: 'storm', weight: 0.5, patterns: ['storm', 'bagyo', 'thunderstorm', 'malakas ulan', 'heavy rain'] },
    ],
    dampeners: [FORECAST],
  },
  {
    guideId: 'flash-floods',
    cueBoost: true,
    useGuideKeywords: true,
    concepts: [
      {
        id: 'flood',
        weight: 1,
        patterns: [
          'flash flood', 'swept away', 'inanod', 'tinangay agos', 'rumaragasa', 'ragasa', 'bumabaha', 'bumaha', 'binaha',
          'nabaha', 'trapped water', 'trapped river', 'natrap ilog', 'natrap tubig', 'stranded river', 'water rising fast',
          'river rising fast', 'cant cross river', 'hindi makatawid',
        ],
      },
      {
        id: 'flood-topic',
        weight: 0.5,
        anchor: true,
        patterns: ['flood', 'flooding', 'baha', 'trapped', 'stranded', 'stuck', 'natrap', 'naipit'],
      },
      {
        id: 'rising',
        weight: 0.5,
        anchor: true,
        patterns: [
          'rising water', 'rising river', 'river rising', 'water rising', 'tumataas tubig', 'tumataas ilog', 'strong current',
          'malakas agos', 'agos', 'current', 'lumalim ilog', 'lumalakas agos',
        ],
      },
      { id: 'rising-signs', weight: 0.5, patterns: ['rising', 'lumalaki', 'lumaki', 'tumataas', 'tumaas', 'umapaw', 'umaapaw', 'muddy', 'maputik', 'malabo', 'lumalakas', 'brown water', 'debris'] },
      { id: 'water', weight: 0.5, patterns: ['river', 'ilog', 'stream', 'sapa', 'creek', 'crossing', 'tawid', 'tumawid', 'heavy rain', 'malakas ulan'] },
    ],
    dampeners: [FORECAST, { weight: 0.5, patterns: ['drink', 'inumin', 'purify', 'linisin', 'pakuluan', 'safe to drink', 'swim', 'swimming', 'maligo', 'ligo'] }],
  },
  {
    guideId: 'altitude-sickness',
    cueBoost: true,
    useGuideKeywords: true,
    concepts: [
      {
        id: 'altitude-sickness',
        weight: 1,
        patterns: [
          'altitude sickness', 'mountain sickness', 'ams', 'hape', 'hace', 'hilo taas', 'nahihilo taas', 'sakit taas',
          'sumasakit ulo taas', 'masakit ulo taas', 'masakit ulo tuktok', 'hirap huminga taas', 'kinakapos hininga taas',
          'headache summit', 'short of breath up high', 'breathless summit', 'hilo summit', 'nahihilo summit',
        ],
      },
      // Surface forms only: the root "taas" would also match "tumataas" (rising) and "pataas" (uphill).
      { id: 'altitude', weight: 0.5, anchor: true, patterns: ['altitude', 'high altitude', 'thin air', 'up high', 'mataas', 'sobrang taas'] },
      { id: 'head', weight: 0.5, patterns: ['headache', 'masakit ulo', 'sumasakit ulo', 'dizzy', 'hilo', 'nausea', 'nasusuka', 'sumusuka', 'vomiting'] },
      { id: 'breath', weight: 0.5, patterns: ['breathless', 'short of breath', 'hirap huminga', 'kinakapos hininga', 'cant catch breath', 'hingal', 'hinihingal'] },
    ],
    dampeners: [{ weight: 0.5, patterns: ['elevation', 'how high', 'gaano kataas', 'meters', 'metro', 'masl', 'tallest'] }],
  },
  {
    // An ordinary Guide, routed only when the question describes a severe allergic reaction.
    // Cues never lift it: "stung by a bee, what do I do?" goes to the Assistant as usual.
    guideId: 'insect-stings',
    cueBoost: false,
    useGuideKeywords: false,
    concepts: [
      {
        id: 'sting',
        weight: 0.5,
        patterns: ['bee', 'bees', 'wasp', 'hornet', 'sting', 'stung', 'stinger', 'bubuyog', 'putakti', 'pukyutan', 'natusok', 'nasting', 'insect', 'insekto', 'kagat insekto'],
      },
      {
        id: 'anaphylaxis',
        weight: 0.5,
        patterns: [
          'anaphylaxis', 'anaphylactic', 'allergic reaction', 'severe allergy', 'epipen', 'epinephrine', 'cant breathe',
          'hard to breathe', 'trouble breathing', 'hirap huminga', 'hindi makahinga', 'swelling face', 'face swelling',
          'swollen face', 'swollen lips', 'swollen throat', 'throat swelling', 'tongue swelling', 'namamaga mukha',
          'namamaga labi', 'namamaga lalamunan', 'namamaga dila', 'mahihimatay', 'feels faint',
        ],
      },
    ],
  },
];

/**
 * When two Guides tie, the more time-critical and more specific one wins: "bleeding from a
 * snakebite" opens Snakebite, whose Guide covers the bite wound too.
 */
export const PRIORITY: readonly string[] = [
  'snakebite',
  'bleeding-wounds',
  'lightning',
  'flash-floods',
  'heat-illness',
  'hypothermia',
  'insect-stings',
  'altitude-sickness',
  'sprains-fractures',
  'dehydration',
  'lost-on-the-trail',
];

/** Distress, urgency and first-aid wording. Lifts an anchor by 0.5. */
export const CUES: readonly string[] = [
  'help', 'emergency', 'urgent', 'please', 'what do i do', 'what should i do', 'what should we do', 'what do we do',
  'what to do', 'first aid', 'treat', 'treatment', 'hospital', 'hurt', 'hurts', 'injured', 'injury', 'pain', 'painful',
  'now', 'right now', 'my friend', 'friend', 'companion', 'someone', 'dying', 'scared', 'serious', 'swelling', 'swollen',
  'tulong', 'tulungan', 'saklolo', 'ano gagawin', 'gagawin', 'ano dapat', 'paano gamutin', 'gamutin', 'gamot', 'lunas',
  'ospital', 'masakit', 'sumasakit', 'nasaktan', 'napinsala', 'ngayon', 'agad', 'bilis', 'pakiusap', 'kasama',
  'kaibigan', 'tropa', 'malala', 'takot', 'natatakot', 'kanina', 'namamaga', 'what if', 'paano kung',
  'everywhere', 'a lot', 'badly', 'heavily', 'severe', 'grabe', 'lakas', 'matindi', 'cant move', 'hindi makagalaw',
];

/**
 * Words that make a distant-past question current again ("it still hurts"). Plain "now" and
 * "ngayon" are left out: "is the trail safe now?" asks about the trail, not the old injury.
 */
export const NOW_CUES: readonly string[] = ['right now', 'still', 'pa rin', 'parin', 'pa din', 'padin', 'until now', 'hanggang ngayon'];

/**
 * Distant past: the question is about something long over ("I was bitten by a snake last
 * year, is the trail safe?"). Yesterday and earlier today still count as current.
 */
export const DISTANT_PAST: readonly string[] = [
  'last year', 'last month', 'last week', 'years ago', 'months ago', 'weeks ago', 'year ago', 'month ago',
  'when i was', 'as a kid', 'noong isang taon', 'nakaraang taon', 'nakaraang buwan', 'nakaraang linggo',
  'noong bata', 'nung bata', 'dati', 'noon pa', 'taon na',
];

/** A negator up to two words before a match cancels it ("not bleeding", "hindi naman dumudugo"). */
export const NEGATORS: ReadonlySet<string> = new Set([
  'not', 'no', 'never', 'dont', 'didnt', 'doesnt', 'isnt', 'arent', 'wasnt', 'werent', 'without',
  'hindi', 'wala', 'walang', 'huwag', 'wag',
]);

/** "I don't know", "hindi ko alam": not a negation of what follows. */
export const NEGATION_EXCEPTIONS: ReadonlySet<string> = new Set(['know', 'alam', 'sure', 'sigurado', 'matter']);

/** Up to this many words count as a very short question, which lifts an anchor like a cue. */
export const SHORT_QUESTION_WORDS = 3;

/** A Guide fires at this score. */
export const FIRE_AT = 1;
