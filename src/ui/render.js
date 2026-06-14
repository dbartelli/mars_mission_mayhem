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
