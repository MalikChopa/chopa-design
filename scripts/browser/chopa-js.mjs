// chopa.js (J3a) : comportement du JavaScript facultatif, sur les pages de pièces construites (site/dist, CH_OUT compris).
//  A. JavaScript désactivé : panneaux d'onglets tous visibles, aucun bouton « Menu » visible et liens du menu visibles,
//     liens du sommaire présents, valeur du curseur absente (rien de périmé), popover natif lisible à 375 px (Chromium et WebKit).
//  B. init idempotent : un 2e et un 3e init n'ajoutent aucun écouteur ; une flèche droite déplace d'un seul onglet ;
//     init sur du HTML ajouté n'initialise que la nouvelle pièce.
//  C. erreur forcée dans un module (la source de chopa.js est réécrite en mémoire, jamais dans src/) : data-ch-failed
//     posé, panneaux visibles, liens du menu visibles.
//  D. chopa.js qui ne charge pas (requête abandonnée exprès, comptée) : `ch-js` retirée par le onerror, tout visible.
//  E. axe-core sur les états ouverts (menu déroulant ouvert, menu téléphone ouvert, 2e onglet actif) × 3 thèmes : 0 violation.
//  F. sommaire qui suit le défilement (page de test en mémoire), curseur qui affiche sa valeur, menu déroulant sans popover natif.
// Chromium obligatoire ; WebKit pour A à D si le moteur démarre (sinon dit pourquoi).
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { withBench, openPage, THEMES } from '../lib/browser.mjs';

