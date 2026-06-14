import { describe, it, expect, beforeEach } from 'vitest';
import { createInitialState, addItem } from '../src/engine/state.js';
import { describeRoom, cmdGo, cmdExamine, availableExits, cmdTake, cmdDrop, cmdInventory, cmdRead, cmdUse, cmdPry } from '../src/engine/commands.js';
import { rooms } from '../src/data/world.js';

// Reset shared room item arrays before each test to avoid inter-test pollution.
const originalRoomItems = Object.fromEntries(
  Object.entries(rooms).map(([id, room]) => [id, [...(room.items || [])]])
);
beforeEach(() => {
  for (const [id, items] of Object.entries(originalRoomItems)) {
    rooms[id].items = [...items];
  }
});

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

describe('inventory', () => {
  it('takes a takeable item from the room', () => {
    const s = createInitialState();
    const out = cmdTake(s, 'wrench');
    expect(out.toLowerCase()).toContain('take');
    expect(s.inventory).toContain('wrench');
  });

  it('refuses to take scenery', () => {
    const s = createInitialState();
    const out = cmdTake(s, 'mission screen');
    expect(out.toLowerCase()).toContain("can't take");
    expect(s.inventory).not.toContain('missionScreen');
  });

  it('lists inventory contents', () => {
    const s = createInitialState();
    cmdTake(s, 'wrench');
    expect(cmdInventory(s)).toContain('wrench');
    const empty = createInitialState();
    expect(cmdInventory(empty).toLowerCase()).toContain('empty');
  });

  it('drops an item back into the room', () => {
    const s = createInitialState();
    cmdTake(s, 'wrench');
    cmdDrop(s, 'wrench');
    expect(s.inventory).not.toContain('wrench');
  });
});

describe('phase 1 beats', () => {
  it('reads the mission screen', () => {
    const s = createInitialState();
    expect(cmdRead(s, 'mission screen')).toContain('HOSTILE');
  });

  it('seals the visor with the sealant and sets the flag', () => {
    const s = createInitialState();
    const out = cmdUse(s, 'sealant', 'visor');
    expect(s.flags.visorFixed).toBe(true);
    expect(out.toLowerCase()).toContain('visor');
  });

  it('pries the trapdoor open only with the wrench', () => {
    const s = createInitialState();
    s.flags.visorFixed = true;
    cmdGo(s, 'out'); // now on surface
    expect(cmdPry(s, 'trapdoor').toLowerCase()).toContain('need'); // no wrench yet
    expect(s.flags.trapdoorOpen).toBeFalsy();
    addItem(s, 'wrench');
    const out = cmdPry(s, 'trapdoor');
    expect(s.flags.trapdoorOpen).toBe(true);
    expect(out.toLowerCase()).toContain('open');
  });
});
