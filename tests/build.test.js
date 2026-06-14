import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';

describe('build', () => {
  it('produces a single self-contained index.html', () => {
    execSync('node build.mjs');
    expect(existsSync('index.html')).toBe(true);
    const html = readFileSync('index.html', 'utf8');
    expect(html).not.toContain('import {'); // imports were stripped
    expect(html).not.toMatch(/\bexport function\b/); // exports were stripped
    expect(html).toContain('createGame'); // engine inlined
    expect(html).toContain('id="console"'); // template intact
  });
});
