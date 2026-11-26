// Jetons : dans les fichiers de composants (src/css/ hors 00-fonts, 10-tokens, 20-themes) :
//   1. seuls les rôles de niveau 2 (docs/ARCHITECTURE.md, section 3) sont lus par var() ;
//   2. aucune couleur hexadécimale ;
//   3. une variante `.ch-x--y` n'apparaît que dans `40-components/x.css`.
import { join, relative, basename } from 'node:path';
import { ROOT, SRC } from '../lib/paths.mjs';
import { cssFiles, readText, stripComments, walkBlocks } from '../lib/css.mjs';

const ROLES = new Set([
  'bg', 'bg2', 'card', 'line', 'fg', 'soft', 'mute',
  'acc', 'acc-text', 'on-acc', 'dim-pct', 'acc-dim', 'focus',
  'sans', 'display', 'mono', 'display-weight', 'display-track',
  'hit', 'measure', 'wrap-max',
  'radius', 't-fast', 't-panel', 'z-bar', 'z-overlay',
  ...Array.from({ length: 9 }, (_, i) => `s${i + 1}`),
].map((r) => `--ch-${r}`));
const SKIP = new Set(['00-fonts.css', '10-tokens.css', '20-themes.css']);
const cssDir = join(SRC, 'css');
const fails = [];
let files = 0, vars = 0, variants = 0;

for (const f of cssFiles(cssDir)) {
  const rel = relative(cssDir, f);
  if (SKIP.has(basename(f)) && !rel.includes('/')) continue;
  files++;
  const text = stripComments(readText(f));
  const sansChaines = text.replace(/"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'/g, '""').replace(/url\([^)]*\)/g, 'url()');
  for (const m of sansChaines.matchAll(/var\(\s*(--[\w-]+)/g)) {
    vars++;
    if (!ROLES.has(m[1])) fails.push(`${rel} : jeton hors liste ${m[1]}`);
  }
  for (const m of sansChaines.matchAll(/#[0-9a-fA-F]{3,8}\b/g)) fails.push(`${rel} : couleur hexadécimale ${m[0]}`);
  if (rel.startsWith('40-components/')) {
    const slug = basename(f, '.css');
    walkBlocks(text, (selector) => {
      for (const m of selector.matchAll(/\.ch-([a-z0-9]+(?:-[a-z0-9]+)*)--[a-z0-9]+(?:-[a-z0-9]+)*/g)) {
        variants++;
        if (m[1] !== slug) fails.push(`${rel} : variante ${m[0]} hors de ${m[1]}.css`);
      }
    });
  }
}
if (fails.length) {
  console.error(`check-tokens : ${fails.length} échec(s)`);
  for (const f of fails) console.error('  - ' + f);
  process.exit(1);
}
console.log(`check-tokens : ${files} fichier(s), ${vars} lecture(s) de jeton, ${variants} variante(s), 0 échec`);
