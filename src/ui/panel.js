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
