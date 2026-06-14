import { createInitialState } from './state.js';
import { parse } from './parser.js';
import { nounVocab } from '../data/world.js';
import { getHint } from './hints.js';
import { saveState, loadState } from './save.js';
import {
  describeRoom, cmdGo, cmdExamine, cmdTake, cmdDrop, cmdInventory,
  cmdRead, cmdUse, cmdPry, cmdEnter, cmdHide, cmdAttack, cmdTalk,
} from './commands.js';

const HELP_TEXT =
  'Commands you can try: LOOK, EXAMINE <thing>, GO <direction> (or N/S/E/W/U/D), ' +
  'TAKE <thing>, DROP <thing>, USE <thing>, READ <thing>, PRY <thing>, ' +
  'HIDE, ATTACK <foe> WITH <thing>, TALK, ENTER <code>, INVENTORY (I), NOTES, HELP (?).';

export function createGame() {
  const state = createInitialState();
  const vocab = nounVocab();
  const saved = loadState();
  const isNewGame = !saved || !saved.room;
  if (!isNewGame) Object.assign(state, saved);

  function notes() {
    if (state.notes.length === 0) return 'Your notebook is empty so far.';
    return 'NOTES:\n' + state.notes.map((n) => `• ${n.title}: ${n.text}`).join('\n');
  }

  function handle(input) {
    const p = parse(input, vocab);
    let out;
    if (!p.verb) {
      out = "I'm not sure what you mean. Type HELP or ? for ideas.";
    } else {
      out = dispatch(p);
    }
    saveState(state);
    return out;
  }

  function dispatch(p) {
    switch (p.verb) {
      case 'look': return p.noun ? cmdExamine(state, p.noun) : describeRoom(state);
      case 'examine': return cmdExamine(state, p.noun);
      case 'go': return p.noun ? cmdGo(state, p.noun) : 'Go where? Try N, S, E, W, UP or DOWN.';
      case 'take': return cmdTake(state, p.noun);
      case 'drop': return cmdDrop(state, p.noun);
      case 'inventory': return cmdInventory(state);
      case 'read': return cmdRead(state, p.noun);
      case 'use': return cmdUse(state, p.noun, p.noun2);
      case 'pry': return cmdPry(state, p.noun);
      case 'open': return (p.noun === 'trapdoor') ? cmdPry(state, 'trapdoor') : cmdUse(state, p.noun, p.noun2);
      case 'enter': return cmdEnter(state, p.words || []);
      case 'hide': return cmdHide(state);
      case 'attack': return cmdAttack(state, p.noun, p.noun2);
      case 'talk': return cmdTalk(state, p.noun);
      case 'notes': return notes();
      case 'help': return getHint(state) + '\n\n' + HELP_TEXT;
      default: return "I don't know how to do that. Type HELP or ?.";
    }
  }

  const roomDesc = describeRoom(state);
  const intro = isNewGame
    ? 'You wake in the wreck of your spaceship. You are the only survivor of the crash.\n\n' + roomDesc
    : 'Continuing your mission...\n\n' + roomDesc;
  return { state, handle, intro };
}
