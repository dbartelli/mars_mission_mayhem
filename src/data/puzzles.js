export const SYMBOL_PUZZLE = {
  // Displayed scrambled in the panel; clue (etching) gives the order.
  symbols: [
    { id: 'beam', glyph: '◈', label: 'BEAM' },
    { id: 'star', glyph: '⟁', label: 'STAR' },
    { id: 'sun', glyph: '☉', label: 'SUN' },
    { id: 'rock', glyph: '⬡', label: 'ROCK' },
  ],
  correctOrder: ['sun', 'star', 'beam', 'rock'],
};

export function checkSymbolOrder(attempt) {
  const want = SYMBOL_PUZZLE.correctOrder;
  if (!Array.isArray(attempt) || attempt.length !== want.length) return false;
  return attempt.every((v, i) => v === want[i]);
}
