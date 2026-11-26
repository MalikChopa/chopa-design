// Socle de la doc immersive (I0, docs/ARCHITECTURE.md §16.8). Pages existantes seulement ; aucun fichier écrit dans le dépôt.
//  1. Navigations enchaînées : 60 en Chromium (3 thèmes × 20) et 20 en WebKit, par liens et par location.assign ; 0 erreur console ou de page ;
//     pagereveal.viewTransition présent ou sauté (raison lue dans data-im-vt) ; 1 seul « im-barre » et au plus 1 « im-piece » par page.
//  2. Mouvement réduit : 0 animation pendant (pagereveal) et après la navigation, après pointeur et molette ; ni curseur, ni lettre découpée.
//  3. Curseur carré : absent au toucher (hasTouch) et en mouvement réduit, créé au premier mouvement de souris, caché après Tab,
//     petit sur l'élément :focus-visible, elementFromPoint le traverse, natif (texte) sur un champ de recherche.
//  4. Titre vivant : nom accessible du h1 inchangé (lu par ariaSnapshot, comparé au HTML construit), lettres aria-hidden, vivantes au survol.
//  5. Version calme : aria-pressed, mémorisée après rechargement et décidée avant le corps de page, curseur et titre arrêtés.
// Variable : CH_OUT (comme les autres scripts).
import { withBench, listPages, THEMES } from '../lib/browser.mjs';

const t0 = Date.now();
const fails = [];
const echec = (m) => fails.push(m);
const stats = { nav: 0, navWebkit: 0, vtPresent: 0, vtAbsent: 0, vtSaute: {}, pieceMax: 0, rechargements: 0 };

const pages = listPages().map((p) => p.route).filter((r) => !/^\/gabarits\/[^/]+\/[^/]+\/$/.test(r));
const norm = (s) => String(s).replace(/\s+/g, ' ').trim();

