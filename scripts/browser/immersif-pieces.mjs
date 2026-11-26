// Pages de pièce de la doc immersive (I3, docs/ARCHITECTURE.md §16.8). Pages /composants/<slug>/ construites.
//  1. Structure, sur les 63 pages (Chromium, thème sombre) : en-tête de pièce (fil « Le mur » vers /#p-<slug>, titre en h1 vivant, but,
//     tuile en grand inert + aria-hidden, sans id), un seul h1, sections et sommaire en ancres « s- » (chaque lien du sommaire vise
//     une section), un seul « im-piece » et un seul « im-barre », pas de barre latérale, « Pièces voisines » = précédente et suivante
//     dans l'ordre du mur (lu des fiches comme pieces.mjs), 0 erreur console, 0 défilement horizontal à 375 px.
//  2. Aimants : un .ch-btn de l'aperçu et un de l'en-tête se déplacent vers le pointeur (≤ 14 px en x, ≤ 10 px en y) puis reviennent
//     à « transform: none » ; un pointeur posé au centre ne le déplace pas ; un bouton désactivé ne bouge pas ; aucun aimant au toucher
//     (évènements pointer de type touch), en mouvement réduit, en version calme (mémorisée, puis basculée par le bouton).
//  3. axe-core 4.14.0 : 0 violation sur 5 pages × 3 thèmes (1 280 px), puis 375 px sur 1 page par thème.
// Lit CH_OUT (site/dist construit). Aucun fichier n'est écrit.
import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { openPage, withBench, listPages, THEMES } from '../lib/browser.mjs';
import { ROOT, SITE_DIST } from '../lib/paths.mjs';

const t0 = Date.now();
const fails = [];
const echec = (m) => fails.push(m);
const st = { pages: 0, voisines: 0, aimants: 0, retours: 0, axe: 0, p375: 0, sansAimant: 0 };
const CINQ = ['button', 'modal', 'table', 'input', 'tabs']; // 5 pages d'axe ; toutes les pages restent couvertes par a11y.mjs

// ---- ordre du mur attendu, lu des fiches comme pieces.mjs (sans Vite) ----
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
  return fiches;
}

