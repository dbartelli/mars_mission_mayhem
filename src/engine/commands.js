import { rooms, items, getRoom, getItem } from '../data/world.js';
import { hasItem, addItem, removeItem, visit } from './state.js';

function text(val, state) {
  return typeof val === 'function' ? val(state) : val;
}

function exitTarget(exit) {
  return typeof exit === 'string' ? exit : exit.to;
}

function exitLocked(exit, state) {
  return typeof exit === 'object' && typeof exit.locked === 'function' && exit.locked(state);
}

export function availableExits(state) {
  const room = getRoom(state.room);
  return Object.entries(room.exits || {})
    .filter(([, exit]) => !exitLocked(exit, state))
    .map(([dir]) => dir);
}

export function describeRoom(state) {
  const room = getRoom(state.room);
  const desc = text(room.description, state);
  const exits = availableExits(state);
  const exitLine = exits.length ? `Exits: ${exits.join(', ')}.` : 'There are no obvious exits.';
  return `**${room.name}**\n${desc}\n${exitLine}`;
}

// Resolve a noun to an item id, searching the room and inventory.
export function resolveItem(state, noun) {
  if (!noun) return null;
  const room = getRoom(state.room);
  const candidates = [...(room.items || []), ...state.inventory];
  for (const id of candidates) {
    const item = getItem(id);
    if (!item) continue;
    if (item.name === noun || (item.aliases || []).includes(noun) || id.toLowerCase() === noun) {
      return id;
    }
  }
  // fall back to any defined item (for items revealed by flags, e.g. crystal)
  for (const id of Object.keys(items)) {
    const item = items[id];
    if (item.name === noun || (item.aliases || []).includes(noun)) return id;
  }
  return null;
}

export function cmdGo(state, dir) {
  const room = getRoom(state.room);
  const exit = (room.exits || {})[dir];
  if (!exit) return `You can't go ${dir} from here.`;
  if (exitLocked(exit, state)) {
    return typeof exit === 'object' && exit.lockedMsg ? exit.lockedMsg : `You can't go ${dir} yet.`;
  }
  state.room = exitTarget(exit);
  visit(state, state.room);
  return describeRoom(state);
}

export function cmdExamine(state, noun) {
  const id = resolveItem(state, noun);
  if (!id) return "You don't see that here.";
  return text(getItem(id).description, state);
}
