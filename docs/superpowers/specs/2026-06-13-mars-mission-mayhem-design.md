# Mars Mission Mayhem — Design Spec (v1)

**Date:** 2026-06-13
**Audience:** 3rd-grade players (≈8–9 years old), web browser
**Genre:** Text adventure (Zork-style) with an interactive visual panel
**Origin:** Designed by a 3rd grader; refined for story logic and buildability.

---

## 1. Vision

A friendly, suspenseful text adventure. You are the **only survivor** of a crash on Mars.
You explore an abandoned Martian base, outwit the occasional alien patrol, and repair a
broken shuttle to fly home to Earth. Primarily text, with a **code-drawn visual panel**
(CSS/SVG/canvas + emoji — no image files) for puzzles and a mini-map.

Tone: mild, Zork-style peril. Suspenseful but never graphic. No graphic death; nobody
dies on a dice roll. Short, simple sentences for a 3rd-grade reader, line spacing 1.25.

---

## 2. Scope & Build Strategy

**This spec covers the FIRST PLAYABLE SLICE: Phases 1–3** (crash → surface → base login →
patrol → vault cliffhanger), built on a reusable, **data-driven engine**.

**Why a slice on a data-driven engine:** the engine (parser, movement, inventory, save,
UI, puzzle framework) is written once and reads the world as plain **data**. Adding the
later content (vault combat resolution, hangar, and the 3-part component hunt) becomes
mostly *writing more data*, not new code — minimizing rework.

**Out of scope for this slice (planned next):** the vault combat *resolution*, the hangar,
and the three components (Fuel Cell, Navigation Chip, Oxygen Scrubber) with their puzzles.
The slice **ends on the vault combat cliffhanger.**

---

## 3. Technical Architecture

**Single `index.html`** — HTML5 structure, CSS3 in `<style>`, vanilla JavaScript in
`<script>`. No libraries, no build step, no server. Deploys to GitHub Pages as-is.

Logical modules (separated within the one file):

- **World data** — `rooms`, `items`, and `puzzles` as plain objects/maps. Each room:
  id, name, description, exits (direction → room id), items present, and optional
  on-enter / on-action hooks driven by flags.
- **Parser** — forgiving input handling:
  - lowercases input, trims, collapses whitespace
  - strips filler words (`the`, `a`, `an`, `at`, `to`, `with` handled as structure)
  - supports abbreviations: `N S E W U D`, `L` (look), `I` (inventory), `X` (examine)
  - fuzzy-matches misspellings against known verbs/nouns (e.g., Levenshtein distance ≤ 2)
  - powers **autocomplete** suggestions as the player types (verbs + in-scope nouns)
- **Game state** — current room id, inventory list, `flags` map (progress booleans),
  and `notes` (auto-collected clues/codes). Single source of truth.
- **UI renderer** — paints the text console, the visual panel, inventory strip,
  and mini-map from state.
- **Save system** — serializes state to `localStorage` after **every** action
  (continuous autosave). On load, resumes from saved state if present.

---

## 4. Interface Layout

Split-pane:

- **Left — Text Console:** scrolling history + input box with autocomplete; a `?` help
  button (typing `?` or `HELP` does the same). Line spacing 1.25.
- **Right — Visual Panel:** shows the current puzzle when one is active; otherwise shows
  the **mini-map** (node graph of visited rooms, drawn with canvas/CSS).
- **Inventory strip:** clickable items; clicking an item can prefill/inspect it.
- **NOTES button/icon:** opens the auto-journal of discovered clues and codes.
- **Clickable helpers:** available **exits** render as buttons; notable **objects** in the
  room are clickable. Clicks feed normal commands into the parser (so clicking and typing
  are equivalent).

---

## 5. Command Set

Zork-style core plus a few extras. All accept the abbreviations noted.

