// Coins : aucun arrondi dans la source (src/css/**) sauf `0` ou `var(--ch-radius)`.
// Seule exception approuvée (CLAUDE.md, 2026-11-15) : le bouton radio, `50%` sur ses sélecteurs `.ch-radio…`.
// Vérifie aussi que `--ch-radius` est posé à 0 dans la source (le réglage d'un site vit dans le site).
import { join, relative } from 'node:path';
import { ROOT, SRC } from '../lib/paths.mjs';
import { cssFiles, readText, walkBlocks } from '../lib/css.mjs';

const RADIO = /^\.ch-radio(?![\w-])/; // liste d'exceptions : le radio, rien d'autre
const RADIO_OK = new Set(['50%']);
const isRadiusProp = (p) => !p.startsWith('--') && /(^|-)radius$/.test(p);
const fails = [];
let seen = 0;

for (const f of cssFiles(join(SRC, 'css'))) {
  walkBlocks(readText(f), (selector, decls) => {
    for (const { prop, value } of decls) {
      const v = value.replace(/\s*!important\s*$/i, '').trim();
      if (prop === '--ch-radius') { seen++; if (v !== '0') fails.push(`${relative(ROOT, f)} : --ch-radius = ${v} (doit valoir 0)`); continue; }
      if (!isRadiusProp(prop)) continue;
      seen++;
      const radio = selector.split(',').every((s) => RADIO.test(s.trim()));
      const ok = v === '0' || v === 'var(--ch-radius)' || (radio && RADIO_OK.has(v));
      if (!ok) fails.push(`${relative(ROOT, f)} : ${selector} { ${prop}: ${v} }`);
    }
  });
}
if (fails.length) {
  console.error(`check-radius : ${fails.length} échec(s)`);
  for (const f of fails) console.error('  - ' + f);
  process.exit(1);
}
console.log(`check-radius : ${seen} déclaration(s) d'arrondi lues, 0 échec`);
