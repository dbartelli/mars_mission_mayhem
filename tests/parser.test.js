import { describe, it, expect } from 'vitest';
import { normalize, tokenize, levenshtein, parse } from '../src/engine/parser.js';

const NOUNS = ['sealant', 'wrench', 'trapdoor', 'alien', 'sharp tool'];

describe('parser', () => {
  it('normalizes case, punctuation and spacing', () => {
    expect(normalize('  LOOK!! ')).toBe('look');
    expect(normalize('Go  North.')).toBe('go north');
  });

  it('drops filler words when tokenizing', () => {
    expect(tokenize('take the wrench')).toEqual(['take', 'wrench']);
  });

  it('computes edit distance', () => {
    expect(levenshtein('seelant', 'sealant')).toBe(1);
  });

  it('parses a verb and noun, fuzzy-correcting spelling', () => {
    const r = parse('take seelant', NOUNS);
    expect(r.verb).toBe('take');
    expect(r.noun).toBe('sealant');
  });

  it('maps single-letter and direction shortcuts to a go command', () => {
    expect(parse('n', NOUNS)).toMatchObject({ verb: 'go', noun: 'north' });
    expect(parse('go north', NOUNS)).toMatchObject({ verb: 'go', noun: 'north' });
  });

  it('splits "with"/"on" into a second noun', () => {
    const r = parse('attack alien with sharp tool', NOUNS);
    expect(r).toMatchObject({ verb: 'attack', noun: 'alien', noun2: 'sharp tool' });
  });

  it('captures a free-text sequence for enter', () => {
    const r = parse('enter sun star beam rock', NOUNS);
    expect(r.verb).toBe('enter');
    expect(r.words).toEqual(['sun', 'star', 'beam', 'rock']);
  });
});
