const KEY = 'marsMissionMayhem.slice1';

function defaultStorage() {
  return typeof localStorage !== 'undefined' ? localStorage : null;
}

export function saveState(state, storage = defaultStorage()) {
  if (!storage) return;
  try {
    storage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage full or unavailable — ignore, game still playable */
  }
}

export function loadState(storage = defaultStorage()) {
  if (!storage) return null;
  const raw = storage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearState(storage = defaultStorage()) {
  if (!storage) return;
  storage.removeItem(KEY);
}
