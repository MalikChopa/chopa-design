// Débordement (J2a-1) : chaque page construite à 375, 1024 et 1440 px (thème sombre, Chromium).
// Échec si la page défile horizontalement, ou si un élément dépasse le bord droit/gauche de la fenêtre
// sans être dans une boîte qui défile ou rogne (overflow-x autre que « visible »).
import { listPages, openPage, withBench } from '../lib/browser.mjs';

const WIDTHS = [375, 1024, 1440];
const t0 = Date.now();
const fails = [];
let runs = 0, nbPages = 0;

function measure() {
  const vw = document.documentElement.clientWidth;
  const out = { scroll: document.documentElement.scrollWidth, vw, items: [] };
  const clipped = (el) => {
    for (let a = el.parentElement; a && a !== document.documentElement; a = a.parentElement) {
      const ox = getComputedStyle(a).overflowX;
      if (ox !== 'visible') return true;
    }
    return false;
  };
  const name = (el) => {
    let s = el.tagName.toLowerCase();
    if (el.id) s += '#' + el.id;
    const c = typeof el.className === 'string' ? el.className.trim().split(/\s+/).filter(Boolean).slice(0, 3).join('.') : '';
    if (c) s += '.' + c;
    return s;
  };
  const bad = new Set();
  for (const el of document.body.querySelectorAll('*')) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    if (r.right > vw + 0.5 || r.left < -0.5) {
      if (el.closest('svg') && el.tagName.toLowerCase() !== 'svg') continue;
      if (clipped(el)) continue;
      bad.add(el);
      // on ne liste que l'élément le plus haut de chaque lignée fautive (ses descendants suivent forcément)
      if (!bad.has(el.parentElement)) out.items.push(`${name(el)} [${Math.round(r.left)}..${Math.round(r.right)}]`);
    }
  }
  return out;
}

try {
  await withBench(async ({ server, launch }) => {
    const pages = listPages();
    nbPages = pages.length;
    const c = await launch('chromium');
    if (c.note) console.log(c.note);
    for (const p of pages) for (const w of WIDTHS) {
      const o = await openPage(c.browser, server.url + p.route, { width: w, height: 900, theme: 'sombre' });
      try {
        const m = await o.page.evaluate(measure);
        runs++;
        if (m.scroll > m.vw) fails.push(`${p.route} @${w} : la page défile horizontalement (scrollWidth ${m.scroll} > ${m.vw})`);
        for (const it of m.items.slice(0, 15)) fails.push(`${p.route} @${w} : élément hors fenêtre sans boîte qui défile : ${it}`);
        if (m.items.length > 15) fails.push(`${p.route} @${w} : … et ${m.items.length - 15} autre(s)`);
        for (const pr of o.problems) fails.push(`${p.route} @${w} : ${pr}`);
      } finally { await o.close(); }
    }
  });
} catch (e) {
  fails.push(`exception : ${e.stack || e}`);
}
for (const f of fails) console.log('ÉCHEC ' + f);
console.log(`check-overflow : ${nbPages} page(s) × largeurs ${WIDTHS.join('/')} = ${runs} mesures, ${fails.length} échec(s), ${((Date.now() - t0) / 1000).toFixed(1)} s`);
process.exit(fails.length ? 1 : 0);
