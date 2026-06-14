import { describe, it, expect } from 'vitest';
import { createInitialState, addItem } from '../src/engine/state.js';
import { describeRoom, cmdGo, cmdExamine, availableExits } from '../src/engine/commands.js';

describe('movement & look', () => {
  it('describes the current room and its exits', () => {
    const s = createInitialState();
    const text = describeRoom(s);
    expect(text).toContain('Crashed Cockpit');
    expect(text.toLowerCase()).toContain('exits');
  });

  it('blocks a locked exit with its message and stays put', () => {
    const s = createInitialState();
    const out = cmdGo(s, 'out');
    expect(out.toLowerCase()).toContain('seal it first');
    expect(s.room).toBe('cockpit');
  });

  it('moves through an unlocked exit and records the visit', () => {
    const s = createInitialState();
    s.flags.visorFixed = true;
    const out = cmdGo(s, 'out');
    expect(s.room).toBe('surface');
    expect(s.visited).toContain('surface');
    expect(out).toContain('Martian Surface');
  });

  it('examines an item in the room', () => {
    const s = createInitialState();
    expect(cmdExamine(s, 'sealant')).toContain('visor sealant');
  });

  it('lists only currently-available exits', () => {
    const s = createInitialState();
    expect(availableExits(s)).toEqual([]); // visor not fixed -> out is locked
    s.flags.visorFixed = true;
    expect(availableExits(s)).toContain('out');
  });
});
