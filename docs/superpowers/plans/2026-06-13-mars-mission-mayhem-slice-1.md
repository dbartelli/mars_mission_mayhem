# Mars Mission Mayhem — Slice 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fully playable first slice (Phases 1–3: crash → surface → base login → patrol beat → vault cliffhanger) of a Zork-style Mars text adventure for 3rd graders.

**Architecture:** Pure, DOM-free game logic in small ES modules under `src/` (state, parser, world data, commands, puzzle, hints, save, game orchestrator), unit-tested with Vitest. A thin DOM/UI layer renders the split-pane console + visual panel. A ~50-line dependency-free Node script (`build.mjs`) flattens the modules + CSS into a single deployable `index.html`.

**Tech Stack:** Vanilla JavaScript (ES modules), Vitest for tests, Node for the build. No runtime libraries. Deploys to GitHub Pages as one `index.html`.

**Reference spec:** `docs/superpowers/specs/2026-06-13-mars-mission-mayhem-design.md`

---

## File Structure

```
package.json              # type:module; scripts: test, build
build.mjs                 # flattens src + css -> index.html (no deps)
src/
  data/world.js           # rooms + items as data (slice 1) + noun vocab
  data/puzzles.js         # Martian symbol login puzzle data + checker
  engine/state.js         # createInitialState + inventory/notes/visited helpers
  engine/parser.js        # normalize, tokenize, fuzzy match, parse()
  engine/commands.js      # command handlers (look, go, take, use, beats...)
  engine/hints.js         # progressive hints per gate
  engine/save.js          # localStorage save/load (injectable storage)
  engine/game.js          # createGame(): handleCommand orchestrator
  ui/styles.css           # split-pane theme, line-spacing 1.25
  ui/render.js            # render console/inventory/minimap/panel from state
  ui/autocomplete.js      # suggestion logic (pure) + input wiring
  ui/main.js              # bootstrap: build DOM, wire events, run game
tests/
  state.test.js
  parser.test.js
  world.test.js
  commands.test.js
  puzzle.test.js
  patrol.test.js
  vault.test.js
  hints.test.js
  save.test.js
  walkthrough.test.js     # full slice, both patrol paths
  autocomplete.test.js
```

**Naming locked (use exactly these everywhere):**

- **Room ids:** `cockpit`, `surface`, `shaft`, `entryHall`, `terminalRoom`, `corridor`, `vault`
- **Item ids:** `sealant`, `wrench`, `missionScreen`, `trapdoor`, `monitors`, `terminal`, `etching`, `patrolAlien`, `alcove`, `codeTablet`, `vaultTerminal`, `steelDoor`, `crystal`, `sharpTool`, `vaultAlien`
- **Flags:** `visorFixed`, `trapdoorOpen`, `loggedIn`, `hasAccessCode`, `vaultOpen`, `slice1Complete`
- **Vault access code:** the string `"blue 4"`
- **Symbol puzzle answer order:** `['sun','star','beam','rock']`

---

### Task 1: Project scaffold + tooling

