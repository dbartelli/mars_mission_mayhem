import { createGame } from '../engine/game.js';
import { clearState } from '../engine/save.js';
import { nounVocab, getItem } from '../data/world.js';
import { availableExits } from '../engine/commands.js';
import { appendLine, renderMinimap } from './render.js';
import { suggest, applySuggestion } from './autocomplete.js';
import { renderPanel } from './panel.js';

const VERBS = ['look', 'examine', 'go', 'take', 'drop', 'use', 'read', 'pry',
  'hide', 'attack', 'talk', 'enter', 'inventory', 'notes', 'help', 'up', 'down', 'out', 'back', 'control', 'corridor', 'vault'];

function boot() {
  // expose item lookup for render helpers (merge — do NOT clobber roomItems set below)
  window.__mmm = Object.assign(window.__mmm || {}, { getItem });
  const game = createGame();
  const vocab = [...VERBS, ...nounVocab()];

  const input = document.getElementById('input');
  const suggestBox = document.getElementById('suggest');

  function refresh() {
    renderMinimap(game.state);
    renderPanel(game.state, runCommand);
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