// Contexte maison : openPage de la bibliothèque du banc ne prend pas d'options de contexte (touch, mouvement réduit).
async function ouvrir(browser, url, { width = 1280, height = 900, theme = 'sombre', ...ctxOpts } = {}) {
  const context = await browser.newContext({ viewport: { width, height }, ...ctxOpts });
  const problems = [];
  await context.addInitScript((t) => {
    try { localStorage.setItem('ch-theme', t); } catch (_) { /* refusé */ }
    // Mesures qui survivent aux navigations (sessionStorage) : l'écouteur est posé AVANT ceux de la page et ne touche à aucune promesse.
    addEventListener('pagereveal', (e) => {
      try {
        sessionStorage.setItem('__vt', e.viewTransition ? '1' : '0');
        sessionStorage.setItem('__anim', String(document.getAnimations().length));
      } catch (_) { /* refusé */ }
    });
    // Classe de <html> au moment où <body> apparaît : tete.js (dans <head>) doit déjà avoir tranché.
    const o = new MutationObserver(() => {
      if (document.body) { try { sessionStorage.setItem('__clsAvantCorps', document.documentElement.className); } catch (_) { /* refusé */ } o.disconnect(); }
    });
    o.observe(document, { childList: true, subtree: true });
  }, theme);
  const page = await context.newPage();
  page.on('console', (m) => { if (m.type() === 'error') problems.push(`console : ${m.text()}`); });
  page.on('pageerror', (e) => problems.push(`erreur de page : ${e.message}`));
  page.on('requestfailed', (r) => problems.push(`requête en échec : ${r.url()} (${r.failure()?.errorText})`));
  page.on('response', (r) => { if (r.status() >= 400) problems.push(`réponse ${r.status()} : ${r.url()}`); });
  await page.goto(url, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  return { page, context, problems, close: () => context.close().catch(() => {}) };
}

const NOMMES = () => {
  const noms = {};
  for (const el of document.querySelectorAll('*')) {
    const n = getComputedStyle(el).viewTransitionName;
    if (n && n !== 'none') noms[n] = (noms[n] || 0) + 1;
  }
  return noms;
};

// ---------- 1. Navigations ----------
async function naviguer(browser, label, theme, n, { reloadsEvery = 0 } = {}) {
  const o = await ouvrir(browser, base + '/', { theme });
  const { page, problems } = o;
  let route = '/';
  try {
    for (let i = 0; i < n; i++) {
      const suivante = pages[(i * 7 + 3 + (theme.length * 5)) % pages.length];
      if (suivante === route) continue;
      const lien = page.locator(`a[href="${suivante}"]`).first();
      const parLien = (await lien.count()) > 0 && (await lien.isVisible().catch(() => false)) && i % 3 !== 2;
      const attente = page.waitForURL((u) => u.pathname === suivante, { waitUntil: 'load', timeout: 15000 });
      if (parLien) await lien.click(); else await page.evaluate((u) => location.assign(u), suivante);
      await attente;
      route = suivante;
      if (i % 2) await page.waitForTimeout(450); // une fois sur deux, on laisse finir ; sinon on enchaîne aussitôt
      // Diapason (I2) : depuis le mur, « pagereveal » arrive quelques ms après « load » ; on attend que la garde ait posé
      // data-im-vt (2 s au plus) avant de lire. Une garde qui ne le pose jamais échoue toujours plus bas.
      await page.waitForFunction(() => document.documentElement.hasAttribute('data-im-vt'), null, { timeout: 2000 }).catch(() => {});
      const e = await page.evaluate(() => ({
        vt: sessionStorage.getItem('__vt'), raison: document.documentElement.getAttribute('data-im-vt'),
        titre: document.title, nommes: (() => { const r = {}; for (const el of document.querySelectorAll('*')) { const nm = getComputedStyle(el).viewTransitionName; if (nm && nm !== 'none') r[nm] = (r[nm] || 0) + 1; } return r; })(),
      }));
      if (label === 'chromium') stats.nav++; else stats.navWebkit++;
      if (e.vt === '1') stats.vtPresent++; else { stats.vtAbsent++; echec(`${label} [${theme}] ${route} : pagereveal.viewTransition absent (les deux moteurs du banc prennent en charge les transitions entre documents ; l'inscription est-elle lue ?)`); }
      if (e.vt === '1' && !e.raison) echec(`${label} [${theme}] ${route} : transition lancée sans que la garde de tete.js l'ait vue (data-im-vt absent)`);
      if (e.raison && e.raison !== 'ok') stats.vtSaute[e.raison] = (stats.vtSaute[e.raison] || 0) + 1;
      if ((e.nommes['im-barre'] || 0) !== 1) echec(`${label} [${theme}] ${route} : ${e.nommes['im-barre'] || 0} élément(s) « im-barre » (1 attendu)`);
      if ((e.nommes['im-piece'] || 0) > 1) echec(`${label} [${theme}] ${route} : ${e.nommes['im-piece']} éléments « im-piece » (1 au plus)`);
      stats.pieceMax = Math.max(stats.pieceMax, e.nommes['im-piece'] || 0);
      if (reloadsEvery && i % reloadsEvery === reloadsEvery - 1) { await page.reload({ waitUntil: 'load' }); stats.rechargements++; }
    }
    await page.waitForTimeout(500);
  } catch (e) { echec(`${label} [${theme}] exception à ${route} : ${e.message.split('\n')[0]}`); }
  for (const p of problems) echec(`${label} [${theme}] navigations : ${p}`);
  await o.close();
}

// ---------- 2. Mouvement réduit ----------
async function reduit(browser) {
  const o = await ouvrir(browser, base + '/jetons/', { reducedMotion: 'reduce' });
  const { page, problems } = o;
  const suite = ['/installation/', '/composants/', '/icones/', '/jetons/', '/composants/button/', '/marque/'];
  try {
    for (const r of suite) {
      const attente = page.waitForURL((u) => u.pathname === r, { waitUntil: 'load', timeout: 15000 });
      await page.evaluate((u) => location.assign(u), r);
      await attente;
      await page.mouse.move(400, 200, { steps: 4 });
      await page.mouse.wheel(0, 300);
      await page.mouse.move(120, 120);
      for (let i = 0; i < 4; i++) await page.evaluate(() => new Promise((ok) => requestAnimationFrame(ok)));
      const e = await page.evaluate(() => ({
        pendant: sessionStorage.getItem('__anim'), apres: document.getAnimations().length,
        curseur: document.querySelectorAll('.im-curseur, .im-curseur-calque').length, lettres: document.querySelectorAll('.im-vivant__l').length,
        calme: document.documentElement.classList.contains('im-calme'), reduit: document.documentElement.classList.contains('im-reduit'),
        bouton: document.querySelector('[data-im-calme]') ? document.querySelector('[data-im-calme]').hidden : null,
        vt: document.documentElement.getAttribute('data-im-vt'), h1: document.querySelector('#contenu h1')?.children.length,
      }));
      if (e.pendant !== '0') echec(`reduit ${r} : ${e.pendant} animation(s) à pagereveal (0 attendu)`);
      if (e.apres !== 0) echec(`reduit ${r} : ${e.apres} animation(s) après chargement, pointeur et molette (0 attendu)`);
      if (e.curseur) echec(`reduit ${r} : curseur carré présent`);
      if (e.lettres) echec(`reduit ${r} : ${e.lettres} lettre(s) du titre vivant découpée(s)`);
      if (!e.calme || !e.reduit) echec(`reduit ${r} : classes im-calme/im-reduit absentes de <html>`);
      if (e.bouton !== true) echec(`reduit ${r} : le bouton « Version calme » n'est pas caché (hidden=${e.bouton})`);
      if (e.vt && e.vt !== 'saute-reduit') echec(`reduit ${r} : data-im-vt = ${e.vt} (saute-reduit attendu)`);
      if (e.h1) echec(`reduit ${r} : le h1 a été découpé`);
    }
  } catch (e) { echec(`reduit exception : ${e.message.split('\n')[0]}`); }
  for (const p of problems) echec(`reduit : ${p}`);
  await o.close();
}

// ---------- 3. Curseur ----------
async function curseur(browser) {
  const o = await ouvrir(browser, base + '/installation/');
  const { page, problems } = o;
  const etat = () => page.evaluate(() => {
    const c = document.querySelector('.im-curseur'); const k = document.querySelector('.im-curseur-calque');
    if (!c) return null;
    const r = c.getBoundingClientRect(), cs = getComputedStyle(c), ks = getComputedStyle(k);
    return { classes: c.className, cx: r.left + r.width / 2, cy: r.top + r.height / 2, w: r.width, opacite: cs.opacity, pe: cs.pointerEvents, kpe: ks.pointerEvents, kover: ks.overflow, kpos: ks.position, on: document.documentElement.classList.contains('im-curseur-on'), aria: k.getAttribute('aria-hidden') };
  });
  try {
    const avant = await etat();
    if (avant) echec('curseur : présent avant le premier mouvement de souris');
    await page.mouse.move(500, 400, { steps: 3 });
    await page.waitForTimeout(500);
    let s = await etat();
    if (!s) echec('curseur : absent après un mouvement de souris');
    else {
      if (Math.abs(s.cx - 500) > 2 || Math.abs(s.cy - 400) > 2) echec(`curseur : centre (${s.cx.toFixed(1)}, ${s.cy.toFixed(1)}) au lieu de (500, 400)`);
      if (!s.classes.includes('is-actif')) echec('curseur : pas « is-actif » après mouvement');
      if (s.pe !== 'none' || s.kpe !== 'none') echec(`curseur : pointer-events ${s.pe}/${s.kpe} (none attendu)`);
      if (s.kover !== 'hidden' || s.kpos !== 'fixed' || s.aria !== 'true' || !s.on) echec(`curseur : calque ${s.kpos}/${s.kover}/aria-hidden=${s.aria}, im-curseur-on=${s.on}`);
      if (Math.abs(s.w - 14) > 0.5) echec(`curseur : largeur ${s.w} px au repos (14 attendu)`);
    }
    const traverse = await page.evaluate(() => { const el = document.elementFromPoint(500, 400); return el ? !el.closest('.im-curseur-calque') : false; });
    if (!traverse) echec('curseur : elementFromPoint tombe sur le curseur (il ne laisse pas passer la souris)');
    // Texte courant : le curseur natif est masqué ; élément interactif : grand.
    const natif = await page.evaluate(() => getComputedStyle(document.querySelector('.doc-main p, .doc-main')).cursor);
    if (natif !== 'none') echec(`curseur : curseur natif « ${natif} » sur du texte (none attendu pendant que le carré vit)`);
    const b = await page.locator('.doc-themes button').first().boundingBox();
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 3 });
    await page.waitForTimeout(500);
    s = await etat();
    if (!s || !s.classes.includes('is-grand') || Math.abs(s.w - 44) > 0.5) echec(`curseur : pas grand (44 px) sur un bouton (${s && s.classes}, ${s && s.w})`);
    // Champ de texte : natif, carré caché.
    const champ = await page.locator('#doc-q').boundingBox();
    await page.mouse.move(champ.x + 40, champ.y + champ.height / 2, { steps: 3 });
    await page.waitForTimeout(400);
    s = await etat();
    const curChamp = await page.evaluate(() => getComputedStyle(document.querySelector('#doc-q')).cursor);
    if (!s || !s.classes.includes('is-cache') || Number(s.opacite) !== 0) echec(`curseur : pas caché sur le champ de recherche (${s && s.classes}, opacité ${s && s.opacite})`);
    if (curChamp !== 'text') echec(`curseur : curseur natif « ${curChamp} » sur le champ de texte (text attendu)`);
    // Tab : caché ; ensuite, sur l'élément focalisé, petit.
    await page.mouse.move(700, 500, { steps: 2 });
    await page.keyboard.press('Tab');
    await page.waitForTimeout(450);
    s = await etat();
    if (!s || s.classes.includes('is-actif') || Number(s.opacite) !== 0) echec(`curseur : pas caché après Tab (${s && s.classes}, opacité ${s && s.opacite})`);
    const f = await page.evaluate(() => { const a = document.activeElement; const r = a.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, fv: a.matches(':focus-visible'), tag: a.tagName }; });
    await page.mouse.move(f.x, f.y, { steps: 2 });
    await page.waitForTimeout(450);
    s = await etat();
    if (!f.fv) echec(`curseur : l'élément focalisé (${f.tag}) n'est pas :focus-visible`);
    if (s && (s.classes.includes('is-grand') || Math.abs(s.w - 14) > 0.5)) echec(`curseur : grand (${s.w} px) sur l'élément :focus-visible (14 px attendu)`);
  } catch (e) { echec(`curseur exception : ${e.message.split('\n')[0]}`); }
  for (const p of problems) echec(`curseur : ${p}`);
  await o.close();

  // Toucher : aucun carré.
  const t = await ouvrir(browser, base + '/installation/', { hasTouch: true });
  try {
    // On touche du texte courant (pas un lien : la page ne doit pas changer, sinon le test ne prouverait rien).
    const p = await t.page.locator('#contenu .doc-lead, #contenu p').first().boundingBox();
    await t.page.touchscreen.tap(p.x + 30, p.y + p.height / 2);
    await t.page.touchscreen.tap(p.x + 80, p.y + p.height / 2);
    await t.page.waitForTimeout(300);
    if (new URL(t.page.url()).pathname !== '/installation/') echec(`curseur : le toucher a changé de page (${t.page.url()})`);
    const n = await t.page.evaluate(() => document.querySelectorAll('.im-curseur').length + (document.documentElement.classList.contains('im-curseur-on') ? 1 : 0));
    if (n) echec('curseur : présent après des touchers (hasTouch)');
  } catch (e) { echec(`curseur toucher exception : ${e.message.split('\n')[0]}`); }
  for (const p of t.problems) echec(`curseur toucher : ${p}`);
  await t.close();
}

