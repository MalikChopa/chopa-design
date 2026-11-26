// Contenu et médias, 2e partie (J4b) : ce que `keyboard`, `parity` et `palette` ne mesurent pas, sur les pages de pièces construites
// (site/dist, CH_OUT compris), Chromium, 3 thèmes.
//  A. Accordéon et FAQ (/composants/accordion/, /composants/faq/) : tous les details portant le même `name` forment un groupe ; chaque groupe
//     (exemple principal, puis chacune des 3 copies de thème, indépendamment) tient dans UN SEUL bloc d'aperçu (un name partagé entre deux blocs
//     ferait fermer l'un par l'autre) ; ouvrir un membre par un clic de souris, puis par Entrée, puis par Espace ne laisse ouvert que lui dans son
//     groupe, et ne change l'état d'aucun details d'un autre groupe. Sans `name` : deux details restent ouverts ensemble. Les groupes à 2 membres
//     ou plus sont exigés (≥ 4 sur l'accordéon : exemple + 3 copies ; ≥ 4 sur la FAQ).
//  B. Ratios (/composants/figure/, /composants/gallery/) : pour chaque média de ch-figure, aspect-ratio calculé = ratio de sa classe (16 / 9 par
//     défaut, 4 / 3, 1 / 1) et boîte rendue : |hauteur − largeur / ratio| ≤ 1 px, à 1280 et 375 px. Chaque <img> a un attribut alt, chaque <video> a controls.
//  C. Galerie à 375 px : une seule colonne (tous les éléments de la liste ont le même bord gauche, grid-template-columns à une piste), aucun élément
//     au-delà de la fenêtre (hors boîtes qui rognent), pas de défilement horizontal ; à 1280 px, le nombre de colonnes est celui de la classe (2, 3, 4).
//     (check-overflow mesure aussi la page de la galerie à 375, 1024 et 1440 px.)
//  D. 0 requête en échec, 0 réponse ≥ 400, 0 erreur de console, aucune requête hors du serveur local (hors data:), images chargées (naturalWidth > 0),
//     sur les 9 pages des pièces 41 à 49.
// Une ligne de résumé ; le détail des échecs est affiché avant.
import { withBench, THEMES } from '../lib/browser.mjs';

const t0 = Date.now();
const fails = [];
let checks = 0, groups = 0, actions = 0, media = 0, galleries = 0, pages = 0, requests = 0;
const check = (ok, msg) => { checks++; if (!ok) fails.push(msg); };
const PAGES = ['figure', 'gallery', 'accordion', 'timeline', 'stats', 'price', 'faq', 'divider', 'score'];
const stop = (page) => page.evaluate(() => document.getAnimations().forEach((a) => a.finish()));

