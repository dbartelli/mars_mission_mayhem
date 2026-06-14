import { describe, it, expect } from 'vitest';
import { saveState, loadState, clearState } from '../src/engine/save.js';

function fakeStorage() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
  };
}

describe('save/load', () => {
  it('round-trips state through storage', () => {
    const store = fakeStorage();
    const state = { room: 'vault', inventory: ['crystal'], flags: { vaultOpen: true }, notes: [], visited: ['cockpit'], puzzles: {} };
    saveState(state, store);
    const loaded = loadState(store);
    expect(loaded.room).toBe('vault');
    expect(loaded.inventory).toEqual(['crystal']);
    expect(loaded.flags.vaultOpen).toBe(true);
  });

  it('returns null when nothing is saved and clears cleanly', () => {
    const store = fakeStorage();
    expect(loadState(store)).toBeNull();
    saveState({ room: 'cockpit' }, store);
    clearState(store);
    expect(loadState(store)).toBeNull();
  });
});
