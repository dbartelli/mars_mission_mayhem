import { describe, it, expect } from 'vitest';
import { createInitialState } from '../src/engine/state.js';
import { getHint } from '../src/engine/hints.js';

describe('hints', () => {
  it('gives the current goal as the first hint, escalating on repeat', () => {
    const s = createInitialState();
    const h1 = getHint(s);
    const h2 = getHint(s);
    expect(h1).not.toEqual(h2); // escalates
    expect(`${h1} ${h2}`.toLowerCase()).toContain('visor');
  });

  it('targets the right gate as the player progresses', () => {
    const s = createInitialState();
    s.flags.visorFixed = true;
    s.room = 'surface';
    expect(getHint(s).toLowerCase()).toContain('trapdoor');
  });

  it('resets escalation when the gate changes', () => {
    const s = createInitialState();
    getHint(s); getHint(s); // escalate cockpit
    s.flags.visorFixed = true; s.room = 'surface';
    const first = getHint(s);
    expect(first.toLowerCase()).toContain('trapdoor');
  });
});