// ---------- 4. Titre vivant ----------
async function vivant(browser, label = 'chromium', routes = ['/installation/', '/jetons/', '/theme/', '/marque/', '/effets/', '/icones/', '/composants/', '/gabarits/', '/composants/button/', '/']) {
  const o = await ouvrir(browser, base + routes[0]);
  const { page, problems } = o;
  try {
    for (const r of routes) {
      if (r !== routes[0]) { await page.goto(base + r, { waitUntil: 'load' }); }
      const attendu = await page.evaluate(async () => {
        const t = await (await fetch(location.href)).text();
        const h = new DOMParser().parseFromString(t, 'text/html').querySelector('#contenu h1');
        return h ? h.textContent.replace(/\s+/g, ' ').trim() : null;
      });
      const e = await page.evaluate(() => {
        const h = document.querySelector('#contenu h1');
        const l = h ? [...h.querySelectorAll('.im-vivant__l')] : [];
        return { n: l.length, masque: h ? [...h.querySelectorAll('.im-vivant__mot')].every((m) => m.closest('[aria-hidden="true"]')) : null, sr: h ? h.querySelector('.im-sr')?.textContent : null, texte: h ? h.textContent : null };
      });
      if (attendu === null) { echec(`${label} vivant ${r} : pas de h1 dans #contenu`); continue; }
      const snap = await page.locator('#contenu h1').first().ariaSnapshot();
      const m = /heading "((?:[^"\\]|\\.)*)"/.exec(snap);
      if (!m || norm(m[1]) !== norm(attendu)) echec(`${label} vivant ${r} : nom accessible « ${m && m[1]} » ≠ « ${attendu} » (${snap.replace(/\n/g, ' ')})`);
      if (e.n === 0 && r !== '/') echec(`${label} vivant ${r} : aucune lettre découpée`);
      if (e.n && !e.masque) echec(`${label} vivant ${r} : des lettres ne sont pas dans un parent aria-hidden`);
      if (e.n && norm(e.sr) !== norm(attendu)) echec(`${label} vivant ${r} : copie lisible « ${e.sr} » ≠ « ${attendu} »`);
    }
    if (label === 'chromium') {
      // Vivant : au survol, au moins une lettre prend une transformation ; apparition terminée.
      await page.goto(base + '/jetons/', { waitUntil: 'load' });
      await page.waitForTimeout(2200);
      const b = await page.locator('#contenu h1 .im-vivant__l').first().boundingBox();
      await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 4 });
      await page.waitForTimeout(600);
      const nT = await page.evaluate(() => [...document.querySelectorAll('#contenu h1 .im-vivant__l')].filter((l) => l.style.transform && l.style.transform !== 'none').length);
      if (!nT) echec('vivant : aucune lettre transformée au survol du titre');
      const sk = await page.evaluate(() => [...document.querySelectorAll('#contenu h1 .im-vivant__l')].some((l) => /skewX\((-?[1-9]|-?0\.[1-9])/.test(l.style.transform)));
      if (!sk) echec('vivant : le survol ne penche aucune lettre (skewX attendu)');
      stats.lettresTransformees = nT;
    }
  } catch (e) { echec(`${label} vivant exception : ${e.message.split('\n')[0]}`); }
  for (const p of problems) echec(`${label} vivant : ${p}`);
  await o.close();
}

