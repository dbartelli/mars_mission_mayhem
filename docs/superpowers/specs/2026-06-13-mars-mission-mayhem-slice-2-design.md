# Mars Mission Mayhem — Design Spec (Slice 2)

**Date:** 2026-06-13
**Audience:** 3rd-grade players (≈8–9 years old), web browser
**Genre:** Text adventure (Zork-style) with an interactive visual panel
**Depends on:** [Slice 1 spec](2026-06-13-mars-mission-mayhem-design.md) (engine + Phases 1–3).
Build slice 2 **after slice 1 is approved and coded** — it reuses the same engine.

---

## 1. Where This Picks Up

Slice 1 ends on a **cliffhanger**: in the Vault Antechamber, taking the sharp Martian tool
triggers combat with a second alien. **Slice 2 opens by resolving that fight**, then carries
the player through the **hangar** and the **3-part component hunt** to the **launch-home win**.

Carried over from slice 1 (already in inventory/state): the **radiant crystal**, the
**sharp Martian tool**, and the continuous autosave. Earlier flags (e.g.,
`hasAccessCode`) no longer matter and are not referenced here.

---

## 2. Scope

This slice covers the **back half of the game**:

1. **Vault combat resolution** (the cliffhanger payoff).
2. A short **stealth set-piece** corridor.
3. The **hangar hub** with the broken shuttle.
4. Three branching **sectors**, each yielding one component behind a gentle visual puzzle.
5. The **install + launch** win sequence, including the **crystal payoff**.

No new engine features beyond three puzzle modules and the install/launch logic.
Everything reuses the slice-1 engine: parser, movement, inventory, flags, NOTES,
hints, mini-map, continuous autosave, clickable helpers, autocomplete.

---

## 3. Design Decisions (locked)

- **Map: hub-and-spoke, any order.** The hangar is a central hub; the three sectors branch
  off it and can be solved in **any order**. The player is always one step from "home,"
  which keeps navigation easy for a young player and the mini-map readable.
- **Pacing: mostly puzzles, one set-piece.** The combat climax already happened at the
  vault. Slice 2 is puzzle-focused, with a **single light alien moment** — a patrol the
  player must `HIDE` from / slip past — to keep tension. No new combat.
- **Difficulty: gentle, hint-rich.** Short, forgiving puzzles with strong progressive
  hints, so a child rarely gets stuck. Puzzles can be retried freely; there is no failure
  state and no death.

---

## 4. Map (Slice 2)

~5 rooms, sparse and Zorky.

### Room A — Vault (combat resolution)
- The cliffhanger fight resolves here. With the **sharp Martian tool** in inventory,
  `ATTACK ALIEN WITH SHARP TOOL` wins (deterministic — no dice, no death).
- A wrong verb / no weapon gives a gentle nudge and the player stays to try again. Per the
  original GDD, a failed attempt simply returns the player to the **start of the vault
  room** (safe respawn) — never a game-over.
- On win: a passage beyond the vault opens. Exit → Connecting Corridor.