// ---- 1. structure ----
const LIRE = () => {
  const q = (s) => document.querySelector(s);
  const nommes = {};
  for (const el of document.querySelectorAll('*')) { const nm = getComputedStyle(el).viewTransitionName; if (nm && nm !== 'none') nommes[nm] = (nommes[nm] || 0) + 1; }
  const hero = q('.im-piece-hero');
  const tuile = q('.im-piece-hero__tuile');
  const ids = [...document.querySelectorAll('[id]')].map((e) => e.id);
  const sections = [...document.querySelectorAll('.im-bloc')].map((s) => s.id);
  return {
    h1: document.querySelectorAll('h1:not(.doc-example h1)').length, h1Exemples: document.querySelectorAll('.doc-example h1').length, h1nom: q('h1') ? (q('h1').querySelector('.im-sr') || q('h1')).textContent : null,
    hero: !!hero, nomHero: hero ? getComputedStyle(hero).viewTransitionName : null,
    filLien: q('.im-piece-hero__fil a') ? q('.im-piece-hero__fil a').getAttribute('href') : null,
    filTexte: q('.im-piece-hero__fil') ? q('.im-piece-hero__fil').textContent.replace(/\s+/g, ' ').trim() : '',
    but: q('.im-piece-hero__but') ? q('.im-piece-hero__but').textContent.trim() : '',
    tuile: tuile ? { inert: tuile.inert, aria: tuile.getAttribute('aria-hidden'), ouverte: !!tuile.shadowRoot, horsOmbre: tuile.querySelectorAll('*').length,
      larg: Math.round(tuile.getBoundingClientRect().width), haut: Math.round(tuile.getBoundingClientRect().height) } : null,
    nommes, sections, ids,
    toc: [...document.querySelectorAll('.im-corps__toc .ch-toc__link')].map((a) => a.getAttribute('href')),
    barreLaterale: !!q('.doc-nav'), plein: !!q('.doc-shell--plein'),
    voisines: [...document.querySelectorAll('.im-voisines a')].map((a) => ({ href: a.getAttribute('href'), rel: a.getAttribute('rel'), nom: a.querySelector('.im-voisines__nom').textContent.trim() })),
    sPrefixes: ids.filter((i) => /^s-/.test(i)).length,
    h2: document.querySelectorAll('main h2').length,
  };
};
async function structure(browser, base, fiches) {
  const html = Object.fromEntries(fiches.map((f) => [f.slug, readFileSync(join(SITE_DIST, 'composants', f.slug, 'index.html'), 'utf8')]));
  const o = await openPage(browser, base + `/composants/${fiches[0].slug}/`, { theme: 'sombre' });
  try {
    for (let i = 0; i < fiches.length; i++) {
      const f = fiches[i];
      const route = `/composants/${f.slug}/`;
      if (i > 0) await o.page.goto(base + route, { waitUntil: 'load' });
      const e = await o.page.evaluate(LIRE);
      st.pages++;
      const nom = `${route}`;
      if (e.h1 !== 1) echec(`${nom} : ${e.h1} h1 hors aperçus d'exemples (1 attendu ; ${e.h1Exemples} h1 dans les aperçus, contenu des fiches)`);
      if (!e.hero) echec(`${nom} : en-tête de pièce absent`);
      if (e.nomHero !== 'im-piece') echec(`${nom} : l'en-tête porte « ${e.nomHero} » (im-piece attendu)`);
      if ((e.nommes['im-piece'] || 0) !== 1) echec(`${nom} : ${e.nommes['im-piece'] || 0} élément(s) « im-piece » (1 attendu)`);
      if ((e.nommes['im-barre'] || 0) !== 1) echec(`${nom} : ${e.nommes['im-barre'] || 0} élément(s) « im-barre » (1 attendu)`);
      if (e.filLien !== `/#p-${f.slug}`) echec(`${nom} : « Le mur » mène à « ${e.filLien} » (/#p-${f.slug} attendu)`);
      if (!e.filTexte.startsWith('Le mur') || !e.filTexte.includes(f.famille)) echec(`${nom} : fil « ${e.filTexte} » sans « Le mur » ni la famille`);
      if (!/\d\d·\d\d/.test(e.filTexte)) echec(`${nom} : numéro NN·MM absent du fil`);
      if (e.but !== f.but.trim()) echec(`${nom} : but affiché différent de la fiche`);
      if (!e.h1nom || e.h1nom.trim() !== f.titre) echec(`${nom} : h1 « ${e.h1nom} » (« ${f.titre} » attendu)`);
      if (!e.tuile) echec(`${nom} : tuile en grand absente`);
      else {
        if (!e.tuile.inert || e.tuile.aria !== 'true') echec(`${nom} : tuile en grand ni inert ni aria-hidden`);
        if (e.tuile.ouverte) echec(`${nom} : ombre de la tuile en grand ouverte (les sélecteurs du banc la traverseraient)`);
        if (e.tuile.horsOmbre) echec(`${nom} : ${e.tuile.horsOmbre} élément(s) de la tuile en grand dans le document (les contrôles du banc les compteraient)`);
        const h = html[f.slug];
        const m = h.match(/<template shadowrootmode="(\w+)">([\s\S]*?)<\/template>/);
        if (!m || m[1] !== 'closed') echec(`${nom} : ombre déclarative fermée absente du HTML construit`);
        else {
          const apercu = m[2].match(/<div class="im-tuile__apercu">([\s\S]*)<\/div><\/div>\s*$/);
          if (!apercu || apercu[1].trim().length < 20) echec(`${nom} : tuile en grand vide dans le HTML construit`);
          else {
            if (/\sid="/.test(apercu[1])) echec(`${nom} : id dans la tuile en grand`);
            if ([...apercu[1].matchAll(/<a\b[^>]*\shref="([^"]*)"/g)].some((l) => !l[1].startsWith('#'))) echec(`${nom} : lien hors ancre dans la tuile en grand`);
          }
        }
        if (e.tuile.larg < 300 || e.tuile.haut < 300) echec(`${nom} : tuile en grand de ${e.tuile.larg} × ${e.tuile.haut} px (au moins 300 attendus : le décor est-il stylé ?)`);
        if (e.tuile.ids) echec(`${nom} : ${e.tuile.ids} id dans la tuile en grand`);
        if (e.tuile.liens) echec(`${nom} : ${e.tuile.liens} lien(s) dans la tuile en grand`);
      }
      if (e.barreLaterale || !e.plein) echec(`${nom} : barre latérale présente ou mise en page pleine absente`);
      if (!e.sections.length || e.sections.some((s) => !/^s-/.test(s))) echec(`${nom} : sections sans préfixe « s- » (${e.sections.join(', ')})`);
      if (new Set(e.toc).size !== e.sections.length || e.toc.some((h) => !e.sections.includes(h.slice(3)) && !e.sections.includes(h.slice(1)))) echec(`${nom} : sommaire ${e.toc.join(',')} ≠ sections ${e.sections.join(',')}`);
      for (const s of ['s-variantes', 's-js']) if (!e.sections.includes(s)) echec(`${nom} : section ${s} absente`);
      if (!e.ids.includes('s-titre')) echec(`${nom} : ancre s-titre absente`);
      if (new Set(e.ids).size !== e.ids.length) echec(`${nom} : id en double`);
      // pièces voisines = ordre du mur
      const prev = fiches[i - 1], next = fiches[i + 1];
      const attenduV = [prev && { href: `/composants/${prev.slug}/`, rel: 'prev', nom: prev.titre }, next && { href: `/composants/${next.slug}/`, rel: 'next', nom: next.titre }].filter(Boolean);
      if (JSON.stringify(e.voisines) !== JSON.stringify(attenduV)) echec(`${nom} : pièces voisines ${JSON.stringify(e.voisines)} ≠ ${JSON.stringify(attenduV)}`);
      st.voisines += e.voisines.length;
    }
    for (const p of o.problems) echec(`structure : ${p}`);
  } finally { await o.close(); }
}

async function mobile375(browser, base, fiches) {
  const o = await openPage(browser, base + '/composants/button/', { width: 375, height: 812, theme: 'sombre' });
  try {
    for (const f of fiches) {
      await o.page.goto(base + `/composants/${f.slug}/`, { waitUntil: 'load' });
      st.p375++;
      const m = await o.page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, bw: document.body.scrollWidth }));
      if (m.sw > m.cw || m.bw > m.cw) echec(`/composants/${f.slug}/ [375 px] défilement horizontal : html ${m.sw}, body ${m.bw}, fenêtre ${m.cw}`);
    }
    for (const p of o.problems) echec(`375 px : ${p}`);
  } finally { await o.close(); }
}

