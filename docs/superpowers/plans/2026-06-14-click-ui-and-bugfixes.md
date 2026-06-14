# Click-Only UI Redesign + Bug Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the typed-command interface with a fully click-based UI so Diego (3rd grade) can play without knowing keyboard layout, and fix three bugs along the way.

**Architecture:** Bug fixes touch only engine/data files; UI changes are isolated to the three UI files (`main.js`, `render.js`, `styles.css`) and the HTML template. The engine is untouched by the UI work — `runCommand` stays the bridge.

**Tech Stack:** Vanilla JS (ES modules), Vitest, jsdom for DOM tests, esbuild via `build.mjs`

---

## File Map

| File | Change |
|------|--------|
| `src/engine/game.js` | Fix `open` dispatch — cockpit hatch goes OUT, hatch/door noun → pry |
| `src/data/world.js` | Fix cockpit description — dynamic locker contents from `room.items` |
| `index.template.html` | Remove input row + exits/objects divs; add `#commands` grid; reorder right pane; add about |
| `src/ui/styles.css` | Remove input/suggest rules; add command grid + cmd-section + about styles |
| `src/ui/main.js` | Remove all input/autocomplete code; add `renderCommands` + `contextUseActions`; slim imports |
| `src/ui/render.js` | Remove `renderExits` and `renderObjects` exports (no longer called) |
| `tests/walkthrough.test.js` | Add two tests for the open-hatch fix |
| `tests/commands.test.js` | Add test for locker description after items taken |
| `tests/render.test.js` | Remove `renderExits` import + test (function deleted) |

---

## Task 1 — Bug fix: "open hatch" in cockpit

**Files:**
- Modify: `src/engine/game.js` (line 51, the `open` case)
- Modify: `tests/walkthrough.test.js`

The `open` dispatch currently checks `p.noun === 'trapdoor'` literally, but the parser returns `p.noun = 'hatch'` (the alias word). The global item fallback in `resolveItem` then finds the trapdoor and routes to `cmdUse`, which says "You can't use the trapdoor like that."

Fix strategy:
- In cockpit + noun is hatch/door/exit → `cmdGo(state, 'out')`
- Noun is trapdoor/hatch/door (elsewhere) → `cmdPry(state, p.noun)`
- Anything else → `cmdUse` (handles locker, etc.)

- [ ] **Step 1: Write two failing tests in `tests/walkthrough.test.js`**

Add inside the existing `describe('full slice-1 walkthrough', ...)` block:

```js
it('open hatch in cockpit exits when visor is fixed', () => {
  const game = createGame();
  game.state.flags.visorFixed = true;
  game.handle('open hatch');
  expect(game.state.room).toBe('surface');
});

it('open hatch in cockpit blocked by oxygen warning when visor not fixed', () => {
  const game = createGame();
  const out = game.handle('open hatch');
  expect(out.toLowerCase()).toContain('oxygen');
  expect(game.state.room).toBe('cockpit');
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd /Users/davebartelli/Projects/mars_mission_mayhem && npm test -- tests/walkthrough.test.js
```

Expected: 2 new tests fail (open hatch gives wrong message / wrong room).

- [ ] **Step 3: Fix the `open` case in `src/engine/game.js`**

Replace line 51:
```js
case 'open': return (p.noun === 'trapdoor') ? cmdPry(state, 'trapdoor') : cmdUse(state, p.noun, p.noun2);
```
With:
```js
case 'open': {
  if (state.room === 'cockpit' && p.noun && ['hatch', 'door', 'exit'].includes(p.noun))
    return cmdGo(state, 'out');
  if (['trapdoor', 'hatch', 'door'].includes(p.noun)) return cmdPry(state, p.noun);
  return cmdUse(state, p.noun, p.noun2);
}
```

- [ ] **Step 4: Run all tests to confirm they pass**

```bash
npm test
```