**Files:**
- Create: `package.json`
- Create: `tests/smoke.test.js`
- Create: `.gitignore`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "mars-mission-mayhem",
  "version": "0.1.0",
  "type": "module",
  "private": true,
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "build": "node build.mjs"
  },
  "devDependencies": {
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 2: Create `.gitignore`**

```
node_modules/
```

- [ ] **Step 3: Create `tests/smoke.test.js`**

```js
import { describe, it, expect } from 'vitest';

describe('tooling', () => {
  it('runs vitest', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 4: Install and run**

Run: `npm install && npm test`
Expected: vitest installs; smoke test PASSES (1 passed).

- [ ] **Step 5: Commit**

```bash
git add package.json .gitignore tests/smoke.test.js
git commit -m "chore: scaffold project with vitest"
```

---

### Task 2: Game state module

**Files:**
- Create: `src/engine/state.js`
- Test: `tests/state.test.js`

- [ ] **Step 1: Write the failing test**

```js
import { describe, it, expect } from 'vitest';
import {
  createInitialState, hasItem, addItem, removeItem, addNote, visit,
} from '../src/engine/state.js';

describe('state', () => {
  it('starts in the cockpit with empty inventory', () => {
    const s = createInitialState();
    expect(s.room).toBe('cockpit');
    expect(s.inventory).toEqual([]);
    expect(s.visited).toEqual(['cockpit']);
    expect(s.flags).toEqual({});
  });

  it('adds and removes items without duplicates', () => {
    const s = createInitialState();
    addItem(s, 'wrench');
    addItem(s, 'wrench');
    expect(s.inventory).toEqual(['wrench']);
    expect(hasItem(s, 'wrench')).toBe(true);
    removeItem(s, 'wrench');
    expect(hasItem(s, 'wrench')).toBe(false);
  });

  it('adds notes once and records visited rooms once', () => {
    const s = createInitialState();
    addNote(s, { title: 'Access Code', text: 'blue 4' });
    addNote(s, { title: 'Access Code', text: 'blue 4' });
    expect(s.notes).toHaveLength(1);
    visit(s, 'surface');
    visit(s, 'surface');
    expect(s.visited).toEqual(['cockpit', 'surface']);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/state.test.js`
Expected: FAIL (cannot find module `src/engine/state.js`).

- [ ] **Step 3: Write `src/engine/state.js`**

```js
export function createInitialState() {
  return {
    room: 'cockpit',
    inventory: [],
    flags: {},
    notes: [],
    visited: ['cockpit'],
    puzzles: { symbolLogin: { attempt: [] } },
  };
}

export function hasItem(state, id) {
  return state.inventory.includes(id);
}

export function addItem(state, id) {
  if (!hasItem(state, id)) state.inventory.push(id);
}

export function removeItem(state, id) {
  state.inventory = state.inventory.filter((x) => x !== id);
}

export function addNote(state, note) {
  if (!state.notes.some((n) => n.title === note.title)) state.notes.push(note);
}

export function visit(state, roomId) {
  if (!state.visited.includes(roomId)) state.visited.push(roomId);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/state.test.js`
Expected: PASS (3 passed).

- [ ] **Step 5: Commit**

```bash
git add src/engine/state.js tests/state.test.js
git commit -m "feat: add game state module"
```

---

### Task 3: Forgiving parser

**Files:**
- Create: `src/engine/parser.js`
- Test: `tests/parser.test.js`

- [ ] **Step 1: Write the failing test**

```js
import { describe, it, expect } from 'vitest';
import { normalize, tokenize, levenshtein, parse } from '../src/engine/parser.js';

const NOUNS = ['sealant', 'wrench', 'trapdoor', 'alien', 'sharp tool'];

describe('parser', () => {
  it('normalizes case, punctuation and spacing', () => {
    expect(normalize('  LOOK!! ')).toBe('look');
    expect(normalize('Go  North.')).toBe('go north');
  });

  it('drops filler words when tokenizing', () => {
    expect(tokenize('take the wrench')).toEqual(['take', 'wrench']);
  });

  it('computes edit distance', () => {
    expect(levenshtein('seelant', 'sealant')).toBe(1);
  });

  it('parses a verb and noun, fuzzy-correcting spelling', () => {
    const r = parse('take seelant', NOUNS);
    expect(r.verb).toBe('take');
    expect(r.noun).toBe('sealant');
  });

  it('maps single-letter and direction shortcuts to a go command', () => {
    expect(parse('n', NOUNS)).toMatchObject({ verb: 'go', noun: 'north' });
    expect(parse('go north', NOUNS)).toMatchObject({ verb: 'go', noun: 'north' });
  });

  it('splits "with"/"on" into a second noun', () => {
    const r = parse('attack alien with sharp tool', NOUNS);
    expect(r).toMatchObject({ verb: 'attack', noun: 'alien', noun2: 'sharp tool' });
  });

  it('captures a free-text sequence for enter', () => {
    const r = parse('enter sun star beam rock', NOUNS);
    expect(r.verb).toBe('enter');
    expect(r.words).toEqual(['sun', 'star', 'beam', 'rock']);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/parser.test.js`
Expected: FAIL (cannot find module).

- [ ] **Step 3: Write `src/engine/parser.js`**

```js
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/parser.test.js`
Expected: PASS (7 passed).

- [ ] **Step 5: Commit**

```bash
git add src/engine/parser.js tests/parser.test.js
git commit -m "feat: add forgiving command parser"
```

---

### Task 4: World data (rooms + items)

**Files:**
- Create: `src/data/world.js`
- Test: `tests/world.test.js`

- [ ] **Step 1: Write the failing test**

```js
import { describe, it, expect } from 'vitest';
import { rooms, items, getRoom, getItem, nounVocab } from '../src/data/world.js';

describe('world data', () => {
  it('defines all slice-1 rooms', () => {
    for (const id of ['cockpit', 'surface', 'shaft', 'entryHall', 'terminalRoom', 'corridor', 'vault']) {
      expect(getRoom(id), `room ${id}`).toBeTruthy();
    }
  });

  it('every exit points to a real room', () => {
    for (const room of Object.values(rooms)) {
      for (const exit of Object.values(room.exits || {})) {
        const to = typeof exit === 'string' ? exit : exit.to;
        expect(rooms[to], `exit to ${to} from ${room.id}`).toBeTruthy();
      }
    }
  });

  it('every item referenced by a room exists', () => {
    for (const room of Object.values(rooms)) {
      for (const itemId of room.items || []) {
        expect(getItem(itemId), `item ${itemId} in ${room.id}`).toBeTruthy();
      }
    }
  });

  it('builds a noun vocabulary including item names and aliases', () => {
    const vocab = nounVocab();
    expect(vocab).toContain('sealant');
    expect(vocab).toContain('wrench');
    expect(vocab).toContain('sharp tool');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/world.test.js`
Expected: FAIL (cannot find module).

- [ ] **Step 3: Write `src/data/world.js`**

```js
// All slice-1 rooms and items as plain data. Logic lives in the engine.

export const rooms = {
  cockpit: {
    id: 'cockpit',
    name: 'Crashed Cockpit',
    description: (s) =>
      'You wake in the wreck of your spaceship. You are the only survivor of the crash. ' +
      'A red OXYGEN LOW warning blinks, and a crack runs across your helmet visor. ' +
      'A MISSION SCREEN flickers on the dashboard. ' +
      (s.flags.visorFixed ? 'Your visor is patched and holding.' : 'You need to seal that crack.'),
    items: ['missionScreen', 'sealant', 'wrench'],
    exits: {
      out: { to: 'surface', locked: (s) => !s.flags.visorFixed,
        lockedMsg: 'Not yet — the dust outside would pour through your cracked visor. Seal it first.' },
    },
  },

  surface: {
    id: 'surface',
    name: 'Martian Surface',
    description: (s) =>
      'Red dust stretches in every direction. Your wrecked ship leans behind you, and far off a ' +
      'SANDSTORM is rolling closer. Half-buried in the sand is a brownish-red TRAPDOOR. ' +
      (s.flags.trapdoorOpen ? 'The trapdoor stands open, a ladder leading DOWN.' : ''),
    items: ['trapdoor'],
    exits: {
      in: 'cockpit',
      back: 'cockpit',
      down: { to: 'shaft', locked: (s) => !s.flags.trapdoorOpen,
        lockedMsg: 'The trapdoor is shut tight. Maybe you can PRY it open.' },
    },
  },

  shaft: {
    id: 'shaft',
    name: 'Airlock Shaft',
    description:
      'You climb down into a metal shaft. The storm howls above as the trapdoor thumps shut. ' +
      'The air down here is warm and breathable — this base has working life support. ' +
      'A doorway leads DOWN into the base.',
    items: [],
    exits: { up: 'surface', down: 'entryHall' },
  },

  entryHall: {
    id: 'entryHall',
    name: 'Base Entry Hall',
    description: (s) =>
      'An abandoned Martian base. Flickering MONITORS line the walls, covered in strange symbols. ' +
      'A hallway runs NORTH to a control room. ' +
      (s.flags.loggedIn
        ? 'To the EAST a security door now stands unlocked.'
        : 'To the EAST a heavy security door is sealed.'),
    items: ['monitors'],
    exits: {
      up: 'shaft',
      north: 'terminalRoom',
      east: { to: 'corridor', locked: (s) => !s.flags.loggedIn,
        lockedMsg: 'The security door is sealed. The main TERMINAL must be unlocked first.' },
    },
  },

  terminalRoom: {
    id: 'terminalRoom',
    name: 'Control Room',
    description:
      'A glowing TERMINAL waits for a login. Beside it, four Martian symbols are scrambled on the screen. ' +
      'An ETCHING is scratched into the wall.',
    items: ['terminal', 'etching'],
    exits: { south: 'entryHall' },
  },

  corridor: {
    id: 'corridor',
    name: 'Guard Corridor',
    description: (s) =>
      'A long corridor. A maintenance ALCOVE — just big enough to slip behind — opens to one side. ' +
      (s.flags.hasAccessCode
        ? 'The corridor is quiet now. A doorway leads NORTH to a vault.'
        : 'A PATROL ALIEN is marching this way!'),
    items: ['alcove', 'patrolAlien'],
    exits: {
      west: 'entryHall',
      north: { to: 'vault', locked: (s) => !s.flags.hasAccessCode,
        lockedMsg: 'The patrol alien blocks the way north. You need to get past it first.' },
    },
  },

  vault: {
    id: 'vault',
    name: 'Vault Antechamber',
    description: (s) =>
      'A small room with a second VAULT TERMINAL and a thick STEEL DOOR. ' +
      (s.flags.vaultOpen
        ? 'The steel door has slid open. Inside, a radiant CRYSTAL glows, and a SHARP TOOL lies in the corner.'
        : 'The steel door is locked. The terminal asks for an access code — try ENTER and your code.'),
    items: ['vaultTerminal', 'steelDoor'],
    exits: { south: 'corridor' },
  },
};

export const items = {
  missionScreen: {
    id: 'missionScreen', name: 'mission screen', aliases: ['screen', 'mission'], takeable: false,
    description: 'A cracked dashboard screen.',
    readText:
      'MISSION LOG: Scans detected HOSTILE Martian lifeforms on the surface. ' +
      'ABORT MISSION. Repair the shuttle and return to Earth immediately.',
  },
  sealant: {
    id: 'sealant', name: 'sealant', aliases: ['patch', 'repair patch', 'tube'], takeable: true,
    description: 'A tube of quick-drying visor sealant.',
  },
  wrench: {
    id: 'wrench', name: 'wrench', aliases: ['pry bar', 'prybar', 'bar', 'pipe'], takeable: true,
    description: 'A heavy wrench. Good for prying — or swinging.',
  },
  trapdoor: {
    id: 'trapdoor', name: 'trapdoor', aliases: ['door', 'hatch'], takeable: false,
    description: 'A brownish-red trapdoor, half-buried in red sand.',
  },
  monitors: {
    id: 'monitors', name: 'monitors', aliases: ['monitor', 'screens'], takeable: false,
    description: (s) => (s.flags.loggedIn
      ? 'The monitors now read in English: maps and warnings about base patrols.'
      : 'Wall monitors covered in scrambled Martian symbols.'),
  },
  terminal: {
    id: 'terminal', name: 'terminal', aliases: ['computer', 'login'], takeable: false,
    description: 'The main login terminal. It wants the four symbols in the right order.',
  },
  etching: {
    id: 'etching', name: 'etching', aliases: ['wall', 'scratch', 'clue'], takeable: false,
    description: 'Scratched words on the wall.',
    readText: 'The etching reads: "The lock wakes in this order — SUN, STAR, BEAM, ROCK."',
  },
  alcove: {
    id: 'alcove', name: 'alcove', aliases: ['crates', 'nook', 'cover'], takeable: false,
    description: 'A shadowy maintenance alcove. Big enough to hide behind.',
  },
  patrolAlien: {
    id: 'patrolAlien', name: 'patrol alien', aliases: ['alien', 'patrol', 'guard'], takeable: false,
    description: 'A Martian patrol guard, clomping down the corridor.',
  },
  codeTablet: {
    id: 'codeTablet', name: 'code tablet', aliases: ['tablet', 'codebook', 'book'], takeable: true,
    description: 'A Martian tablet showing the vault access code: "blue 4".',
  },
  vaultTerminal: {
    id: 'vaultTerminal', name: 'vault terminal', aliases: ['terminal', 'panel'], takeable: false,
    description: 'A second terminal that controls the steel door.',
  },
  steelDoor: {
    id: 'steelDoor', name: 'steel door', aliases: ['door'], takeable: false,
    description: 'A thick steel vault door.',
  },
  crystal: {
    id: 'crystal', name: 'crystal', aliases: ['radiant crystal', 'gem'], takeable: true,
    description: 'A radiant crystal humming with power. It feels important.',
  },
  sharpTool: {
    id: 'sharpTool', name: 'sharp tool', aliases: ['tool', 'blade'], takeable: true,
    description: 'A sharp Martian tool, light and dangerous.',
  },
  vaultAlien: {
    id: 'vaultAlien', name: 'vault alien', aliases: ['alien', 'guard'], takeable: false,
    description: 'A second alien, eyeing the tool in your hand.',
  },
};

export function getRoom(id) {
  return rooms[id];
}

export function getItem(id) {
  return items[id];
}

export function nounVocab() {
  const set = new Set();
  for (const item of Object.values(items)) {
    set.add(item.name);
    for (const a of item.aliases || []) set.add(a);
  }
  // common scenery/verbs-as-nouns
  ['visor', 'sand', 'symbols', 'code'].forEach((w) => set.add(w));
  return [...set];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/world.test.js`
Expected: PASS (4 passed).

- [ ] **Step 5: Commit**

```bash
git add src/data/world.js tests/world.test.js
git commit -m "feat: add slice-1 world data"
```

---

### Task 5: Movement, look, examine commands

**Files:**
- Create: `src/engine/commands.js`
- Test: `tests/commands.test.js`

- [ ] **Step 1: Write the failing test**

```js
import { describe, it, expect } from 'vitest';
import { createInitialState, addItem } from '../src/engine/state.js';
import { describeRoom, cmdGo, cmdExamine, availableExits } from '../src/engine/commands.js';

describe('movement & look', () => {
  it('describes the current room and its exits', () => {
    const s = createInitialState();
    const text = describeRoom(s);
    expect(text).toContain('Crashed Cockpit');
    expect(text.toLowerCase()).toContain('exits');
  });

  it('blocks a locked exit with its message and stays put', () => {
    const s = createInitialState();
    const out = cmdGo(s, 'out');
    expect(out.toLowerCase()).toContain('seal it first');
    expect(s.room).toBe('cockpit');
  });

  it('moves through an unlocked exit and records the visit', () => {
    const s = createInitialState();
    s.flags.visorFixed = true;
    const out = cmdGo(s, 'out');
    expect(s.room).toBe('surface');
    expect(s.visited).toContain('surface');
    expect(out).toContain('Martian Surface');
  });

  it('examines an item in the room', () => {
    const s = createInitialState();
    expect(cmdExamine(s, 'sealant')).toContain('visor sealant');
  });

  it('lists only currently-available exits', () => {
    const s = createInitialState();
    expect(availableExits(s)).toEqual([]); // visor not fixed -> out is locked
    s.flags.visorFixed = true;
    expect(availableExits(s)).toContain('out');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/commands.test.js`
Expected: FAIL (cannot find module).

- [ ] **Step 3: Write `src/engine/commands.js` (initial)**

```js
import { rooms, items, getRoom, getItem } from '../data/world.js';
import { hasItem, addItem, removeItem, visit } from './state.js';

function text(val, state) {
  return typeof val === 'function' ? val(state) : val;
}

function exitTarget(exit) {
  return typeof exit === 'string' ? exit : exit.to;
}

function exitLocked(exit, state) {
  return typeof exit === 'object' && typeof exit.locked === 'function' && exit.locked(state);
}

export function availableExits(state) {
  const room = getRoom(state.room);
  return Object.entries(room.exits || {})
    .filter(([, exit]) => !exitLocked(exit, state))
    .map(([dir]) => dir);
}

export function describeRoom(state) {
  const room = getRoom(state.room);
  const desc = text(room.description, state);
  const exits = availableExits(state);
  const exitLine = exits.length ? `Exits: ${exits.join(', ')}.` : 'There are no obvious exits.';
  return `**${room.name}**\n${desc}\n${exitLine}`;
}

// Resolve a noun to an item id, searching the room and inventory.
export function resolveItem(state, noun) {
  if (!noun) return null;
  const room = getRoom(state.room);
  const candidates = [...(room.items || []), ...state.inventory];
  for (const id of candidates) {
    const item = getItem(id);
    if (!item) continue;
    if (item.name === noun || (item.aliases || []).includes(noun) || id.toLowerCase() === noun) {
      return id;
    }
  }
  // fall back to any defined item (for items revealed by flags, e.g. crystal)
  for (const id of Object.keys(items)) {
    const item = items[id];
    if (item.name === noun || (item.aliases || []).includes(noun)) return id;
  }
  return null;
}

export function cmdGo(state, dir) {
  const room = getRoom(state.room);
  const exit = (room.exits || {})[dir];
  if (!exit) return `You can't go ${dir} from here.`;
  if (exitLocked(exit, state)) {
    return typeof exit === 'object' && exit.lockedMsg ? exit.lockedMsg : `You can't go ${dir} yet.`;
  }
  state.room = exitTarget(exit);
  visit(state, state.room);
  return describeRoom(state);
}

export function cmdExamine(state, noun) {
  const id = resolveItem(state, noun);
  if (!id) return "You don't see that here.";
  return text(getItem(id).description, state);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/commands.test.js`
Expected: PASS (5 passed).

- [ ] **Step 5: Commit**

```bash
git add src/engine/commands.js tests/commands.test.js
git commit -m "feat: add movement, look and examine commands"
```

---

### Task 6: Inventory commands (take, drop, inventory)

**Files:**
- Modify: `src/engine/commands.js`
- Test: `tests/commands.test.js` (add cases)

- [ ] **Step 1: Add failing tests to `tests/commands.test.js`**

```js
import { cmdTake, cmdDrop, cmdInventory } from '../src/engine/commands.js';

describe('inventory', () => {
  it('takes a takeable item from the room', () => {
    const s = createInitialState();
    const out = cmdTake(s, 'wrench');
    expect(out.toLowerCase()).toContain('take');
    expect(s.inventory).toContain('wrench');
  });

  it('refuses to take scenery', () => {
    const s = createInitialState();
    const out = cmdTake(s, 'mission screen');
    expect(out.toLowerCase()).toContain("can't take");
    expect(s.inventory).not.toContain('missionScreen');
  });

  it('lists inventory contents', () => {
    const s = createInitialState();
    cmdTake(s, 'wrench');
    expect(cmdInventory(s)).toContain('wrench');
    const empty = createInitialState();
    expect(cmdInventory(empty).toLowerCase()).toContain('empty');
  });

  it('drops an item back into the room', () => {
    const s = createInitialState();
    cmdTake(s, 'wrench');
    cmdDrop(s, 'wrench');
    expect(s.inventory).not.toContain('wrench');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/commands.test.js`
Expected: FAIL (`cmdTake` is not exported).

- [ ] **Step 3: Append to `src/engine/commands.js`**

```js
export function cmdTake(state, noun) {
  const id = resolveItem(state, noun);
  if (!id) return "You don't see that here.";
  const item = getItem(id);
  if (!item.takeable) return `You can't take the ${item.name}.`;
  if (hasItem(state, id)) return `You already have the ${item.name}.`;
  const room = getRoom(state.room);
  if (!(room.items || []).includes(id)) return "You don't see that here.";
  room.items = room.items.filter((x) => x !== id);
  addItem(state, id);
  return `You take the ${item.name}.`;
}

export function cmdDrop(state, noun) {
  const id = resolveItem(state, noun);
  if (!id || !hasItem(state, id)) return "You aren't carrying that.";
  removeItem(state, id);
  const room = getRoom(state.room);
  room.items = room.items || [];
  if (!room.items.includes(id)) room.items.push(id);
  return `You drop the ${getItem(id).name}.`;
}

export function cmdInventory(state) {
  if (state.inventory.length === 0) return 'Your pack is empty.';
  const names = state.inventory.map((id) => getItem(id).name);
  return `You are carrying: ${names.join(', ')}.`;
}
```

> **Note on room.items mutation:** because `rooms` is a shared module object, tests and the game mutate it. The game is single-session per page load, so this is acceptable. Tests that need a pristine world re-import is unnecessary; each `cmdTake` test takes a distinct item. The walkthrough test (Task 12) runs one continuous session, matching real play.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/commands.test.js`
Expected: PASS (9 passed total in file).

- [ ] **Step 5: Commit**

```bash
git add src/engine/commands.js tests/commands.test.js
git commit -m "feat: add inventory commands"
```

---

### Task 7: Interaction beats — read, seal visor, pry trapdoor

**Files:**
- Modify: `src/engine/commands.js`
- Test: `tests/commands.test.js` (add cases)

- [ ] **Step 1: Add failing tests**

```js
import { cmdRead, cmdUse, cmdPry } from '../src/engine/commands.js';

describe('phase 1 beats', () => {
  it('reads the mission screen', () => {
    const s = createInitialState();
    expect(cmdRead(s, 'mission screen')).toContain('HOSTILE');
  });

  it('seals the visor with the sealant and sets the flag', () => {
    const s = createInitialState();
    const out = cmdUse(s, 'sealant', 'visor');
    expect(s.flags.visorFixed).toBe(true);
    expect(out.toLowerCase()).toContain('visor');
  });

  it('pries the trapdoor open only with the wrench', () => {
    const s = createInitialState();
    s.flags.visorFixed = true;
    cmdGo(s, 'out'); // now on surface
    expect(cmdPry(s, 'trapdoor').toLowerCase()).toContain('need'); // no wrench yet
    expect(s.flags.trapdoorOpen).toBeFalsy();
    addItem(s, 'wrench');
    const out = cmdPry(s, 'trapdoor');
    expect(s.flags.trapdoorOpen).toBe(true);
    expect(out.toLowerCase()).toContain('open');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/commands.test.js`
Expected: FAIL (`cmdRead` not exported).

- [ ] **Step 3: Append to `src/engine/commands.js`**

```js
export function cmdRead(state, noun) {
  const id = resolveItem(state, noun);
  if (!id) return "You don't see that here.";
  const item = getItem(id);
  if (item.readText) return text(item.readText, state);
  return `There's nothing to read on the ${item.name}.`;
}

export function cmdUse(state, noun, noun2) {
  const id = resolveItem(state, noun);
  if (!id) return "You don't have that.";

  // Seal the visor
  if (id === 'sealant') {
    if (state.flags.visorFixed) return 'Your visor is already sealed.';
    state.flags.visorFixed = true;
    if (!hasItem(state, 'sealant') && (getRoom(state.room).items || []).includes('sealant')) {
      getRoom(state.room).items = getRoom(state.room).items.filter((x) => x !== 'sealant');
    }
    removeItem(state, 'sealant');
    return 'You smear the sealant across your visor. It dries fast — the crack is sealed and the oxygen warning fades.';
  }

  // Use the wrench on the trapdoor == pry
  if (id === 'wrench' && (noun2 === 'trapdoor' || noun2 === 'door')) {
    return cmdPry(state, 'trapdoor');
  }

  return `You can't use the ${getItem(id).name} like that.`;
}

export function cmdPry(state, noun) {
  const id = resolveItem(state, noun);
  if (id !== 'trapdoor') return "You can't pry that.";
  if (state.flags.trapdoorOpen) return 'The trapdoor is already open.';
  if (!hasItem(state, 'wrench')) {
    return 'It won\'t budge by hand. You need something to pry with — like a wrench.';
  }
  state.flags.trapdoorOpen = true;
  return 'You brush away the red sand and lever the wrench under the trapdoor. It groans open, revealing a ladder DOWN.';
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/commands.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/engine/commands.js tests/commands.test.js
git commit -m "feat: add phase 1 interaction beats"
```

---

### Task 8: Martian symbol login puzzle

**Files:**
- Create: `src/data/puzzles.js`
- Modify: `src/engine/commands.js`
- Test: `tests/puzzle.test.js`

- [ ] **Step 1: Write the failing test `tests/puzzle.test.js`**

```js
import { describe, it, expect } from 'vitest';
import { SYMBOL_PUZZLE, checkSymbolOrder } from '../src/data/puzzles.js';
import { createInitialState } from '../src/engine/state.js';
import { cmdEnter } from '../src/engine/commands.js';

describe('symbol login puzzle', () => {
  it('defines four symbols and a correct order', () => {
    expect(SYMBOL_PUZZLE.symbols).toHaveLength(4);
    expect(SYMBOL_PUZZLE.correctOrder).toEqual(['sun', 'star', 'beam', 'rock']);
  });

  it('accepts the right order and rejects wrong ones', () => {
    expect(checkSymbolOrder(['sun', 'star', 'beam', 'rock'])).toBe(true);
    expect(checkSymbolOrder(['star', 'sun', 'beam', 'rock'])).toBe(false);
  });

  it('logs in when the player enters the right order in the control room', () => {
    const s = createInitialState();
    s.room = 'terminalRoom';
    const wrong = cmdEnter(s, ['star', 'sun', 'beam', 'rock']);
    expect(s.flags.loggedIn).toBeFalsy();
    expect(wrong.toLowerCase()).toContain('wrong');
    const right = cmdEnter(s, ['sun', 'star', 'beam', 'rock']);
    expect(s.flags.loggedIn).toBe(true);
    expect(right.toLowerCase()).toContain('patrol');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/puzzle.test.js`
Expected: FAIL (cannot find module `src/data/puzzles.js`).

- [ ] **Step 3: Write `src/data/puzzles.js`**

```js
export const SYMBOL_PUZZLE = {
  // Displayed scrambled in the panel; clue (etching) gives the order.
  symbols: [
    { id: 'beam', glyph: '◈', label: 'BEAM' },
    { id: 'star', glyph: '⟁', label: 'STAR' },
    { id: 'sun', glyph: '☉', label: 'SUN' },
    { id: 'rock', glyph: '⬡', label: 'ROCK' },
  ],
  correctOrder: ['sun', 'star', 'beam', 'rock'],
};

export function checkSymbolOrder(attempt) {
  const want = SYMBOL_PUZZLE.correctOrder;
  if (!Array.isArray(attempt) || attempt.length !== want.length) return false;
  return attempt.every((v, i) => v === want[i]);
}
```

- [ ] **Step 4: Append `cmdEnter` to `src/engine/commands.js`**

```js
import { SYMBOL_PUZZLE, checkSymbolOrder } from '../data/puzzles.js';

// cmdEnter handles both the symbol login (terminalRoom) and the vault code (vault).
export function cmdEnter(state, words = []) {
  if (state.room === 'terminalRoom') {
    const known = new Set(SYMBOL_PUZZLE.symbols.map((s) => s.id));
    const attempt = words.filter((w) => known.has(w));
    if (state.flags.loggedIn) return 'You are already logged in.';
    if (checkSymbolOrder(attempt)) {
      state.flags.loggedIn = true;
      return (
        'The symbols light up in order and the terminal unlocks! The monitors flip to English. ' +
        'A red message scrolls: "PATROL RETURNS IN 5 MINUTES." The security door to the EAST clicks open.'
      );
    }
    return 'The symbols flash red — wrong order. Look for a clue in the room (try READ ETCHING).';
  }

  // vault handled in Task 10 (cmdEnter extended there)
  return vaultEnter(state, words);
}

// Placeholder until Task 10 fills it in; defined now to keep imports valid.
export function vaultEnter() {
  return 'There is nothing to enter here.';
}
```

> The `import` line goes at the top of `commands.js` with the other imports. Keep `vaultEnter` as a named export so Task 10 can replace its body.

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run tests/puzzle.test.js tests/commands.test.js`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/data/puzzles.js src/engine/commands.js tests/puzzle.test.js
git commit -m "feat: add Martian symbol login puzzle"
```

---

### Task 9: Patrol beat (hide / attack / talk → access code)

**Files:**
- Modify: `src/engine/commands.js`
- Test: `tests/patrol.test.js`

- [ ] **Step 1: Write the failing test `tests/patrol.test.js`**

```js
import { describe, it, expect } from 'vitest';
import { createInitialState, addItem } from '../src/engine/state.js';
import { cmdHide, cmdAttack, cmdTalk } from '../src/engine/commands.js';

function inCorridor() {
  const s = createInitialState();
  s.room = 'corridor';
  s.flags.loggedIn = true;
  return s;
}

describe('patrol beat', () => {
  it('stealth: HIDE earns the access code', () => {
    const s = inCorridor();
    const out = cmdHide(s);
    expect(s.flags.hasAccessCode).toBe(true);
    expect(s.notes.some((n) => /code/i.test(n.title))).toBe(true);
    expect(out.toLowerCase()).toContain('code');
  });

  it('combat: ATTACK ALIEN WITH WRENCH earns the access code', () => {
    const s = inCorridor();
    addItem(s, 'wrench');
    const out = cmdAttack(s, 'alien', 'wrench');
    expect(s.flags.hasAccessCode).toBe(true);
    expect(out.toLowerCase()).toContain('win');
  });

  it('combat without a weapon is a safe nudge, not a loss', () => {
    const s = inCorridor();
    const out = cmdAttack(s, 'alien', undefined);
    expect(s.flags.hasAccessCode).toBeFalsy();
    expect(out.toLowerCase()).toContain('need');
  });

  it('talking is always safe and hints what to do', () => {
    const s = inCorridor();
    const out = cmdTalk(s, 'alien');
    expect(s.flags.hasAccessCode).toBeFalsy();
    expect(out.toLowerCase()).toMatch(/hide|fight|out of sight/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/patrol.test.js`
Expected: FAIL (`cmdHide` not exported).

- [ ] **Step 3: Append to `src/engine/commands.js`**

```js
import { addNote } from './state.js'; // add to existing state import if not present

const ACCESS_CODE_NOTE = { title: 'Vault Access Code', text: 'blue 4' };

function grantAccessCode(state) {
  state.flags.hasAccessCode = true;
  addNote(state, ACCESS_CODE_NOTE);
}

export function cmdHide(state) {
  if (state.room !== 'corridor') return 'There is nothing to hide from here.';
  if (state.flags.hasAccessCode) return 'The corridor is quiet now.';
  grantAccessCode(state);
  return (
    'You slip into the alcove and hold your breath. The patrol alien clomps past, taps a code into a ' +
    'panel, and sets a CODE TABLET on the bench before leaving. You sneak out and read it: the access code is "blue 4". ' +
    '(Saved to your NOTES.) The way NORTH is clear.'
  );
}

export function cmdAttack(state, noun, noun2) {
  const target = resolveItem(state, noun);
  const isAlien = target === 'patrolAlien' || target === 'vaultAlien' || noun === 'alien';

  if (state.room === 'corridor' && !state.flags.hasAccessCode) {
    if (!noun2 || !hasItem(state, resolveItem(state, noun2))) {
      return 'You swing — but with empty hands the alien shoves you back. You need a weapon, like the WRENCH.';
    }
    grantAccessCode(state);
    return (
      'You bonk the patrol alien with the wrench and it crumples in a heap! You grab its CODE TABLET — ' +
      'the access code is "blue 4". (Saved to your NOTES.) You win! The way NORTH is clear.'
    );
  }

  if (!isAlien) return "There's nothing here to attack.";
  return 'You take a swing, but nothing happens.';
}

export function cmdTalk(state, noun) {
  if (state.room === 'corridor' && !state.flags.hasAccessCode) {
    return 'The alien squints at you, confused. It doesn\'t recognize you — better get OUT OF SIGHT (try HIDE) or be ready to fight!';
  }
  const id = resolveItem(state, noun);
  if (!id) return 'There is no one here to talk to.';
  return 'No response.';
}
```

> If `state.js` was imported as `import { hasItem, addItem, removeItem, visit } from './state.js';`, extend it to also import `addNote`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/patrol.test.js`
Expected: PASS (4 passed).

- [ ] **Step 5: Commit**

```bash
git add src/engine/commands.js tests/patrol.test.js
git commit -m "feat: add patrol beat with stealth and combat paths"
```

---

### Task 10: Vault — open door and trigger the cliffhanger

**Files:**
- Modify: `src/engine/commands.js`
- Test: `tests/vault.test.js`

- [ ] **Step 1: Write the failing test `tests/vault.test.js`**

```js
import { describe, it, expect } from 'vitest';
import { createInitialState } from '../src/engine/state.js';
import { cmdEnter, cmdTake } from '../src/engine/commands.js';
import { rooms } from '../src/data/world.js';

function inVault() {
  const s = createInitialState();
  s.room = 'vault';
  s.flags.hasAccessCode = true;
  // make crystal + sharpTool reachable like the real game does on open
  return s;
}

describe('vault', () => {
  it('opens the steel door with the right code', () => {
    const s = inVault();
    const wrong = cmdEnter(s, ['red', '9']);
    expect(s.flags.vaultOpen).toBeFalsy();
    expect(wrong.toLowerCase()).toContain('notes');
    const right = cmdEnter(s, ['blue', '4']);
    expect(s.flags.vaultOpen).toBe(true);
    expect(right.toLowerCase()).toContain('crystal');
    expect(rooms.vault.items).toContain('crystal');
    expect(rooms.vault.items).toContain('sharpTool');
  });

  it('taking the sharp tool triggers the cliffhanger and ends the slice', () => {
    const s = inVault();
    cmdEnter(s, ['blue', '4']);
    cmdTake(s, 'crystal');
    const out = cmdTake(s, 'sharp tool');
    expect(s.inventory).toContain('sharpTool');
    expect(s.flags.slice1Complete).toBe(true);
    expect(out.toLowerCase()).toContain('footsteps');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/vault.test.js`
Expected: FAIL (wrong vault behavior / `vaultEnter` is a stub).

- [ ] **Step 3: Replace the `vaultEnter` stub in `src/engine/commands.js`**

```js
const VAULT_CODE = 'blue 4';

export function vaultEnter(state, words = []) {
  if (state.room !== 'vault') return 'There is nothing to enter here.';
  if (state.flags.vaultOpen) return 'The vault is already open.';
  const attempt = words.join(' ').trim();
  if (attempt === VAULT_CODE) {
    state.flags.vaultOpen = true;
    const room = getRoom('vault');
    room.items = room.items || [];
    if (!room.items.includes('crystal')) room.items.push('crystal');
    if (!room.items.includes('sharpTool')) room.items.push('sharpTool');
    return 'The terminal beeps green and the STEEL DOOR slides open! Inside, a radiant CRYSTAL glows, and a SHARP TOOL lies in the corner.';
  }
  return 'The terminal buzzes — wrong code. Check your NOTES for the access code.';
}
```

- [ ] **Step 4: Add a take-hook for the sharp tool. Modify `cmdTake` in `src/engine/commands.js`**

Change the end of `cmdTake` so that taking `sharpTool` triggers the cliffhanger. Replace the final return of `cmdTake`:

```js
  room.items = room.items.filter((x) => x !== id);
  addItem(state, id);
  if (id === 'sharpTool') {
    state.flags.slice1Complete = true;
    return (
      'You pick up the sharp tool. Heavy FOOTSTEPS echo behind you — a second alien enters, sees the tool ' +
      'in your hand, and bares its teeth. Combat begins!\n\n' +
      '*** To be continued in the next chapter... ***'
    );
  }
  return `You take the ${item.name}.`;
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run tests/vault.test.js tests/commands.test.js`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/engine/commands.js tests/vault.test.js
git commit -m "feat: add vault unlock and slice-1 cliffhanger"
```

---

### Task 11: Progressive hint system

**Files:**
- Create: `src/engine/hints.js`
- Test: `tests/hints.test.js`

- [ ] **Step 1: Write the failing test `tests/hints.test.js`**

```js
import { describe, it, expect } from 'vitest';
import { createInitialState } from '../src/engine/state.js';
import { getHint } from '../src/engine/hints.js';

describe('hints', () => {
  it('gives the current goal as the first hint, escalating on repeat', () => {
    const s = createInitialState();
    const h1 = getHint(s);
    const h2 = getHint(s);
    expect(h1).not.toEqual(h2); // escalates
    expect(`${h1} ${h2}`.toLowerCase()).toContain('visor');
  });

  it('targets the right gate as the player progresses', () => {
    const s = createInitialState();
    s.flags.visorFixed = true;
    s.room = 'surface';
    expect(getHint(s).toLowerCase()).toContain('trapdoor');
  });

  it('resets escalation when the gate changes', () => {
    const s = createInitialState();
    getHint(s); getHint(s); // escalate cockpit
    s.flags.visorFixed = true; s.room = 'surface';
    const first = getHint(s);
    expect(first.toLowerCase()).toContain('trapdoor');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/hints.test.js`
Expected: FAIL (cannot find module).

- [ ] **Step 3: Write `src/engine/hints.js`**

```js
import { hasItem } from './state.js';

// Determine the current gate the player is working on, with escalating hints.
function currentGate(state) {
  if (!state.flags.visorFixed) {
    return {
      key: 'visor',
      hints: [
        'Your visor is cracked. Look around the cockpit for something to seal it.',
        'Try TAKE SEALANT, then USE SEALANT.',
        'Type: USE SEALANT — it patches your visor so you can go OUT.',
      ],
    };
  }
  if (!state.flags.trapdoorOpen) {
    return {
      key: 'trapdoor',
      hints: [
        'Go OUT to the surface and find a way underground.',
        'There is a trapdoor in the sand. You need something to pry it.',
        'TAKE the WRENCH from the cockpit, go OUT, then PRY TRAPDOOR.',
      ],
    };
  }
  if (!state.flags.loggedIn) {
    return {
      key: 'login',
      hints: [
        'Head DOWN into the base and find the control terminal.',
        'The terminal needs four symbols in order. Find a clue in the room.',
        'READ the ETCHING, then ENTER SUN STAR BEAM ROCK.',
      ],
    };
  }
  if (!state.flags.hasAccessCode) {
    return {
      key: 'patrol',
      hints: [
        'A patrol is coming through the EAST door. You need its access code.',
        'You can HIDE in the alcove, or fight if you have a weapon. Talking is safe.',
        'Type HIDE to sneak the code, or ATTACK ALIEN WITH WRENCH to fight.',
      ],
    };
  }
  if (!state.flags.vaultOpen) {
    return {
      key: 'vaultCode',
      hints: [
        'Go NORTH to the vault and use the terminal.',
        'Check your NOTES for the access code.',
        'Type: ENTER BLUE 4 at the vault terminal.',
      ],
    };
  }
  return {
    key: 'cliffhanger',
    hints: [
      'Take the treasures in the vault.',
      'TAKE the CRYSTAL, then TAKE the SHARP TOOL.',
      'Grab the SHARP TOOL to see what happens next!',
    ],
  };
}

export function getHint(state) {
  if (!state._hint) state._hint = { gate: null, step: 0 };
  const gate = currentGate(state);
  if (state._hint.gate !== gate.key) {
    state._hint.gate = gate.key;
    state._hint.step = 0;
  }
  const idx = Math.min(state._hint.step, gate.hints.length - 1);
  state._hint.step += 1;
  return gate.hints[idx];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/hints.test.js`
Expected: PASS (3 passed).

- [ ] **Step 5: Commit**

```bash
git add src/engine/hints.js tests/hints.test.js
git commit -m "feat: add progressive hint system"
```

---

### Task 12: Game orchestrator + NOTES + full walkthrough test

**Files:**
- Create: `src/engine/game.js`
- Test: `tests/walkthrough.test.js`

- [ ] **Step 1: Write the failing test `tests/walkthrough.test.js`**

```js
import { describe, it, expect, beforeEach } from 'vitest';
import { createGame } from '../src/engine/game.js';
import { rooms } from '../src/data/world.js';

// The game mutates shared room.items; reset the two mutated rooms before each run.
const pristine = {
  cockpit: ['missionScreen', 'sealant', 'wrench'],
  surface: ['trapdoor'],
  vault: ['vaultTerminal', 'steelDoor'],
};
beforeEach(() => {
  for (const [id, items] of Object.entries(pristine)) rooms[id].items = [...items];
});

function play(game, cmds) {
  return cmds.map((c) => game.handle(c));
}

describe('full slice-1 walkthrough', () => {
  it('completes via the STEALTH path', () => {
    const game = createGame();
    play(game, [
      'read mission screen', 'take sealant', 'use sealant', 'take wrench',
      'go out', 'pry trapdoor', 'go down', 'go down',
      'go north', 'read etching', 'enter sun star beam rock',
      'go south', 'go east', 'hide', 'go north',
      'enter blue 4', 'take crystal',
    ]);
    expect(game.state.flags.hasAccessCode).toBe(true);
    expect(game.state.flags.vaultOpen).toBe(true);
    const last = game.handle('take sharp tool');
    expect(game.state.flags.slice1Complete).toBe(true);
    expect(last.toLowerCase()).toContain('continued');
  });

  it('completes via the COMBAT path', () => {
    const game = createGame();
    play(game, [
      'take sealant', 'use sealant', 'take wrench',
      'go out', 'pry trapdoor', 'go down', 'go down',
      'go north', 'enter sun star beam rock',
      'go south', 'go east', 'attack alien with wrench', 'go north',
      'enter blue 4', 'take crystal', 'take sharp tool',
    ]);
    expect(game.state.flags.slice1Complete).toBe(true);
  });

  it('NOTES shows the access code after the patrol beat', () => {
    const game = createGame();
    game.state.room = 'corridor';
    game.state.flags.loggedIn = true;
    game.handle('hide');
    expect(game.handle('notes').toLowerCase()).toContain('blue 4');
  });

  it('unknown commands are handled kindly', () => {
    const game = createGame();
    expect(game.handle('xyzzy').toLowerCase()).toMatch(/don't|not sure|try/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/walkthrough.test.js`
Expected: FAIL (cannot find module `src/engine/game.js`).

- [ ] **Step 3: Write `src/engine/game.js`**

```js
import { createInitialState } from './state.js';
import { parse } from './parser.js';
import { nounVocab, getItem } from '../data/world.js';
import { getHint } from './hints.js';
import {
  describeRoom, cmdGo, cmdExamine, cmdTake, cmdDrop, cmdInventory,
  cmdRead, cmdUse, cmdPry, cmdEnter, cmdHide, cmdAttack, cmdTalk,
} from './commands.js';

const HELP_TEXT =
  'Commands you can try: LOOK, EXAMINE <thing>, GO <direction> (or N/S/E/W/U/D), ' +
  'TAKE <thing>, DROP <thing>, USE <thing>, READ <thing>, PRY <thing>, ' +
  'HIDE, ATTACK <foe> WITH <thing>, TALK, ENTER <code>, INVENTORY (I), NOTES, HELP (?).';

export function createGame() {
  const state = createInitialState();
  const vocab = nounVocab();

  function notes() {
    if (state.notes.length === 0) return 'Your notebook is empty so far.';
    return 'NOTES:\n' + state.notes.map((n) => `• ${n.title}: ${n.text}`).join('\n');
  }

  function handle(input) {
    const p = parse(input, vocab);
    if (!p.verb) return "I'm not sure what you mean. Type HELP or ? for ideas.";
    switch (p.verb) {
      case 'look': return describeRoom(state);
      case 'examine': return cmdExamine(state, p.noun);
      case 'go': return p.noun ? cmdGo(state, p.noun) : 'Go where? Try N, S, E, W, UP or DOWN.';
      case 'take': return cmdTake(state, p.noun);
      case 'drop': return cmdDrop(state, p.noun);
      case 'inventory': return cmdInventory(state);
      case 'read': return cmdRead(state, p.noun);
      case 'use': return cmdUse(state, p.noun, p.noun2);
      case 'pry': return cmdPry(state, p.noun);
      case 'open': return p.noun === 'trapdoor' ? cmdPry(state, 'trapdoor') : cmdUse(state, p.noun, p.noun2);
      case 'enter': return cmdEnter(state, p.words || []);
      case 'hide': return cmdHide(state);
      case 'attack': return cmdAttack(state, p.noun, p.noun2);
      case 'talk': return cmdTalk(state, p.noun);
      case 'notes': return notes();
      case 'help': return getHint(state) + '\n\n' + HELP_TEXT;
      default: return "I don't know how to do that. Type HELP or ?.";
    }
  }

  // initial room description
  const intro = describeRoom(state);
  return { state, handle, intro };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/walkthrough.test.js`
Expected: PASS (4 passed). Then run the full suite: `npm test` — all green.

- [ ] **Step 5: Commit**

```bash
git add src/engine/game.js tests/walkthrough.test.js
git commit -m "feat: add game orchestrator and full walkthrough tests"
```

---

### Task 13: Save / load via localStorage

**Files:**
- Create: `src/engine/save.js`
- Modify: `src/engine/game.js`
- Test: `tests/save.test.js`

- [ ] **Step 1: Write the failing test `tests/save.test.js`**

```js
import { describe, it, expect } from 'vitest';
import { saveState, loadState, clearState } from '../src/engine/save.js';

function fakeStorage() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
  };
}

describe('save/load', () => {
  it('round-trips state through storage', () => {
    const store = fakeStorage();
    const state = { room: 'vault', inventory: ['crystal'], flags: { vaultOpen: true }, notes: [], visited: ['cockpit'], puzzles: {} };
    saveState(state, store);
    const loaded = loadState(store);
    expect(loaded.room).toBe('vault');
    expect(loaded.inventory).toEqual(['crystal']);
    expect(loaded.flags.vaultOpen).toBe(true);
  });

  it('returns null when nothing is saved and clears cleanly', () => {
    const store = fakeStorage();
    expect(loadState(store)).toBeNull();
    saveState({ room: 'cockpit' }, store);
    clearState(store);
    expect(loadState(store)).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/save.test.js`
Expected: FAIL (cannot find module).

- [ ] **Step 3: Write `src/engine/save.js`**

```js
const KEY = 'marsMissionMayhem.slice1';

function defaultStorage() {
  return typeof localStorage !== 'undefined' ? localStorage : null;
}

export function saveState(state, storage = defaultStorage()) {
  if (!storage) return;
  try {
    storage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage full or unavailable — ignore, game still playable */
  }
}

export function loadState(storage = defaultStorage()) {
  if (!storage) return null;
  const raw = storage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearState(storage = defaultStorage()) {
  if (!storage) return;
  storage.removeItem(KEY);
}
```

- [ ] **Step 4: Wire autosave into `src/engine/game.js`**

Add the import at the top:

```js
import { saveState, loadState } from './save.js';
```

In `createGame()`, after `const vocab = nounVocab();`, load any saved state:

```js
  const saved = loadState();
  if (saved && saved.room) Object.assign(state, saved);
```

At the end of `handle(input)`, autosave before returning. Wrap the switch so every path saves. Replace the `switch` return style by capturing the result:

```js
  function handle(input) {
    const p = parse(input, vocab);
    let out;
    if (!p.verb) {
      out = "I'm not sure what you mean. Type HELP or ? for ideas.";
    } else {
      out = dispatch(p);
    }
    saveState(state);
    return out;
  }

  function dispatch(p) {
    switch (p.verb) {
      case 'look': return describeRoom(state);
      case 'examine': return cmdExamine(state, p.noun);
      case 'go': return p.noun ? cmdGo(state, p.noun) : 'Go where? Try N, S, E, W, UP or DOWN.';
      case 'take': return cmdTake(state, p.noun);
      case 'drop': return cmdDrop(state, p.noun);
      case 'inventory': return cmdInventory(state);
      case 'read': return cmdRead(state, p.noun);
      case 'use': return cmdUse(state, p.noun, p.noun2);
      case 'pry': return cmdPry(state, p.noun);
      case 'open': return p.noun === 'trapdoor' ? cmdPry(state, 'trapdoor') : cmdUse(state, p.noun, p.noun2);
      case 'enter': return cmdEnter(state, p.words || []);
      case 'hide': return cmdHide(state);
      case 'attack': return cmdAttack(state, p.noun, p.noun2);
      case 'talk': return cmdTalk(state, p.noun);
      case 'notes': return notes();
      case 'help': return getHint(state) + '\n\n' + HELP_TEXT;
      default: return "I don't know how to do that. Type HELP or ?.";
    }
  }
```

> Add `import { clearState }` is not needed yet; the UI "Restart" (Task 16) imports it separately.

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test`
Expected: ALL green (walkthrough still passes; save tests pass). The walkthrough test runs in Node where `localStorage` is undefined, so `saveState` safely no-ops.

- [ ] **Step 6: Commit**

```bash
git add src/engine/save.js src/engine/game.js tests/save.test.js
git commit -m "feat: add continuous autosave and resume"
```

---

### Task 14: UI styling (split-pane theme)

**Files:**
- Create: `src/ui/styles.css`

- [ ] **Step 1: Write `src/ui/styles.css`**

```css
:root {
  --bg: #1a0e0a;
  --panel: #241310;
  --rust: #c1440e;
  --rust-light: #e9743a;
  --text: #f4e6d8;
  --dim: #b89a86;
  --good: #6ee7b7;
  --glow: 0 0 12px rgba(233, 116, 58, 0.6);
}
* { box-sizing: border-box; }
body {
  margin: 0;
  font-family: 'Trebuchet MS', 'Segoe UI', system-ui, sans-serif;
  background: radial-gradient(circle at 30% 20%, #3a1c12, var(--bg));
  color: var(--text);
  line-height: 1.25;
}
#app { display: flex; gap: 12px; padding: 12px; height: 100vh; }
#left { flex: 1.3; display: flex; flex-direction: column; min-width: 0; }
#right { flex: 1; display: flex; flex-direction: column; gap: 12px; min-width: 0; }
.pane {
  background: var(--panel);
  border: 2px solid var(--rust);
  border-radius: 12px;
  padding: 14px;
  box-shadow: var(--glow);
}
#console { flex: 1; overflow-y: auto; white-space: pre-wrap; }
#console .room { color: var(--rust-light); font-weight: bold; }
#console .you { color: var(--good); }
#console p { margin: 0 0 10px; }
#inputRow { display: flex; gap: 8px; margin-top: 10px; position: relative; }
#input {
  flex: 1; font-size: 1.1rem; padding: 10px; border-radius: 8px;
  border: 2px solid var(--rust); background: #160b08; color: var(--text);
}
#help-btn, #input-go {
  border: none; border-radius: 8px; padding: 0 14px; font-size: 1.2rem;
  background: var(--rust); color: white; cursor: pointer;
}
#suggest {
  position: absolute; bottom: 52px; left: 0; background: #160b08;
  border: 1px solid var(--rust); border-radius: 8px; display: none; z-index: 5;
}
#suggest div { padding: 6px 12px; cursor: pointer; }
#suggest div.active, #suggest div:hover { background: var(--rust); }
#panel { flex: 1; min-height: 180px; }
#exits button, #objects button {
  margin: 4px; padding: 6px 10px; border-radius: 16px; border: 1px solid var(--rust-light);
  background: transparent; color: var(--text); cursor: pointer;
}
#minimap { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
.cell { text-align: center; padding: 8px 4px; border-radius: 8px; font-size: 0.8rem; background: #160b08; color: var(--dim); }
.cell.here { background: var(--rust); color: white; box-shadow: var(--glow); }
.cell.seen { color: var(--text); }
.symbols { display: flex; gap: 10px; flex-wrap: wrap; }
.symbol {
  font-size: 2.2rem; width: 64px; height: 64px; display: flex; align-items: center;
  justify-content: center; border: 2px solid var(--rust); border-radius: 10px; cursor: pointer;
}
.symbol.picked { background: var(--rust); box-shadow: var(--glow); }
h3 { margin: 0 0 8px; color: var(--rust-light); }
```

- [ ] **Step 2: Commit**

```bash
git add src/ui/styles.css
git commit -m "feat: add split-pane Mars theme styling"
```

---

### Task 15: UI rendering (console, inventory, minimap, panel)

**Files:**
- Create: `src/ui/render.js`
- Test: `tests/render.test.js`

- [ ] **Step 1: Write the failing test `tests/render.test.js`**

Use Vitest's jsdom environment via an inline pragma.

```js
// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { renderMinimap, renderExits, appendLine } from '../src/ui/render.js';

beforeEach(() => { document.body.innerHTML = '<div id="console"></div><div id="minimap"></div><div id="exits"></div>'; });

describe('render', () => {
  it('appends a line to the console', () => {
    appendLine('Hello Mars', 'room');
    expect(document.getElementById('console').textContent).toContain('Hello Mars');
  });

  it('marks the current room in the minimap', () => {
    renderMinimap({ room: 'surface', visited: ['cockpit', 'surface'] });
    const here = document.querySelector('.cell.here');
    expect(here.textContent.toLowerCase()).toContain('surface');
  });

  it('renders a button per available exit', () => {
    const clicks = [];
    renderExits(['out', 'down'], (cmd) => clicks.push(cmd));
    const btns = document.querySelectorAll('#exits button');
    expect(btns).toHaveLength(2);
    btns[0].click();
    expect(clicks[0]).toBe('go out');
  });
});
```

- [ ] **Step 2: Add jsdom dev dependency**

Run: `npm install -D jsdom`
Then run: `npx vitest run tests/render.test.js`
Expected: FAIL (cannot find module `src/ui/render.js`).

- [ ] **Step 3: Write `src/ui/render.js`**

```js
import { getRoom } from '../data/world.js';

const MAP_LAYOUT = [
  ['surface', 'shaft', ''],
  ['cockpit', 'entryHall', 'terminalRoom'],
  ['', 'corridor', 'vault'],
];
const ROOM_SHORT = {
  cockpit: 'Cockpit', surface: 'Surface', shaft: 'Shaft', entryHall: 'Entry',
  terminalRoom: 'Control', corridor: 'Corridor', vault: 'Vault',
};

export function appendLine(textStr, cls = '') {
  const el = document.getElementById('console');
  const p = document.createElement('p');
  if (cls) p.className = cls;
  p.textContent = textStr;
  el.appendChild(p);
  el.scrollTop = el.scrollHeight;
}

export function renderMinimap(state) {
  const map = document.getElementById('minimap');
  map.innerHTML = '';
  for (const row of MAP_LAYOUT) {
    for (const id of row) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      if (!id) { cell.style.visibility = 'hidden'; cell.textContent = '.'; map.appendChild(cell); continue; }
      cell.textContent = state.visited.includes(id) ? ROOM_SHORT[id] : '???';
      if (state.visited.includes(id)) cell.classList.add('seen');
      if (state.room === id) cell.classList.add('here');
      map.appendChild(cell);
    }
  }
}

export function renderExits(exits, onCommand) {
  const box = document.getElementById('exits');
  box.innerHTML = '<h3>Go</h3>';
  for (const dir of exits) {
    const b = document.createElement('button');
    b.textContent = dir.toUpperCase();
    b.onclick = () => onCommand(`go ${dir}`);
    box.appendChild(b);
  }
}

export function renderObjects(state, onCommand) {
  const box = document.getElementById('objects');
  if (!box) return;
  box.innerHTML = '<h3>Look at</h3>';
  const room = getRoom(state.room);
  for (const id of room.items || []) {
    const item = getRoom ? room && id : id;
    const b = document.createElement('button');
    const { getItem } = window.__mmm || {};
    const name = getItem ? getItem(id).name : id;
    b.textContent = name;
    b.onclick = () => onCommand(`examine ${name}`);
    box.appendChild(b);
  }
}
```

> `renderObjects` is wired fully in Task 16 where `window.__mmm` is set; the tested functions are `appendLine`, `renderMinimap`, `renderExits`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/render.test.js`
Expected: PASS (3 passed).

- [ ] **Step 5: Commit**

```bash
git add package.json src/ui/render.js tests/render.test.js
git commit -m "feat: add UI rendering helpers"
```

---

### Task 16: Autocomplete + main bootstrap (wire it all together)

**Files:**
- Create: `src/ui/autocomplete.js`
- Create: `src/ui/main.js`
- Test: `tests/autocomplete.test.js`

- [ ] **Step 1: Write the failing test `tests/autocomplete.test.js`**

```js
import { describe, it, expect } from 'vitest';
import { suggest } from '../src/ui/autocomplete.js';

const WORDS = ['look', 'sealant', 'wrench', 'sun', 'star', 'beam', 'rock', 'trapdoor'];

describe('autocomplete', () => {
  it('suggests words that start with the last token', () => {
    expect(suggest('use se', WORDS)).toContain('sealant');
  });

  it('returns nothing for an empty input', () => {
    expect(suggest('', WORDS)).toEqual([]);
  });

  it('caps the number of suggestions', () => {
    expect(suggest('s', WORDS).length).toBeLessThanOrEqual(5);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/autocomplete.test.js`
Expected: FAIL (cannot find module).

- [ ] **Step 3: Write `src/ui/autocomplete.js`**

```js
export function suggest(input, vocabulary, max = 5) {
  const text = String(input).toLowerCase();
  const lastSpace = text.lastIndexOf(' ');
  const prefix = text.slice(lastSpace + 1);
  if (!prefix) return [];
  return vocabulary.filter((w) => w.startsWith(prefix) && w !== prefix).slice(0, max);
}

export function applySuggestion(input, word) {
  const lastSpace = input.lastIndexOf(' ');
  return (lastSpace === -1 ? '' : input.slice(0, lastSpace + 1)) + word + ' ';
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/autocomplete.test.js`
Expected: PASS (3 passed).

- [ ] **Step 5: Write `src/ui/main.js`**

```js
import { createGame } from '../engine/game.js';
import { clearState } from '../engine/save.js';
import { nounVocab, getItem } from '../data/world.js';
import { availableExits } from '../engine/commands.js';
import { appendLine, renderMinimap, renderExits } from './render.js';
import { suggest, applySuggestion } from './autocomplete.js';
import { renderPanel } from './panel.js';

const VERBS = ['look', 'examine', 'go', 'take', 'drop', 'use', 'read', 'pry',
  'hide', 'attack', 'talk', 'enter', 'inventory', 'notes', 'help', 'north', 'south', 'east', 'west', 'up', 'down'];

function boot() {
  // expose item lookup for render helpers (merge — do NOT clobber roomItems set below)
  window.__mmm = Object.assign(window.__mmm || {}, { getItem });
  const game = createGame();
  const vocab = [...VERBS, ...nounVocab()];

  const input = document.getElementById('input');
  const suggestBox = document.getElementById('suggest');

  function refresh() {
    renderMinimap(game.state);
    renderExits(availableExits(game.state), runCommand);
    renderObjectsRow();
    renderPanel(game.state, runCommand);
  }

  function renderObjectsRow() {
    const box = document.getElementById('objects');
    box.innerHTML = '<h3>Look at</h3>';
    const ids = (gameRoomItems());
    for (const id of ids) {
      const name = getItem(id).name;
      const b = document.createElement('button');
      b.textContent = name;
      b.onclick = () => runCommand(`examine ${name}`);
      box.appendChild(b);
    }
  }
  function gameRoomItems() {
    // read current room items from the world via a fresh import-free path
    return window.__mmm.roomItems ? window.__mmm.roomItems(game.state.room) : [];
  }

  function runCommand(cmd) {
    appendLine(`> ${cmd}`, 'you');
    const out = game.handle(cmd);
    appendLine(out);
    refresh();
    input.value = '';
    hideSuggest();
  }

  function hideSuggest() { suggestBox.style.display = 'none'; }

  input.addEventListener('input', () => {
    const matches = suggest(input.value, vocab);
    if (matches.length === 0) return hideSuggest();
    suggestBox.innerHTML = '';
    matches.forEach((w) => {
      const d = document.createElement('div');
      d.textContent = w;
      d.onclick = () => { input.value = applySuggestion(input.value, w); input.focus(); hideSuggest(); };
      suggestBox.appendChild(d);
    });
    suggestBox.style.display = 'block';
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && input.value.trim()) runCommand(input.value.trim());
    if (e.key === 'Escape') hideSuggest();
  });

  document.getElementById('input-go').onclick = () => input.value.trim() && runCommand(input.value.trim());
  document.getElementById('help-btn').onclick = () => runCommand('help');
  document.getElementById('restart-btn').onclick = () => {
    if (confirm('Start over from the crash?')) { clearState(); location.reload(); }
  };

  appendLine(game.intro, 'room');
  refresh();
  input.focus();
}

document.addEventListener('DOMContentLoaded', boot);

// helper exposed for render: list current room items
import { rooms } from '../data/world.js';
window.__mmm = window.__mmm || {};
window.__mmm.roomItems = (id) => (rooms[id] && rooms[id].items) || [];
```

> `panel.js` is created in Task 17. `main.js` is not unit-tested (it is the DOM bootstrap); it is verified by the build smoke test (Task 18) and the manual playtest (Task 19).

- [ ] **Step 6: Commit**

```bash
git add src/ui/autocomplete.js src/ui/main.js tests/autocomplete.test.js
git commit -m "feat: add autocomplete and UI bootstrap"
```

---

### Task 17: Visual panel — symbol puzzle + default map view

**Files:**
- Create: `src/ui/panel.js`
- Test: `tests/panel.test.js`

- [ ] **Step 1: Write the failing test `tests/panel.test.js`**

```js
// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { renderPanel } from '../src/ui/panel.js';

beforeEach(() => { document.body.innerHTML = '<div id="panel"></div>'; });

describe('visual panel', () => {
  it('shows the four Martian symbols in the control room', () => {
    renderPanel({ room: 'terminalRoom', flags: {}, puzzles: { symbolLogin: { attempt: [] } } }, () => {});
    expect(document.querySelectorAll('.symbol')).toHaveLength(4);
  });

  it('clicking symbols builds an ENTER command when four are chosen', () => {
    let cmd = null;
    renderPanel({ room: 'terminalRoom', flags: {}, puzzles: { symbolLogin: { attempt: [] } } }, (c) => { cmd = c; });
    const syms = document.querySelectorAll('.symbol');
    syms.forEach((s) => s.click()); // pick all four in displayed order
    expect(cmd).toMatch(/^enter /);
  });

  it('shows a friendly default panel elsewhere', () => {
    renderPanel({ room: 'cockpit', flags: {}, puzzles: {} }, () => {});
    expect(document.getElementById('panel').textContent.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/panel.test.js`
Expected: FAIL (cannot find module).

- [ ] **Step 3: Write `src/ui/panel.js`**

```js
import { SYMBOL_PUZZLE } from '../data/puzzles.js';

export function renderPanel(state, onCommand) {
  const panel = document.getElementById('panel');
  if (!panel) return;

  if (state.room === 'terminalRoom' && !state.flags.loggedIn) {
    renderSymbolPuzzle(panel, onCommand);
    return;
  }
  renderDefault(panel, state);
}

function renderSymbolPuzzle(panel, onCommand) {
  panel.innerHTML = '<h3>Martian Login</h3><p>Tap the symbols in the right order. Find the clue in the room!</p>';
  const row = document.createElement('div');
  row.className = 'symbols';
  const picked = [];
  SYMBOL_PUZZLE.symbols.forEach((sym) => {
    const b = document.createElement('div');
    b.className = 'symbol';
    b.textContent = sym.glyph;
    b.title = sym.label;
    b.onclick = () => {
      if (picked.includes(sym.id)) return;
      picked.push(sym.id);
      b.classList.add('picked');
      if (picked.length === SYMBOL_PUZZLE.symbols.length) {
        onCommand(`enter ${picked.join(' ')}`);
      }
    };
    row.appendChild(b);
  });
  panel.appendChild(row);
}

function renderDefault(panel, state) {
  panel.innerHTML = `<h3>Mission</h3><p>Explore the Martian base, get past the patrol, and reach the vault.</p>
    <p style="color:var(--dim)">Room: ${state.room}</p>`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/panel.test.js`
Expected: PASS (3 passed). Then `npm test` — full suite green.

- [ ] **Step 5: Commit**

```bash
git add src/ui/panel.js tests/panel.test.js
git commit -m "feat: add visual panel with symbol puzzle"
```

---

### Task 18: Build script → single `index.html`

**Files:**
- Create: `build.mjs`
- Create: `index.template.html`
- Test: `tests/build.test.js`

- [ ] **Step 1: Write `index.template.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Mars Mission Mayhem</title>
  <style>/*__CSS__*/</style>
</head>
<body>
  <div id="app">
    <div id="left" class="pane">
      <div id="console"></div>
      <div id="inputRow">
        <div id="suggest"></div>
        <input id="input" autocomplete="off" placeholder="Type a command… (try LOOK or HELP)" />
        <button id="input-go">▶</button>
        <button id="help-btn">?</button>
      </div>
    </div>
    <div id="right">
      <div id="panel" class="pane"></div>
      <div id="exits" class="pane"></div>
      <div id="objects" class="pane"></div>
      <div class="pane"><h3>Map</h3><div id="minimap"></div>
        <button id="restart-btn" style="margin-top:10px">Restart</button></div>
    </div>
  </div>
  <script type="module">/*__JS__*/</script>
</body>
</html>
```

- [ ] **Step 2: Write `build.mjs`**

```js
// Dependency-free build: flatten ES modules + CSS into one index.html.
import { readFileSync, writeFileSync } from 'node:fs';

// Build order: dependencies before dependents. All modules share one scope,
// so we strip `import ... from ...` lines and the `export ` keyword.
const MODULES = [
  'src/data/world.js',
  'src/data/puzzles.js',
  'src/engine/state.js',
  'src/engine/parser.js',
  'src/engine/commands.js',
  'src/engine/hints.js',
  'src/engine/save.js',
  'src/engine/game.js',
  'src/ui/render.js',
  'src/ui/panel.js',
  'src/ui/autocomplete.js',
  'src/ui/main.js',
];

function strip(src) {
  return src
    .split('\n')
    .filter((line) => !/^\s*import\s.+from\s.+;?\s*$/.test(line))
    .map((line) => line.replace(/^\s*export\s+(?=function|const|class|let|var)/, ''))
    .join('\n');
}

const js = MODULES.map((f) => `// ===== ${f} =====\n${strip(readFileSync(f, 'utf8'))}`).join('\n\n');
const css = readFileSync('src/ui/styles.css', 'utf8');

let html = readFileSync('index.template.html', 'utf8');
html = html.replace('/*__CSS__*/', css).replace('/*__JS__*/', js);
writeFileSync('index.html', html);
console.log(`Built index.html (${html.length} bytes)`);
```

> **Important constraint this build relies on:** because all modules are concatenated into one scope, **every top-level name must be unique across modules** and there are **no default exports**. The naming in this plan already satisfies this. The `main.js` bootstrap runs last and references everything by its now-global name.

- [ ] **Step 3: Write `tests/build.test.js`**

```js
import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';

describe('build', () => {
  it('produces a single self-contained index.html', () => {
    execSync('node build.mjs');
    expect(existsSync('index.html')).toBe(true);
    const html = readFileSync('index.html', 'utf8');
    expect(html).not.toContain('import {'); // imports were stripped
    expect(html).not.toMatch(/\bexport function\b/); // exports were stripped
    expect(html).toContain('createGame'); // engine inlined
    expect(html).toContain('id="console"'); // template intact
  });
});
```

- [ ] **Step 4: Run the build and test**

Run: `npm run build && npx vitest run tests/build.test.js`
Expected: build prints byte count; test PASSES (1 passed).

- [ ] **Step 5: Manual browser check**

Run: `python3 -m http.server 8000` then open `http://localhost:8000/` in a browser.
Expected: the cockpit description appears; typing `look`, `take sealant`, `use sealant`, `go out` works; the map and panel update. (Full playthrough is Task 19.)

- [ ] **Step 6: Commit**

```bash
git add build.mjs index.template.html index.html tests/build.test.js
git commit -m "build: inline modules into single index.html"
```

---

### Task 19: README, deploy notes, and playtest checklist

**Files:**
- Create: `README.md`
- Create: `docs/PLAYTEST.md`

- [ ] **Step 1: Write `README.md`**

```markdown
# Mars Mission Mayhem 🪐

A Zork-style text adventure for 3rd graders. You are the only survivor of a crash on Mars —
explore the abandoned base, get past the patrol, and reach the vault.

## Play locally
Open `index.html` in a browser, or serve the folder: `python3 -m http.server 8000`.

## Develop
- `npm install` — install dev tools (Vitest, jsdom)
- `npm test` — run all tests
- `npm run build` — rebuild `index.html` from `src/`

Game logic lives in `src/` as small modules; `build.mjs` flattens them into the single
deployable `index.html`. **Always run `npm run build` after editing `src/` and commit the
updated `index.html`.**

## Deploy (GitHub Pages)
1. Push to the `main` branch of a public repo named `mars-mission-mayhem`.
2. Repo Settings → Pages → Source: `main` branch (root) → Save.
3. Play at `https://<username>.github.io/mars-mission-mayhem/`.
```

- [ ] **Step 2: Write `docs/PLAYTEST.md`**

```markdown
# Slice 1 Playtest Checklist

Play in a browser (rebuild first: `npm run build`). Tick each item.

## Phase 1 — Cockpit & Surface
- [ ] Opening text shows "only survivor" and the cracked visor.
- [ ] `read mission screen` shows the HOSTILE / abort-mission log.
- [ ] `go out` is blocked until `use sealant`.
- [ ] `take wrench`, `go out` → surface text mentions the sandstorm.
- [ ] `pry trapdoor` fails without the wrench, succeeds with it.

## Phase 2 — Base & Login
- [ ] `go down` twice reaches the Entry Hall (breathable-air line shown).
- [ ] EAST door is locked until login.
- [ ] In Control Room, `read etching` reveals the order; panel shows 4 symbols.
- [ ] Entering the right order (typed OR by clicking symbols) logs in and shows the patrol warning.

## Phase 3 — Patrol & Vault
- [ ] STEALTH: `hide` grants the code; `notes` shows "blue 4".
- [ ] COMBAT: `attack alien with wrench` grants the code; empty-handed attack is a safe nudge.
- [ ] `talk` to the alien never ends the game.
- [ ] NORTH is blocked until you have the code.
- [ ] `enter blue 4` opens the steel door; crystal + sharp tool appear.
- [ ] `take sharp tool` shows the "to be continued" cliffhanger.

## Cross-cutting
- [ ] `help` / `?` gives an escalating hint for the current step.
- [ ] Misspellings (e.g., `tak seelant`) still work.
- [ ] Refreshing the page resumes in the same room with the same inventory.
- [ ] Autocomplete suggests words as you type.
- [ ] A 3rd grader can finish using only typing, clicks, and HELP.
```

- [ ] **Step 3: Run the full suite one last time**

Run: `npm test`
Expected: ALL tests pass.

- [ ] **Step 4: Commit**

```bash
git add README.md docs/PLAYTEST.md
git commit -m "docs: add README and slice-1 playtest checklist"
```

---

## Self-Review Notes (completed during planning)

- **Spec coverage:** split-pane UI (Tasks 14–17), forgiving parser + autocomplete (Tasks 3, 16), abbreviations (Task 3), clickable exits/objects/symbols (Tasks 15–17), inventory + NOTES (Tasks 6, 12), progressive hints (Task 11), continuous autosave/resume (Task 13), all seven rooms + both patrol paths converging on `hasAccessCode` (Tasks 4, 9, 12), symbol visual puzzle (Tasks 8, 17), deterministic no-death combat (Task 9), narrative-only oxygen (no timer — Task 4 text), crystal carried for later payoff (Task 10), single `index.html` build + GitHub Pages (Tasks 18–19). All spec sections map to a task.
- **Placeholder scan:** the only deferred bodies are `vaultEnter` (stub in Task 8, filled in Task 10) and `panel.js`/`renderObjects` wiring (created in Tasks 16–17) — each has an explicit completing task. No "TODO/TBD" left in shipped code.
- **Type consistency:** room ids, item ids, flags, the code string `"blue 4"`, and symbol order `['sun','star','beam','rock']` are fixed in the File Structure header and used identically across data, commands, tests, hints, and walkthrough.
```
