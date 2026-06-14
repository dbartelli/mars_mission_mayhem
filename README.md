# Mars Mission Mayhem

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
3. Play at `https://dbartelli.github.io/mars-mission-mayhem/`.
