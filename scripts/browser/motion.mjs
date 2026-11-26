// Mouvement réduit (J2c) : sur chaque page construite, avec prefers-reduced-motion: reduce,
//  1. toute transition d'un élément `ch-` (et de ses descendants, et de ::before/::after) dure <= 0,01 ms, animation: none ;
//  2. après des interactions (survol, focus, clic sur une case, un interrupteur, un radio, un bouton), `document.getAnimations()`
//     est vide (lu après 8 images : une transition de 0,01 ms vit 1 à 2 images) ;
//  3. témoin : sans la préférence, des transitions existent (sinon le test ne prouverait rien).
// Variable : CH_OUT (comme les autres scripts) pour tester un build copié.
import { withBench, listPages } from '../lib/browser.mjs';

const t0 = Date.now();
const fails = [];
const pages = listPages();
let nElems = 0, nInter = 0, controlWith = 0, controlPagesWith = 0;

const SEL = '[class^="ch-"], [class*=" ch-"], [class*="\\9 ch-"], [class*="\\A ch-"]';
// Éléments visés par la règle de 30-base.css : l'élément ch-, ses descendants, ses ::before et ::after.
const SCAN = (sel) => {
  const max = (s) => Math.max(0, ...String(s).split(',').map((x) => { x = x.trim(); return x.endsWith('ms') ? parseFloat(x) / 1000 : parseFloat(x); }));
  const roots = [...document.querySelectorAll(sel)];
  const seen = new Set();
  for (const r of roots) { seen.add(r); r.querySelectorAll('*').forEach((e) => seen.add(e)); }
  const bad = [];
  let n = 0;
  for (const el of seen) {
    for (const p of [null, '::before', '::after']) {
      n++;
      const cs = getComputedStyle(el, p);
      const d = max(cs.transitionDuration), a = cs.animationName;
      if (d > 0.00001 + 1e-9 || (a && a !== 'none')) bad.push(el.tagName.toLowerCase() + '.' + String(el.className).split(' ')[0] + (p || '') + ' : transition ' + cs.transitionDuration + ', animation ' + a);
    }
  }
  return { n, bad: bad.slice(0, 5), nbad: bad.length };
};
// Une transition de 0,01 ms vit une image ; l'héritage de couleur la fait démarrer un cran plus bas à l'image suivante
// (button, svg, use : mesuré 2 images). On attend 8 images avant de lire.
const FRAMES = async () => { for (let i = 0; i < 8; i++) await new Promise((r) => requestAnimationFrame(r)); };
const ANIMS = () => document.getAnimations().map((a) => (a.transitionProperty || a.animationName || '?') + ' sur ' + (a.effect && a.effect.target ? a.effect.target.tagName.toLowerCase() + '.' + String(a.effect.target.className).split(' ')[0] : '?'));