// ---------- 5. Version calme ----------
async function calme(browser) {
  const o = await ouvrir(browser, base + '/jetons/');
  const { page, problems } = o;
  const bouton = page.locator('[data-im-calme]');
  const lettresTransformees = () => page.evaluate(() => [...document.querySelectorAll('#contenu h1 .im-vivant__l, #contenu h1 .im-vivant__point')].filter((l) => l.style.transform).length);
  try {
    await page.waitForTimeout(2000);
    if (!(await bouton.isVisible())) echec('calme : bouton « Version calme » non visible (mouvement normal)');
    if ((await bouton.getAttribute('aria-pressed')) !== 'false') echec('calme : aria-pressed initial ≠ false');
    if (!(await page.evaluate(() => document.querySelector('[data-im-calme]').getBoundingClientRect().height >= 44))) echec('calme : bouton de moins de 44 px de haut');
    // En mouvement : curseur et lettres vivent.
    await page.mouse.move(300, 300, { steps: 3 });
    await page.waitForTimeout(400);
    if (!(await page.locator('.im-curseur').count())) echec('calme : le curseur manque avant la bascule');
    if (!(await lettresTransformees())) echec('calme : les lettres ne vivent pas avant la bascule');
    await bouton.click();
    await page.waitForTimeout(300);
    if ((await bouton.getAttribute('aria-pressed')) !== 'true') echec('calme : aria-pressed ≠ true après un clic');
    const e = await page.evaluate(() => ({ cl: document.documentElement.classList.contains('im-calme'), ls: localStorage.getItem('doc-calme'), cur: document.querySelectorAll('.im-curseur').length, curOn: document.documentElement.classList.contains('im-curseur-on') }));
    if (!e.cl) echec('calme : im-calme absent de <html> après le clic');
    if (e.ls !== '1') echec(`calme : localStorage doc-calme = ${e.ls} (« 1 » attendu)`);
    if (e.cur || e.curOn) echec('calme : le curseur carré n\'est pas arrêté après le clic');
    if (await lettresTransformees()) echec('calme : des lettres bougent encore après le clic');
    await page.mouse.move(500, 250, { steps: 5 });
    await page.waitForTimeout(500);
    if (await page.locator('.im-curseur').count()) echec('calme : un curseur est créé après un mouvement de souris');
    if (await lettresTransformees()) echec('calme : le survol du titre transforme des lettres en version calme');
    if ((await page.evaluate(() => document.getAnimations().filter((a) => a.effect && a.effect.target && a.effect.target.classList && a.effect.target.classList.contains('im-vivant__l')).length)) !== 0) echec('calme : animation de lettres en cours');
    // Rechargement : mémorisé, décidé avant le corps de page.
    await page.reload({ waitUntil: 'load' });
    const r = await page.evaluate(() => ({ p: document.querySelector('[data-im-calme]').getAttribute('aria-pressed'), avant: sessionStorage.getItem('__clsAvantCorps'), cl: document.documentElement.classList.contains('im-calme') }));
    if (r.p !== 'true') echec(`calme : aria-pressed = ${r.p} après rechargement (true attendu)`);
    if (!r.cl || !(r.avant || '').includes('im-calme')) echec(`calme : im-calme n'est pas posé avant le corps de page (classe vue : « ${r.avant} »)`);
    await page.mouse.move(300, 300, { steps: 3 });
    await page.waitForTimeout(400);
    if (await page.locator('.im-curseur').count()) echec('calme : curseur après rechargement');
    // Autre page : toujours calme. Puis retour au mouvement.
    await page.goto(base + '/installation/', { waitUntil: 'load' });
    if ((await page.locator('[data-im-calme]').getAttribute('aria-pressed')) !== 'true') echec('calme : pas mémorisé sur une autre page');
    await page.locator('[data-im-calme]').click();
    await page.waitForTimeout(300);
    await page.mouse.move(200, 200, { steps: 3 });
    await page.mouse.move(260, 220, { steps: 3 });
    await page.waitForTimeout(500);
    const f = await page.evaluate(() => ({ ls: localStorage.getItem('doc-calme'), cl: document.documentElement.classList.contains('im-calme'), cur: document.querySelectorAll('.im-curseur').length }));
    if (f.ls !== null || f.cl) echec(`calme : sortie du calme incomplète (localStorage ${f.ls}, classe ${f.cl})`);
    if (!f.cur) echec('calme : le curseur ne revient pas à la sortie du calme');
    // Sans stockage utilisable : la bascule marche en mémoire (pas d'exception).
  } catch (e) { echec(`calme exception : ${e.message.split('\n')[0]}`); }
  for (const p of problems) echec(`calme : ${p}`);
  await o.close();
}

