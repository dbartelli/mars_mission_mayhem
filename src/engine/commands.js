import { rooms, items, getRoom, getItem } from '../data/world.js';
import { hasItem, addItem, removeItem, addNote, visit } from './state.js';
import { SYMBOL_PUZZLE, checkSymbolOrder } from '../data/puzzles.js';

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

export function cmdTake(state, noun) {
  const id = resolveItem(state, noun);
  if (!id) return "You don't see that here.";
  const item = getItem(id);
  if (!item.takeable) return `You can't take the ${item.name}.`;
  if (hasItem(state, id)) return `You already have the ${item.name}.`;
  const room = getRoom(state.room);
  if (!(room.items || []).includes(id)) return "You don't see that here.";
  room.items = room.items.filter((x) => x !== id);
  addItem(state, id);
  if (id === 'sharpTool') {
    state.flags.slice1Complete = true;
    return (
      'You pick up the sharp tool. Heavy FOOTSTEPS echo behind you — a second alien enters, sees the tool ' +
      'in your hand, and bares its teeth. Combat begins!\n\n' +
      '*** To be continued in the next chapter... ***'
    );
  }
  return `You take the ${item.name}.`;
}

export function cmdDrop(state, noun) {
  const id = resolveItem(state, noun);
  if (!id || !hasItem(state, id)) return "You aren't carrying that.";
  removeItem(state, id);
  const room = getRoom(state.room);
  room.items = room.items || [];
  if (!room.items.includes(id)) room.items.push(id);
  return `You drop the ${getItem(id).name}.`;
}

export function cmdInventory(state) {
  if (state.inventory.length === 0) return 'Your pack is empty.';
  const names = state.inventory.map((id) => getItem(id).name);
  return `You are carrying: ${names.join(', ')}.`;
}

export function cmdRead(state, noun) {
  const id = resolveItem(state, noun);
  if (!id) return "You don't see that here.";
  const item = getItem(id);
  if (item.readText) return text(item.readText, state);
  return `There's nothing to read on the ${item.name}.`;
}

export function cmdUse(state, noun, noun2) {
  const id = resolveItem(state, noun);
  if (!id) return "You don't have that.";

  // Open the storage locker
  if (id === 'locker') {
    if (state.flags.lockerOpen) return 'The locker is already open. Inside: SUPER GLUE, a WRENCH, and a FIRST AID KIT.';
    state.flags.lockerOpen = true;
    const room = getRoom(state.room);
    room.items = room.items || [];
    if (!room.items.includes('sealant')) room.items.push('sealant');
    if (!room.items.includes('wrench')) room.items.push('wrench');
    if (!room.items.includes('firstAidKit')) room.items.push('firstAidKit');
    return 'You pull open the locker. Inside you find SUPER GLUE, a WRENCH, and a FIRST AID KIT.';
  }

  // Seal the visor
  if (id === 'sealant') {
    if (state.flags.visorFixed) return 'Your visor is already sealed.';
    state.flags.visorFixed = true;
    removeItem(state, 'sealant');
    getRoom(state.room).items = (getRoom(state.room).items || []).filter((x) => x !== 'sealant');
    return 'You squeeze a bead of super glue along the crack in your visor. It dries in seconds — the crack is sealed and the oxygen warning fades!';
  }

  // Use the wrench on the trapdoor == pry
  if (id === 'wrench' && (noun2 === 'trapdoor' || noun2 === 'door')) {
    return cmdPry(state, 'trapdoor');
  }

  return `You can't use the ${getItem(id).name} like that.`;
}

export function cmdPry(state, noun) {
  const id = resolveItem(state, noun);
  if (id !== 'trapdoor') return "You can't pry that.";
  if (state.flags.trapdoorOpen) return 'The trapdoor is already open.';
  if (!hasItem(state, 'wrench')) {
    return 'It won\'t budge by hand. You need something to pry with — like a wrench.';
  }
  state.flags.trapdoorOpen = true;
  return 'You brush away the red sand and lever the wrench under the trapdoor. It groans open, revealing a ladder DOWN.';
}

