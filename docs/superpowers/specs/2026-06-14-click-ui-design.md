# Click-Only UI Redesign + Bug Fixes
**Date:** 2026-06-14  
**Author:** Dave Bartelli + Claude

## Background

Mars Mission Mayhem is being play-tested by Diego (3rd grade). Typing full commands is too slow for a 3rd grader who doesn't know where all the keys are. The game already has clickable "Go" and "Look at" sections — this redesign extends that pattern to cover every possible action so no typing is ever required.

## Bugs to Fix

### Bug 1: "open hatch" in cockpit gives wrong message
**Root cause:** `game.js` dispatch for `open` checks `p.noun === 'trapdoor'` literally, but the parser returns `p.noun = 'hatch'` (the alias). The fallback resolves 'hatch' globally to the trapdoor item and calls `cmdUse`, which says "You can't use the trapdoor like that."  
**Fix:** In the `open` case, if room is cockpit and noun is hatch/door/exit, call `cmdGo(state, 'out')`.

### Bug 2: Locker description shows all items even after they're taken
**Root cause:** The cockpit room description hardcodes "SUPER GLUE, WRENCH, and FIRST AID KIT inside" when `lockerOpen` is true, regardless of actual room contents.  
**Fix:** Replace the hardcoded string with a dynamic check of `rooms.cockpit.items` to list only items still present.

### Bug 3: Add About section
**Location:** Right pane, below the map restart button.  
**Content:** "Created June 2026 by Diego (and Claude)"

## Major UI Change: Click-Only Commands

### Layout

**Left pane** (wider, `flex: 1.3`): Console text (top, scrollable) + 2-column command grid (bottom).

**Right pane** (`flex: 1`): Mission panel (top) + Map with restart (middle) + About (bottom).

The existing `#exits` and `#objects` divs are **removed**. The text input, go button, and autocomplete are **removed**.

### Command Grid (left pane, below console)

Two equal columns. Each cell is a command section with:
- A colored header button (icon emoji + label). Clicking fires the command (for single-action commands like Help, Notes, Hide, Attack) or is purely decorative for multi-step ones.
- Sub-buttons below the header for that category's items/exits.

```
┌──────────────────────┬──────────────────────┐
│  🚶 GO               │  👁 LOOK AT          │
│  [Control] [Out]     │  [mission screen]    │
│                      │  [storage locker]    │
├──────────────────────┼──────────────────────┤
│  ✋ TAKE             │  🎒 BACKPACK         │
│  [wrench]            │  [first aid kit]     │
│  [super glue]        │                      │
├──────────────────────┼──────────────────────┤
│  🔧 USE              │  📋 NOTES            │
│  [super glue→visor]  │  (fires notes cmd)   │
│  [locker]            │                      │
├──────────────────────┼──────────────────────┤
│  ❓ HELP             │  [🫣 HIDE] [⚔️ ATTACK]│
│  (fires help cmd)    │  (context-only)      │
└──────────────────────┴──────────────────────┘
```

### Command Section Definitions

| Section | Icon | Sub-buttons | Click action |
|---------|------|-------------|--------------|
| Go | 🚶 | Available exits (from `availableExits`) | `go <exit>` |
| Look at | 👁 | All items in current room | `examine <item name>` |
| Take | ✋ | Room items that are `takeable: true` | `take <item name>` |
| Backpack | 🎒 | Items in `state.inventory` | `use <item name>` |
| Use | 🔧 | Context-smart usable items (see below) | context-specific cmd |
| Notes | 📋 | No sub-buttons — fires command directly | `notes` |
| Help | ❓ | No sub-buttons — fires command directly | `help` |
| Hide | 🫣 | Shown only in corridor when alien present (`!state.flags.hasAccessCode`) | `hide` |
| Attack | ⚔️ | Shown only in corridor when alien present + wrench in inventory | `attack alien with wrench` |

### Use Section (context-smart)

The Use section shows inventory items that have a meaningful action available. Sub-button labels and fired commands:

| Item | Condition | Label | Command fired |
|------|-----------|-------|---------------|
| super glue | `!state.flags.visorFixed` | "Seal visor" | `use super glue` |
| wrench | in surface room + trapdoor not open | "Pry trapdoor" | `pry trapdoor` |
| locker | in cockpit + `!state.flags.lockerOpen` | "Open locker" | `use locker` |

If none of these conditions match for a carried item, it does not appear in Use (avoids confusing dead-end clicks).

### Sections Hidden When Empty

- **Take**: hidden entirely if no takeable items in room
- **Use**: hidden entirely if no context-smart actions available
- **Hide** and **Attack**: hidden unless in corridor without access code

### Styling

- Command grid: `display: grid; grid-template-columns: 1fr 1fr; gap: 8px;`
- Section cell: same `.pane` border/radius as existing panels, padding 10px
- Section header: `h3` style already used, with emoji prepended inline in text (no separate element needed)
- Sub-buttons: same pill-style as existing exit/object buttons

### What's Removed

- `<input id="input">` and associated HTML
- `<button id="input-go">` and `<button id="help-btn">`
- `<div id="suggest">`
- `<div id="exits">` and `<div id="objects">` (from right pane)
- All input/autocomplete JS in `main.js`
- `autocomplete.js` import (file can be left, just unused)

### Right Pane Order

1. `#panel` — mission / symbol puzzle (existing, unchanged)
2. Map pane with `#minimap` and Restart button
3. About section: small dim text "Created June 2026 by Diego (and Claude)"

## File Changes

| File | Change |
|------|--------|
| `src/data/world.js` | Fix cockpit description (dynamic locker contents) |
| `src/engine/game.js` | Fix `open` dispatch for cockpit hatch |
| `src/ui/main.js` | Remove input/autocomplete, add `renderCommands()`, update `refresh()` |
| `src/ui/render.js` | Remove `renderExits` / `renderObjects` exports (or leave, unused) — add nothing |
| `src/ui/styles.css` | Add command grid styles; remove input/suggest styles |
| `index.template.html` | Remove input row; add command grid div; reorder right pane; add about |

## Testing Notes

- All existing engine tests should pass unchanged (no engine logic changed except the `open` hatch fix)
- Walk through the full game path clicking only buttons: cockpit → surface → shaft → entryHall → terminalRoom → corridor → vault
- Verify locker description updates correctly after each item is taken
- Verify Hide and Attack appear/disappear in corridor based on state
- Verify Use section shows correct context-smart buttons at each stage
