// Pas de tracé SVG dans les exemples et les gabarits (J2b, docs/ARCHITECTURE.md sections 4 et 9) : les icônes sont
// référencées par `<use href=".../chopa-icons.svg#ch-i-<nom>">`, de sorte que J8a ne remplace que src/icons/.
// Tout élément de dessin (path, circle, rect, line, polyline, polygon, ellipse) dans un <svg> de site/src/examples/**
// ou site/src/templates/** échoue ; <use> est permis.
import { readFileSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const DESSIN = /<(path|circle|rect|line|polyline|polygon|ellipse)\b/gi;

export default function svgSansTrace(ctx) {
  const racines = [join(ctx.ROOT, 'site', 'src', 'examples'), join(ctx.ROOT, 'site', 'src', 'templates')];
  const fichiers = racines.filter((r) => existsSync(r)).flatMap((r) => ctx.walk(r).filter((f) => f.endsWith('.html')));
  let svgs = 0;
  const traces = [];
  for (const f of fichiers) {
    const html = readFileSync(f, 'utf8');
    for (const m of html.matchAll(/<svg\b[\s\S]*?<\/svg>/gi)) {
      svgs++;
      for (const d of m[0].matchAll(DESSIN)) traces.push(`${relative(ctx.ROOT, f)} : <${d[1].toLowerCase()}> dans un <svg>`);
    }
  }
  return [
    { nom: `${svgs} <svg> lu(s) dans ${fichiers.length} fichier(s) HTML d'exemples et de gabarits`, ok: true },
    { nom: 'aucun tracé (path, circle, rect, line, polyline, polygon, ellipse) dans un <svg> d\'exemple ou de gabarit', ok: traces.length === 0, detail: traces.join(' ; ') },
  ];
}