Expected: all 56 + 2 = 58 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/engine/game.js tests/walkthrough.test.js
git commit -m "fix: open hatch in cockpit correctly exits to surface"
```

---

## Task 2 — Bug fix: locker description shows taken items

**Files:**
- Modify: `src/data/world.js` (cockpit description function, lines 7–15)
- Modify: `tests/commands.test.js`

The cockpit description hardcodes "SUPER GLUE, WRENCH, and FIRST AID KIT inside" when `lockerOpen` is true, regardless of what's actually still in `room.items`. Fix by reading `rooms.cockpit.items` at call time.

- [ ] **Step 1: Write a failing test in `tests/commands.test.js`**

Add inside the existing `describe('phase 1 beats', ...)` block:

```js
it('locker description drops items already taken', () => {
  const s = createInitialState();
  cmdUse(s, 'locker');      // opens locker, adds sealant/wrench/firstAidKit to room
  cmdTake(s, 'super glue'); // removes sealant
  cmdTake(s, 'wrench');     // removes wrench
  cmdTake(s, 'first aid kit'); // removes firstAidKit
  const desc = describeRoom(s);
  expect(desc).not.toMatch(/SUPER GLUE|WRENCH|FIRST AID KIT/);
  expect(desc).toContain('empty');
});
```

- [ ] **Step 2: Run tests to confirm it fails**

```bash
npm test -- tests/commands.test.js
```

Expected: new test fails — description still shows all three items.

- [ ] **Step 3: Fix the cockpit description in `src/data/world.js`**

Replace lines 7–15 (the cockpit description function):
```js
description: (s) =>
  (s.flags.visorFixed
    ? 'Your visor is patched and holding. '
    : 'A red OXYGEN LOW warning blinks — your helmet visor is cracked. ') +
  'A MISSION SCREEN flickers on the dashboard. ' +
  'An EXIT HATCH leads outside. Along the wall is a STORAGE LOCKER' +
  (s.flags.lockerOpen
    ? ' (open — SUPER GLUE, WRENCH, and FIRST AID KIT inside).'
    : ' (shut).'),
```
With:
```js
description: (s) => {
  const base =
    (s.flags.visorFixed
      ? 'Your visor is patched and holding. '
      : 'A red OXYGEN LOW warning blinks — your helmet visor is cracked. ') +
    'A MISSION SCREEN flickers on the dashboard. ' +
    'An EXIT HATCH leads outside. Along the wall is a STORAGE LOCKER';
  if (!s.flags.lockerOpen) return base + ' (shut).';
  const r = rooms.cockpit;
  const inside = [];
  if ((r.items || []).includes('sealant')) inside.push('SUPER GLUE');
  if ((r.items || []).includes('wrench')) inside.push('WRENCH');
  if ((r.items || []).includes('firstAidKit')) inside.push('FIRST AID KIT');
  return base + (inside.length ? ` (open — ${inside.join(', ')} inside).` : ' (open — empty).');
},
```

Note: `rooms` is the same `const` declared in the same file. The description is a function called at runtime, not at parse time, so `rooms.cockpit` is fully initialized by then.

- [ ] **Step 4: Run all tests**

```bash
npm test
```

Expected: all 59 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/data/world.js tests/commands.test.js
git commit -m "fix: locker description dynamically reflects items still in room"
```

---

## Task 3 — HTML restructure

**Files:**
- Modify: `index.template.html`

Remove the input row, exits, and objects divs. Add a `#commands` grid in the left pane. Reorder the right pane to: panel → map → about.

- [ ] **Step 1: Replace the full body of `index.template.html`**

The file currently has 31 lines. Rewrite it entirely to:

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
      <div id="commands"></div>
    </div>
    <div id="right">
      <div id="panel" class="pane"></div>
      <div class="pane">
        <h3>Map</h3>
        <div id="minimap"></div>
        <button id="restart-btn" style="margin-top:10px">Restart</button>
      </div>
      <div class="pane about">Created June 2026 by Diego (and Claude)</div>
    </div>
  </div>
  <script type="module">/*__JS__*/</script>
</body>
</html>
```

- [ ] **Step 2: Run tests to confirm nothing broke**

```bash
npm test
```

Expected: all 59 pass (HTML is not tested directly, but the build test checks the template).

- [ ] **Step 3: Commit**

```bash
git add index.template.html
git commit -m "feat: restructure HTML — command grid below console, about section"
```

---

## Task 4 — CSS: command grid styles, remove input styles

**Files:**
- Modify: `src/ui/styles.css`

Remove all input/suggest/exits/objects styles. Add command grid, cmd-section, and about styles.

- [ ] **Step 1: Replace `src/ui/styles.css` entirely**

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
#console { flex: 1; overflow-y: auto; white-space: pre-wrap; min-height: 120px; }
#console .room { color: var(--rust-light); font-weight: bold; }
#console .you { color: var(--good); }
#console p { margin: 0 0 10px; }
#commands {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-top: 10px;
  max-height: 45vh;
  overflow-y: auto;
}
.cmd-section {
  background: var(--panel);
  border: 2px solid var(--rust);
  border-radius: 12px;
  padding: 10px;
  box-shadow: var(--glow);
}
.cmd-section h3 { margin: 0 0 6px; color: var(--rust-light); font-size: 0.9rem; }
.cmd-section button {
  margin: 3px;
  padding: 5px 10px;
  border-radius: 16px;
  border: 1px solid var(--rust-light);
  background: transparent;
  color: var(--text);
  cursor: pointer;
  font-size: 0.9rem;
}
.cmd-section button:hover { background: var(--rust); color: white; }
#panel { flex: 1; min-height: 180px; }
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
.about { font-size: 0.75rem; color: var(--dim); text-align: center; padding: 10px; }
```

