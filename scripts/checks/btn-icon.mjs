// Bouton icône (J2b, docs/ARCHITECTURE.md section 9) : tout élément de classe `ch-btn--icon` dans un exemple
// (site/src/examples/**) ou un gabarit (site/src/templates/**) porte un nom accessible posé par attribut :
// `aria-label` non vide ou `aria-labelledby` non vide. Sans lui, le bouton n'a pas de nom (le glyphe est aria-hidden).
import { readFileSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const attr = (tag, nom) => {
  const m = tag.match(new RegExp(`\\s${nom}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'i'));
  return m ? (m[1] ?? m[2]).trim() : null;
};

export default function btnIcon(ctx) {
  const res = [];
  const racines = [join(ctx.ROOT, 'site', 'src', 'examples'), join(ctx.ROOT, 'site', 'src', 'templates')];
  const fichiers = racines.filter((r) => existsSync(r)).flatMap((r) => ctx.walk(r).filter((f) => f.endsWith('.html')));
  let n = 0;
  const sansNom = [];
  for (const f of fichiers) {
    const html = readFileSync(f, 'utf8');
    for (const m of html.matchAll(/<(?:button|a|input|summary)\b[^>]*>/gi)) {
      const cls = attr(m[0], 'class');
      if (cls === null || !/(?:^|\s)ch-btn--icon(?:\s|$)/.test(cls)) continue;
      n++;
      if (!attr(m[0], 'aria-label') && !attr(m[0], 'aria-labelledby')) sansNom.push(`${relative(ctx.ROOT, f)} : ${m[0].slice(0, 90)}`);
    }
  }
  res.push({ nom: `${n} bouton(s) ch-btn--icon lu(s) dans ${fichiers.length} fichier(s) HTML`, ok: n > 0 });
  res.push({ nom: 'chaque ch-btn--icon a un aria-label ou un aria-labelledby non vide', ok: sansNom.length === 0, detail: sansNom.join(' ; ') });
  return res;
}
