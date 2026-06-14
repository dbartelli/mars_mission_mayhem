import { createInitialState } from './state.js';
import { parse } from './parser.js';
import { nounVocab } from '../data/world.js';
import { saveState, loadState } from './save.js';
import {
  describeRoom, cmdGo, cmdExamine, cmdTake, cmdDrop, cmdInventory,
  cmdRead, cmdUse, cmdPry, cmdEnter, cmdHide, cmdAttack, cmdTalk,
} from './commands.js';

const HELP_TEXT =
  'Use the buttons to play: GO moves you between rooms, LOOK AT examines things, ' +
  'TAKE picks up items, and BACKPACK lets you use what you\'re carrying. ' +
  'USE and ACTIONS sections appear when you have something specific to do.';

export function createGame() {
  const state = createInitialState();
  const vocab = nounVocab();
  const saved = loadState();
  const isNewGame = !saved || !saved.room;
  if (!isNewGame) Object.assign(state, saved);

  function handle(input) {
    const p = parse(input, vocab);
    let out;
    if (!p.verb) {
      out = "I'm not sure what you mean. Click 'How to play' for help.";
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
      case 'go': return p.noun ? cmdGo(state, p.noun) : 'Use the GO buttons to move between rooms.';
      case 'take': return cmdTake(state, p.noun);
      case 'drop': return cmdDrop(state, p.noun);
      case 'inventory': return cmdInventory(state);
      case 'read': return cmdRead(state, p.noun);
      case 'use': return cmdUse(state, p.noun, p.noun2);
      case 'pry': return cmdPry(state, p.noun);
      case 'open': {
        if (state.room === 'cockpit' && p.noun && ['hatch', 'door', 'exit'].includes(p.noun))
          return cmdGo(state, 'out');
        if (['trapdoor', 'hatch', 'door'].includes(p.noun)) return cmdPry(state, p.noun);
        return cmdUse(state, p.noun, p.noun2);
      }
      case 'enter': return cmdEnter(state, p.words || []);
      case 'hide': return cmdHide(state);
      case 'attack': return cmdAttack(state, p.noun, p.noun2);
      case 'talk': return cmdTalk(state, p.noun);
      case 'help': return HELP_TEXT;
      default: return "I don't know how to do that. Click 'How to play' for help.";
    }
  }

  const roomDesc = describeRoom(state);
  const intro = isNewGame
    ? 'You wake in the wreck of your spaceship. You are the only survivor of the crash.\n\n' + roomDesc
    : 'Continuing your mission...\n\n' + roomDesc;
  return { state, handle, intro };
}
