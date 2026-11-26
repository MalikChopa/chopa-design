// 0 occurrence de `data-theme` (migration D3, J1a-1) dans les sources et les sorties.
// Déplacé de check-dist.mjs (J1b-1), même logique.
import { readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

export default function noDataTheme(ctx) {
  const { ROOT, dist, walk } = ctx;
  const cibles = [['src/', join(ROOT, 'src')], ['site/src/', join(ROOT, 'site', 'src')], ['dist-lib/', dist.lib], ['site/dist/', dist.site]];
  return cibles.map(([nom, dir]) => {
    const bad = walk(dir).filter((f) => readFileSync(f, 'utf8').includes('data-theme'));
    return { nom: `0 occurrence de data-theme dans ${nom}`, ok: bad.length === 0, detail: bad.map((f) => relative(ROOT, f)).join(', ') };
  });
}
