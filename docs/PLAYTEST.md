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
