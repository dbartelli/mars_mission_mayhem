import { describe, it, expect } from 'vitest';
import { suggest } from '../src/ui/autocomplete.js';

const WORDS = ['look', 'sealant', 'wrench', 'sun', 'star', 'beam', 'rock', 'trapdoor'];

describe('autocomplete', () => {
  it('suggests words that start with the last token', () => {
    expect(suggest('use se', WORDS)).toContain('sealant');
  });

  it('returns nothing for an empty input', () => {
    expect(suggest('', WORDS)).toEqual([]);
  });

  it('caps the number of suggestions', () => {
    expect(suggest('s', WORDS).length).toBeLessThanOrEqual(5);
  });
});
