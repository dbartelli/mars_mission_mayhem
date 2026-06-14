import { describe, it, expect } from 'vitest';
import { SYMBOL_PUZZLE, checkSymbolOrder } from '../src/data/puzzles.js';
import { createInitialState } from '../src/engine/state.js';
import { cmdEnter } from '../src/engine/commands.js';

describe('symbol login puzzle', () => {
  it('defines four symbols and a correct order', () => {
    expect(SYMBOL_PUZZLE.symbols).toHaveLength(4);
    expect(SYMBOL_PUZZLE.correctOrder).toEqual(['sun', 'star', 'beam', 'rock']);
  });

  it('accepts the right order and rejects wrong ones', () => {
    expect(checkSymbolOrder(['sun', 'star', 'beam', 'rock'])).toBe(true);
    expect(checkSymbolOrder(['star', 'sun', 'beam', 'rock'])).toBe(false);
  });

  it('logs in when the player enters the right order in the control room', () => {
    const s = createInitialState();
    s.room = 'terminalRoom';
    const wrong = cmdEnter(s, ['star', 'sun', 'beam', 'rock']);
    expect(s.flags.loggedIn).toBeFalsy();
    expect(wrong.toLowerCase()).toContain('wrong');
    const right = cmdEnter(s, ['sun', 'star', 'beam', 'rock']);
    expect(s.flags.loggedIn).toBe(true);
    expect(right.toLowerCase()).toContain('patrol');
  });
});
