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
    const roomIds = currentRoomItems();
    if (roomIds.length > 0) {
      const lookSec = makeSection('👁 Look at');
      roomIds.forEach((id) => {
        const item = getItem(id);
        if (item) lookSec.appendChild(makeBtn(item.name, () => runCommand(`examine ${item.name}`)));
      });
      box.appendChild(lookSec);
    }

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
    if (state.inventory.length > 0) {
      const packSec = makeSection('🎒 Backpack');
      state.inventory.forEach((id) => {
        const item = getItem(id);
        if (item) packSec.appendChild(makeBtn(item.name, () => runCommand(`use ${item.name}`)));
      });
      box.appendChild(packSec);
    }

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
    helpSec.appendChild(makeBtn('How to play', () => runCommand('help')));
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
    if (state.room === 'vault' && !state.flags.vaultOpen && state.inventory.includes('codeTablet'))
      actions.push({ label: 'Enter vault code', cmd: 'enter blue 4' });
    return actions;
  }

  document.getElementById('restart-btn').onclick = () => {
    if (confirm('Start over from the crash?')) { clearState(); location.reload(); }
  };

  appendLine(game.intro, 'room');
  refresh();
}

document.addEventListener('DOMContentLoaded', boot);
