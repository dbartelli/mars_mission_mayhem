// Dependency-free build: flatten ES modules + CSS into one index.html.
import { readFileSync, writeFileSync } from 'node:fs';

// Build order: dependencies before dependents. All modules share one scope,
// so we strip `import ... from ...` lines and the `export ` keyword.
const MODULES = [
  'src/data/world.js',
  'src/data/puzzles.js',
  'src/engine/state.js',
  'src/engine/parser.js',
  'src/engine/commands.js',
  'src/engine/hints.js',
  'src/engine/save.js',
  'src/engine/game.js',
  'src/ui/render.js',
  'src/ui/panel.js',
  'src/ui/autocomplete.js',
  'src/ui/main.js',
];

function strip(src) {
  // Remove multi-line imports: `import { ... } from '...';`
  // Also handles single-line imports.
  src = src.replace(/^\s*import\s[\s\S]*?from\s+['"][^'"]+['"]\s*;?\s*$/gm, '');
  return src
    .split('\n')
    .map((line) => line.replace(/^\s*export\s+(?=function|const|class|let|var)/, ''))
    .join('\n');
}

const js = MODULES.map((f) => `// ===== ${f} =====\n${strip(readFileSync(f, 'utf8'))}`).join('\n\n');
const css = readFileSync('src/ui/styles.css', 'utf8');

let html = readFileSync('index.template.html', 'utf8');
html = html.replace('/*__CSS__*/', css).replace('/*__JS__*/', js);
writeFileSync('index.html', html);
console.log(`Built index.html (${html.length} bytes)`);
