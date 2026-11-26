// Grille immobile des tuiles (I1, docs/ARCHITECTURE.md §16.8) : page /composants/ construite.
//  1. 63 tuiles en 5 familles, dans l'ordre de `pieces` (famille de FAMILLES, puis titre en français), comptes des h2 justes ;
//     un seul h1 ; chaque tuile : aperçu inert + aria-hidden, un lien /composants/<slug>/ nommé par le titre, distinct.
//  2. Chaque lien répond 200 (requête sur le serveur du banc).
//  3. Couleurs calculées des tuiles au repos (élément, ::before, ::after) dans les valeurs du thème : rôles de jetons
//     lus sur la page (bg, bg2, card, fg, soft, mute, line, acc, acc-text, on-acc, focus), acc-dim et acc-dim composé, transparent.
//     3 thèmes.
//  4. axe-core 4.14.0 : 0 violation sur la page entière, 3 thèmes (1 280 px).
//  5. 375 px : 0 défilement horizontal (3 thèmes), 0 erreur console ni requête en échec.
// Lit CH_OUT (site/dist construit). Aucun fichier n'est écrit.
import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { openPage, withBench, THEMES } from '../lib/browser.mjs';
import { ROOT } from '../lib/paths.mjs';

const t0 = Date.now();
const fails = [];
const st = { pages: 0, tuiles: 0, liens: 0, couleurs: 0, elements: 0, axe: 0, p375: 0 };
const ROUTE = '/composants/';

// ---- ordre attendu, lu des fiches comme pieces.mjs (sans Vite) ----
async function attendu() {
  const src = readFileSync(join(ROOT, 'site', 'src', 'lib', 'pieces.mjs'), 'utf8');
  const familles = [...(src.match(/export const FAMILLES = \[([^\]]*)\]/)?.[1] ?? '').matchAll(/'([^']+)'/g)].map((m) => m[1]);
  const dir = join(ROOT, 'site', 'src', 'data');
  const fiches = [];
  for (const f of readdirSync(dir).filter((n) => n.endsWith('.mjs'))) {
    const mod = await import(pathToFileURL(join(dir, f)).href);
    fiches.push({ slug: f.replace(/\.mjs$/, ''), ...mod.default });
  }
  const rang = (f) => { const i = familles.indexOf(f); return i < 0 ? familles.length : i; };
  fiches.sort((a, b) => rang(a.famille) - rang(b.famille) || (a.famille ?? '').localeCompare(b.famille ?? '', 'fr') || a.titre.localeCompare(b.titre, 'fr'));
  return { familles, fiches };
}

