// Retours (J5b) : notification (module toast), alerte, progression, squelette, indicateur, sur les pages construites (site/dist), Chromium, 3 thèmes.
//  A. toast : la région vivante du noyau existe avant le premier message (role=status, vide) et reçoit le texte d'une information ;
//     une erreur porte role="alert" et n'est pas écrite dans la région (pas de double annonce) ; le focus ne bouge pas à l'affichage ;
//     délai court : le toast reste survolé, reste tant que le focus est dedans, part après ; un toast à action ne se ferme pas seul ;
//     croix au clavier (Entrée) et Échap ferment et rendent le focus ; plusieurs toasts tiennent dans 375 px ; axe avec 3 toasts : 0 violation.
//  B. alertes (et toasts fixes) de toutes les pages : un glyphe du sprite et le mot attendu, en plus de la couleur.
//  C. indicateur, squelette, progression : border-radius calculé 0, aussi avec --ch-radius: 8px.
//  D. mouvement : sans préférence, animations présentes ; avec reduce, 0 animation sur indicateur, squelette, progression indéterminée.
// CH_RET_MUTATION (en mémoire, rien dans src/ ni site/dist/) : hover (survol sans effet), mot (mot retiré des alertes), rayon (indicateur en var(--ch-radius)).
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { withBench, THEMES, listPages } from '../lib/browser.mjs';