### Room B — Connecting Corridor (the stealth set-piece)
- A patrol alien is sweeping the corridor. A **hiding nook** is described ("a maintenance
  alcove, just big enough").
- `HIDE` → the patrol passes; you slip through to the hangar.
- `TALK` / standing in the open → safe nudge ("The alien's lights swing toward you —
  better duck out of sight!"), the patrol "pauses," another chance. **Never a fail.**
- One-time scripted beat; it does not interfere with the any-order hub. Exit → Hangar.

### Room C — Hangar (HUB)
- The **broken Martian shuttle** sits here. A panel/placard (`READ`) lists what it needs:
  **Fuel Cell**, **Navigation Chip**, **Oxygen Scrubber**, and a **power crystal** for
  ignition.
- Three exits to the three sectors (any order). The player returns here to install parts
  and, finally, to launch.

### Room D1 — Power Room  → **Fuel Cell**
### Room D2 — Science Lab → **Navigation Chip**
### Room D3 — Hydroponics Bay → **Oxygen Scrubber**

Each sector is a single room: a short description, its visual puzzle on the panel, and the
component locked in a housing that opens when the puzzle is solved (`TAKE <part>` after).

---

## 5. The Three Puzzles (gentle, hint-rich)

### Puzzle #2 — Fuel Cell (Power Room)
- **Visual panel:** 3–4 vertical **energy bars with sliders**.
- **Goal:** balance the bars to a shown **target** (e.g., all equal, or match a displayed
  pattern). Drag sliders (or type, e.g., `SET BAR 2 HIGH`); clickable for young players.
- **Solved:** the safety housing unlocks → `TAKE FUEL CELL`.
- **Hints:** (1) "The bars must be balanced." (2) show the target outline. (3) name the
  bar that's off.

### Puzzle #3 — Navigation Chip (Science Lab)
- **Visual panel:** a **Simon-style** console of 4 colored buttons.
- **Goal:** the panel flashes a **4-step** color sequence; the player replicates it
  (click the buttons, or type colors). The sequence can be **replayed** on demand.
- **Solved:** the console releases the chip → `TAKE NAVIGATION CHIP`.
- **Hints:** (1) "Watch, then repeat." (2) replay slowly. (3) reveal the first colors.

### Puzzle #4 — Oxygen Scrubber (Hydroponics Bay)
- **Visual panel:** **emoji Martian flora** (🌱🌵🪴🌿) as flavor.
- **Goal:** answer a short, age-appropriate **nature/plant riddle** (typed answer; parser
  is forgiving of spelling). Example shape: *"I drink the light and breathe out air, green
  and growing everywhere — what am I?"* → a **plant / leaf**.
- **Solved:** the security lock opens → `TAKE OXYGEN SCRUBBER`.
- **Hints:** (1) restate the riddle simply. (2) "Think about what makes the air you
  breathe." (3) near-explicit ("It is green and grows…").

All three: freely retryable, no fail state, progressive hints via `HELP` / `?`.

---

## 6. Win Sequence (install + launch)

- The shuttle needs **4 things**: Fuel Cell, Navigation Chip, Oxygen Scrubber, and the
  **radiant crystal** (carried from the vault).
- Install in **any order**: `INSTALL <part>` or `USE <part> ON SHUTTLE`. Each install
  prints a satisfying confirmation and updates the hangar placard / visual panel
  (a little checklist of installed parts).
- **Crystal payoff:** `INSTALL CRYSTAL` (or `USE CRYSTAL ON SHUTTLE`) seats the crystal in
  the **ignition housing** — this is the planted payoff from slice 1: the crystal is what
  powers the launch.
- When all **4** are installed, the **launch** becomes available (`LAUNCH` / `GO` / press
  the ignition). A final text sequence plays: the shuttle roars off the red planet and
  charts a course home → **victory screen**.

---

## 7. Mechanics (reused, no changes)

- **Combat:** deterministic, no death (only the vault resolution in §4 Room A).
- **Stealth:** the `HIDE` beat in the corridor; safe, retryable.
- **Hints:** progressive per gate (every puzzle + the corridor + the install step).
- **Checkpoints:** continuous autosave; refresh resumes in place; a "failed" puzzle or
  encounter just keeps the player in the room.
- **Crystal** remains a normal inventory item gated by a `crystal` flag (set in slice 1).

---

## 8. Hint Coverage (every gate)

1. **Vault combat** — use the sharp tool; correct attack phrasing.
2. **Corridor** — a patrol is coming; `HIDE` in the alcove.
3. **Fuel Cell** — balance the bars; show target; name the off bar.
4. **Navigation Chip** — watch then repeat; replay; reveal first colors.
5. **Oxygen Scrubber** — restate riddle; conceptual nudge; near-explicit.
6. **Install/launch** — what the shuttle still needs; remember the crystal.

Each gate: gentle first hint → more specific → near-explicit.

---

## 9. Testing Approach

- **Puzzle modules** testable in isolation: Fuel Cell balance check, Simon sequence
  match (incl. replay), riddle answer matching (forgiving of spelling).
- **Install/launch logic:** launch unlocks only when all 4 items are installed; installing
  in different orders all reach the win; the crystal is required (no crystal → no launch).
- **Walkthrough test:** vault-resolution → corridor `HIDE` → solve all three sectors in
  multiple orders → install → launch → victory, asserting room/flag/inventory outcomes.
- **Forgiveness tests:** misspelled riddle answers and part names still resolve.
- **Manual playtest target:** a 3rd grader finishes slice 2 using typed commands, clicks,
  and `HELP`, without getting stuck.

---

## 10. Success Criteria

- The vault cliffhanger resolves and leads to the hangar.
- The three sectors are solvable in **any order**, each yielding its component.
- The single stealth set-piece works and is safe (no fail state).
- All three visual puzzles render and are solvable from in-panel info + hints.
- Installing all three parts **+ the crystal** enables the launch and the victory sequence.
- Still a single `index.html`, no external assets, deployable to GitHub Pages.
- Full game (slice 1 + slice 2) is playable end-to-end: crash → home.
