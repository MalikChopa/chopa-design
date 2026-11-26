// Navigation statique (J3b) : ce que `keyboard` ne mesure pas, sur les pages de pièces construites (site/dist, CH_OUT compris), Chromium.
//  A. Lien d'évitement (`ch-skip`), 3 thèmes : au repos non visible (boîte ≤ 1 px, ou hors de la fenêtre) mais jamais display:none ni
//     visibility:hidden ; au focus entièrement dans la fenêtre, 44 px de haut au moins, couleurs = paire autorisée on-acc sur acc, ≥ 4,5 ;
//     premier élément focalisable de son exemple ; Entrée déplace le focus sur sa cible ; chaque cible `href="#id"` existe sur chaque page construite
//     (le contrôle `ids-uniques` ne lit pas les href).
//  B. Barre latérale (`ch-sidebar`), 3 thèmes, à 375 et 1440 px :
//     B1 repli « toujours ouverte » : la feuille de style servie est amputée de ses règles ::details-content (simulation d'un navigateur sans
//        le support : le bloc @supports est retiré, et on vérifie qu'il n'en reste aucune trace) : tous les liens sont visibles et atteignables
//        (focus), à 375 comme à 1440 ;
//     B2 avec ses règles : 375 px : résumé visible (44 px), liens visibles ; Espace plie (liens cachés), Espace redéplie ; 1440 px : résumé non
//        affiché, liens visibles, même si le détail est replié (amélioration) ; le résumé n'est pas un arrêt de Tab.
// Le résumé (une ligne) est la seule sortie ; le détail des échecs est affiché avant.
import { readFileSync } from 'node:fs';
import { withBench, listPages, THEMES } from '../lib/browser.mjs';
import { parseColor, ratio } from '../../src/lib/color.mjs';

const t0 = Date.now();
const fails = [];
let checks = 0, skipLinks = 0, sidebars = 0, pagesLues = 0, cibles = 0;
const check = (ok, msg) => { checks++; if (!ok) fails.push(msg); };

