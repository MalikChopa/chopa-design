// Contraste du bloc de code (J1b-1, docs/ARCHITECTURE.md sections 7 et 9) : chaque variable --astro-code-* posée par
// site/src/doc.css, résolue dans chacun des 3 thèmes depuis dist-lib/chopa.css, doit faire au moins 4,5 : 1 sur la surface
// `card` (--astro-code-background). Vérifie aussi que la page construite emploie Shiki `css-variables` (et pas un thème figé)
// et que chaque variable utilisée par le HTML construit est définie. Lit le source de doc.css (valeurs en var(--ch-*) seulement).
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { THEMES, rawTokens, resolve } from '../../src/lib/css-tokens.mjs';
import { parseColor, ratio } from '../../src/lib/color.mjs';
import { MIN_TEXT } from '../../src/lib/pairs.mjs';

// Variables lues dans le(s) bloc(s) de doc.css dont la liste de sélecteurs contient « [data-ch-theme] ».
function codeVars(docCss) {
  const css = docCss.replace(/\/\*[\s\S]*?\*\//g, '');
  const vars = {};
  for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (!m[1].includes('[data-ch-theme]')) continue;
    for (const d of m[2].split(';')) {
      const k = d.indexOf(':');
      if (k > 0 && d.slice(0, k).trim().startsWith('--astro-code-')) vars[d.slice(0, k).trim()] = d.slice(k + 1).trim();
    }
  }
  return vars;
}

export default function codeContrast(ctx) {
  const res = [];
  const add = (nom, ok, detail = '') => res.push({ nom, ok: Boolean(ok), detail });
  const docFile = join(ctx.ROOT, 'site', 'src', 'doc.css');
  if (!existsSync(docFile)) return [{ nom: 'site/src/doc.css présent', ok: false }];
  const vars = codeVars(readFileSync(docFile, 'utf8'));
  const noms = Object.keys(vars);
  const attendues = ['foreground', 'background', 'token-keyword', 'token-string', 'token-constant', 'token-comment', 'token-parameter', 'token-function', 'token-string-expression', 'token-punctuation', 'token-link', 'token-inserted', 'token-deleted', 'token-changed'].map((k) => `--astro-code-${k}`);
  for (const a of attendues) add(`variable définie : ${a}`, noms.includes(a));
  if (!noms.includes('--astro-code-background')) return res;
  for (const theme of THEMES) {
    let raw;
    try { raw = rawTokens(ctx.css, theme); } catch (e) { add(`${theme} : lecture des jetons`, false, e.message); continue; }
    let fond;
    try { fond = parseColor(resolve(vars['--astro-code-background'], raw)); } catch (e) { add(`${theme} : fond du code`, false, e.message); continue; }
    for (const nom of noms) {
      if (nom === '--astro-code-background') continue;
      try {
        const r = ratio(parseColor(resolve(vars[nom], raw)), fond);
        add(`${theme} : ${nom.replace('--astro-code-', '')} sur le fond du code = ${r.toFixed(2)}`, r >= MIN_TEXT, r >= MIN_TEXT ? '' : `${r.toFixed(2)} < ${MIN_TEXT}`);
      } catch (e) { add(`${theme} : ${nom}`, false, e.message); }
    }
  }
  // Page construite : `css-variables`, et toutes les variables employées par le HTML sont définies.
  const index = join(ctx.dist.site, 'index.html');
  if (!existsSync(index)) { add('site/dist/index.html présent', false); return res; }
  const html = readFileSync(index, 'utf8');
  add('bloc de code : Shiki css-variables', /<pre class="astro-code css-variables"/.test(html));
  add('aucun thème Shiki figé (github-dark…)', !/<pre class="astro-code (?!css-variables)/.test(html));
  const utilisees = [...new Set([...html.matchAll(/var\((--astro-code-[a-z-]+)\)/g)].map((m) => m[1]))];
  add('au moins une variable de coloration employée', utilisees.length > 0);
  for (const u of utilisees) add(`variable employée définie dans doc.css : ${u}`, noms.includes(u));
  return res;
}
