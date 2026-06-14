// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { renderMinimap, appendLine } from '../src/ui/render.js';

beforeEach(() => {
  document.body.innerHTML = '<div id="console"></div><div id="minimap"></div>';
});

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
});
