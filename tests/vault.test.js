import { describe, it, expect, beforeEach } from 'vitest';
import { createInitialState } from '../src/engine/state.js';
import { cmdEnter, cmdTake } from '../src/engine/commands.js';
import { rooms } from '../src/data/world.js';

// Reset shared room item arrays before each test to avoid inter-test pollution.
const originalVaultItems = [...(rooms.vault.items || [])];
beforeEach(() => {
  rooms.vault.items = [...originalVaultItems];
});

function inVault() {
  const s = createInitialState();
  s.room = 'vault';
  s.flags.hasAccessCode = true;
  // make crystal + sharpTool reachable like the real game does on open
  return s;
}

describe('vault', () => {
  it('opens the steel door with the right code', () => {
    const s = inVault();
    const wrong = cmdEnter(s, ['red', '9']);
    expect(s.flags.vaultOpen).toBeFalsy();
    expect(wrong.toLowerCase()).toContain('tablet');
    const right = cmdEnter(s, ['blue', '4']);
    expect(s.flags.vaultOpen).toBe(true);
    expect(right.toLowerCase()).toContain('crystal');
    expect(rooms.vault.items).toContain('crystal');
    expect(rooms.vault.items).toContain('sharpTool');
  });

  it('taking the sharp tool triggers the cliffhanger and ends the slice', () => {
    const s = inVault();
    cmdEnter(s, ['blue', '4']);
    cmdTake(s, 'crystal');
    const out = cmdTake(s, 'sharp tool');
    expect(s.inventory).toContain('sharpTool');
    expect(s.flags.slice1Complete).toBe(true);
    expect(out.toLowerCase()).toContain('footsteps');
  });
});