let base = '';
try {
  await withBench(async ({ server, launch }) => {
    base = server.url;
    const c = await launch('chromium');
    if (c.note) console.log(c.note);
    for (const t of THEMES) await naviguer(c.browser, 'chromium', t, 20, { reloadsEvery: 10 });
    await reduit(c.browser);
    await curseur(c.browser);
    await vivant(c.browser);
    await calme(c.browser);
    const w = await launch('webkit');
    await naviguer(w.browser, 'webkit', 'sombre', 20);
    await vivant(w.browser, 'webkit', ['/installation/', '/jetons/', '/composants/']);
  });
} catch (e) { echec(`exception : ${e.stack || e}`); }

for (const f of fails) console.log('ÉCHEC ' + f);
console.log(`immersif-socle : ${stats.nav} navigations Chromium (3 thèmes, ${stats.rechargements} rechargements en plus) et ${stats.navWebkit} WebKit ; pagereveal.viewTransition présent ${stats.vtPresent}, absent ${stats.vtAbsent}, sauté ${JSON.stringify(stats.vtSaute)} ; « im-piece » max ${stats.pieceMax} par page ; lettres transformées au survol ${stats.lettresTransformees ?? '?'} ; ${fails.length} échec(s), ${((Date.now() - t0) / 1000).toFixed(1)} s`);
process.exit(fails.length ? 1 : 0);