// ---- code exécuté dans la page : lecture des couleurs des tuiles ----
const LIB = `(() => {
  const PROPS = ['color', 'background-color', 'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color',
    'outline-color', 'text-decoration-color', 'column-rule-color', '-webkit-text-stroke-color', 'caret-color', 'box-shadow', 'text-shadow', 'fill', 'stroke'];
  const COLOUR_RE = /(rgba?\\([^)]*\\)|color\\([^)]*\\)|#[0-9a-f]{3,8}\\b|\\b(?:transparent|currentcolor)\\b)/gi;
  const ROLES = ['bg', 'bg2', 'card', 'fg', 'soft', 'mute', 'line', 'acc', 'acc-text', 'on-acc', 'focus'];
  function parse(s) {
    s = s.trim().toLowerCase();
    if (s === 'transparent') return [0, 0, 0, 0];
    let m = s.match(/^rgba?\\(([^)]*)\\)$/);
    if (m) { const p = m[1].split(/[\\s,\\/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1]; }
    m = s.match(/^color\\(srgb\\s+([^)]*)\\)$/);
    if (m) { const p = m[1].split(/[\\s\\/]+/).filter(Boolean).map(Number); return [p[0] * 255, p[1] * 255, p[2] * 255, p.length > 3 ? p[3] : 1]; }
    return null;
  }
  const over = (a, b) => [0, 1, 2].map((i) => a[i] * a[3] + b[i] * (1 - a[3])).concat([1]);
  const same = (a, b) => Math.abs(a[0] - b[0]) < 1 && Math.abs(a[1] - b[1]) < 1 && Math.abs(a[2] - b[2]) < 1 && Math.abs(a[3] - b[3]) < 0.004;
  const frame = document.documentElement;
  const probe = document.createElement('span');
  frame.appendChild(probe);
  const read = (role) => { probe.style.color = 'var(--ch-' + role + ')'; return parse(getComputedStyle(probe).color); };
  const roles = {};
  for (const r of ROLES) roles[r] = read(r);
  const dim = read('acc-dim');
  probe.remove();
  const allowed = [...Object.values(roles), dim, [0, 0, 0, 0]];
  for (const b of ['bg', 'bg2', 'card']) allowed.push(over(dim, roles[b]));
  const describe = (el) => el.tagName.toLowerCase() + ((el.getAttribute('class') || '').trim().split(/\\s+/).filter(Boolean).slice(0, 3).map((c) => '.' + c).join(''));
  const bag = { elements: 0, colours: 0, bad: [], roles: ROLES.length };
  function checkEl(el, pseudo) {
    const cs = getComputedStyle(el, pseudo || null);
    if (pseudo && (cs.content === 'none' || cs.content === 'normal')) return;
    bag.elements++;
    const own = [...(pseudo ? [] : el.childNodes)].some((n) => n.nodeType === 3 && n.textContent.trim());
    const control = /^(INPUT|SELECT|TEXTAREA|BUTTON)$/.test(el.tagName) && !pseudo;
    const rendered = (p) => {
      const side = p.match(/^border-(top|right|bottom|left)-color$/);
      if (side) return cs.getPropertyValue('border-' + side[1] + '-style') !== 'none' && parseFloat(cs.getPropertyValue('border-' + side[1] + '-width')) > 0;
      if (p === 'outline-color') return cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0;
      if (p === 'text-decoration-color') return cs.textDecorationLine !== 'none';
      if (p === 'column-rule-color') return cs.columnRuleStyle !== 'none' && parseFloat(cs.columnRuleWidth) > 0;
      if (p === '-webkit-text-stroke-color') return parseFloat(cs.webkitTextStrokeWidth) > 0;
      if (p === 'caret-color') return control || el.isContentEditable;
      if (p === 'color') return own || control || (pseudo && cs.content !== '""') || el instanceof SVGElement;
      return true;
    };
    for (const p of PROPS) {
      if ((p === 'fill' || p === 'stroke') && !(el instanceof SVGElement)) continue;
      if (!rendered(p)) continue;
      const v = cs.getPropertyValue(p);
      if (!v || v === 'none' || v === 'auto' || v === 'normal') continue;
      for (const col of v.match(COLOUR_RE) || []) {
        if (/^currentcolor$/i.test(col)) continue;
        bag.colours++;
        const c = parse(col);
        if (!c) { bag.bad.push(describe(el) + (pseudo || '') + ' ' + p + ' ' + col + ' (format non lu)'); continue; }
        if (!allowed.some((a) => same(a, c))) bag.bad.push(describe(el) + (pseudo || '') + ' ' + p + ' ' + col);
      }
    }
  }
  const racines = [...document.querySelectorAll('.im-tuile')];
  for (const r of racines) for (const e of [r, ...r.querySelectorAll('*')]) if (!['SCRIPT', 'STYLE'].includes(e.tagName)) { checkEl(e, null); checkEl(e, '::before'); checkEl(e, '::after'); }
  bag.tuiles = racines.length;
  return bag;
})()`;

async function lirePage(browser, base, theme, att) {
  const o = await openPage(browser, base + ROUTE, { theme });
  const nom = `${ROUTE} [${theme}]`;
  try {
    st.pages++;
    for (const p of o.problems) fails.push(`${nom} ${p}`);
    // l'état final, transitions de chargement finies (comme a11y et palette) ; les animations infinies restent telles quelles
    await o.page.evaluate(() => document.getAnimations().forEach((a) => { try { a.finish(); } catch (_) { /* infinie */ } }));
    const d = await o.page.evaluate(() => ({
      h1: document.querySelectorAll('h1').length,
      sections: [...document.querySelectorAll('.im-pieces > section')].map((s) => ({
        h2: s.querySelector('h2')?.textContent.replace(/\s+/g, ' ').trim(),
        tuiles: [...s.querySelectorAll(':scope > ul > li.im-tuile')].map((li) => {
          const a = li.querySelectorAll('a.im-tuile__lien');
          const ap = li.querySelector('.im-tuile__apercu');
          return { slug: li.dataset.slug, id: li.id, href: a[0]?.getAttribute('href'), nom: a[0]?.textContent.trim(), nbLiens: a.length, inert: ap?.hasAttribute('inert') && ap.getAttribute('aria-hidden') === 'true', focalisables: li.querySelectorAll('.im-tuile__apercu a[href], .im-tuile__apercu button, .im-tuile__apercu input').length };
        }),
      })),
      liens: document.querySelectorAll('.im-pieces a.im-tuile__lien').length,
    }));
    if (d.h1 !== 1) fails.push(`${nom} : ${d.h1} h1 (attendu 1)`);
    const groupes = att.familles.map((f) => ({ f, fiches: att.fiches.filter((p) => p.famille === f) }));
    if (d.sections.length !== groupes.length) fails.push(`${nom} : ${d.sections.length} familles (attendu ${groupes.length})`);
    groupes.forEach((g, gi) => {
      const s = d.sections[gi];
      if (!s) return;
      const compte = `${g.fiches.length} pièce${g.fiches.length > 1 ? 's' : ''}`;
      const attendu = `${String(gi + 1).padStart(2, '0')} ${g.f} ${compte}`;
      if (s.h2 !== attendu) fails.push(`${nom} : titre de famille « ${s.h2} » (attendu « ${attendu} »)`);
      const slugs = s.tuiles.map((t) => t.slug);
      const voulus = g.fiches.map((p) => p.slug);
      if (JSON.stringify(slugs) !== JSON.stringify(voulus)) fails.push(`${nom} : ordre de ${g.f} : ${slugs.join(',')} (attendu ${voulus.join(',')})`);
      for (const [ti, t] of s.tuiles.entries()) {
        const fiche = g.fiches[ti];
        if (t.href !== `/composants/${t.slug}/`) fails.push(`${nom} : ${t.slug} : href ${t.href}`);
        if (t.id !== `p-${t.slug}`) fails.push(`${nom} : ${t.slug} : id ${t.id}`);
        if (fiche && t.nom !== fiche.titre) fails.push(`${nom} : ${t.slug} : nom du lien « ${t.nom} » (attendu « ${fiche.titre} »)`);
        if (t.nbLiens !== 1) fails.push(`${nom} : ${t.slug} : ${t.nbLiens} liens de tuile`);
        if (!t.inert) fails.push(`${nom} : ${t.slug} : aperçu non inert ou non aria-hidden`);
      }
    });
    const toutes = d.sections.flatMap((s) => s.tuiles);
    if (toutes.length !== att.fiches.length) fails.push(`${nom} : ${toutes.length} tuiles (attendu ${att.fiches.length})`);
    if (new Set(toutes.map((t) => t.href)).size !== toutes.length) fails.push(`${nom} : liens non distincts`);
    st.tuiles = toutes.length;
    if (theme === 'sombre') st.hrefs = toutes.map((t) => t.href);
    // couleurs au repos
    await o.page.evaluate(() => { document.activeElement?.blur?.(); });
    const bag = await o.page.evaluate(LIB);
    st.couleurs += bag.colours; st.elements += bag.elements;
    if (bag.tuiles !== att.fiches.length) fails.push(`${nom} couleurs : ${bag.tuiles} tuiles lues`);
    for (const b of [...new Set(bag.bad)]) fails.push(`${nom} couleur hors des valeurs du thème : ${b}`);
  } finally { await o.close(); }
}