// cmdEnter handles both the symbol login (terminalRoom) and the vault code (vault).
export function cmdEnter(state, words = []) {
  if (state.room === 'terminalRoom') {
    const known = new Set(SYMBOL_PUZZLE.symbols.map((s) => s.id));
    const attempt = words.filter((w) => known.has(w));
    if (state.flags.loggedIn) return 'You are already logged in.';
    if (checkSymbolOrder(attempt)) {
      state.flags.loggedIn = true;
      return (
        'The symbols light up in order and the terminal unlocks! The monitors flip to English. ' +
        'A red message scrolls: "PATROL RETURNS IN 5 MINUTES." The security door to the EAST clicks open.'
      );
    }
    return 'The symbols flash red — wrong order. Look for a clue in the room (try READ ETCHING).';
  }

  // vault handled in Task 10 (cmdEnter extended there)
  return vaultEnter(state, words);
}

const VAULT_CODE = 'blue 4';

// Placeholder until Task 10 fills it in; defined now to keep imports valid.
export function vaultEnter(state, words = []) {
  if (state.room !== 'vault') return 'There is nothing to enter here.';
  if (state.flags.vaultOpen) return 'The vault is already open.';
  const attempt = words.join(' ').trim();
  if (attempt === VAULT_CODE) {
    state.flags.vaultOpen = true;
    const room = getRoom('vault');
    room.items = room.items || [];
    if (!room.items.includes('crystal')) room.items.push('crystal');
    if (!room.items.includes('sharpTool')) room.items.push('sharpTool');
    return 'The terminal beeps green and the STEEL DOOR slides open! Inside, a radiant CRYSTAL glows, and a SHARP TOOL lies in the corner.';
  }
  return 'The terminal buzzes — wrong code. Check your NOTES for the access code.';
}

const ACCESS_CODE_NOTE = { title: 'Vault Access Code', text: 'blue 4' };

function grantAccessCode(state) {
  state.flags.hasAccessCode = true;
  addNote(state, ACCESS_CODE_NOTE);
}

export function cmdHide(state) {
  if (state.room !== 'corridor') return 'There is nothing to hide from here.';
  if (state.flags.hasAccessCode) return 'The corridor is quiet now.';
  grantAccessCode(state);
  return (
    'You slip into the alcove and hold your breath. The patrol alien clomps past, taps a code into a ' +
    'panel, and sets a CODE TABLET on the bench before leaving. You sneak out and read it: the access code is "blue 4". ' +
    '(Saved to your NOTES.) The way NORTH is clear.'
  );
}

export function cmdAttack(state, noun, noun2) {
  const target = resolveItem(state, noun);
  const isAlien = target === 'patrolAlien' || target === 'vaultAlien' || noun === 'alien';

  if (state.room === 'corridor' && !state.flags.hasAccessCode) {
    if (!noun2 || !hasItem(state, resolveItem(state, noun2))) {
      return 'You swing — but with empty hands the alien shoves you back. You need a weapon, like the WRENCH.';
    }
    grantAccessCode(state);
    return (
      'You bonk the patrol alien with the wrench and it crumples in a heap! You grab its CODE TABLET — ' +
      'the access code is "blue 4". (Saved to your NOTES.) You win! The way NORTH is clear.'
    );
  }

  if (!isAlien) return "There's nothing here to attack.";
  return 'You take a swing, but nothing happens.';
}

export function cmdTalk(state, noun) {
  if (state.room === 'corridor' && !state.flags.hasAccessCode) {
    return 'The alien squints at you, confused. It doesn\'t recognize you — better get OUT OF SIGHT (try HIDE) or be ready to fight!';
  }
  const id = resolveItem(state, noun);
  if (!id) return 'There is no one here to talk to.';
  return 'No response.';
}