const axeSrc = readFileSync(createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8');
const t0 = Date.now();
const fails = [];
const st = { checks: 0, toasts: 0, alerts: 0, axe: 0 };
const check = (ok, msg) => { st.checks++; if (!ok) fails.push(msg); };
const MUT = process.env.CH_RET_MUTATION || '';
let mutated = 0;
const JS_MUT = { hover: [['t.onmouseenter = function () { hov = 1; arm(); };', 't.onmouseenter = function () {};']] };

async function newPage(browser, { theme = 'sombre', width = 1280, reducedMotion = 'no-preference' } = {}) {
  const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion });
  await context.addInitScript((t) => { try { localStorage.setItem('ch-theme', t); } catch (_) {} }, theme);
  const page = await context.newPage();
  const problems = [];
  page.on('pageerror', (e) => problems.push(`erreur de page : ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') problems.push(`console : ${m.text()}`); });
  if (MUT === 'hover') await page.route('**/chopa/chopa.js', async (route) => {
    const resp = await route.fetch(); let src = await resp.text();
    for (const [a, b] of JS_MUT.hover) if (src.includes(a)) { src = src.replace(a, b); mutated++; }
    await route.fulfill({ response: resp, body: src });
  });
  if (MUT === 'mot') await page.route('**/composants/**', async (route) => {
    const resp = await route.fetch(); const ct = resp.headers()['content-type'] || '';
    if (!ct.includes('html')) return route.fulfill({ response: resp });
    let src = await resp.text();
    const n = src.length; src = src.replace(/<b class="ch-alert__kind">[^<]*<\/b>/g, ''); if (src.length !== n) mutated++;
    await route.fulfill({ response: resp, body: src });
  });
  if (MUT === 'rayon') await page.route('**/chopa/chopa.css', async (route) => {
    const resp = await route.fetch(); let src = await resp.text();
    const a = 'border-radius: 0; animation: ch-spin'; if (src.includes(a)) { src = src.replace(a, 'border-radius: var(--ch-radius); animation: ch-spin'); mutated++; }
    await route.fulfill({ response: resp, body: src });
  });
  return { page, context, problems };
}
const finish = async (tag, o) => { for (const p of o.problems) fails.push(`${tag} : ${p}`); st.checks++; await o.context.close().catch(() => {}); };
async function go(o, server, route) {
  await o.page.goto(server.url + route, { waitUntil: 'load' });
  await o.page.evaluate(() => document.fonts.ready);
  await o.page.waitForFunction(() => window.chopa && document.documentElement.classList.contains('ch-js'));
  await o.page.waitForTimeout(80);
}
const frames = (page, n = 8) => page.evaluate(async (k) => { for (let i = 0; i < k; i++) await new Promise((r) => requestAnimationFrame(r)); }, n);
const count = (page) => page.evaluate(() => document.querySelectorAll('.ch-toast-stack .ch-toast').length);
const clearAll = (page) => page.evaluate(() => document.querySelectorAll('.ch-toast-stack').forEach((s) => s.remove()));
const live = (page) => page.evaluate(() => { const r = document.querySelector('[data-ch-live]'); return r ? { role: r.getAttribute('role'), live: r.getAttribute('aria-live'), text: r.textContent } : null; });

async function toasts(browser, server, theme) {
  const o = await newPage(browser, { theme });
  const { page } = o;
  await go(o, server, '/composants/toast/');
  const tag = (s) => `toast [${theme}] ${s}`;
  // région vivante présente avant le premier message
  const r0 = await live(page);
  check(r0 && r0.role === 'status' && r0.live === 'polite' && r0.text === '', tag(`région vivante persistante avant tout message (${JSON.stringify(r0)})`));
  check(await count(page) === 0, tag('aucune notification avant le premier clic'));
  const trig = '.doc-example__preview:not([data-ch-theme]) [data-ch-toast]';
  const trigs = await page.$$(trig);
  check(trigs.length === 4, tag(`4 déclencheurs dans l'exemple principal (${trigs.length})`));
  // information, au clavier : le focus reste sur le déclencheur
  st.toasts++;
  await trigs[0].focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(250);
  let info = await page.evaluate(() => { const t = document.querySelector('.ch-toast-stack .ch-toast'); return t && { cls: t.className, role: t.getAttribute('role'), text: t.textContent }; });
  check(info && /ch-toast--info/.test(info.cls) && info.role === null, tag(`information : toast info, sans role propre (${JSON.stringify(info)})`));
  check(info && info.text.includes('Info') && info.text.includes('Partie sauvegardée'), tag('information : mot « Info » et texte présents'));
  const r1 = await live(page);
  check(r1 && r1.text === 'Partie sauvegardée au point de contrôle 4.', tag(`information : la région du noyau reçoit le texte (${JSON.stringify(r1 && r1.text)})`));
  check(await page.evaluate((i) => document.activeElement === document.querySelectorAll('[data-ch-toast]')[i], 0) || await page.evaluate(() => document.activeElement.hasAttribute('data-ch-toast')), tag('le focus n\'a pas bougé à l\'affichage'));
  await clearAll(page);
  // erreur : role=alert, pas écrite dans la région
  await page.evaluate(() => { document.querySelector('[data-ch-live]').textContent = ''; });
  await trigs[2].click();
  await page.waitForTimeout(250);
  const err = await page.evaluate(() => { const t = document.querySelector('.ch-toast-stack .ch-toast'); return t && { cls: t.className, role: t.getAttribute('role'), text: t.textContent }; });
  check(err && /ch-toast--error/.test(err.cls) && err.role === 'alert' && err.text.includes('Erreur'), tag(`erreur : role="alert" et mot « Erreur » (${JSON.stringify(err)})`));
  check((await live(page)).text === '', tag('erreur : non écrite dans la région du noyau (pas de double annonce)'));
  // l'erreur reste (pas de délai par défaut)
  await page.waitForTimeout(700);
  check(await count(page) === 1, tag('erreur : reste affichée sans délai'));
  await clearAll(page);
  // thème de la copie : le toast d'un déclencheur de copie reprend le thème de la copie
  const copie = await page.$('.doc-example__preview[data-ch-theme="clair"] [data-ch-toast]');
  if (copie) { await copie.click(); await page.waitForTimeout(150);
    check(await page.evaluate(() => document.querySelector('.ch-toast-stack .ch-toast').getAttribute('data-ch-theme')) === 'clair', tag('toast d\'une copie : thème de la copie repris')); }
  await clearAll(page);
  // délai court : survol
  st.toasts++;
  await page.evaluate(() => { window.__t = chopa.toast('Niveau chargé', { delai: 700 }); });
  await page.waitForTimeout(150);
  const box = await page.evaluate(() => { const r = window.__t.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
  await page.mouse.move(box.x, box.y);
  await page.waitForTimeout(1600);
  check(await count(page) === 1, tag('délai 700 ms : le toast reste pendant le survol (1,6 s)'));
  await page.mouse.move(5, 5);
  await page.waitForTimeout(1800);
  check(await count(page) === 0, tag('délai 700 ms : le toast part après la sortie du pointeur'));
  // focus dedans
  await page.evaluate(() => { window.__t = chopa.toast('Carte enregistrée', { delai: 700 }); window.__t.querySelector('.ch-toast__close').focus(); });
  await page.waitForTimeout(1600);
  check(await count(page) === 1, tag('délai 700 ms : le toast reste tant que le focus est dedans (1,6 s)'));
  await page.evaluate(() => document.activeElement.blur());
  await page.waitForTimeout(1800);
  check(await count(page) === 0, tag('délai 700 ms : le toast part après la sortie du focus'));
  // à action : jamais seul
  await page.evaluate(() => { chopa.toast('Brouillon supprimé', { delai: 300, action: { texte: 'Annuler', fn() { window.__fait = 1; } } }); });
  await page.waitForTimeout(1500);
  check(await count(page) === 1, tag('toast à action : ne se ferme pas seul (delai 300, 1,5 s)'));
  await page.click('.ch-toast-stack .ch-toast__action');
  check(await count(page) === 0 && await page.evaluate(() => window.__fait === 1), tag('toast à action : le bouton appelle fn puis ferme'));
  // clavier : croix et Échap rendent le focus
  for (const [nom, key] of [['croix (Entrée)', 'Enter'], ['Échap', 'Escape']]) {
    st.toasts++;
    await trigs[3].focus();
    await page.keyboard.press('Enter'); // déclencheur 4 : à action
    await page.waitForTimeout(200);
    // la pile est en fin de page : depuis le dernier élément focalisable de la page, Tab atteint l'action puis la croix
    await page.evaluate(() => { const l = [...document.querySelectorAll('a[href],button:not([disabled]),input,select,textarea,summary,[tabindex]:not([tabindex="-1"])')].filter((e) => !e.closest('.ch-toast-stack') && e.getClientRects().length); window.__prev = l[l.length - 1]; window.__prev.focus(); });
    await page.keyboard.press('Tab');
    check(await page.evaluate(() => document.activeElement.matches('.ch-toast-stack .ch-toast__action')), tag(`${nom} : le bouton d'action est atteint au clavier`));
    await page.keyboard.press('Tab');
    check(await page.evaluate(() => document.activeElement.matches('.ch-toast-stack .ch-toast__close')), tag(`${nom} : la croix est atteinte au clavier`));
    await page.keyboard.press(key);
    await page.waitForTimeout(150);
    check(await count(page) === 0, tag(`${nom} : ferme le toast`));
    check(await page.evaluate(() => document.activeElement === window.__prev), tag(`${nom} : focus rendu à l'élément qui l'avait avant la croix`));
    await clearAll(page);
  }
  // axe avec 3 toasts
  await page.evaluate(() => { chopa.toast('Partie sauvegardée', {}); chopa.toast('Batterie faible', { type: 'warn' }); chopa.toast('Envoi impossible', { type: 'error', action: { texte: 'Réessayer' } }); });
  await page.waitForTimeout(400);
  await page.evaluate(() => document.getAnimations().forEach((a) => a.finish()));
  await page.evaluate(axeSrc);
  const res = await page.evaluate(() => axe.run(document, { resultTypes: ['violations'] }).then((r) => r.violations.map((v) => `${v.id} (${v.nodes.length}) ${v.nodes[0].target.join(' ')}`)));
  st.axe++;
  check(res.length === 0, tag(`axe avec 3 toasts : ${res.join(' ; ')}`));
  await finish(`toast ${theme}`, o);
}

async function etroit(browser, server, theme) {
  const o = await newPage(browser, { theme, width: 375 });
  await go(o, server, '/composants/toast/');
  await o.page.evaluate(() => { chopa.toast('Partie sauvegardée au point de contrôle 4, bravo', { delai: 0 }); chopa.toast('Batterie faible : il reste environ 10 % de charge', { type: 'warn', delai: 0 }); chopa.toast('Envoi impossible : la photo dépasse 20 Mo', { type: 'error', action: { texte: 'Réessayer' } }); });
  await o.page.waitForTimeout(400);
  await o.page.evaluate(() => document.getAnimations().forEach((a) => a.finish()));
  const r = await o.page.evaluate(() => [...document.querySelectorAll('.ch-toast-stack .ch-toast')].map((t) => { const b = t.getBoundingClientRect(); return { l: b.left, r: b.right, t: b.top, b: b.bottom, w: innerWidth, h: innerHeight, sw: t.scrollWidth, cw: t.clientWidth }; }));
  check(r.length === 3 && r.every((b) => b.l >= 0 && b.r <= b.w && b.t >= 0 && b.b <= b.h && b.sw <= b.cw + 1), `toast 375 px [${theme}] : 3 toasts dans la fenêtre (${JSON.stringify(r)})`);
  await finish(`toast 375 ${theme}`, o);
}

async function alertes(browser, server, theme, pages) {
  const o = await newPage(browser, { theme });
  for (const route of pages) {
    await o.page.goto(server.url + route, { waitUntil: 'load' });
    const list = await o.page.evaluate(() => [...document.querySelectorAll('.ch-alert, .ch-toast')].map((a) => {
      const m = /ch-(?:alert|toast)--(info|warn|error)/.exec(a.className);
      const kind = a.querySelector('.ch-alert__kind, .ch-toast__kind');
      const use = a.querySelector('svg use');
      return { v: m && m[1], word: kind ? kind.textContent.trim() : '', href: use ? use.getAttribute('href') : '', vis: !!kind && getComputedStyle(kind).display !== 'none' && kind.getClientRects().length > 0 };
    }));
    for (const a of list) {
      st.alerts++;
      const attendu = { info: 'Info', warn: 'Attention', error: 'Erreur' }[a.v];
      check(a.word === attendu && a.vis, `${route} [${theme}] : alerte ${a.v} : mot visible « ${attendu} » (trouvé « ${a.word} »)`);
      check(/#ch-i-(info|alert)$/.test(a.href), `${route} [${theme}] : alerte ${a.v} : glyphe du sprite (${a.href || 'aucun'})`);
    }
    if (route === '/composants/alert/') check(list.length >= 4, `${route} : alertes lues (${list.length})`);
  }
  await finish(`alertes ${theme}`, o);
}

async function formes(browser, server, theme) {
  const o = await newPage(browser, { theme });
  for (const [route, sel] of [['/composants/spinner/', '.ch-spinner'], ['/composants/skeleton/', '.ch-skeleton'], ['/composants/progress/', '.ch-progress']]) {
    for (const fixture of [false, true]) {
      await go(o, server, route);
      if (fixture) await o.page.addStyleTag({ content: ':root{--ch-radius:8px}' });
      const r = await o.page.evaluate((s) => ({ n: document.querySelectorAll(s).length, bad: [...document.querySelectorAll(s)].filter((e) => { const c = getComputedStyle(e); return [c.borderTopLeftRadius, c.borderTopRightRadius, c.borderBottomLeftRadius, c.borderBottomRightRadius].some((v) => v !== '0px'); }).length, rad: getComputedStyle(document.documentElement).getPropertyValue('--ch-radius').trim() }), sel);
      check(r.n >= 4 && r.bad === 0, `${route} [${theme}${fixture ? ', --ch-radius: 8px' : ''}] : ${r.n} élément(s) ${sel}, ${r.bad} avec un rayon ≠ 0`);
      if (fixture) check(r.rad === '8px', `${route} : le réglage de test est bien appliqué (--ch-radius ${r.rad})`);
    }
  }
  await finish(`formes ${theme}`, o);
}

async function mouvement(browser, server) {
  for (const rm of ['no-preference', 'reduce']) {
    const o = await newPage(browser, { reducedMotion: rm });
    for (const [route, sel] of [['/composants/spinner/', '.ch-spinner'], ['/composants/skeleton/', '.ch-skeleton'], ['/composants/progress/', '.ch-progress:indeterminate']]) {
      await go(o, server, route);
      await frames(o.page, 8);
      const r = await o.page.evaluate((s) => { const l = [...document.querySelectorAll(s)]; return { n: l.length, anim: l.filter((e) => e.getAnimations().length > 0).length, ranim: l.reduce((a, e) => a + e.getAnimations().length, 0) }; }, sel);
      if (rm === 'reduce') check(r.n >= 1 && r.ranim === 0, `${route} reduce : ${r.n} ${sel}, ${r.ranim} animation(s) (attendu 0)`);
      else check(r.n >= 1 && r.anim === r.n, `${route} sans préférence : ${r.anim}/${r.n} ${sel} animé(s) (attendu tous)`);
    }
    await finish(`mouvement ${rm}`, o);
  }
}

try {
  const pagesAlertes = listPages().filter((p) => /ch-(alert|toast)--/.test(readFileSync(p.file, 'utf8'))).map((p) => p.route);
  check(pagesAlertes.includes('/composants/alert/') && pagesAlertes.includes('/composants/toast/'), `pages avec alertes : ${pagesAlertes.join(', ')}`);
  await withBench(async ({ server, launch }) => {
    const { browser } = await launch('chromium');
    for (const theme of THEMES) { await toasts(browser, server, theme); await etroit(browser, server, theme); await alertes(browser, server, theme, pagesAlertes); await formes(browser, server, theme); }
    await mouvement(browser, server);
  });
} catch (e) { fails.push(`exception : ${e.stack || e}`); }
if (MUT && !mutated) fails.push(`mutation « ${MUT} » : aucune réécriture appliquée`);
for (const f of fails) console.log('ÉCHEC ' + f);
console.log(`retours : ${st.toasts} scénario(s) de toast, ${st.alerts} alerte(s)/toast fixe(s) lue(s), axe ${st.axe} analyse(s), ${st.checks} vérification(s), ${fails.length} échec(s), ${((Date.now() - t0) / 1000).toFixed(1)} s`);
process.exit(fails.length ? 1 : 0);
