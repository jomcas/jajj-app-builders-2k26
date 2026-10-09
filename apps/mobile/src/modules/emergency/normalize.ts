// Text normalisation for emergency routing: casing, accents, Taglish hyphens, texting
// spellings, Filipino affixes and light English inflection. Pure, tested under plain Node.
//
// Everything here is deterministic and runs in well under a millisecond per question, so the
// router can run before the relevance gate and the model (ADR 0003, ADR 0005).

/** A clause boundary (comma, full stop, question mark…). Negation never reaches across one. */
export const BOUNDARY = '|';

/** Texting spellings and short forms, mapped to the word the lexicon uses. */
const SPELLINGS: Record<string, string> = {
  di: 'hindi',
  hnd: 'hindi',
  hndi: 'hindi',
  hinde: 'hindi',
  pwede: 'puwede',
  pede: 'puwede',
  ung: 'yung',
  yong: 'yung',
  lng: 'lang',
  nmn: 'naman',
  pls: 'please',
  plz: 'please',
  u: 'you',
  ur: 'your',
  anong: 'ano',
  ngaun: 'ngayon',
  ngyon: 'ngayon',
  ngayun: 'ngayon',
  tlg: 'talaga',
  tlga: 'talaga',
  kc: 'kasi',
  dun: 'doon',
  sya: 'siya',
  xa: 'siya',
};

/**
 * Lowercases, strips accents, joins Taglish hyphenation ("na-sprain" → "nasprain",
 * "nagbi-bleed" → "nagbibleed"), drops apostrophes ("can't" → "cant"), squeezes letters
 * repeated three or more times ("tulonggg" → "tulong"), and returns the words with a
 * BOUNDARY token wherever punctuation ends a clause.
 */