const axeSrc = readFileSync(createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8');
const t0 = Date.now();
const fails = [];
let checks = 0, axeRuns = 0, abortsExpected = 0, abortsSeen = 0;
const check = (ok, msg) => { checks++; if (!ok) fails.push(msg); };

const P = { tabs: '/composants/tabs/', header: '/composants/header/', dropdown: '/composants/dropdown/', toc: '/composants/toc/', range: '/composants/range/' };

// Dans la page : un élément est-il visible ?
const VIS = `(el) => { const cs = getComputedStyle(el); return cs.display !== 'none' && cs.visibility !== 'hidden' && el.getClientRects().length > 0; }`;

async function newPage(browser, { js = true, width = 1280, height = 900, init, reducedMotion, abortOk = false } = {}) {
  const context = await browser.newContext({ viewport: { width, height }, javaScriptEnabled: js, reducedMotion: reducedMotion || 'no-preference' });
  if (init) await context.addInitScript(init);
  const page = await context.newPage();
  const problems = [];
  page.on('pageerror', (e) => problems.push(`erreur de page : ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error' && !(abortOk && /Failed to load resource/.test(m.text()))) problems.push(`console : ${m.text()}`); });
  page.on('requestfailed', (r) => { if (abortOk && /chopa\.js$/.test(r.url())) abortsSeen++; else problems.push(`requête en échec : ${r.url()}`); });
  page.on('response', (r) => { if (r.status() >= 400) problems.push(`réponse ${r.status()} : ${r.url()}`); });
  return { page, context, problems };
}
const done = async (tag, o) => { for (const p of o.problems) fails.push(`${tag} : ${p}`); checks++; await o.context.close().catch(() => {}); };

// ---------- A. JavaScript désactivé ----------
async function sansJs(browser, server, engine) {
  const tag = (s) => `[${engine}] sans JS ${s}`;
  let o = await newPage(browser, { js: false });
  await o.page.goto(server.url + P.tabs, { waitUntil: 'load' });
  let r = await o.page.evaluate(`(() => { const vis = ${VIS}; return [...document.querySelectorAll('.ch-tabs')].map((t) => ({
    panels: [...t.querySelectorAll('.ch-tabs__panel')].map(vis), headings: [...t.querySelectorAll('.ch-tabs__heading')].map(vis), list: vis(t.querySelector('.ch-tabs__list')),
    roles: t.querySelectorAll('[role]').length })); })()`);
  check(r.length >= 4, tag(`onglets : ${r.length} jeu(x) d'onglets trouvés (attendu ≥ 4 : 3 exemples + copies de thème)`));
  r.forEach((t, i) => {
    check(t.panels.length > 0 && t.panels.every(Boolean), tag(`onglets n°${i + 1} : tous les panneaux visibles (${t.panels.join(',')})`));
    check(t.headings.every(Boolean), tag(`onglets n°${i + 1} : chaque panneau garde son titre visible`));
    check(!t.list, tag(`onglets n°${i + 1} : la rangée de boutons (qui ne feraient rien) n'est pas visible`));
    check(t.roles === 0, tag(`onglets n°${i + 1} : aucun attribut role posé (aucun script n'a tourné)`));
  });
  await done(tag('onglets'), o);

  o = await newPage(browser, { js: false, width: 375, height: 800 });
  await o.page.goto(server.url + P.header, { waitUntil: 'load' });
  r = await o.page.evaluate(`(() => { const vis = ${VIS}; return [...document.querySelectorAll('[data-ch-menu]')].map((h) => ({
    toggle: vis(h.querySelector('.ch-header__toggle')), links: [...h.querySelectorAll('.ch-nav a')].map(vis) })); })()`);
  check(r.length >= 6, tag(`menu : ${r.length} en-têtes trouvés (attendu ≥ 6)`));
  r.forEach((h, i) => {
    check(!h.toggle, tag(`menu n°${i + 1} : le bouton « Menu » n'est pas visible`));
    check(h.links.length > 0 && h.links.every(Boolean), tag(`menu n°${i + 1} : tous les liens sont visibles (à 375 px)`));
  });
  await done(tag('menu'), o);

  o = await newPage(browser, { js: false });
  await o.page.goto(server.url + P.toc, { waitUntil: 'load' });
  r = await o.page.evaluate(`(() => { const vis = ${VIS}; return [...document.querySelectorAll('.ch-toc')].map((t) => ({ n: t.querySelectorAll('a[href^="#"]').length, vis: [...t.querySelectorAll('a')].every(vis),
    cibles: [...t.querySelectorAll('a[href^="#"]')].every((a) => document.getElementById(a.getAttribute('href').slice(1))) })); })()`);
  check(r.length >= 2, tag(`sommaire : ${r.length} sommaires trouvés`));
  r.forEach((t, i) => check(t.n >= 3 && t.vis && t.cibles, tag(`sommaire n°${i + 1} : ≥ 3 ancres visibles, chacune vers un id existant (${t.n})`)));
  await done(tag('sommaire'), o);

  o = await newPage(browser, { js: false });
  await o.page.goto(server.url + P.range, { waitUntil: 'load' });
  r = await o.page.evaluate(() => [...document.querySelectorAll('input[data-ch-range]')].map((i) => {
    const out = [...document.querySelectorAll('output')].find((x) => x.htmlFor.contains(i.id));
    return { id: i.id, text: out ? out.textContent.trim() : null };
  }));
  check(r.length >= 3, tag(`curseur : ${r.length} curseurs trouvés`));
  r.forEach((x) => check(x.text === '', tag(`curseur ${x.id} : aucune valeur affichée sans JS (« ${x.text} »)`)));
  await done(tag('curseur'), o);

  o = await newPage(browser, { js: false, width: 375, height: 700 });
  await o.page.goto(server.url + P.dropdown, { waitUntil: 'load' });
  await o.page.click('.doc-example__preview:not([data-ch-theme]) .ch-dropdown [popovertarget]');
  r = await o.page.evaluate(() => {
    const p = document.querySelector('.doc-example__preview:not([data-ch-theme]) .ch-dropdown__panel');
    const b = p.getBoundingClientRect();
    return { open: p.matches(':popover-open'), left: b.left, right: b.right, top: b.top, bottom: b.bottom, w: innerWidth, h: innerHeight };
  });
  check(r.open, tag('popover natif : s\'ouvre au clic, sans script'));
  check(r.left >= 0 && r.right <= r.w && r.top >= 0 && r.bottom <= r.h, tag(`popover natif à 375 px : dans la fenêtre (${Math.round(r.left)}..${Math.round(r.right)} × ${Math.round(r.top)}..${Math.round(r.bottom)})`));
  await done(tag('menu déroulant'), o);
}

// ---------- B. init idempotent ----------
const COUNT_LISTENERS = () => {
  window.__ael = []; // une entrée par addEventListener : la cible
  const o = EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener = function (t, f, x) { window.__ael.push(this); return o.call(this, t, f, x); };
};
async function idempotence(browser, server, engine) {
  const tag = (s) => `[${engine}] init ${s}`;
  const o = await newPage(browser, { init: COUNT_LISTENERS });
  await o.page.goto(server.url + P.tabs, { waitUntil: 'load' });
  await o.page.waitForFunction(() => window.chopa && document.querySelector('[data-ch-tabs] [role=tablist]'));
  const n0 = await o.page.evaluate(() => window.__ael.length);
  await o.page.evaluate(() => { chopa.init(); chopa.init(); chopa.init(document.body); chopa.init(document.querySelector('[data-ch-tabs]')); });
  const n1 = await o.page.evaluate(() => window.__ael.length);
  check(n1 === n0, tag(`idempotent : 4 appels de plus n'ajoutent aucun écouteur (${n0} avant, ${n1} après)`));
  const sel = '.doc-example__preview:not([data-ch-theme]) .ch-tabs';
  await o.page.focus(`${sel} .ch-tabs__tab[aria-selected=true]`);
  await o.page.keyboard.press('ArrowRight');
  const r = await o.page.evaluate((s) => { const t = document.querySelector(s); const all = [...t.querySelectorAll('.ch-tabs__tab')]; return { sel: all.map((x) => x.getAttribute('aria-selected')), focus: all.indexOf(document.activeElement) }; }, sel);
  check(r.sel.join() === 'false,true,false' && r.focus === 1, tag(`une flèche droite après 4 init déplace d'un seul onglet (aria-selected ${r.sel.join('/')}, focus sur ${r.focus})`));
  // HTML ajouté : seule la nouvelle pièce est initialisée.
  const before = await o.page.evaluate(() => window.__ael.length);
  const add = await o.page.evaluate(() => {
    const box = document.createElement('div'); box.id = 'ajout';
    box.innerHTML = '<div class="ch-tabs" data-ch-tabs><div class="ch-tabs__list"><button class="ch-tabs__tab" type="button">Un</button><button class="ch-tabs__tab" type="button">Deux</button></div><div class="ch-tabs__panel"><p>a</p></div><div class="ch-tabs__panel"><p>b</p></div></div>';
    document.body.appendChild(box);
    const jeuxAvant = [...document.querySelectorAll('[data-ch-tabs]')].filter((t) => !box.contains(t)).map((t) => t.querySelector('[role=tablist]') ? 1 : 0);
    const nonInitAvant = box.querySelector('[role=tablist]') === null;
    const n = window.__ael.length;
    chopa.init(box);
    const cibles = window.__ael.slice(n);
    return { nonInitAvant, init: box.querySelector('[role=tablist]') !== null, dehors: cibles.filter((c) => !(c instanceof Node) || !box.contains(c)).length, dedans: cibles.filter((c) => c instanceof Node && box.contains(c)).length,
      anciensInit: jeuxAvant.every(Boolean), roleTab: box.querySelectorAll('[role=tab]').length };
  });
  check(add.nonInitAvant && add.init && add.roleTab === 2, tag('HTML ajouté : la nouvelle pièce est câblée par chopa.init(racine) (et pas avant)'));
  check(add.dehors === 0 && add.dedans > 0, tag(`HTML ajouté : ${add.dedans} écouteur(s) dans la nouvelle pièce, ${add.dehors} ailleurs (attendu 0)`));
  check(add.anciensInit, tag('HTML ajouté : les pièces déjà présentes restent câblées'));
  void before;
  await done(tag('idempotence'), o);
}

// ---------- C. erreur forcée dans un module ----------
async function erreurForcee(browser, server, engine) {
  const tag = (s) => `[${engine}] erreur forcée ${s}`;
  const cas = [
    { mod: 'tabs', page: P.tabs, line: 'chopa.use("tabs", "[data-ch-tabs]", tabs);', repl: 'chopa.use("tabs", "[data-ch-tabs]", function (el) { tabs(el); throw new Error("erreur forcée par le test"); });' },
    { mod: 'menu', page: P.header, line: 'chopa.use("menu", "[data-ch-menu]", menu);', repl: 'chopa.use("menu", "[data-ch-menu]", function (el) { menu(el); throw new Error("erreur forcée par le test"); });' },
  ];
  for (const c of cas) {
    const o = await newPage(browser, { width: c.mod === 'menu' ? 375 : 1280, height: 800 });
    let replaced = false;
    await o.page.route('**/chopa/chopa.js', async (route) => {
      const resp = await route.fetch();
      const src = await resp.text();
      replaced = src.includes(c.line);
      await route.fulfill({ response: resp, body: src.replace(c.line, c.repl) });
    });
    await o.page.goto(server.url + c.page, { waitUntil: 'load' });
    await o.page.waitForFunction(() => window.chopa);
    await o.page.waitForTimeout(150);
    check(replaced, tag(`${c.mod} : ligne d'enregistrement du module trouvée dans chopa.js (réécriture en mémoire)`));
    if (c.mod === 'tabs') {
      const r = await o.page.evaluate(`(() => { const vis = ${VIS}; return [...document.querySelectorAll('[data-ch-tabs]')].map((t) => ({ failed: t.getAttribute('data-ch-failed'), panels: [...t.querySelectorAll('.ch-tabs__panel')].map(vis), list: vis(t.querySelector('.ch-tabs__list')), hiddenAttr: t.querySelectorAll('.ch-tabs__panel[hidden]').length })); })()`);
      check(r.length >= 4, tag(`tabs : ${r.length} jeux d'onglets`));
      r.forEach((t, i) => {
        check(t.failed === 'tabs', tag(`tabs n°${i + 1} : data-ch-failed="tabs" posé (« ${t.failed} »)`));
        check(t.panels.every(Boolean), tag(`tabs n°${i + 1} : tous les panneaux sont visibles (${t.hiddenAttr} avaient l'attribut hidden : le module les avait cachés avant l'erreur)`));
        check(!t.list, tag(`tabs n°${i + 1} : la rangée de boutons est masquée`));
      });
    } else {
      const r = await o.page.evaluate(`(() => { const vis = ${VIS}; return [...document.querySelectorAll('[data-ch-menu]')].map((h) => ({ failed: h.getAttribute('data-ch-failed'), toggle: vis(h.querySelector('.ch-header__toggle')), links: [...h.querySelectorAll('.ch-nav a')].map(vis) })); })()`);
      check(r.length >= 6, tag(`menu : ${r.length} en-têtes`));
      r.forEach((h, i) => {
        check(h.failed === 'menu', tag(`menu n°${i + 1} : data-ch-failed="menu" posé`));
        check(!h.toggle && h.links.every(Boolean), tag(`menu n°${i + 1} : liens visibles et bouton masqué à 375 px`));
      });
    }
    await done(tag(c.mod), o);
  }
}

// ---------- D. chopa.js ne charge pas ----------
async function chargementEchoue(browser, server, engine) {
  const tag = (s) => `[${engine}] chopa.js absent ${s}`;
  const o = await newPage(browser, { width: 375, height: 800, abortOk: true });
  abortsExpected += 2; // une page d'onglets, une page d'en-têtes
  await o.page.route('**/chopa/chopa.js', (route) => route.abort());
  await o.page.goto(server.url + P.tabs, { waitUntil: 'load' });
  await o.page.waitForTimeout(100);
  check(await o.page.evaluate(() => !document.documentElement.classList.contains('ch-js')), tag('onglets : la classe ch-js est retirée par le onerror'));
  check(await o.page.evaluate(() => typeof window.chopa === 'undefined'), tag('window.chopa n\'existe pas'));
  const r = await o.page.evaluate(`(() => { const vis = ${VIS}; return [...document.querySelectorAll('.ch-tabs')].map((t) => ({ panels: [...t.querySelectorAll('.ch-tabs__panel')].map(vis), list: vis(t.querySelector('.ch-tabs__list')) })); })()`);
  r.forEach((t, i) => check(t.panels.every(Boolean) && !t.list, tag(`onglets n°${i + 1} : tous les panneaux visibles, rangée de boutons masquée`)));
  await o.page.goto(server.url + P.header, { waitUntil: 'load' });
  await o.page.waitForTimeout(100);
  const h = await o.page.evaluate(`(() => { const vis = ${VIS}; return { cls: document.documentElement.classList.contains('ch-js'), menus: [...document.querySelectorAll('[data-ch-menu]')].map((m) => ({ toggle: vis(m.querySelector('.ch-header__toggle')), links: [...m.querySelectorAll('.ch-nav a')].every(vis) })) }; })()`);
  check(!h.cls && h.menus.every((m) => !m.toggle && m.links), tag('menu à 375 px : ch-js retirée, liens visibles, bouton masqué'));
  await done(tag('chargement'), o);
}

// ---------- E. axe sur les états ouverts ----------
async function axeOuvert(browser, server) {
  const run = async (label, theme, route, width, setup) => {
    const o = await openPage(browser, server.url + route, { width, height: 900, theme });
    try {
      await o.page.waitForFunction(() => window.chopa && document.querySelector('[data-ch-tabs] [role=tablist]') !== undefined);
      await setup(o.page);
      await o.page.evaluate(() => document.getAnimations().forEach((a) => a.finish()));
      await o.page.evaluate(axeSrc);
      const r = await o.page.evaluate(() => axe.run(document));
      axeRuns++;
      for (const v of r.violations) for (const n of v.nodes) fails.push(`axe ${label} [${theme}] ${v.id} (${v.impact}) : ${n.target.join(' ')}`);
      for (const p of o.problems) fails.push(`axe ${label} [${theme}] ${p}`);
      checks++;
    } finally { await o.close(); }
  };
  for (const theme of THEMES) {
    await run('menu déroulant ouvert', theme, P.dropdown, 1280, async (page) => {
      const btn = '.doc-example__preview:not([data-ch-theme]) .ch-dropdown [popovertarget]';
      await page.click(btn);
      await page.waitForFunction(() => document.querySelector('.ch-dropdown__panel:popover-open') && document.querySelector('[popovertarget][aria-expanded=true]') && document.querySelector('.ch-dropdown__panel:popover-open').contains(document.activeElement));
      const r = await page.evaluate(() => {
        const p = document.querySelector('.ch-dropdown__panel:popover-open'), b = document.querySelector('[aria-expanded=true][popovertarget]').getBoundingClientRect(), pr = p.getBoundingClientRect();
        return { role: p.getAttribute('role'), items: [...p.querySelectorAll('[role=menuitem]')].length, focusOk: p.contains(document.activeElement), under: Math.abs(pr.top - (b.bottom + 4)) < 2 && Math.abs(pr.left - b.left) < 2, expanded: document.querySelector('[popovertarget][aria-haspopup]').getAttribute('aria-expanded') };
      });
      check(r.role === 'menu' && r.items === 3 && r.focusOk && r.under && r.expanded === 'true', `menu déroulant ouvert [${theme}] : role=menu, 3 menuitem, focus dans le menu, panneau sous le bouton (${JSON.stringify(r)})`);
    });
    await run('menu téléphone ouvert', theme, P.header, 375, async (page) => {
      const t = '.doc-example__preview:not([data-ch-theme]) .ch-header__toggle';
      await page.click(t);
      const r = await page.evaluate((s) => { const b = document.querySelector(s); const nav = document.getElementById(b.getAttribute('aria-controls')); return { exp: b.getAttribute('aria-expanded'), vis: nav.getClientRects().length > 0, h: Math.round(nav.querySelector('a').getBoundingClientRect().height) }; }, t);
      check(r.exp === 'true' && r.vis && r.h >= 44, `menu téléphone ouvert [${theme}] : aria-expanded=true, liens visibles, 44 px au moins (${JSON.stringify(r)})`);
    });
    await run('2e onglet actif', theme, P.tabs, 1280, async (page) => {
      const s = '.doc-example__preview:not([data-ch-theme]) .ch-tabs';
      await page.click(`${s} .ch-tabs__tab:nth-child(2)`);
      const r = await page.evaluate((s) => { const t = document.querySelector(s); return { sel: [...t.querySelectorAll('.ch-tabs__tab')].map((x) => x.getAttribute('aria-selected')).join(), vis: [...t.querySelectorAll('.ch-tabs__panel')].map((p) => p.hidden).join() }; }, s);
      check(r.sel === 'false,true,false' && r.vis === 'true,false,true', `2e onglet actif [${theme}] : seul l'onglet 2 sélectionné, seul le panneau 2 visible (${JSON.stringify(r)})`);
    });
  }
}

// ---------- F. sommaire, curseur, repli sans popover ----------
async function divers(browser, server) {
  const tall = '<!doctype html><html lang="fr" data-ch-theme="sombre"><head><meta charset="utf-8"><title>sommaire</title><link rel="stylesheet" href="/chopa/chopa.css"><script src="/chopa/chopa.js" defer></script></head><body>'
    + '<nav class="ch-toc" aria-label="Sommaire" data-ch-toc style="position:fixed;top:0;right:0"><ol class="ch-toc__list"><li><a class="ch-toc__link" href="#s1">Un</a></li><li><a class="ch-toc__link" href="#s2">Deux</a></li><li><a class="ch-toc__link" href="#s3">Trois</a></li></ol></nav>'
    + '<main><h2 id="s1">Un</h2><div style="height:1500px"></div><h2 id="s2">Deux</h2><div style="height:1500px"></div><h2 id="s3">Trois</h2><div style="height:1500px"></div></main></body></html>';
  server.virtual['/zz/toc.html'] = tall;
  let o = await newPage(browser, { width: 1280, height: 800 });
  await o.page.goto(server.url + '/zz/toc.html', { waitUntil: 'load' });
  const cur = () => o.page.evaluate(() => [...document.querySelectorAll('.ch-toc__link')].map((a, i) => a.getAttribute('aria-current') === 'true' ? i + 1 : 0).filter(Boolean).join());
  check(await cur() === '1', 'sommaire : au départ, le 1er lien est marqué (aria-current="true")');
  for (const [id, n] of [['s2', '2'], ['s3', '3'], ['s1', '1']]) {
    await o.page.evaluate((id) => window.scrollTo(0, document.getElementById(id).offsetTop - 2), id);
    await o.page.waitForFunction((n) => [...document.querySelectorAll('.ch-toc__link')].map((a, i) => a.getAttribute('aria-current') === 'true' ? i + 1 : 0).filter(Boolean).join() === n, n, { timeout: 2000 }).catch(() => {});
    check(await cur() === n, `sommaire : au défilement vers #${id}, seul le lien ${n} est marqué (trouvé « ${await cur()} »)`);
  }
  await o.page.evaluate(() => window.scrollTo(0, document.getElementById('s3').offsetTop + 200));
  await o.page.evaluate(() => window.scrollTo(0, 0));
  await o.page.waitForTimeout(300);
  check(await cur() === '1', 'sommaire : saut brusque de #s3 en haut de page : le lien 1 est marqué');
  await done('sommaire défilant', o);

  o = await newPage(browser, { width: 1280, height: 900 });
  await o.page.goto(server.url + P.range, { waitUntil: 'load' });
  await o.page.waitForFunction(() => window.chopa && [...document.querySelectorAll('output.ch-range__value')].some((x) => x.textContent));
  const r = await o.page.evaluate(() => [...document.querySelectorAll('input[data-ch-range]')].map((i) => ({ id: i.id, dis: i.disabled, v: i.value, text: [...document.querySelectorAll('output')].find((x) => x.htmlFor.contains(i.id)).textContent })));
  r.forEach((x) => check(x.text === (x.id.includes('zoom') ? `${x.v} sur 5` : x.v), `curseur ${x.id} : la valeur courante est affichée au chargement (« ${x.text} »)`));
  await o.page.focus('#ex-range-zoom');
  await o.page.keyboard.press('ArrowRight');
  const z = await o.page.evaluate(() => ({ t: document.querySelector('output[for=ex-range-zoom]').textContent, a: document.getElementById('ex-range-zoom').getAttribute('aria-valuetext') }));
  check(z.t === '4 sur 5' && z.a === '4 sur 5', `curseur : après une flèche droite, « 4 sur 5 » affiché et lu (« ${z.t} » / « ${z.a} »)`);
  await done('curseur', o);

  // Sans popover natif : le module bascule en repli par hidden. Le test retire l'attribut popover des panneaux (une page
  // construite pour un navigateur sans popover n'en a pas la feuille de style) et la propriété du prototype.
  o = await newPage(browser, { width: 1280, height: 900, init: () => { delete HTMLElement.prototype.popover; } });
  await o.page.route('**/composants/dropdown/', async (route) => {
    const resp = await route.fetch();
    const html = (await resp.text()).replace(/(<div class="ch-dropdown__panel"[^>]*?) popover(?=[\s>])/g, '$1');
    await route.fulfill({ response: resp, body: html });
  });
  await o.page.goto(server.url + P.dropdown, { waitUntil: 'load' });
  await o.page.waitForFunction(() => window.chopa && document.querySelector('[data-ch-fallback]'));
  const s = '.doc-example__preview:not([data-ch-theme]) .ch-dropdown';
  const st = () => o.page.evaluate((s) => { const p = document.querySelector(s + ' .ch-dropdown__panel'); return { hidden: p.hidden, shown: p.getClientRects().length > 0, exp: document.querySelector(s + ' [popovertarget]').getAttribute('aria-expanded'), inPanel: p.contains(document.activeElement) }; }, s);
  let x = await st();
  check(x.hidden && !x.shown && x.exp === 'false', 'sans popover : le panneau est caché (hidden) au départ');
  await o.page.click(`${s} [popovertarget]`);
  x = await st();
  check(!x.hidden && x.shown && x.exp === 'true' && x.inPanel, `sans popover : un clic ouvre le panneau (hidden retiré), focus dans le menu (${JSON.stringify(x)})`);
  await o.page.keyboard.press('Escape');
  x = await st();
  const back = await o.page.evaluate((s) => document.activeElement === document.querySelector(s + ' [popovertarget]'), s);
  check(x.hidden && !x.shown && x.exp === 'false' && back, `sans popover : Échap ferme et rend le focus au bouton (${JSON.stringify(x)})`);
  await o.page.click(`${s} [popovertarget]`);
  await o.page.mouse.click(5, 5);
  x = await st();
  check(x.hidden, 'sans popover : un clic en dehors ferme le panneau');
  await done('repli sans popover', o);
}

try {
  await withBench(async ({ server, launch }) => {
    const c = await launch('chromium');
    if (c.note) console.log(c.note);
    let w = null;
    try { w = await launch('webkit'); } catch (e) { console.log(`chopa-js : WebKit non lancé (${String(e.message).split('\n')[0]}) : A à D en Chromium seulement`); }
    for (const [engine, b] of [['chromium', c.browser], ...(w ? [['webkit', w.browser]] : [])]) {
      await sansJs(b, server, engine);
      await idempotence(b, server, engine);
      await erreurForcee(b, server, engine);
      await chargementEchoue(b, server, engine);
    }
    await axeOuvert(c.browser, server);
    await divers(c.browser, server);
    check(abortsSeen === abortsExpected, `requêtes chopa.js abandonnées exprès : ${abortsSeen} vues pour ${abortsExpected} attendues`);
  });
} catch (e) { fails.push(`exception : ${e.stack || e}`); }
for (const f of fails) console.log('ÉCHEC ' + f);
console.log(`chopa-js : ${checks} vérification(s), dont ${axeRuns} analyse(s) axe sur états ouverts (0 violation exigée), ${fails.length} échec(s), ${((Date.now() - t0) / 1000).toFixed(1)} s`);
process.exit(fails.length ? 1 : 0);
