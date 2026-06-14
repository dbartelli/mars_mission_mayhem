// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { renderMinimap, renderExits, appendLine } from '../src/ui/render.js';

beforeEach(() => { document.body.innerHTML = '<div id="console"></div><div id="minimap"></div><div id="exits"></div>'; });

describe('render', () => {
  it('appends a line to the console', () => {
    appendLine('Hello Mars', 'room');
    expect(document.getElementById('console').textContent).toContain('Hello Mars');
  });

  it('marks the current room in the minimap', () => {
    renderMinimap({ room: 'surface', visited: ['cockpit', 'surface'] });
    const here = document.querySelector('.cell.here');
    expect(here.textContent.toLowerCase()).toContain('surface');
  });

  it('renders a button per available exit', () => {
    const clicks = [];
    renderExits(['out', 'down'], (cmd) => clicks.push(cmd));
    const btns = document.querySelectorAll('#exits button');
    expect(btns).toHaveLength(2);
    btns[0].click();
    expect(clicks[0]).toBe('go out');
  });
});
