export function suggest(input, vocabulary, max = 5) {
  const text = String(input).toLowerCase();
  const lastSpace = text.lastIndexOf(' ');
  const prefix = text.slice(lastSpace + 1);
  if (!prefix) return [];
  return vocabulary.filter((w) => w.startsWith(prefix) && w !== prefix).slice(0, max);
}

export function applySuggestion(input, word) {
  const lastSpace = input.lastIndexOf(' ');
  return (lastSpace === -1 ? '' : input.slice(0, lastSpace + 1)) + word + ' ';
}