// ---- 2. aimants ----
async function etatBouton(page, sel) {
  return page.evaluate((s) => {
    const el = document.querySelector(s);
    const cs = getComputedStyle(el).transform;
    const m = cs === 'none' ? [0, 0] : (cs.match(/matrix\(([^)]*)\)/)?.[1].split(',').map(Number).slice(4, 6) ?? [NaN, NaN]);
    return { cs, x: m[0], y: m[1], style: el.style.transform };
  }, sel);
}
async function centre(page, sel) {
  await page.locator(sel).first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(60);
  return page.evaluate((s) => { const r = document.querySelector(s).getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height }; }, sel);
}
// Cibles : le premier bouton actif d'un aperçu, et un bouton de l'en-tête (sans l'apercu : l'en-tête est sa propre page).
const APERCU = '.doc-example__preview .ch-btn:not([disabled])';
const ENTETE = '.im-piece-hero .ch-btn';
async function aimant(browser, base, sel, nom) {
  const o = await openPage(browser, base + '/composants/button/', { theme: 'sombre' });
  const { page } = o;
  try {
    const c0 = await centre(page, sel);
    // au repos
    let e = await etatBouton(page, sel);
    if (e.cs !== 'none') echec(`aimant ${nom} : transform au repos = « ${e.cs} »`);
    // un pointeur posé au centre ne déplace pas le bouton
    await page.mouse.move(c0.x - 30, c0.y, { steps: 3 });
    await page.mouse.move(c0.x, c0.y, { steps: 3 });
    await page.waitForTimeout(500);
    e = await etatBouton(page, sel);
    if (Math.abs(e.x) > 0.6 || Math.abs(e.y) > 0.6) echec(`aimant ${nom} : pointeur posé au centre, bouton déplacé de (${e.x}, ${e.y}) px`);
    // pointeur à droite et sous le bouton, dans la zone d'attraction : le bouton se déplace vers lui, plafonné
    await page.mouse.move(c0.x + c0.w / 2 + 30, c0.y + c0.h / 2 + 20, { steps: 5 });
    await page.waitForTimeout(700);
    e = await etatBouton(page, sel);
    st.aimants++;
    if (!(e.x > 1)) echec(`aimant ${nom} : le bouton ne se déplace pas vers le pointeur à droite (x = ${e.x})`);
    if (!(e.y > 0.5)) echec(`aimant ${nom} : le bouton ne se déplace pas vers le pointeur en dessous (y = ${e.y})`);
    if (e.x > 14.01 || e.y > 10.01 || e.x < -14.01 || e.y < -10.01) echec(`aimant ${nom} : décalage (${e.x}, ${e.y}) px au-delà du plafond (14, 10)`);
    // retour : pointeur loin
    await page.mouse.move(Math.max(5, c0.x - 600), c0.y > 400 ? 60 : c0.y + 400, { steps: 5 });
    await page.waitForTimeout(900);
    e = await etatBouton(page, sel);
    st.retours++;
    if (e.cs !== 'none' || e.style !== '') echec(`aimant ${nom} : après éloignement, transform = « ${e.cs} » / style « ${e.style} » (none attendu)`);
    for (const p of o.problems) echec(`aimant ${nom} : ${p}`);
  } finally { await o.close(); }
}
async function aimantDesactive(browser, base) {
  const o = await openPage(browser, base + '/composants/button/', { theme: 'sombre' });
  try {
    const sel = '.doc-example__preview .ch-btn[disabled]';
    if (!(await o.page.locator(sel).count())) { echec('aimant désactivé : aucun bouton désactivé dans les aperçus'); return; }
    const c0 = await centre(o.page, sel);
    await o.page.mouse.move(c0.x + c0.w / 2 + 25, c0.y, { steps: 5 });
    await o.page.waitForTimeout(600);
    const e = await etatBouton(o.page, sel);
    if (e.cs !== 'none') echec(`aimant : bouton désactivé déplacé (« ${e.cs} »)`);
  } finally { await o.close(); }
}
// Contextes sans aimant : toucher, mouvement réduit, appareil tactile, calme (mémorisé), calme (bascule par le bouton).
async function sansAimant(browser, base) {
  const test = async (nom, opts, avant, apres) => {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, ...opts });
    await context.addInitScript(() => { try { localStorage.setItem('ch-theme', 'sombre'); } catch (_) { /* refusé */ } });
    if (avant) await context.addInitScript(avant);
    const page = await context.newPage();
    const problems = [];
    page.on('console', (m) => { if (m.type() === 'error') problems.push(m.text()); });
    page.on('pageerror', (e) => problems.push(e.message));
    try {
      await page.goto(base + '/composants/button/', { waitUntil: 'load' });
      await page.evaluate(() => document.fonts.ready);
      const c0 = await centre(page, APERCU);
      await apres(page, c0);
      await page.waitForTimeout(700);
      const e = await etatBouton(page, APERCU);
      st.sansAimant++;
      if (e.cs !== 'none') echec(`sans aimant (${nom}) : le bouton s'est déplacé (« ${e.cs} »)`);
      for (const p of problems) echec(`sans aimant (${nom}) : ${p}`);
    } finally { await context.close(); }
  };
  const pres = async (page, c) => { await page.mouse.move(c.x + c.w / 2 + 30, c.y + c.h / 2 + 20, { steps: 5 }); };
  await test('mouvement réduit', { reducedMotion: 'reduce' }, null, pres);
  await test('calme mémorisée', {}, () => { try { localStorage.setItem('doc-calme', '1'); } catch (_) { /* refusé */ } }, pres);
  // appareil sans souris (hasTouch : pointeur grossier, la requête hover/fine ne correspond pas) : même un pointeur de souris n'attire rien
  await test('appareil tactile', { hasTouch: true }, null, pres);
  // toucher sur un appareil qui a aussi une souris : évènements pointer de type « touch » envoyés tels quels (jamais attirés)
  await test('toucher', {}, null, async (page, c) => {
    await page.evaluate(({ x, y }) => {
      for (let i = 0; i < 6; i++) window.dispatchEvent(new PointerEvent('pointermove', { pointerType: 'touch', clientX: x + i, clientY: y, bubbles: true }));
    }, { x: c.x + c.w / 2 + 30, y: c.y + c.h / 2 + 20 });
  });
  // calme par le bouton : le bouton est d'abord attiré, puis revient à none et ne bouge plus
  const o = await openPage(browser, base + '/composants/button/', { theme: 'sombre' });
  try {
    const c0 = await centre(o.page, APERCU);
    await o.page.mouse.move(c0.x + c0.w / 2 + 30, c0.y + c0.h / 2 + 20, { steps: 5 });
    await o.page.waitForTimeout(600);
    let e = await etatBouton(o.page, APERCU);
    if (!(e.x > 1)) echec('calme par le bouton : aimant non actif avant la bascule');
    await o.page.evaluate(() => document.querySelector('[data-im-calme]').click());
    await o.page.mouse.move(c0.x + c0.w / 2 + 32, c0.y + c0.h / 2 + 22, { steps: 4 });
    await o.page.waitForTimeout(800);
    e = await etatBouton(o.page, APERCU);
    st.sansAimant++;
    if (e.cs !== 'none' || e.style !== '') echec(`calme par le bouton : bouton encore déplacé (« ${e.cs} », style « ${e.style} »)`);
    for (const p of o.problems) echec(`calme par le bouton : ${p}`);
  } finally { await o.close(); }
}

