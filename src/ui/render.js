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
