const FILLER = new Set(['the', 'a', 'an', 'to', 'of', 'at', 'please', 'my', 'go']);

const DIRECTIONS = {
  n: 'north', s: 'south', e: 'east', w: 'west', u: 'up', d: 'down',
  north: 'north', south: 'south', east: 'east', west: 'west',
  up: 'up', down: 'down', out: 'out', in: 'in', back: 'back',
};

const VERB_ALIASES = {
  l: 'look', look: 'look',
  x: 'examine', examine: 'examine', inspect: 'examine',
  get: 'take', take: 'take', grab: 'take', pick: 'take',
  drop: 'drop',
  use: 'use', read: 'read', open: 'open', close: 'close', pry: 'pry',
  hide: 'hide', attack: 'attack', hit: 'attack', talk: 'talk',
  i: 'inventory', inv: 'inventory', inventory: 'inventory',
  notes: 'notes', help: 'help', '?': 'help',
  enter: 'enter', login: 'enter', code: 'enter',
};

const VERB_VOCAB = Object.keys(VERB_ALIASES);

export function normalize(input) {
  return String(input)
    .toLowerCase()
    .replace(/[^a-z0-9?\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function tokenize(input) {
  const norm = normalize(input);
  if (!norm) return [];
  return norm.split(' ').filter((t) => t && !FILLER.has(t));
}

export function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  const d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
    }
  }
  return d[m][n];
}

export function fuzzyMatch(token, vocab, max = 2) {
  if (vocab.includes(token)) return token;
  let best = null;
  let bestDist = max + 1;
  for (const word of vocab) {
    const dist = levenshtein(token, word);
    if (dist < bestDist) {
      bestDist = dist;
      best = word;
    }
  }
  return bestDist <= max ? best : null;
}

// Match a (possibly multi-word) noun phrase against the noun vocabulary.
function matchNoun(words, nounVocab) {
  if (words.length === 0) return null;
  const phrase = words.join(' ');
  if (nounVocab.includes(phrase)) return phrase;
  // try last two words, then last word, with fuzzy fallback on the last word
  if (words.length >= 2) {
    const two = words.slice(-2).join(' ');
    if (nounVocab.includes(two)) return two;
  }
  const last = words[words.length - 1];
  if (nounVocab.includes(last)) return last;
  return fuzzyMatch(last, nounVocab, 2) || phrase;
}

export function parse(input, nounVocab = []) {
  const tokens = tokenize(input);
  if (tokens.length === 0) return { verb: null };

  const first = tokens[0];

  // Bare direction (e.g. "n", "north") becomes a go command.
  if (DIRECTIONS[first] && !VERB_ALIASES[first]) {
    return { verb: 'go', noun: DIRECTIONS[first] };
  }

  let verb = VERB_ALIASES[first] || fuzzyMatch(first, VERB_VOCAB, 2);
  let rest = tokens.slice(1);

  // "go north" etc.
  if (verb === 'go' || first === 'go') {
    verb = 'go';
    const dirToken = rest[0];
    const dir = dirToken ? DIRECTIONS[dirToken] || fuzzyMatch(dirToken, Object.keys(DIRECTIONS), 2) : null;
    return { verb: 'go', noun: dir };
  }

  if (!verb) return { verb: null, raw: input };

  // enter: keep the raw word sequence (for code / symbol order)
  if (verb === 'enter') {
    return { verb, words: rest };
  }

  // split on prepositions
  const prepIdx = rest.findIndex((t) => t === 'with' || t === 'on' || t === 'using');
  let nounWords = rest;
  let noun2Words = [];
  let prep = null;
  if (prepIdx !== -1) {
    prep = rest[prepIdx];
    nounWords = rest.slice(0, prepIdx);
    noun2Words = rest.slice(prepIdx + 1);
  }

  const noun = matchNoun(nounWords, nounVocab);
  const noun2 = noun2Words.length ? matchNoun(noun2Words, nounVocab) : undefined;
  return { verb, noun: noun || undefined, noun2, prep: prep || undefined };
}