| Command | Aliases | Purpose |
|---|---|---|
| `LOOK` | `L` | Re-describe the current room |
| `EXAMINE <obj>` | `X` | Closer look at an object |
| `GO <dir>` / direction | `N S E W U D` | Move |
| `TAKE <obj>` | `GET` | Pick up |
| `DROP <obj>` | | Drop |
| `USE <obj>` / `USE <obj> ON <obj>` | | Use/apply an item |
| `OPEN <obj>` / `CLOSE <obj>` | | Open/close |
| `READ <obj>` | | Read text (signs, screens, logs) |
| `PRY <obj>` / `MOVE <obj>` | | Manipulate (e.g., trapdoor, sand) |
| `HIDE` | | Take cover (patrol beat) |
| `ATTACK <target> WITH <obj>` | | Combat |
| `TALK TO <target>` | `TALK` | Speak (always safe; gives a clue) |
| `INVENTORY` | `I` | List inventory |
| `NOTES` | | Open the auto-journal |
| `HELP` / `?` | | Progressive hints + command list |

Saving is automatic (no `SAVE` command needed); `RESTART` clears the save.

---

## 6. Core Mechanics

- **Combat — deterministic, no death.** With the correct weapon in inventory,
  `ATTACK <alien> WITH <weapon>` wins. A wrong verb or no weapon gives a gentle nudge
  (e.g., *"The alien dodges! You need something sharp..."*) and the player stays in the
  room to try again. No dice, no game-over.
- **Oxygen — narrative only.** The cracked visor / oxygen warning sets mood and urgency.
  There is **no real countdown** that can kill the player.
- **Hints — progressive.** `HELP` / `?` gives escalating clues per active gate
  (gentle → specific), never the full solution on the first ask. Every gate has hint text
  (see §10).
- **Checkpoints — continuous autosave.** State saves after every action. "Respawn after a
  failed encounter" simply means staying in / restoring the current room. Refreshing the
  browser resumes exactly where the player left off.

---

## 7. First-Slice Map (Phases 1–3)

Seven rooms, mostly sparse and Zorky (a description, exits, occasionally one object).

### Room 1 — Crashed Cockpit
- Wake as the **only survivor**. Cracked visor → oxygen warning (mood only).
- **Mission screen** (`READ`): scans detected hostile Martian lifeforms — *abort mission,
  return to Earth immediately.* Establishes the goal (get home) and pre-warns of danger.
- **Sealant / repair patch:** found here. `USE SEALANT` (on visor) fixes the visor.
- **Wrench / pry-bar:** found in the wreckage. Triple duty: pries the trapdoor later
  **and** is the weapon for the combat path at the patrol beat.
- **Gate:** visor must be fixed before going out (dusty surface + storm). Exit → Surface.

### Room 2 — Martian Surface
- Red dust, the wrecked ship behind you, a **sandstorm building on the horizon**
  (hurry-up tension; **not** a kill-timer).
- A **trapdoor half-buried in red sand.** Brush the sand aside, then `PRY TRAPDOOR`
  with the wrench → it opens. Go `DOWN`.
- **Gate:** trapdoor requires the wrench (and clearing the sand).

### Room 3 — Airlock / Shaft
- Short transition underground. The storm howls above; the door seals.
- Establishes the base is **pressurized / breathable** (fixes the air logic: surface is
  hostile, the base has air). Continue inward.

### Room 4 — Base Entry Hall
- Abandoned base: flickering monitors, Martian signs, multiple exits.
- Sets the premise: *abandoned, only an occasional patrol* — making a lone human sneaking
  around believable.

### Room 5 — Terminal Room
- **Visual Puzzle #1 — Martian Symbol Login.** The panel shows scrambled Martian symbols
  (Unicode glyph set, e.g., ◈ ⟁ ☉ ⚶ ▲ ⬡). Clues found in this room reveal the correct
  **order**; entering it logs in.
- On login: monitors translate to English and reveal *"Patrol returns in 5 minutes"*
  (no real timer). This **arms the patrol beat** and reinforces the hostility/goal.

### Room 6 — Guard Corridor (the Patrol Beat)
- Has a **hiding nook** (crates/locker, described as "big enough to slip behind").
- The patrol alien enters. **Both paths converge** on obtaining the access code:
  - **Stealth:** `HIDE` → the alien taps a code into a panel and leaves; you grab the
    **code-tablet** it left on the bench.
  - **Combat:** `ATTACK ALIEN WITH WRENCH` → you win and take its **codebook**.
  - **Talk (safe):** `TALK` → *"The alien squints at you, confused."* A clue nudging you to
    hide or fight; the alien "pauses," giving another chance. **Never an instant fail.**
