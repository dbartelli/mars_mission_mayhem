import { describe, it, expect, beforeEach } from 'vitest';
import { createGame } from '../src/engine/game.js';
import { rooms } from '../src/data/world.js';

// The game mutates shared room.items and flags; reset before each run.
const pristine = {
  cockpit: ['missionScreen', 'locker'],
  surface: ['trapdoor'],
  vault: ['vaultTerminal', 'steelDoor'],
};
beforeEach(() => {
  for (const [id, items] of Object.entries(pristine)) rooms[id].items = [...items];
});

function play(game, cmds) {
  return cmds.map((c) => game.handle(c));
}

describe('full slice-1 walkthrough', () => {
  it('completes via the STEALTH path', () => {
    const game = createGame();
    play(game, [
      'read mission screen', 'open locker', 'take super glue', 'use super glue', 'take wrench',
      'go out', 'pry trapdoor', 'go down', 'go down',
      'go north', 'read etching', 'enter sun star beam rock',
      'go south', 'go east', 'hide', 'go north',
      'enter blue 4', 'take crystal',
    ]);
    expect(game.state.flags.hasAccessCode).toBe(true);
    expect(game.state.flags.vaultOpen).toBe(true);
    const last = game.handle('take sharp tool');
    expect(game.state.flags.slice1Complete).toBe(true);
    expect(last.toLowerCase()).toContain('continued');
  });

  it('completes via the COMBAT path', () => {
    const game = createGame();
    play(game, [
      'open locker', 'take super glue', 'use super glue', 'take wrench',
      'go out', 'pry trapdoor', 'go down', 'go down',
      'go north', 'enter sun star beam rock',
      'go south', 'go east', 'attack alien with wrench', 'go north',
      'enter blue 4', 'take crystal', 'take sharp tool',
    ]);
    expect(game.state.flags.slice1Complete).toBe(true);
  });

  it('NOTES shows the access code after the patrol beat', () => {
    const game = createGame();
    game.state.room = 'corridor';
    game.state.flags.loggedIn = true;
    game.handle('hide');
    expect(game.handle('notes').toLowerCase()).toContain('blue 4');
  });

  it('unknown commands are handled kindly', () => {
    const game = createGame();
    expect(game.handle('xyzzy').toLowerCase()).toMatch(/don't|not sure|try/);
  });
});
