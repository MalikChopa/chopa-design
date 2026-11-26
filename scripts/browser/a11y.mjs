// Accessibilité (J2a-1) : axe-core 4.14.0 sur chaque page construite × 3 thèmes (Chromium) ;
// WebKit : au moins la page d'accueil, 3 thèmes. 0 violation exigée. Aucune règle désactivée, aucun élément exclu.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { listPages, openPage, withBench, THEMES } from '../lib/browser.mjs';

const axeSrc = readFileSync(createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8');
const t0 = Date.now();
const fails = [];
let runs = 0, nbPages = 0, n375 = 0;

async function scan(browser, label, url, route, theme, width = 1280) {
  const o = await openPage(browser, url, { width, height: width < 800 ? 812 : 900, theme });
  try {
    // Diapason (J6) : axe lit l'état stable, transitions terminées (ex. puces de thème qui passent en aria-pressed au chargement :
    // un contraste lu en pleine transition variait de 1,36 à 1,55). Ne masque rien : la couleur finale est celle qui est jugée.
    // Une animation infinie (indicateur, squelette, progression indéterminée) ne peut pas être « finie » : elle est laissée telle quelle.
    await o.page.evaluate(() => document.getAnimations().forEach((a) => { try { a.finish(); } catch (_) { /* infinie */ } }));
    await o.page.evaluate(axeSrc);
    const r = await o.page.evaluate(() => axe.run(document));
    runs++;
    for (const v of r.violations) {
      for (const n of v.nodes) fails.push(`${label} ${route} [${theme}${width !== 1280 ? ' ' + width + ' px' : ''}] ${v.id} (${v.impact}) : ${n.target.join(' ')} — ${n.failureSummary?.split('\n')[1]?.trim() ?? v.help}`);
    }
    for (const p of o.problems) fails.push(`${label} ${route} [${theme}] ${p}`);
  } finally { await o.close(); }
}

try {
  await withBench(async ({ server, launch }) => {
    const pages = listPages();
    nbPages = pages.length;
    const c = await launch('chromium');
    if (c.note) console.log(c.note);
    for (const p of pages) for (const t of THEMES) await scan(c.browser, 'chromium', server.url + p.route, p.route, t);
    // Téléphone (Diapason, après le testeur n° 1) : chaque page à 375 px, thème sombre (la mise en page ne dépend pas du thème ;
    // le contraste est déjà lu dans les 3 thèmes à 1280 px). Attrape par exemple une région défilante sans focus.
    for (const p of pages) { await scan(c.browser, 'chromium', server.url + p.route, p.route, 'sombre', 375); n375++; }
    const w = await launch('webkit');
    for (const t of THEMES) await scan(w.browser, 'webkit', server.url + '/', '/', t);
  });
} catch (e) {
  fails.push(`exception : ${e.stack || e}`);
}
for (const f of fails) console.log('ÉCHEC ' + f);
console.log(`a11y : ${nbPages} page(s) × ${THEMES.length} thèmes (Chromium) + ${n375} page(s) à 375 px + accueil × ${THEMES.length} (WebKit) = ${runs} analyses, axe-core 4.14.0, ${fails.length} violation(s)/problème(s), ${((Date.now() - t0) / 1000).toFixed(1)} s`);
process.exit(fails.length ? 1 : 0);
