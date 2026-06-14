import { describe, it, expect } from 'vitest';
import {
  createInitialState, hasItem, addItem, removeItem, visit,
} from '../src/engine/state.js';

describe('state', () => {
  it('starts in the cockpit with empty inventory', () => {
    const s = createInitialState();
    expect(s.room).toBe('cockpit');
    expect(s.inventory).toEqual([]);
    expect(s.visited).toEqual(['cockpit']);
    expect(s.flags).toEqual({});
  });

  it('adds and removes items without duplicates', () => {
    const s = createInitialState();
    addItem(s, 'wrench');
    addItem(s, 'wrench');
    expect(s.inventory).toEqual(['wrench']);
    expect(hasItem(s, 'wrench')).toBe(true);
    removeItem(s, 'wrench');
    expect(hasItem(s, 'wrench')).toBe(false);
  });

  it('records visited rooms once without duplicates', () => {
    const s = createInitialState();
    visit(s, 'surface');
    visit(s, 'surface');
    expect(s.visited).toEqual(['cockpit', 'surface']);
  });
});