// Retire de la feuille chopa.css tout bloc @supports qui parle de ::details-content (comptés), et ses commentaires.
export function sansDetailsContent(css) {
  let out = css.replace(/\/\*[\s\S]*?\*\//g, '');
  let retires = 0;
  for (;;) {
    const i = out.search(/@supports\s+selector\(\s*::details-content\s*\)/);
    if (i < 0) break;
    let j = out.indexOf('{', i), depth = 0, k = j;
    for (; k < out.length; k++) { if (out[k] === '{') depth++; else if (out[k] === '}' && --depth === 0) break; }
    out = out.slice(0, i) + out.slice(k + 1);
    retires++;
  }
  return { css: out, retires, reste: /details-content/.test(out) };
}

async function newPage(browser, theme, width, height, { stripCss = false } = {}) {
  const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'no-preference' });
  await context.addInitScript((t) => { try { localStorage.setItem('ch-theme', t); } catch (_) {} }, theme);
  const info = { retires: 0, reste: false, servies: 0 };
  if (stripCss) {
    await context.route(/\/chopa\/chopa\.css(\?.*)?$/, async (route) => {
      const resp = await route.fetch();
      const r = sansDetailsContent(await resp.text());
      info.retires += r.retires; info.reste = info.reste || r.reste; info.servies++;
      await route.fulfill({ response: resp, body: r.css });
    });
  }
  const page = await context.newPage();
  const problems = [];
  page.on('pageerror', (e) => problems.push(`erreur de page : ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') problems.push(`console : ${m.text()}`); });
  page.on('requestfailed', (r) => problems.push(`requête en échec : ${r.url()}`));
  return { page, context, problems, info };
}

// Dans la page : un élément est-il rendu et visible ?
const VISIBLE = `(el) => el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }) && el.getClientRects().length > 0`;

// ---------- A. lien d'évitement ----------
async function lienDEvitement(browser, server, theme) {
  const tag = (s) => `[skip ${theme}] ${s}`;
  const o = await newPage(browser, theme, 1280, 800);
  await o.page.goto(server.url + '/composants/skip/', { waitUntil: 'load' });
  await o.page.evaluate(() => document.fonts.ready);
  await o.page.evaluate(() => document.getAnimations().forEach((a) => a.finish()));
  const n = await o.page.locator('.ch-skip').count();
  check(n >= 6, tag(`${n} lien(s) ch-skip trouvés (attendu 6 : 1 + 2 + 3 copies de thème)`));
  for (let i = 0; i < n; i++) {
    skipLinks++;
    const sel = `.ch-skip >> nth=${i}`;
    const loc = o.page.locator(sel);
    const href = await loc.getAttribute('href');
    const t = (s) => tag(`n°${i + 1} (${href}) ${s}`);
    // Repos
    const rest = await loc.evaluate((el, vp) => {
      const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
      return { w: r.width, h: r.height, left: r.left, top: r.top, right: r.right, bottom: r.bottom, display: cs.display, visibility: cs.visibility, clip: cs.clipPath,
        dehors: r.right <= 0 || r.bottom <= 0 || r.left >= vp.w || r.top >= vp.h };
    }, { w: 1280, h: 800 });
    check(rest.display !== 'none' && rest.visibility !== 'hidden', t(`au repos : ni display:none ni visibility:hidden (${rest.display}, ${rest.visibility})`));
    check((rest.w <= 1 && rest.h <= 1) || rest.dehors, t(`au repos : boîte ≤ 1 px ou hors de la fenêtre (${rest.w} × ${rest.h})`));
    // Premier focalisable de son exemple
    const premier = await loc.evaluate((el) => {
      const zone = el.closest('.doc-example__preview');
      const tous = [...zone.querySelectorAll('a[href], button, input, select, textarea, summary, [tabindex]:not([tabindex="-1"])')];
      const i = tous.indexOf(el);
      return i >= 0 && tous.slice(0, i + 1).every((x) => x.classList.contains('ch-skip')); // en tête, derrière d'autres liens d'évitement seulement
    });
    check(premier, t('est le premier élément focalisable de son exemple'));
    // Focus
    await loc.focus();
    await o.page.evaluate(() => document.getAnimations().forEach((a) => a.finish()));
    const foc = await loc.evaluate((el) => {
      const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
      const probe = (v) => { const s = document.createElement('span'); s.style.color = `var(${v})`; el.parentElement.appendChild(s); const c = getComputedStyle(s).color; s.remove(); return c; };
      return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, w: r.width, h: r.height, color: cs.color, bg: cs.backgroundColor,
        onAcc: probe('--ch-on-acc'), acc: probe('--ch-acc'), actif: document.activeElement === el, vis: el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }),
        vw: document.documentElement.clientWidth, vh: document.documentElement.clientHeight };
    });
    check(foc.actif, t('prend le focus'));
    check(foc.vis && foc.left >= 0 && foc.top >= 0 && foc.right <= foc.vw && foc.bottom <= foc.vh, t(`au focus : entièrement dans la fenêtre (${foc.left},${foc.top} → ${foc.right},${foc.bottom} dans ${foc.vw} × ${foc.vh})`));
    check(foc.h >= 44 - 0.01, t(`au focus : 44 px de haut au moins (${foc.h})`));
    check(foc.color === foc.onAcc && foc.bg === foc.acc, t(`au focus : paire on-acc sur acc (${foc.color} sur ${foc.bg} ; rôles ${foc.onAcc} sur ${foc.acc})`));
    check(ratio(parseColor(foc.color), parseColor(foc.bg)) >= 4.5, t(`au focus : contraste ≥ 4,5 (${ratio(parseColor(foc.color), parseColor(foc.bg)).toFixed(2)})`));
    // Entrée : le focus va à la cible
    await o.page.keyboard.press('Enter');
    const cible = await o.page.evaluate((h) => { const e = document.getElementById(decodeURIComponent(h.slice(1))); return { existe: !!e, actif: !!e && document.activeElement === e }; }, href);
    check(cible.existe, t('la cible existe'));
    check(cible.actif, t('Entrée : le focus est sur la cible'));
    // Retour au repos après la sortie du focus
    const apres = await loc.evaluate((el) => { const r = el.getBoundingClientRect(); return r.width <= 1 && r.height <= 1; });
    check(apres, t('le focus parti, il redevient invisible'));
  }
  for (const p of o.problems) fails.push(tag(p));
  await o.context.close();
}

// Chaque href="#id" d'un ch-skip de chaque page construite vise un id de la même page.
function ciblesDesPages() {
  for (const p of listPages()) {
    pagesLues++;
    const html = readFileSync(p.file, 'utf8');
    for (const m of html.matchAll(/<a\b[^>]*\bclass="[^"]*\bch-skip\b[^"]*"[^>]*>/g)) {
      const h = m[0].match(/\bhref="#([^"]+)"/);
      cibles++;
      check(!!h && html.includes(`id="${h[1]}"`), `[skip] ${p.route} : cible de ${m[0]} absente de la page`);
    }
  }
}

// ---------- B. barre latérale ----------
async function barreLaterale(browser, server, theme, width, strip) {
  const nom = `[sidebar ${theme} ${width} px ${strip ? 'sans ::details-content' : 'avec ::details-content'}]`;
  const o = await newPage(browser, theme, width, 900, { stripCss: strip });
  await o.page.goto(server.url + '/composants/sidebar/', { waitUntil: 'load' });
  await o.page.evaluate(() => document.fonts.ready);
  await o.page.evaluate(() => document.getAnimations().forEach((a) => a.finish()));
  if (strip) {
    check(o.info.servies >= 1 && o.info.retires >= 1, `${nom} : le bloc @supports ::details-content a été retiré de la feuille servie (${o.info.retires} retrait(s), ${o.info.servies} service(s))`);
    check(!o.info.reste, `${nom} : aucune trace de ::details-content ne reste dans la feuille servie`);
  }
  const supporte = await o.page.evaluate(() => CSS.supports('selector(::details-content)'));
  const n = await o.page.locator('.ch-sidebar').count();
  check(n >= 5, `${nom} : ${n} barre(s) latérale(s) (attendu ≥ 5 : 2 exemples + 3 copies de thème)`);
  for (let i = 0; i < n; i++) {
    sidebars++;
    const aside = o.page.locator(`.ch-sidebar >> nth=${i}`);
    const t = (s) => `${nom} n°${i + 1} ${s}`;
    const etat = await aside.evaluate((el, V) => {
      const vis = eval(V);
      const d = el.querySelector('details'), s = el.querySelector('summary');
      const liens = [...el.querySelectorAll('.ch-sidebar__link')];
      const r = s.getBoundingClientRect();
      return { open: d.open, liens: liens.length, visibles: liens.filter(vis).length, resume: vis(s), resumeH: r.height };
    }, VISIBLE);
    check(etat.open, t('le HTML porte open (le contenu est affiché sans aucun support)'));
    check(etat.liens >= 3 && etat.visibles === etat.liens, t(`tous les liens sont visibles (${etat.visibles} sur ${etat.liens})`));
    // Atteignables : chaque lien prend le focus
    const atteignables = await aside.evaluate((el) => [...el.querySelectorAll('.ch-sidebar__link')].every((a) => { a.focus(); return document.activeElement === a; }));
    check(atteignables, t('chaque lien prend le focus'));
    if (strip) {
      check(etat.resume && etat.resumeH >= 44 - 0.01, t(`sans le support, le résumé reste affiché, 44 px (${etat.resumeH})`));
    } else if (width === 375) {
      check(etat.resume && etat.resumeH >= 44 - 0.01, t(`téléphone : résumé visible, 44 px (${etat.resumeH})`));
    } else if (supporte) {
      check(!etat.resume, t('large : résumé non affiché'));
    }
  }
  // Interactions sur la première barre (plié, déplié)
  const premiere = o.page.locator('.ch-sidebar >> nth=0');
  const resume = premiere.locator('summary');
  const liensVisibles = () => premiere.evaluate((el, V) => { const vis = eval(V); return [...el.querySelectorAll('.ch-sidebar__link')].filter(vis).length; }, VISIBLE);
  const total = await premiere.locator('.ch-sidebar__link').count();
  if (strip || width === 375) {
    // Le résumé est un bouton natif : focus, Espace plie, Espace redéplie, Entrée replie.
    await resume.focus();
    await o.page.keyboard.press('Space');
    await o.page.evaluate(() => document.getAnimations().forEach((a) => a.finish()));
    const ferme = await premiere.evaluate((el) => !el.querySelector('details').open);
    check(ferme && (await liensVisibles()) === 0, `${nom} : Espace sur le résumé plie la barre (aucun lien visible)`);
    const foc = await resume.evaluate((s) => { const cs = getComputedStyle(s); return { focus: document.activeElement === s, outline: parseFloat(cs.outlineWidth), style: cs.outlineStyle }; });
    check(foc.focus && foc.style !== 'none' && foc.outline >= 2, `${nom} : le résumé garde le focus, contour visible (${foc.style} ${foc.outline} px)`);
    await o.page.keyboard.press('Space');
    await o.page.evaluate(() => document.getAnimations().forEach((a) => a.finish()));
    check((await liensVisibles()) === total, `${nom} : Espace redéploie la barre (${total} liens visibles)`);
    await o.page.keyboard.press('Enter');
    check((await liensVisibles()) === 0, `${nom} : Entrée sur le résumé plie la barre`);
    await o.page.keyboard.press('Enter');
    check((await liensVisibles()) === total, `${nom} : Entrée redéploie la barre`);
  } else if (supporte) {
    // Large et avec le support : replié à la main, le contenu reste affiché ; le résumé n'est pas un arrêt de Tab.
    await premiere.evaluate((el) => { el.querySelector('details').open = false; });
    await o.page.evaluate(() => document.getAnimations().forEach((a) => a.finish()));
    check((await liensVisibles()) === total, `${nom} : détail replié à la main, les ${total} liens restent visibles (amélioration ::details-content)`);
    await o.page.evaluate(() => { const b = document.createElement('button'); b.id = 'avant-sb'; b.textContent = 'avant'; document.querySelector('.ch-sidebar').before(b); });
    await o.page.focus('#avant-sb');
    await o.page.keyboard.press('Tab');
    const surLien = await o.page.evaluate(() => document.activeElement && document.activeElement.classList.contains('ch-sidebar__link'));
    check(surLien, `${nom} : le premier Tab après le repère atteint un lien, pas le résumé`);
  } else {
    // Chromium sans le support : on le dit au lieu de le passer sous silence.
    fails.push(`${nom} : ce Chromium ne connaît pas ::details-content, l'amélioration n'a pu être mesurée`);
  }
  for (const p of o.problems) fails.push(`${nom} ${p}`);
  await o.context.close();
}

try {
  ciblesDesPages();
  await withBench(async ({ server, launch }) => {
    const { browser } = await launch('chromium');
    for (const theme of THEMES) await lienDEvitement(browser, server, theme);
    for (const theme of THEMES) for (const width of [375, 1440]) for (const strip of [true, false]) await barreLaterale(browser, server, theme, width, strip);
  });
} catch (e) {
  fails.push(`exception : ${e.stack || e}`);
}
for (const f of fails) console.log('ÉCHEC ' + f);
console.log(`nav-statique : ${checks} vérification(s), ${skipLinks} lien(s) d'évitement × 3 thèmes, ${cibles} cible(s) de lien d'évitement sur ${pagesLues} page(s), ${sidebars} barre(s) latérale(s) mesurée(s) (3 thèmes × 375 et 1440 px × avec et sans ::details-content), ${fails.length} échec(s), ${((Date.now() - t0) / 1000).toFixed(1)} s`);
process.exit(fails.length ? 1 : 0);