- [ ] **Step 2: Run tests**

```bash
npm test
```

Expected: all 59 pass.

- [ ] **Step 3: Commit**

```bash
git add src/ui/styles.css
git commit -m "feat: add command grid CSS, remove input/suggest styles, add about style"
```

---

## Task 5 — Remove renderExits from render.js + update its test

**Files:**
- Modify: `src/ui/render.js`
- Modify: `tests/render.test.js`

`renderExits` and `renderObjects` are no longer called. Remove them from render.js and remove the corresponding test. Do the test update first (TDD — make the test describe the new state before the code).

- [ ] **Step 1: Update `tests/render.test.js` to remove renderExits**

Replace the file entirely:

```js
// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { renderMinimap, appendLine } from '../src/ui/render.js';

beforeEach(() => {
  document.body.innerHTML = '<div id="console"></div><div id="minimap"></div>';
});

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
});
```

- [ ] **Step 2: Run tests — expect render test to fail (renderExits still exported)**

```bash
npm test -- tests/render.test.js
```

Expected: 2 tests pass (the ones that remain). The removed `renderExits` test is just gone — no failure there. Actually the test file compiles fine since we're just not importing `renderExits` anymore. Both remaining tests should pass. If all pass, proceed.

- [ ] **Step 3: Rewrite `src/ui/render.js` — remove renderExits and renderObjects**

Replace the file entirely:

```js
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
```

(The `import { getRoom }` line at the top is also removed — it was only used by `renderObjects`.)

- [ ] **Step 4: Run all tests**

```bash
npm test
```

Expected: all 59 pass.

- [ ] **Step 5: Commit**

```bash
git add src/ui/render.js tests/render.test.js
git commit -m "refactor: remove renderExits/renderObjects from render.js (moved to main.js)"
```

---

## Task 6 — Rewrite main.js: click-only command renderer

**Files:**
- Modify: `src/ui/main.js`

Remove all input/autocomplete code. Add `renderCommands` (the 2-column grid builder), `contextUseActions`, and supporting helpers. The `runCommand` function stays unchanged in role.

- [ ] **Step 1: Replace `src/ui/main.js` entirely**

