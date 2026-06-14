import { hasItem } from './state.js';

// Determine the current gate the player is working on, with escalating hints.
function currentGate(state) {
  if (!state.flags.visorFixed) {
    return {
      key: 'visor',
      hints: [
        'Your visor is cracked. Look around the cockpit for something to seal it.',
        'Try TAKE SEALANT, then USE SEALANT.',
        'Type: USE SEALANT — it patches your visor so you can go OUT.',
      ],
    };
  }
  if (!state.flags.trapdoorOpen) {
    return {
      key: 'trapdoor',
      hints: [
        'There is a trapdoor in the sand on the surface. You need something to pry it.',
        'TAKE the WRENCH from the cockpit, go OUT, then PRY TRAPDOOR.',
        'Use the WRENCH to pry open the TRAPDOOR and get underground.',
      ],
    };
  }
  if (!state.flags.loggedIn) {
    return {
      key: 'login',
      hints: [
        'Head DOWN into the base and find the control terminal.',
        'The terminal needs four symbols in order. Find a clue in the room.',
        'READ the ETCHING, then ENTER SUN STAR BEAM ROCK.',
      ],
    };
  }
  if (!state.flags.hasAccessCode) {
    return {
      key: 'patrol',
      hints: [
        'A patrol is coming through the EAST door. You need its access code.',
        'You can HIDE in the alcove, or fight if you have a weapon. Talking is safe.',
        'Type HIDE to sneak the code, or ATTACK ALIEN WITH WRENCH to fight.',
      ],
    };
  }
  if (!state.flags.vaultOpen) {
    return {
      key: 'vaultCode',
      hints: [
        'Go NORTH to the vault and use the terminal.',
        'Check your NOTES for the access code.',
        'Type: ENTER BLUE 4 at the vault terminal.',
      ],
    };
  }
  return {
    key: 'cliffhanger',
    hints: [
      'Take the treasures in the vault.',
      'TAKE the CRYSTAL, then TAKE the SHARP TOOL.',
      'Grab the SHARP TOOL to see what happens next!',
    ],
  };
}

export function getHint(state) {
  if (!state._hint) state._hint = { gate: null, step: 0 };
  const gate = currentGate(state);
  if (state._hint.gate !== gate.key) {
    state._hint.gate = gate.key;
    state._hint.step = 0;
  }
  const idx = Math.min(state._hint.step, gate.hints.length - 1);
  state._hint.step += 1;
  return gate.hints[idx];
}