- Outcome: sets flag `hasAccessCode = true` and writes the code into `NOTES`. Nothing
  downstream cares which path was taken.

### Room 7 — Vault Antechamber (Cliffhanger)
- Enter the access code (from `NOTES`) on a second terminal → a thick **steel door** opens.
- Inside: the **radiant crystal** and a **sharp Martian tool.**
- Taking the sharp tool triggers a **different alien** → combat is initiated.
- **The slice ends on this cliffhanger** (combat *resolution* + what's beyond is the next
  slice). The vault combat uses the sharp tool found right here.

---

## 8. The Crystal Payoff (cross-slice tracking)

The **radiant crystal** taken in the vault is **not** decoration. It is planted here as the
**power source** required at the climax: it powers the repaired shuttle's ignition (and/or
charges the Fuel Cell). Picking it up in the vault is the **setup**; installing it at the
hangar to launch home is the **payoff**, delivered in a later slice. The engine should keep
the crystal as a normal inventory item with a `crystal` flag so the future hangar sequence
can require it.

---

## 9. Both Patrol Paths — Convergence Detail

- Shared post-condition: `flags.hasAccessCode = true`, access code appended to `NOTES`.
- The combat path consumes nothing permanent (wrench is retained; it is not the vault
  weapon — the vault uses the sharp Martian tool found there).
- A player who chose stealth simply meets their **first** combat at the vault; a player who
  fought the patrol meets their **second**. Both are fine and intentional.

---

## 10. Hint Coverage (every gate must have progressive hints)

1. **Visor** — fix the cracked visor before going outside.
2. **Trapdoor** — clear the sand; use the wrench to pry it.
3. **Symbol login** — where the ordering clue is; then how to read it.
4. **Patrol beat** — the "5 minutes" warning; suggest hiding or fighting; talking is safe.
5. **Vault code** — check `NOTES`; which terminal to use.
6. **Vault combat** — use the sharp tool you just found; correct attack phrasing.

Each gate: a gentle first hint, then a more specific second hint, then near-explicit.

---

## 11. Out-of-Scope (Next Slices) — for context only

- **Vault combat resolution**, then the path to the **hangar** with the broken shuttle.
- **Component hunt** (each guarded by a visual puzzle):
  1. **Fuel Cell** (Power Room) — energy bars/sliders to balance (HTML sliders).
  2. **Navigation Chip** (Science Lab) — flashing color-sequence to replicate (Simon-style).
  3. **Oxygen Scrubber** (Hydroponics Bay) — plant/nature **riddle**, emoji flora flavor.
- **Win condition:** install all three parts **+ the crystal** at the hangar → launch home.

These reuse the same engine and are added as data + puzzle modules.

---

## 12. Deployment

1. Public GitHub repo `mars-mission-mayhem` (already initialized locally).
2. Commit & push the single `index.html` to the main branch.
3. Settings → Pages → build source = main branch → Save.
4. Live at `https://<username>.github.io/mars-mission-mayhem/`.

---

## 13. Testing Approach

- **Engine units** are testable in isolation: parser normalization/fuzzy-matching,
  movement, inventory add/remove, flag transitions, and save/load round-trips.
- **Walkthrough tests:** scripted command sequences that drive both patrol paths from
  cockpit to the vault cliffhanger, asserting expected room/flag/notes outcomes.
- **Forgiveness tests:** misspellings, filler words, and abbreviations resolve correctly.
- Manual playtest target: a 3rd grader can finish the slice using only typed commands,
  clicks, and `HELP`, without getting stuck on spelling or logic.

---

## 14. Success Criteria

- The slice is fully playable start (cockpit) to cliffhanger (vault combat trigger).
- Both patrol paths work and converge.
- Visual Puzzle #1 renders and is solvable from in-room clues.
- Autocomplete + forgiving parser keep a young speller unstuck.
- Continuous autosave: refresh resumes in place.
- Single `index.html`, no external assets, deployable to GitHub Pages.
