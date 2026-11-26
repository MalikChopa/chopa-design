// Id uniques (Diapason, 2026-11-15) : sur chaque page construite de site/dist, aucun id n'est porté deux fois, et
// chaque référence par id (for, form, list, headers, popovertarget, commandfor, aria-controls, aria-describedby,
// aria-labelledby, aria-owns, aria-details, aria-errormessage, aria-activedescendant, aria-flowto) vise un id présent.
// Protège les copies par thème des exemples (Example.astro) et les pièces qui lient par id (onglets, menus, fenêtres).
import { readFileSync, existsSync } from 'node:fs';
import { relative } from 'node:path';

const REFS = ['for', 'form', 'list', 'headers', 'popovertarget', 'commandfor', 'aria-controls', 'aria-describedby',
  'aria-labelledby', 'aria-owns', 'aria-details', 'aria-errormessage', 'aria-activedescendant', 'aria-flowto'];

export default function idsUniques(ctx) {
  const res = [];
  const pages = existsSync(ctx.dist.site) ? ctx.walk(ctx.dist.site).filter((f) => f.endsWith('.html')) : [];
  res.push({ nom: 'ids-uniques : pages construites lues', ok: pages.length > 0, detail: `${pages.length} pages` });
  for (const f of pages) {
    const html = readFileSync(f, 'utf8');
    const balises = [...html.matchAll(/<[a-zA-Z][^>]*>/g)].map((m) => m[0]);
    const vus = new Map();
    const refs = [];
    for (const b of balises) {
      for (const [, nom, val] of b.matchAll(/\s([\w:-]+)="([^"]*)"/g)) {
        const n = nom.toLowerCase();
        if (n === 'id') vus.set(val, (vus.get(val) || 0) + 1);
        else if (REFS.includes(n)) for (const t of val.trim().split(/\s+/).filter(Boolean)) refs.push(`${n}="${t}"`);
      }
    }
    const doublons = [...vus].filter(([, c]) => c > 1).map(([id, c]) => `${id} ×${c}`);
    const orphelines = refs.filter((r) => !vus.has(r.slice(r.indexOf('"') + 1, -1)));
    const page = relative(ctx.ROOT, f);
    res.push({ nom: `ids-uniques : ${page}`, ok: doublons.length === 0, detail: `id en double : ${doublons.join(', ')}` });
    res.push({ nom: `ids-références : ${page}`, ok: orphelines.length === 0, detail: `cible absente : ${[...new Set(orphelines)].join(', ')}` });
  }
  return res;
}