try {
  await withBench(async ({ server, launch }) => {
    const { browser } = await launch('chromium');
    for (const { route } of pages) {
      const url = server.url + route;
      // Témoin : sans réduction, des transitions existent.
      {
        const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'no-preference' });
        const page = await ctx.newPage();
        await page.goto(url, { waitUntil: 'load' });
        const r = await page.evaluate(SCAN, SEL);
        if (r.nbad > 0) { controlWith += r.nbad; controlPagesWith++; }
        await ctx.close();
      }
      // Mesure : avec réduction.
      const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
      const page = await ctx.newPage();
      const problems = [];
      page.on('pageerror', (e) => problems.push('erreur de page : ' + e.message));
      await page.goto(url, { waitUntil: 'load' });
      await page.evaluate(() => document.fonts.ready);
      const r = await page.evaluate(SCAN, SEL);
      nElems += r.n;
      if (r.nbad) fails.push(`${route} : ${r.nbad} élément(s) ch- avec transition > 0,01 ms ou animation (ex. ${r.bad.join(' ; ')})`);
      const check = async (what) => {
        nInter++;
        await page.evaluate(FRAMES);
        const a = await page.evaluate(ANIMS);
        if (a.length) fails.push(`${route} après ${what} : ${a.length} animation(s) en cours (${a.slice(0, 4).join(' ; ')})`);
      };
      await check('le chargement');
      // Interactions : survol et focus de chaque contrôle ch- (jusqu'à 25 par page), clic sur cases, interrupteurs, radios.
      const targets = await page.$$('input.ch-check, input.ch-radio, input.ch-switch, button.ch-btn, a.ch-btn, input.ch-input, select.ch-select, textarea.ch-textarea');
      for (const h of targets.slice(0, 25)) {
        try {
          if (!(await h.isVisible())) continue;
          await h.scrollIntoViewIfNeeded();
          await h.hover({ timeout: 2000 }); await check('un survol');
          await h.focus(); await check('un focus');
          const type = await h.evaluate((e) => e.type + '|' + e.disabled);
          if (/^(checkbox|radio)\|false/.test(type)) { await h.click({ timeout: 2000 }); await check('un clic sur une case'); }
        } catch (e) { /* contrôle masqué ou recouvert : suivant */ }
      }
      // J3a : états ouverts de chopa.js (menu déroulant, menu téléphone, onglet actif) : aucune animation non plus.
      try {
        for (const t of (await page.$$('.ch-dropdown [popovertarget]')).slice(0, 2)) {
          if (!(await t.isVisible())) continue;
          await t.scrollIntoViewIfNeeded(); await t.click({ timeout: 2000 }); await page.mouse.move(1, 1); await check("l'ouverture d'un menu déroulant"); // souris écartée : Chromium recalcule le survol avec un retard, ce qui décalait une transition de 0,01 ms hors des 8 images
          await page.keyboard.press('ArrowDown'); await check('une flèche dans le menu déroulant');
          await page.keyboard.press('Escape'); await check('la fermeture du menu déroulant');
        }
        for (const t of (await page.$$('.ch-header__toggle')).slice(0, 3)) {
          if (!(await t.isVisible())) continue;
          await t.scrollIntoViewIfNeeded(); await t.click({ timeout: 2000 }); await page.mouse.move(1, 1); await check('un clic sur le bouton du menu téléphone');
          await t.click({ timeout: 2000 }); await page.mouse.move(1, 1); await check('un 2e clic sur le bouton du menu téléphone');
        }
        for (const t of (await page.$$('.ch-tabs__tab:not([aria-selected="true"]):not([aria-disabled="true"])')).slice(0, 3)) {
          if (!(await t.isVisible())) continue;
          await t.scrollIntoViewIfNeeded(); await t.click({ timeout: 2000 }); await page.mouse.move(1, 1); await check('un clic sur un onglet');
        }
        for (const n of (await page.$$('.ch-nav a')).slice(0, 3)) { await n.scrollIntoViewIfNeeded(); await n.hover({ timeout: 2000 }); await check("le survol d'un lien de navigation"); }
      } catch (e) { /* élément masqué ou recouvert : suivant */ }
      await page.keyboard.press('Tab'); await check('Tab');
      await page.mouse.move(1, 1); await check('un retrait de la souris');
      for (const p of problems) fails.push(`${route} : ${p}`);
      await ctx.close();
    }
  });
} catch (e) { fails.push(`exception : ${e.stack || e}`); }
if (controlWith === 0) fails.push('témoin : sans prefers-reduced-motion, aucune transition ch- trouvée (le test ne prouverait rien)');
for (const f of fails) console.log('ÉCHEC ' + f);
console.log(`motion : ${pages.length} page(s), ${nElems} élément(s)/pseudo lus, ${nInter} lecture(s) de getAnimations (0 animation attendue), témoin sans réduction : ${controlWith} élément(s) avec transition sur ${controlPagesWith} page(s), ${fails.length} échec(s), ${((Date.now() - t0) / 1000).toFixed(1)} s`);
process.exit(fails.length ? 1 : 0);
