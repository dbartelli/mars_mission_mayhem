import { describe, it, expect } from 'vitest';
import { rooms, items, getRoom, getItem, nounVocab } from '../src/data/world.js';

describe('world data', () => {
  it('defines all slice-1 rooms', () => {
    for (const id of ['cockpit', 'surface', 'shaft', 'entryHall', 'terminalRoom', 'corridor', 'vault']) {
      expect(getRoom(id), `room ${id}`).toBeTruthy();
    }
  });

  it('every exit points to a real room', () => {
    for (const room of Object.values(rooms)) {
      for (const exit of Object.values(room.exits || {})) {
        const to = typeof exit === 'string' ? exit : exit.to;
        expect(rooms[to], `exit to ${to} from ${room.id}`).toBeTruthy();
      }
    }
  });

  it('every item referenced by a room exists', () => {
    for (const room of Object.values(rooms)) {
      for (const itemId of room.items || []) {
        expect(getItem(itemId), `item ${itemId} in ${room.id}`).toBeTruthy();
      }
    }
  });

  it('builds a noun vocabulary including item names and aliases', () => {
    const vocab = nounVocab();
    expect(vocab).toContain('sealant');
    expect(vocab).toContain('wrench');
    expect(vocab).toContain('sharp tool');
  });
});
