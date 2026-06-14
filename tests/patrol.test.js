import { describe, it, expect } from 'vitest';
import { createInitialState, addItem } from '../src/engine/state.js';
import { cmdHide, cmdAttack, cmdTalk } from '../src/engine/commands.js';

function inCorridor() {
  const s = createInitialState();
  s.room = 'corridor';
  s.flags.loggedIn = true;
  return s;
}

describe('patrol beat', () => {
  it('stealth: HIDE earns the access code', () => {
    const s = inCorridor();
    const out = cmdHide(s);
    expect(s.flags.hasAccessCode).toBe(true);
    expect(s.inventory).toContain('codeTablet');
    expect(out.toLowerCase()).toContain('code');
  });

  it('combat: ATTACK ALIEN WITH WRENCH earns the access code', () => {
    const s = inCorridor();
    addItem(s, 'wrench');
    const out = cmdAttack(s, 'alien', 'wrench');
    expect(s.flags.hasAccessCode).toBe(true);
    expect(out.toLowerCase()).toContain('tablet');
  });

  it('combat without a weapon is a safe nudge, not a loss', () => {
    const s = inCorridor();
    const out = cmdAttack(s, 'alien', undefined);
    expect(s.flags.hasAccessCode).toBeFalsy();
    expect(out.toLowerCase()).toContain('need');
  });

  it('talking is always safe and hints what to do', () => {
    const s = inCorridor();
    const out = cmdTalk(s, 'alien');
    expect(s.flags.hasAccessCode).toBeFalsy();
    expect(out.toLowerCase()).toMatch(/hide|fight|out of sight/);
  });
});
