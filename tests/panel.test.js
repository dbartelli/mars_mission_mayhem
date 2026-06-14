// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { renderPanel } from '../src/ui/panel.js';

beforeEach(() => { document.body.innerHTML = '<div id="panel"></div>'; });

describe('visual panel', () => {
  it('shows the four Martian symbols in the control room', () => {
    renderPanel({ room: 'terminalRoom', flags: {}, puzzles: { symbolLogin: { attempt: [] } } }, () => {});
    expect(document.querySelectorAll('.symbol')).toHaveLength(4);
  });

  it('clicking symbols builds an ENTER command when four are chosen', () => {
    let cmd = null;
    renderPanel({ room: 'terminalRoom', flags: {}, puzzles: { symbolLogin: { attempt: [] } } }, (c) => { cmd = c; });
    const syms = document.querySelectorAll('.symbol');
    syms.forEach((s) => s.click()); // pick all four in displayed order
    expect(cmd).toMatch(/^enter /);
  });

  it('shows a friendly default panel elsewhere', () => {
    renderPanel({ room: 'cockpit', flags: {}, puzzles: {} }, () => {});
    expect(document.getElementById('panel').textContent.length).toBeGreaterThan(0);
  });
});