// ---- 3. axe ----
async function axe(browser, base, slug, theme, axeSrc, largeur) {
  const o = await openPage(browser, base + `/composants/${slug}/`, { width: largeur, height: largeur < 500 ? 812 : 900, theme });
  try {
    await o.page.evaluate(() => document.getAnimations().forEach((a) => { try { a.finish(); } catch (_) { /* infinie */ } }));
    await o.page.evaluate(axeSrc);
    const r = await o.page.evaluate(() => axe.run(document));
    st.axe++;
    for (const v of r.violations) for (const n of v.nodes) echec(`axe /composants/${slug}/ [${theme} ${largeur} px] ${v.id} (${v.impact}) : ${n.target.join(' ')}`);
    for (const p of o.problems) echec(`axe /composants/${slug}/ [${theme}] ${p}`);
  } finally { await o.close(); }
}

try {
  const fiches = await attendu();
  const routes = new Set(listPages().map((p) => p.route));
  const manque = fiches.filter((f) => !routes.has(`/composants/${f.slug}/`));
  if (manque.length) echec(`pages de pièce non construites : ${manque.map((f) => f.slug).join(', ')}`);
  if (fiches.length !== 63) echec(`${fiches.length} fiches (63 attendues)`);
  const axeSrc = readFileSync(createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8');
  await withBench(async ({ server, launch }) => {
    const c = await launch('chromium');
    if (c.note) console.log(c.note);
    await structure(c.browser, server.url, fiches);
    await mobile375(c.browser, server.url, fiches);
    await aimant(c.browser, server.url, APERCU, 'aperçu');
    await aimant(c.browser, server.url, ENTETE, 'en-tête');
    await aimantDesactive(c.browser, server.url);
    await sansAimant(c.browser, server.url);
    for (const s of CINQ) for (const t of THEMES) await axe(c.browser, server.url, s, t, axeSrc, 1280);
    for (const t of THEMES) await axe(c.browser, server.url, 'button', t, axeSrc, 375);
  });
} catch (e) {
  echec(`exception : ${e.stack || e}`);
}
for (const f of fails) console.log('ÉCHEC ' + f);
console.log(`immersif-pieces : ${st.pages} pages de pièce lues, ${st.voisines} lien(s) voisin vérifié(s), 375 px : ${st.p375} pages, aimants : ${st.aimants} attirés / ${st.retours} retours, ${st.sansAimant} cas sans aimant, axe : ${st.axe} analyses ; ${fails.length} échec(s), ${((Date.now() - t0) / 1000).toFixed(1)} s`);
process.exit(fails.length ? 1 : 0);