async function newPage(browser, server, { theme, width }) {
  const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'no-preference' });
  await context.addInitScript((t) => { try { localStorage.setItem('ch-theme', t); } catch (_) {} }, theme);
  const page = await context.newPage();
  const problems = [];
  const hors = [];
  page.on('pageerror', (e) => problems.push(`erreur de page : ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') problems.push(`console : ${m.text()}`); });
  page.on('requestfailed', (r) => problems.push(`requête en échec : ${r.url().slice(0, 100)}`));
  page.on('response', (r) => { if (r.status() >= 400) problems.push(`réponse ${r.status()} : ${r.url().slice(0, 100)}`); });
  page.on('request', (r) => { requests++; const u = r.url(); if (!u.startsWith('data:') && !u.startsWith(server.url)) hors.push(u.slice(0, 100)); });
  return { page, context, problems, hors };
}
async function open(o, server, route) {
  await o.page.goto(`${server.url}/composants/${route}/`, { waitUntil: 'load' });
  await o.page.evaluate(() => document.fonts.ready);
}
async function done(tag, o) {
  for (const p of o.problems) fails.push(`${tag} : ${p}`);
  check(o.hors.length === 0, `${tag} : requête hors du serveur local : ${o.hors.join(', ')}`);
  checks++;
  await o.context.close().catch(() => {});
}

// ---------- A. exclusivité ----------
const GROUPES = () => {
  const out = {};
  document.querySelectorAll('details').forEach((d, i) => {
    d.dataset.mi = i;
    if (!d.name) return;
    const bloc = d.closest('.doc-example__preview');
    (out[d.name] = out[d.name] || []).push({ i, bloc: bloc ? [...document.querySelectorAll('.doc-example__preview')].indexOf(bloc) : -1 });
  });
  return out;
};
const OUVERTS = () => [...document.querySelectorAll('details')].map((d) => d.open);

async function exclusivite(browser, server, theme, route, minGroupes) {
  const o = await newPage(browser, server, { theme, width: 1280 });
  await open(o, server, route);
  const tag = `[${route} ${theme}]`;
  const g = await o.page.evaluate(GROUPES);
  const noms = Object.keys(g);
  const complets = noms.filter((n) => g[n].length >= 2);
  check(complets.length >= minGroupes, `${tag} ${complets.length} groupe(s) de details à name (≥ 2 membres ; chacun d'au moins 3), attendu au moins ${minGroupes}`);
  for (const n of noms) check(new Set(g[n].map((m) => m.bloc)).size === 1, `${tag} le name « ${n} » est partagé entre plusieurs blocs d'aperçu (les copies de thème ne sont pas indépendantes)`);
  for (const n of complets) {
    groups++;
    const membres = g[n].map((m) => m.i);
    check(membres.length >= 3, `${tag} le groupe « ${n} » n'a que ${membres.length} membre(s) : chaque exemple en a au moins 3 (un name retiré d'un details sort celui-ci du groupe)`);
    if (membres.length < 3) continue;
    const sel = (i) => `details[data-mi="${i}"]`;
    const attendu = async (ouvert, avant, quoi) => {
      await stop(o.page);
      const etat = await o.page.evaluate(OUVERTS);
      const dansGroupe = membres.map((i) => etat[i]);
      check(dansGroupe.filter(Boolean).length === 1 && etat[ouvert], `${tag} « ${n} » ${quoi} : seul le membre ${membres.indexOf(ouvert)} doit être ouvert (état ${JSON.stringify(dansGroupe)})`);
      const autres = etat.map((v, i) => (membres.includes(i) ? null : v === avant[i]));
      check(autres.every((x) => x === null || x), `${tag} « ${n} » ${quoi} : l'état d'un details d'un autre groupe a changé`);
      actions++;
    };
    // un membre qui n'est pas ouvert au départ, puis un autre
    const [a, b, c] = membres.slice(1).concat(membres[0]);
    await o.page.locator(`${sel(a)} > summary`).scrollIntoViewIfNeeded();
    let avant = await o.page.evaluate(OUVERTS);
    await o.page.locator(`${sel(a)} > summary`).click();
    await attendu(a, avant, 'clic');
    avant = await o.page.evaluate(OUVERTS);
    await o.page.locator(`${sel(b)} > summary`).focus();
    await o.page.keyboard.press('Enter');
    await attendu(b, avant, 'Entrée');
    avant = await o.page.evaluate(OUVERTS);
    await o.page.locator(`${sel(c)} > summary`).focus();
    await o.page.keyboard.press('Space');
    await attendu(c, avant, 'Espace');
    // un membre ouvert se referme au clavier (bascule) et le groupe se retrouve sans membre ouvert
    await o.page.keyboard.press('Enter');
    await stop(o.page);
    const fin = await o.page.evaluate(OUVERTS);
    check(membres.every((i) => !fin[i]), `${tag} « ${n} » Entrée sur le membre ouvert : le groupe doit n'avoir aucun membre ouvert (${JSON.stringify(membres.map((i) => fin[i]))})`);
    actions++;
  }
  // details sans name : indépendants
  const libres = await o.page.evaluate(() => [...document.querySelectorAll('details:not([name])')].filter((d) => d.closest('.doc-example__preview')).map((d, k) => { d.dataset.libre = k; return k; }));
  if (libres.length >= 2) {
    groups++;
    await o.page.evaluate(() => document.querySelectorAll('details[data-libre]').forEach((d) => { d.open = false; }));
    await o.page.locator('details[data-libre="0"] > summary').click();
    await o.page.locator('details[data-libre="1"] > summary').click();
    const r = await o.page.evaluate(() => [0, 1].map((k) => document.querySelector(`details[data-libre="${k}"]`).open));
    check(r[0] && r[1], `${tag} details sans name : les deux premiers doivent rester ouverts ensemble (${JSON.stringify(r)})`);
    actions += 2;
  }
  await done(tag, o);
}

// ---------- B et C. ratios, galerie ----------
const RATIOS = () => {
  const vue = (cls) => (cls.contains('ch-figure--4x3') ? [4, 3] : cls.contains('ch-figure--1x1') ? [1, 1] : [16, 9]);
  return [...document.querySelectorAll('.ch-figure > .ch-figure__media')].map((m) => {
    const fig = m.parentElement;
    const [rw, rh] = vue(fig.classList);
    const r = m.getBoundingClientRect();
    return { tag: m.tagName.toLowerCase(), cls: fig.className, ar: getComputedStyle(m).aspectRatio, rw, rh, w: r.width, h: r.height,
      alt: m.tagName === 'IMG' ? m.getAttribute('alt') : null, controls: m.tagName === 'VIDEO' ? m.hasAttribute('controls') : null,
      charge: m.tagName === 'IMG' ? m.complete && m.naturalWidth > 0 : null };
  });
};
const DEPASSE = () => {
  const vw = document.documentElement.clientWidth;
  const rogne = (el) => { for (let a = el.parentElement; a && a !== document.documentElement; a = a.parentElement) if (getComputedStyle(a).overflowX !== 'visible') return true; return false; };
  const mauvais = [];
  for (const el of document.body.querySelectorAll('*')) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    const r = el.getBoundingClientRect();
    if (!r.width && !r.height) continue;
    if ((r.right > vw + 0.5 || r.left < -0.5) && !(el.closest('svg') && el.tagName.toLowerCase() !== 'svg') && !rogne(el)) mauvais.push(el.tagName.toLowerCase() + '.' + String(el.className.baseVal ?? el.className).split(' ')[0] + ` [${Math.round(r.left)}..${Math.round(r.right)}]`);
  }
  return { scroll: document.documentElement.scrollWidth, vw, mauvais };
};
const GALERIES = () => [...document.querySelectorAll('ul.ch-gallery')].map((ul) => {
  const cls = [...ul.classList].find((c) => /^ch-gallery--\d$/.test(c));
  const lefts = [...ul.children].map((li) => Math.round(li.getBoundingClientRect().left));
  return { attendu: cls ? Number(cls.slice(-1)) : 3, colonnes: new Set(lefts).size, pistes: getComputedStyle(ul).gridTemplateColumns.split(' ').length, items: lefts.length };
});

async function ratios(browser, server, theme, route, width) {
  const o = await newPage(browser, server, { theme, width });
  await open(o, server, route);
  const tag = `[${route} ${theme} ${width}px]`;
  await stop(o.page);
  const ms = await o.page.evaluate(RATIOS);
  check(ms.length >= 3, `${tag} ${ms.length} média(s) de ch-figure lu(s), attendu au moins 3`);
  for (const m of ms) {
    media++;
    const attendu = `${m.rw} / ${m.rh}`;
    const nom = `${m.tag} (${m.cls})`;
    check(m.ar === attendu, `${tag} ${nom} : aspect-ratio calculé « ${m.ar} », attendu « ${attendu} »`);
    check(Math.abs(m.h - m.w * m.rh / m.rw) <= 1, `${tag} ${nom} : boîte ${m.w.toFixed(1)} × ${m.h.toFixed(1)}, ratio attendu ${attendu} (écart ${(m.h - m.w * m.rh / m.rw).toFixed(2)} px)`);
    if (m.tag === 'img') { check(m.alt !== null, `${tag} ${nom} : attribut alt absent`); check(m.charge, `${tag} ${nom} : image non chargée`); }
    if (m.tag === 'video') check(m.controls, `${tag} ${nom} : attribut controls absent`);
  }
  if (route === 'gallery') {
    const gs = await o.page.evaluate(GALERIES);
    check(gs.length >= 3, `${tag} ${gs.length} galerie(s), attendu au moins 3`);
    for (const g of gs) {
      galleries++;
      if (width === 375) {
        check(g.colonnes === 1 && g.pistes === 1, `${tag} galerie ${g.attendu} col. : ${g.colonnes} bord(s) gauche distinct(s), ${g.pistes} piste(s), attendu 1 colonne`);
      } else {
        check(g.colonnes === Math.min(g.attendu, g.items), `${tag} galerie : ${g.colonnes} colonne(s), attendu ${Math.min(g.attendu, g.items)}`);
      }
    }
    const d = await o.page.evaluate(DEPASSE);
    check(d.scroll <= d.vw && d.mauvais.length === 0, `${tag} débordement : scrollWidth ${d.scroll} pour ${d.vw} ; ${d.mauvais.slice(0, 4).join(' ; ')}`);
  }
  await done(tag, o);
}

// ---------- D. toutes les pages 41 à 49 ----------
async function requetes(browser, server, theme, route) {
  const o = await newPage(browser, server, { theme, width: 1280 });
  await open(o, server, route);
  pages++;
  const n = await o.page.evaluate(() => document.querySelectorAll('.doc-example__preview').length);
  check(n >= 2, `[${route} ${theme}] ${n} aperçu(s) d'exemple, attendu au moins 2`);
  await done(`[${route} ${theme}]`, o);
}

try {
  await withBench(async ({ server, launch }) => {
    const { browser } = await launch('chromium');
    for (const theme of THEMES) {
      await exclusivite(browser, server, theme, 'accordion', 4);
      await exclusivite(browser, server, theme, 'faq', 4);
      for (const route of ['figure', 'gallery']) for (const width of [1280, 375]) await ratios(browser, server, theme, route, width);
      for (const route of PAGES) await requetes(browser, server, theme, route);
    }
  });
} catch (e) {
  fails.push(`exception : ${e.stack || e}`);
}
for (const f of fails) console.log('ÉCHEC ' + f);
console.log(`medias : ${checks} vérification(s), ${groups} groupe(s) de details (accordéon et FAQ, exemple + copies, × 3 thèmes), ${actions} ouverture(s) par clic, Entrée ou Espace, ${media} média(s) de figure mesuré(s) (ratio calculé et rendu), ${galleries} galerie(s) (1 colonne à 375 px, 0 débordement), ${pages} page(s) sans requête en échec (${requests} requête(s) vue(s)), ${fails.length} échec(s), ${((Date.now() - t0) / 1000).toFixed(1)} s`);
process.exit(fails.length ? 1 : 0);
