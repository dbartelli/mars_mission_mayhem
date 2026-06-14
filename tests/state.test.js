import { describe, it, expect } from 'vitest';
import {
  createInitialState, hasItem, addItem, removeItem, addNote, visit,
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

  it('adds notes once and records visited rooms once', () => {
    const s = createInitialState();
    addNote(s, { title: 'Access Code', text: 'blue 4' });
    addNote(s, { title: 'Access Code', text: 'blue 4' });
    expect(s.notes).toHaveLength(1);
    visit(s, 'surface');
    visit(s, 'surface');
    expect(s.visited).toEqual(['cockpit', 'surface']);
  });
});