export function tokenize(text: string): string[] {
  const cleaned = text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[’'`´]/g, '')
    .replace(/([a-z])-(?=[a-z])/g, '$1')
    .replace(/([a-z])\1{2,}/g, '$1')
    .replace(/[.,;:!?()[\]{}"“”/\\]+/g, ` ${BOUNDARY} `)
    .replace(/[^a-z0-9| ]+/g, ' ');
  const tokens: string[] = [];
  for (const raw of cleaned.split(/\s+/)) {
    if (!raw) continue;
    if (raw === BOUNDARY) {
      if (tokens.length && tokens[tokens.length - 1] !== BOUNDARY) tokens.push(BOUNDARY);
      continue;
    }
    tokens.push(SPELLINGS[raw] ?? raw);
  }
  while (tokens[tokens.length - 1] === BOUNDARY) tokens.pop();
  return tokens;
}

const VOWELS = new Set(['a', 'e', 'i', 'o', 'u']);
const isVowel = (c: string | undefined) => c !== undefined && VOWELS.has(c);

// Filipino verb and adjective prefixes, longest first. "ni" covers the -in- infix before l/y
// roots ("nilalamig" from "lamig").
const PREFIXES = [
  'nakakapag', 'nakaka', 'nakapag', 'napaka', 'pinaka', 'nagpa', 'nagka', 'naka', 'nagsi',
  'pinag', 'nag', 'napa', 'pina', 'mapa', 'maka', 'mag', 'mang', 'nang', 'nan', 'nam',
  'na', 'ma', 'ka', 'pa', 'ni', 'i',
];

const SUFFIXES = ['han', 'hin', 'an', 'in'];

const MIN_STEM = 3;

/** The forms one step of Filipino affix removal can give. */
function filipinoSteps(word: string): string[] {
  const out: string[] = [];
  for (const prefix of PREFIXES) {
    if (word.startsWith(prefix) && word.length - prefix.length >= MIN_STEM) out.push(word.slice(prefix.length));
  }
  // Infixes -um- and -in- after the first consonant: kinagat → kagat, dumudugo → dudugo.
  if (!isVowel(word[0]) && (word.slice(1, 3) === 'um' || word.slice(1, 3) === 'in') && word.length - 2 >= MIN_STEM) {
    out.push(word[0] + word.slice(3));
  }
  // Reduplicated first syllable: dudugo → dugo, liligaw → ligaw, bibleed → bleed.
  if (!isVowel(word[0]) && isVowel(word[1]) && word[2] === word[0] && word.length - 2 >= MIN_STEM) {
    out.push(word.slice(2));
  }
  // A reduplicated vowel-initial syllable: iinom → inom.
  if (isVowel(word[0]) && word[1] === word[0] && word.length - 1 >= MIN_STEM) out.push(word.slice(1));
  for (const suffix of SUFFIXES) {
    if (word.endsWith(suffix) && word.length - suffix.length >= MIN_STEM) out.push(word.slice(0, -suffix.length));
  }
  // The -ng linker on an adjective: rumaragasang → rumaragasa, baling → bali.
  if (word.endsWith('ng') && isVowel(word[word.length - 3]) && word.length - 2 >= MIN_STEM) out.push(word.slice(0, -2));
  // u/o alternate at the end of a root when a suffix is added: duguan → dugu → dugo.
  if (word.endsWith('u')) out.push(`${word.slice(0, -1)}o`);
  return out;
}

/** Light English inflection: bleeding → bleed, sprained → sprain, stopped → stop. */
function englishSteps(word: string): string[] {
  const out: string[] = [];
  const undouble = (stem: string) =>
    stem.length >= 3 && stem[stem.length - 1] === stem[stem.length - 2] && !isVowel(stem[stem.length - 1])
      ? [stem, stem.slice(0, -1)]
      : [stem];
  if (word.endsWith('ing') && word.length >= 6) {
    const stem = word.slice(0, -3);
    out.push(...undouble(stem), `${stem}e`);
  }
  if (word.endsWith('ed') && word.length >= 5) {
    const stem = word.slice(0, -2);
    out.push(...undouble(stem), `${stem}e`);
  }
  if (word.endsWith('ies') && word.length >= 5) out.push(`${word.slice(0, -3)}y`);
  if (word.endsWith('es') && word.length >= 5) out.push(word.slice(0, -2));
  if (word.endsWith('s') && !word.endsWith('ss') && word.length >= 4) out.push(word.slice(0, -1));
  return out;
}

const stemCache = new Map<string, ReadonlySet<string>>();

/**
 * Every form a word can be reduced to by removing affixes and inflections, the word itself
 * included. Over-generation is harmless: a form only matters if it equals a lexicon word.
 */
export function stems(word: string): ReadonlySet<string> {
  const cached = stemCache.get(word);
  if (cached) return cached;
  const seen = new Set<string>([word]);
  let frontier = [word];
  for (let depth = 0; depth < 4 && frontier.length; depth++) {
    const next: string[] = [];
    for (const form of frontier) {
      for (const reduced of [...filipinoSteps(form), ...englishSteps(form)]) {
        if (!seen.has(reduced)) {
          seen.add(reduced);
          next.push(reduced);
        }
      }
    }
    frontier = next;
  }
  stemCache.set(word, seen);
  return seen;
}

/**
 * Optimal string alignment distance (Levenshtein plus adjacent transpositions), stopping
 * early once it exceeds max.
 */
export function editDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const rows = a.length + 1;
  const cols = b.length + 1;
  const d: number[][] = Array.from({ length: rows }, (_, i) => {
    const row = new Array<number>(cols).fill(0);
    row[0] = i;
    return row;
  });
  for (let j = 0; j < cols; j++) d[0][j] = j;
  for (let i = 1; i < rows; i++) {
    let rowMin = Infinity;
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let value = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) value = Math.min(value, d[i - 2][j - 2] + 1);
      d[i][j] = value;
      rowMin = Math.min(rowMin, value);
    }
    if (rowMin > max) return max + 1;
  }
  return d[a.length][b.length];
}

/**
 * Common words that sit one typo away from a lexicon word and must never count as that word
 * ("ginawa", made, is one letter from "ginaw", cold).
 */
const NOT_TYPOS = new Set(['ginawa', 'gagawin', 'ginagawa', 'sugar', 'store', 'stored', 'could', 'blessed', 'breed', 'scream', 'flour', 'floor']);

/** How many typos a word of this length may have and still match. */
function allowedTypos(length: number): number {
  if (length >= 9) return 2;
  if (length >= 6) return 1;
  return 0;
}

/**
 * Does a word from the question match a lexicon word? The lexicon word may be a root ("kagat"
 * matches "kinagat", "nakagat", "makagat") or an inflected form, which then matches only that
 * form and its further-affixed forms. Long words also match with a typo or two, as long as
 * the first letter is right.
 */
export function wordMatches(textWord: string, lexiconWord: string): boolean {
  if (textWord === lexiconWord) return true;
  const forms = stems(textWord);
  if (forms.has(lexiconWord)) return true;
  const typos = allowedTypos(lexiconWord.length);
  if (typos === 0 || NOT_TYPOS.has(textWord) || textWord[0] !== lexiconWord[0]) return false;
  for (const form of forms) {
    if (form.length >= 5 && form[0] === lexiconWord[0] && editDistance(form, lexiconWord, typos) <= typos) return true;
  }
  return false;
}
