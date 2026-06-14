export function createInitialState() {
  return {
    room: 'cockpit',
    inventory: [],
    flags: {},
    visited: ['cockpit'],
    puzzles: { symbolLogin: { attempt: [] } },
  };
}

export function hasItem(state, id) {
  return state.inventory.includes(id);
}

export function addItem(state, id) {
  if (!hasItem(state, id)) state.inventory.push(id);
}

export function removeItem(state, id) {
  state.inventory = state.inventory.filter((x) => x !== id);
}

export function visit(state, roomId) {
  if (!state.visited.includes(roomId)) state.visited.push(roomId);
}