async function axe(browser, base, theme, axeSrc) {
  const o = await openPage(browser, base + ROUTE, { theme });
  try {
    await o.page.evaluate(() => document.getAnimations().forEach((a) => { try { a.finish(); } catch (_) { /* infinie */ } }));
    await o.page.evaluate(axeSrc);
    const r = await o.page.evaluate(() => axe.run(document));
    st.axe++;
    for (const v of r.violations) for (const n of v.nodes) fails.push(`axe ${ROUTE} [${theme}] ${v.id} (${v.impact}) : ${n.target.join(' ')}`);
  } finally { await o.close(); }
}

async function mobile(browser, base, theme) {
  const o = await openPage(browser, base + ROUTE, { width: 375, height: 812, theme });
  try {
    st.p375++;
    for (const p of o.problems) fails.push(`${ROUTE} [${theme} 375 px] ${p}`);
    const m = await o.page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, bw: document.body.scrollWidth,
      tuiles: document.querySelectorAll('.im-tuile').length }));
    if (m.sw > m.cw || m.bw > m.cw) fails.push(`${ROUTE} [${theme} 375 px] défilement horizontal : html ${m.sw}, body ${m.bw}, fenêtre ${m.cw}`);
    if (m.tuiles <= 0) fails.push(`${ROUTE} [${theme} 375 px] : aucune tuile`);
  } finally { await o.close(); }
}

try {
  const att = await attendu();
  const axeSrc = readFileSync(createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8');
  await withBench(async ({ server, launch }) => {
    const c = await launch('chromium');
    if (c.note) console.log(c.note);
    for (const t of THEMES) await lirePage(c.browser, server.url, t, att);
    // chaque lien répond 200
    for (const h of st.hrefs ?? []) {
      const r = await fetch(server.url + h);
      st.liens++;
      if (r.status !== 200) fails.push(`lien ${h} : réponse ${r.status}`);
      await r.arrayBuffer();
    }
    for (const t of THEMES) await axe(c.browser, server.url, t, axeSrc);
    for (const t of THEMES) await mobile(c.browser, server.url, t);
  });
} catch (e) {
  fails.push(`exception : ${e.stack || e}`);
}
for (const f of fails) console.log('ÉCHEC ' + f);
console.log(`immersif-grille : ${st.pages} lectures (page × thème), ${st.tuiles} tuiles, ${st.liens} lien(s) répondant 200, ${st.elements} élément(s)/pseudo lus, ${st.couleurs} couleur(s) vérifiée(s), axe : ${st.axe} analyses, 375 px : ${st.p375} lectures ; ${fails.length} échec(s), ${((Date.now() - t0) / 1000).toFixed(1)} s`);
process.exit(fails.length ? 1 : 0);
