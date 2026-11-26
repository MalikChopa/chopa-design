// Lecture minimale du CSS pour les contrôles : retire les commentaires, parcourt les blocs (at-rules et
// imbrication comprises) et rend, pour chaque bloc, son sélecteur et ses déclarations propres. Sans dépendance.
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));

// Remplace le contenu des chaînes par des espaces (garde les guillemets et les sauts de ligne) pour que
// « { », « ; » ou « # » dans une chaîne ne gênent pas l'analyse.
const blankStrings = (css) => css.replace(/"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'/g, (m) => m[0] + ' '.repeat(m.length - 2) + m[m.length - 1]);

// Découpe un texte CSS en { decls: ['prop: valeur', …], blocks: [{ selector, inner }] } (premier niveau).
function split(text) {
  const decls = []; const blocks = [];
  let buf = ''; let i = 0;
  while (i < text.length) {
    const c = text[i];
    if (c === ';') { if (buf.trim()) decls.push(buf.trim()); buf = ''; i++; }
    else if (c === '{') {
      let depth = 1; let j = i + 1;
      while (j < text.length && depth) { if (text[j] === '{') depth++; else if (text[j] === '}') depth--; j++; }
      blocks.push({ selector: buf.trim(), inner: text.slice(i + 1, j - 1) });
      buf = ''; i = j;
    } else { buf += c; i++; }
  }
  if (buf.trim()) decls.push(buf.trim());
  return { decls, blocks };
}

// cb(selecteur, [{prop, value}], chaine) pour chaque bloc ; `chaine` = sélecteurs englobants (at-rules comprises).
export function walkBlocks(css, cb, chain = []) {
  const { blocks } = split(blankStrings(stripComments(css)));
  for (const b of blocks) walkNode(b, cb, chain);
}
function walkNode(b, cb, chain) {
  const { decls, blocks } = split(b.inner);
  cb(b.selector, declarations(decls.join(';')), chain);
  for (const c of blocks) walkNode(c, cb, [...chain, b.selector]);
}

// Déclarations « prop: valeur » d'une chaîne de déclarations.
export function declarations(decl) {
  return decl.split(';').map((s) => s.trim()).filter(Boolean).map((s) => {
    const k = s.indexOf(':');
    return k < 0 ? null : { prop: s.slice(0, k).trim().toLowerCase(), value: s.slice(k + 1).trim() };
  }).filter(Boolean);
}

export function cssFiles(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1)).flatMap((e) => {
    const p = join(dir, e.name);
    return e.isDirectory() ? cssFiles(p) : e.name.endsWith('.css') ? [p] : [];
  });
}
export const readText = (p) => readFileSync(p, 'utf8');