```js
import { createGame } from '../engine/game.js';
import { clearState } from '../engine/save.js';
import { getItem, rooms } from '../data/world.js';
import { availableExits } from '../engine/commands.js';
import { appendLine, renderMinimap } from './render.js';
import { renderPanel } from './panel.js';

function boot() {
  const game = createGame();

  function runCommand(cmd) {
    appendLine(`> ${cmd}`, 'you');
    appendLine(game.handle(cmd));
    refresh();
  }

  function refresh() {
    renderMinimap(game.state);
    renderCommands(game.state);
    renderPanel(game.state, runCommand);
  }

  function makeBtn(label, onClick) {
    const b = document.createElement('button');
    b.textContent = label;
    b.onclick = onClick;
    return b;
  }

  function makeSection(title) {
    const sec = document.createElement('div');
    sec.className = 'cmd-section';
    const h = document.createElement('h3');
    h.textContent = title;
    sec.appendChild(h);
    return sec;
  }

  function currentRoomItems() {
    return (rooms[game.state.room] || {}).items || [];
  }

  function renderCommands(state) {
    const box = document.getElementById('commands');
    box.innerHTML = '';

    // GO
    const goSec = makeSection('🚶 Go');
    availableExits(state).forEach((dir) =>
      goSec.appendChild(makeBtn(dir.toUpperCase(), () => runCommand(`go ${dir}`)))
    );
    box.appendChild(goSec);

    // LOOK AT
    const lookSec = makeSection('👁 Look at');
    currentRoomItems().forEach((id) => {
      const item = getItem(id);
      if (item) lookSec.appendChild(makeBtn(item.name, () => runCommand(`examine ${item.name}`)));
    });
    box.appendChild(lookSec);

    // TAKE (hidden when nothing takeable)
    const takeableIds = currentRoomItems().filter((id) => getItem(id)?.takeable);
    if (takeableIds.length > 0) {
      const takeSec = makeSection('✋ Take');
      takeableIds.forEach((id) => {
        const item = getItem(id);
        takeSec.appendChild(makeBtn(item.name, () => runCommand(`take ${item.name}`)));
      });
      box.appendChild(takeSec);
    }

    // BACKPACK
    const packSec = makeSection('🎒 Backpack');
    state.inventory.forEach((id) => {
      const item = getItem(id);
      if (item) packSec.appendChild(makeBtn(item.name, () => runCommand(`use ${item.name}`)));
    });
    box.appendChild(packSec);

    // USE — context-smart, hidden when no actions apply
    const useActions = contextUseActions(state);
    if (useActions.length > 0) {
      const useSec = makeSection('🔧 Use');
      useActions.forEach(({ label, cmd }) =>
        useSec.appendChild(makeBtn(label, () => runCommand(cmd)))
      );
      box.appendChild(useSec);
    }

    // HELP + NOTES (always visible)
    const helpSec = makeSection('❓ Help');
    helpSec.appendChild(makeBtn('Get a hint', () => runCommand('help')));
    helpSec.appendChild(makeBtn('📋 My notes', () => runCommand('notes')));
    box.appendChild(helpSec);

    // CONTEXT: corridor actions (only when alien present)
    if (state.room === 'corridor' && !state.flags.hasAccessCode) {
      const ctxSec = makeSection('🫣 Actions');
      ctxSec.appendChild(makeBtn('Hide!', () => runCommand('hide')));
      if (state.inventory.includes('wrench')) {
        ctxSec.appendChild(makeBtn('⚔️ Fight the alien', () => runCommand('attack alien with wrench')));
      }
      box.appendChild(ctxSec);
    }
  }

  function contextUseActions(state) {
    const actions = [];
    if (state.inventory.includes('sealant') && !state.flags.visorFixed)
      actions.push({ label: 'Seal visor crack', cmd: 'use super glue' });
    if (state.inventory.includes('wrench') && state.room === 'surface' && !state.flags.trapdoorOpen)
      actions.push({ label: 'Pry trapdoor open', cmd: 'pry trapdoor' });
    if (state.room === 'cockpit' && !state.flags.lockerOpen)
      actions.push({ label: 'Open storage locker', cmd: 'use locker' });
    return actions;
  }

  document.getElementById('restart-btn').onclick = () => {
    if (confirm('Start over from the crash?')) { clearState(); location.reload(); }
  };

  appendLine(game.intro, 'room');
  refresh();
}

document.addEventListener('DOMContentLoaded', boot);
```

- [ ] **Step 2: Run all tests**

```bash
npm test
```

Expected: all 59 pass. (The autocomplete test imports `autocomplete.js` directly and still passes; it's just no longer imported by `main.js`.)

- [ ] **Step 3: Build the game**

```bash
npm run build
```

Expected: exits 0, produces `index.html`.

- [ ] **Step 4: Commit**

```bash
git add src/ui/main.js
git commit -m "feat: replace typed input with click-only command grid"
```

---

## Task 7 — Verify in browser and final commit

**Files:** none (verification only)

- [ ] **Step 1: Open `index.html` in a browser**

```bash
open /Users/davebartelli/Projects/mars_mission_mayhem/index.html
```

- [ ] **Step 2: Walk through these click-only checkpoints**

| Checkpoint | What to verify |
|------------|----------------|
| Page loads | No input box visible; command grid shows Go (no exits — visor locked), Look at (mission screen, storage locker), Use (Open storage locker), Help sections |
| Click "Open storage locker" in Use | Locker opens; wrench, super glue, first aid kit appear in Look at + Take sections |
| Take wrench and super glue | Items appear in Backpack; Use section shows "Seal visor crack" |
| Click "Seal visor crack" | Visor sealed; Go section now shows OUT |
| Click OUT | Moves to surface; Use shows "Pry trapdoor open" |
| Click "Pry trapdoor open" | Trapdoor opens; Go shows DOWN |
| Full walkthrough to vault | All exits and actions available via clicking only |
| Corridor | 🫣 Actions section appears with Hide and Fight buttons; disappears after hide/attack |
| About section | Visible at bottom-right: "Created June 2026 by Diego (and Claude)" |
| Locker look | After taking all items, `look` description shows "(open — empty)" |
| Open hatch test | Restart, fix visor, type... wait — no typing. Click OUT works same as open hatch did |

- [ ] **Step 3: Run final test suite**

```bash
npm test
```

Expected: all 59 pass.

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: click-only UI for Diego + fix open-hatch + fix locker description + about section"
```
