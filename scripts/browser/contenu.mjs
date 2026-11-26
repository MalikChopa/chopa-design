// Contenu et médias, 1re partie (J4a) : ce que `keyboard` et `parity` ne mesurent pas, sur les pages de pièces construites
// (site/dist, CH_OUT compris), Chromium, 3 thèmes (sauf JavaScript désactivé : la page ne peut alors pas lire le thème, sombre).
//  A. Tri (module sort, page /composants/table/) : un seul <button> dans chaque <th> de thead ; aucun aria-sort au départ ; après chaque action
//     (souris, Entrée, Espace) exactement un [aria-sort], sur la colonne cliquée, croissant puis décroissant ; ordre vérifié ligne par ligne contre un
//     tri stable recalculé par le test (colonnes ch-table__num : numérique, espaces, insécables, virgule, data-ch-value ; autres : texte) ; les ex æquo
//     gardent leur ordre ; valeurs de contrôle « 1 905 », « 3 210 », « 12 480 » (le tri de texte les mettrait dans un autre ordre).
//  B. JavaScript désactivé : aucun bouton de tri ni aria-sort, tableaux lisibles ; aucun bouton « Copier » (ni barre), code lisible.
//  C. Copie (module copy, page /composants/code/) : le presse-papiers contient EXACTEMENT le textContent du <code> (permissions accordées) ;
//     message dans la région aria-live (chopa.live()) ; état « Copié » sur le bouton, puis retour à « Copier » ; presse-papiers refusé, puis absent :
//     le code est sélectionné (la sélection = le textContent), état « manual » et message qui dit comment copier ; pas de débordement de la page à 375 px.
//  D. Carte-lien (page /composants/card/) : un seul élément focalisable par carte --link, c'est son lien ; boîte de la carte ≥ 44 px ;
//     9 points de la carte (elementFromPoint) renvoient le lien ; un clic dans un coin suit le lien.
//  E. Puces (page /composants/chip/) : 32 px visibles ; ::before : contenu vide, position absolute, largeur et hauteur ≥ 44 px ; 3 px au-dessus et
//     au-dessous de la puce, elementFromPoint renvoie la puce.
//  F. Avatar (page /composants/avatar/) : rayon de coin calculé 0 sur chaque avatar, ses descendants, ::before et ::after ; puis avec une feuille qui
//     règle --ch-radius à 8px (le test vérifie que carte, bouton et puce l'ont bien, donc que la feuille agit) : l'avatar reste à 0 ; il est carré.
// Une ligne de résumé ; le détail des échecs est affiché avant.
import { withBench, THEMES } from '../lib/browser.mjs';

const t0 = Date.now();
const fails = [];
let checks = 0, tables = 0, sorts = 0, copies = 0, refusals = 0, cards = 0, chips = 0, avatars = 0;
const check = (ok, msg) => { checks++; if (!ok) fails.push(msg); };
const P = { table: '/composants/table/', code: '/composants/code/', card: '/composants/card/', chip: '/composants/chip/', avatar: '/composants/avatar/' };
const stop = (page) => page.evaluate(() => document.getAnimations().forEach((a) => a.finish()));

async function newPage(browser, server, { theme = 'sombre', js = true, width = 1280, height = 900, permissions, init } = {}) {
  const context = await browser.newContext({ viewport: { width, height }, javaScriptEnabled: js, reducedMotion: 'no-preference' });
  if (permissions) await context.grantPermissions(permissions, { origin: server.url });
  await context.addInitScript((t) => { try { localStorage.setItem('ch-theme', t); } catch (_) {} }, theme);
  if (init) await context.addInitScript(init);
  const page = await context.newPage();
  const problems = [];
  page.on('pageerror', (e) => problems.push(`erreur de page : ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') problems.push(`console : ${m.text()}`); });
  page.on('requestfailed', (r) => problems.push(`requête en échec : ${r.url()}`));
  page.on('response', (r) => { if (r.status() >= 400) problems.push(`réponse ${r.status()} : ${r.url()}`); });
  return { page, context, problems };
}
async function open(o, server, route) {
  await o.page.goto(server.url + route, { waitUntil: 'load' });
  await o.page.evaluate(() => document.fonts.ready);
  await o.page.evaluate(() => new Promise((r) => setTimeout(r, 50))); // le module s'initialise après le chargement
}
const done = async (tag, o) => { for (const p of o.problems) fails.push(`${tag} : ${p}`); checks++; await o.context.close().catch(() => {}); };

// ---------- A. tri ----------
const parseNum = (s) => { const m = String(s).replace(/[\s  ]/g, '').replace(',', '.').replace('−', '-').match(/[-+]?\d+(\.\d+)?/); return m ? Number(m[0]) : NaN; };
// Tri stable recalculé par le test, indépendant du module : les lignes (dans l'ordre affiché AVANT l'action) sont triées ; les ex æquo gardent leur ordre d'avant.
function attendu(rows, numeric, dir) {
  const v = rows.map((r, idx) => ({ o: r.o, idx, v: numeric ? parseNum(r.dv ?? r.text) : String(r.dv ?? r.text).trim() }));
  v.sort((a, b) => {
    let c;
    if (numeric) { const na = Number.isNaN(a.v), nb = Number.isNaN(b.v); c = na || nb ? (na ? (nb ? 0 : 1) : -1) * dir : (a.v - b.v) * dir; }
    else c = a.v.localeCompare(b.v, 'fr', { numeric: true, sensitivity: 'base' }) * dir;
    return c || a.idx - b.idx;
  });
  return v.map((x) => x.o);
}
const LIRE = ({ ti, c }) => {
  const t = document.querySelectorAll('table[data-ch-sort]')[ti];
  return [...t.tBodies[0].rows].map((r) => ({ o: Number(r.dataset.o), text: r.cells[c].textContent, dv: r.cells[c].getAttribute('data-ch-value') }));
};
const ETAT = (ti) => {
  const t = document.querySelectorAll('table[data-ch-sort]')[ti];
  const ths = [...t.tHead.rows[0].cells];
  return { sorted: [...t.querySelectorAll('[aria-sort]')].map((e) => ({ idx: ths.indexOf(e), v: e.getAttribute('aria-sort'), tag: e.tagName })), focus: document.activeElement && document.activeElement.className };
};

async function tri(browser, server, theme) {
  const o = await newPage(browser, server, { theme });
  await open(o, server, P.table);
  const tag = `[tri ${theme}]`;
  const n = await o.page.evaluate(() => {
    const ts = [...document.querySelectorAll('table[data-ch-sort]')];
    ts.forEach((t) => [...t.tBodies[0].rows].forEach((r, k) => { r.dataset.o = k; }));
    return ts.length;
  });
  check(n === 5, `${tag} ${n} tableau(x) data-ch-sort trouvés (attendu 5 : triable ×4 avec les copies de thème, tendance)`);
  let litterales = 0;
  for (let ti = 0; ti < n; ti++) {
    tables++;
    const t = o.page.locator('table[data-ch-sort]').nth(ti);
    const colonnes = await t.evaluate((el) => [...el.tHead.rows[0].cells].map((th) => ({ boutons: th.querySelectorAll('button').length, direct: [...th.children].filter((c) => c.tagName === 'BUTTON').length, num: th.classList.contains('ch-table__num'), nosort: th.hasAttribute('data-ch-nosort'), aria: th.hasAttribute('aria-sort'), glyphe: !!th.querySelector('button svg use') })));
    const aria0 = await o.page.evaluate((i) => document.querySelectorAll('table[data-ch-sort]')[i].querySelectorAll('[aria-sort]').length, ti);
    const nom = `${tag} tableau n°${ti + 1}`;
    check(aria0 === 0, `${nom} : aucun aria-sort au départ (${aria0})`);
    colonnes.forEach((c, k) => {
      check(c.nosort ? c.boutons === 0 : c.boutons === 1 && c.direct === 1, `${nom} colonne ${k + 1} : un seul <button> dans le <th> (${c.boutons} bouton(s), ${c.direct} enfant(s) direct(s))`);
      check(c.nosort || c.glyphe, `${nom} colonne ${k + 1} : le glyphe « sort » du sprite est dans le bouton`);
    });
    for (let c = 0; c < colonnes.length; c++) {
      if (colonnes[c].nosort) continue;
      const num = colonnes[c].num;
      const th = t.locator('thead th').nth(c);
      const bouton = th.locator('button');
      const orig = await o.page.evaluate(LIRE, { ti, c });
      const ordre = async () => (await o.page.evaluate(LIRE, { ti, c })).map((r) => r.o);
      let avant = orig;
      const agir = async (fn, dir, how) => { avant = await o.page.evaluate(LIRE, { ti, c }); await fn(); return verifie(dir, how); };
      const verifie = async (dir, how) => {
        sorts++;
        const e = await o.page.evaluate(ETAT, ti);
        const w = `${nom} colonne ${c + 1}${num ? ' (nombres)' : ''} ${how}`;
        check(e.sorted.length === 1, `${w} : exactement un aria-sort (${JSON.stringify(e.sorted)})`);
        check(e.sorted[0] && e.sorted[0].idx === c && e.sorted[0].tag === 'TH' && e.sorted[0].v === (dir > 0 ? 'ascending' : 'descending'), `${w} : aria-sort ${dir > 0 ? 'ascending' : 'descending'} sur le <th> de la colonne (${JSON.stringify(e.sorted)})`);
        const got = await ordre(), want = attendu(avant, num, dir);
        check(JSON.stringify(got) === JSON.stringify(want), `${w} : ordre ${dir > 0 ? 'croissant' : 'décroissant'} attendu ${JSON.stringify(want)}, obtenu ${JSON.stringify(got)}`);
        return got;
      };
      const asc = await agir(() => bouton.click(), 1, 'clic');
      await agir(() => bouton.click(), -1, 'clic 2');
      if (num || c === 0) {
        await bouton.focus();
        await agir(() => o.page.keyboard.press('Enter'), 1, 'Entrée'); // état précédent : décroissant -> croissant
        await agir(() => o.page.keyboard.press('Space'), -1, 'Espace');
        const foc = await o.page.evaluate(ETAT, ti);
        check(/ch-table__sort/.test(foc.focus || ''), `${nom} colonne ${c + 1} : le bouton garde le focus après le tri (${foc.focus})`);
      }
      // Valeurs de contrôle : « 1 905 », « 3 210 », « 12 480 » (jamais l'ordre du texte).
      if (num) {
        const noms = (await o.page.evaluate(LIRE, { ti, c })).map((r) => parseNum(r.text));
        if ([1905, 3210, 12480].every((x) => orig.some((r) => parseNum(r.text) === x))) {
          litterales++;
          await bouton.click(); // décroissant -> croissant
          const textes = (await o.page.evaluate(LIRE, { ti, c })).map((r) => parseNum(r.text));
          const i = (x) => textes.indexOf(x);
          check(i(1905) < i(3210) && i(3210) < i(12480), `${nom} colonne ${c + 1} : croissant : 1 905 avant 3 210 avant 12 480 (${textes.join(', ')})`);
          check(textes.every((x, k) => k === 0 || textes[k - 1] <= x), `${nom} colonne ${c + 1} : croissant : suite non décroissante (${textes.join(', ')})`);
          await bouton.click();
          const dec = (await o.page.evaluate(LIRE, { ti, c })).map((r) => parseNum(r.text));
          check(dec.every((x, k) => k === 0 || dec[k - 1] >= x), `${nom} colonne ${c + 1} : décroissant : suite non croissante (${dec.join(', ')})`);
          void noms; void asc;
        }
      }
    }
    // Tri stable : on revient à la première colonne en croissant puis on vérifie qu'il n'y a pas de doublon ni de ligne perdue.
    const final = await o.page.evaluate((i) => [...document.querySelectorAll('table[data-ch-sort]')[i].tBodies[0].rows].map((r) => Number(r.dataset.o)).sort((a, b) => a - b), ti);
    check(JSON.stringify(final) === JSON.stringify(final.map((_, k) => k)), `${nom} : aucune ligne perdue ni dupliquée après les tris (${JSON.stringify(final)})`);
  }
  check(litterales >= 1, `${tag} aucun tableau n'a les valeurs 1 905, 3 210, 12 480 dans une colonne de nombres`);
  await done(tag, o);
}

// ---------- B. sans JavaScript ----------
async function sansJs(browser, server) {
  const tag = '[sans JS]';
  let o = await newPage(browser, server, { js: false });
  await o.page.goto(server.url + P.table, { waitUntil: 'load' });
  const r = await o.page.evaluate(() => [...document.querySelectorAll('table.ch-table')].map((t) => ({
    tri: t.hasAttribute('data-ch-sort'), boutons: t.querySelectorAll('button').length, aria: t.querySelectorAll('[aria-sort]').length,
    visible: t.checkVisibility() && t.getClientRects().length > 0, lignes: t.tBodies[0].rows.length, texte: t.tBodies[0].rows[0].textContent.trim().length > 0, ths: t.tHead.rows[0].cells.length })));
  check(r.length === 7, `${tag} tableaux : ${r.length} trouvés (attendu 7 : triable ×4 avec les copies de thème, sans tri, tendance, large)`);
  check(r.filter((t) => t.tri).length >= 5, `${tag} tableaux data-ch-sort présents (${r.filter((t) => t.tri).length})`);
  r.forEach((t, i) => {
    check(t.boutons === 0, `${tag} tableau n°${i + 1} : aucun bouton de tri sans JavaScript (${t.boutons})`);
    check(t.aria === 0, `${tag} tableau n°${i + 1} : aucun aria-sort (${t.aria})`);
    check(t.visible && t.lignes > 0 && t.texte, `${tag} tableau n°${i + 1} : lisible (${t.lignes} ligne(s), visible ${t.visible})`);
  });
  await done(tag + ' tableaux', o);
  o = await newPage(browser, server, { js: false });
  await o.page.goto(server.url + P.code, { waitUntil: 'load' });
  const c = await o.page.evaluate(() => [...document.querySelectorAll('.ch-code')].map((b) => {
    const code = b.querySelector('pre code'), bt = b.querySelector('.ch-code__copy'), bar = b.querySelector('.ch-code__bar');
    return { attr: b.hasAttribute('data-ch-copy'), bouton: bt ? bt.checkVisibility() && bt.getClientRects().length > 0 : false, boutonPresent: !!bt, bar: !!bar,
      lisible: !!code && code.checkVisibility() && code.textContent.length > 0 && code.getClientRects().length > 0, pad: getComputedStyle(b).paddingTop };
  }));
  check(c.length === 7, `${tag} blocs de code : ${c.length} trouvés (attendu 7 : 4 exemples + 3 copies de thème du 1er)`);
  c.forEach((b, i) => {
    check(!b.bouton && !b.boutonPresent && !b.bar, `${tag} bloc n°${i + 1} : ni barre ni bouton « Copier » sans JavaScript`);
    check(b.lisible, `${tag} bloc n°${i + 1} : le code est visible et non vide`);
    check(b.pad === '0px', `${tag} bloc n°${i + 1} : aucune place réservée sans JavaScript (${b.pad})`);
  });
  await done(tag + ' code', o);
}

// ---------- C. copie ----------
const BLOCS = () => [...document.querySelectorAll('.ch-code[data-ch-copy]')].map((b) => ({ texte: (b.querySelector('pre code') || b.querySelector('pre')).textContent }));
async function copie(browser, server, theme) {
  const tag = `[copie ${theme}]`;
  const o = await newPage(browser, server, { theme, permissions: ['clipboard-read', 'clipboard-write'] });
  await open(o, server, P.code);
  const blocs = await o.page.evaluate(BLOCS);
  check(blocs.length === 6, `${tag} ${blocs.length} bloc(s) data-ch-copy (attendu 6 : 3 exemples + 3 copies de thème du 1er)`);
  for (let i = 0; i < blocs.length; i++) {
    copies++;
    const b = o.page.locator('.ch-code[data-ch-copy]').nth(i);
    const nom = `${tag} bloc n°${i + 1}`;
    const info = await b.evaluate((el) => ({ boutons: el.querySelectorAll('button').length, dansPre: !!el.querySelector('pre button'), avant: el.firstElementChild.className, etat: el.querySelector('.ch-code__copy').textContent.trim(), h: el.querySelector('.ch-code__copy').getBoundingClientRect().height, pad: getComputedStyle(el).paddingTop }));
    check(info.boutons === 1 && !info.dansPre, `${nom} : un seul bouton, hors du <pre> (${info.boutons})`);
    check(info.avant === 'ch-code__bar' && info.etat === 'Copier' && info.h >= 43.99, `${nom} : barre en tête, bouton « Copier » de 44 px au moins (${info.h})`);
    check(info.pad === '0px', `${nom} : la place réservée avant l'initialisation est rendue (${info.pad})`);
    await b.locator('.ch-code__copy').click();
    await o.page.waitForFunction((k) => document.querySelectorAll('.ch-code[data-ch-copy]')[k].querySelector('.ch-code__copy').getAttribute('data-ch-state') === 'ok', i, { timeout: 3000 }).catch(() => {});
    const apres = await o.page.evaluate(async (k) => {
      const el = document.querySelectorAll('.ch-code[data-ch-copy]')[k], bt = el.querySelector('.ch-code__copy');
      let clip = null; try { clip = await navigator.clipboard.readText(); } catch (e) { clip = 'ERREUR ' + e.message; }
      return { clip, code: (el.querySelector('pre code') || el.querySelector('pre')).textContent, etat: bt.getAttribute('data-ch-state'), label: bt.textContent.trim(), live: document.querySelector('[data-ch-live]').textContent.trim() };
    }, i);
    check(apres.clip === apres.code, `${nom} : le presse-papiers est EXACTEMENT le texte du code (${JSON.stringify(apres.clip).slice(0, 60)} contre ${JSON.stringify(apres.code).slice(0, 60)})`);
    check(apres.code === blocs[i].texte, `${nom} : le texte du code n'a pas changé après la copie`);
    check(apres.etat === 'ok' && apres.label === 'Copié', `${nom} : le bouton affiche « Copié » (${apres.etat}, ${apres.label})`);
    check(apres.live === 'Code copié.', `${nom} : message dans la région aria-live (${JSON.stringify(apres.live)})`);
    if (i === 0) {
      check(apres.clip === apres.clip.trim() && apres.clip.startsWith('.carte {') && apres.clip.endsWith('}'), `${nom} : ni espace ni saut de ligne ajouté en tête ou en fin (${JSON.stringify(apres.clip)})`);
      await o.page.waitForFunction(() => document.querySelector('.ch-code[data-ch-copy] .ch-code__copy').textContent.trim() === 'Copier', null, { timeout: 4500 }).then(
        () => check(true, ''), () => check(false, `${nom} : le bouton ne revient pas à « Copier »`));
      const r = await o.page.evaluate(() => document.querySelector('.ch-code[data-ch-copy] .ch-code__copy').hasAttribute('data-ch-state'));
      check(!r, `${nom} : l'état est retiré quand le libellé revient`);
    }
  }
  await done(tag, o);
}
async function refus(browser, server, mode) {
  const tag = `[copie ${mode}]`;
  const init = mode === 'refusée'
    ? () => Object.defineProperty(navigator, 'clipboard', { value: { writeText: () => Promise.reject(new DOMException('refusé', 'NotAllowedError')) }, configurable: true })
    : () => Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
  const o = await newPage(browser, server, { init });
  await open(o, server, P.code);
  const n = await o.page.evaluate(() => document.querySelectorAll('.ch-code[data-ch-copy]').length);
  for (let i = 0; i < Math.min(n, 4); i++) {
    refusals++;
    await o.page.locator('.ch-code[data-ch-copy] .ch-code__copy').nth(i).click();
    await o.page.waitForFunction((k) => document.querySelectorAll('.ch-code[data-ch-copy]')[k].querySelector('.ch-code__copy').hasAttribute('data-ch-state'), i, { timeout: 3000 }).catch(() => {});
    const r = await o.page.evaluate((k) => {
      const el = document.querySelectorAll('.ch-code[data-ch-copy]')[k], bt = el.querySelector('.ch-code__copy');
      const code = (el.querySelector('pre code') || el.querySelector('pre'));
      return { sel: String(getSelection()), code: code.textContent, etat: bt.getAttribute('data-ch-state'), label: bt.textContent.trim(), live: document.querySelector('[data-ch-live]').textContent.trim() };
    }, i);
    const nom = `${tag} bloc n°${i + 1}`;
    check(r.sel === r.code, `${nom} : le code est sélectionné (sélection ${JSON.stringify(r.sel).slice(0, 40)} contre ${JSON.stringify(r.code).slice(0, 40)})`);
    check(r.etat === 'manual' && /Ctrl\+C/.test(r.label), `${nom} : le bouton dit comment copier (${r.etat}, ${r.label})`);
    check(/Ctrl\+C/.test(r.live) && /⌘C/.test(r.live) && /sélectionné/.test(r.live), `${nom} : le message de la région aria-live dit comment copier (${JSON.stringify(r.live)})`);
  }
  await done(tag, o);
  // Pas de débordement de la page à 375 px (ligne très longue).
  const p = await newPage(browser, server, { width: 375, height: 800 });
  if (mode === 'refusée') {
    await open(p, server, P.code);
    const m = await p.page.evaluate(() => ({ page: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth,
      defile: [...document.querySelectorAll('.ch-code__pre')].some((e) => e.scrollWidth > e.clientWidth) }));
    check(m.page <= m.vw, `[code 375] la page ne défile pas à l'horizontale (${m.page} > ${m.vw})`);
    check(m.defile, '[code 375] la ligne très longue défile dans son cadre');
  }
  await done('[code 375]', p);
}

// ---------- D. carte-lien ----------
async function carteLien(browser, server, theme) {
  const tag = `[carte ${theme}]`;
  const o = await newPage(browser, server, { theme });
  await open(o, server, P.card);
  const n = await o.page.locator('.ch-card--link').count();
  check(n === 6, `${tag} ${n} carte(s) --link (attendu 6 : 3 + 2 + 1 ; les copies de thème sont celles de la carte à actions)`);
  for (let i = 0; i < n; i++) {
    cards++;
    const card = o.page.locator('.ch-card--link').nth(i);
    await card.scrollIntoViewIfNeeded();
    const nom = `${tag} carte n°${i + 1}`;
    const r = await card.evaluate((el) => {
      const foc = [...el.querySelectorAll('a[href], area[href], button, input, select, textarea, summary, iframe, [tabindex], [contenteditable], audio[controls], video[controls]')].filter((e) => e.tabIndex >= 0 || e.hasAttribute('tabindex'));
      const liens = [...el.querySelectorAll('a')];
      const link = el.querySelector('.ch-card__link');
      const b = el.getBoundingClientRect();
      const pts = [];
      for (const fx of [0.05, 0.5, 0.95]) for (const fy of [0.05, 0.5, 0.95]) {
        const x = b.left + b.width * fx, y = b.top + b.height * fy, hit = document.elementFromPoint(x, y);
        pts.push(!!hit && hit.closest('a') === link);
      }
      const cs = link ? getComputedStyle(link, '::after') : null;
      return { foc: foc.length, premier: foc[0] === link, liens: liens.length, w: b.width, h: b.height, pts, posCarte: getComputedStyle(el).position, after: cs ? { c: cs.content, p: cs.position } : null,
        cible: link ? link.getAttribute('href') : null, point: { x: b.right - 6, y: b.bottom - 6 } };
    });
    check(r.foc === 1 && r.premier, `${nom} : un seul élément focalisable, c'est le lien de la carte (${r.foc})`);
    check(r.liens === 1, `${nom} : un seul lien dans la carte (${r.liens})`);
    check(r.w >= 44 && r.h >= 44, `${nom} : la boîte de la carte fait 44 px au moins (${r.w} × ${r.h})`);
    check(r.posCarte === 'relative' && r.after && r.after.c === '""' && r.after.p === 'absolute', `${nom} : le ::after du lien (position absolute) couvre la carte (position relative) (${r.posCarte}, ${JSON.stringify(r.after)})`);
    check(r.pts.every(Boolean), `${nom} : les 9 points de la carte renvoient le lien (${r.pts.map((x) => (x ? 1 : 0)).join('')})`);
    await o.page.mouse.click(r.point.x, r.point.y);
    const h = await o.page.evaluate(() => location.hash);
    check(h === r.cible, `${nom} : un clic dans le coin bas droit suit le lien (${h} attendu ${r.cible})`);
  }
  await done(tag, o);
}

// ---------- E. puces ----------
async function puces(browser, server, theme) {
  const tag = `[puce ${theme}]`;
  const o = await newPage(browser, server, { theme });
  await open(o, server, P.chip);
  const n = await o.page.locator('.ch-chip').count();
  check(n === 23, `${tag} ${n} puce(s) (attendu 23 : 4 + 3 + 4 + 3 × 4 copies de thème)`);
  for (let i = 0; i < n; i++) {
    chips++;
    const chip = o.page.locator('.ch-chip').nth(i);
    await chip.scrollIntoViewIfNeeded();
    await stop(o.page);
    const nom = `${tag} puce n°${i + 1}`;
    const r = await chip.evaluate((el) => {
      const b = el.getBoundingClientRect(), cs = getComputedStyle(el, '::before');
      const cx = b.left + b.width / 2;
      const haut = document.elementFromPoint(cx, b.top - 3), bas = document.elementFromPoint(cx, b.bottom + 3);
      return { h: b.height, w: b.width, c: cs.content, p: cs.position, bw: parseFloat(cs.width), bh: parseFloat(cs.height), haut: !!haut && (haut === el || el.contains(haut)), bas: !!bas && (bas === el || el.contains(bas)),
        txt: el.textContent.trim() };
    });
    check(Math.abs(r.h - 32) < 0.6, `${nom} « ${r.txt} » : 32 px visibles (${r.h})`);
    check(r.c === '""' && r.p === 'absolute', `${nom} : ::before vide en position absolute (${r.c}, ${r.p})`);
    check(r.bw >= 44 - 0.01 && r.bh >= 44 - 0.01, `${nom} « ${r.txt} » : zone ::before ≥ 44 × 44 (${r.bw} × ${r.bh})`);
    check(r.haut && r.bas, `${nom} « ${r.txt} » : 3 px au-dessus et au-dessous, elementFromPoint renvoie la puce (haut ${r.haut}, bas ${r.bas})`);
  }
  await done(tag, o);
}

// ---------- F. avatar ----------
const RAYONS = () => {
  const out = [];
  const lire = (cs) => ['border-top-left-radius', 'border-top-right-radius', 'border-bottom-right-radius', 'border-bottom-left-radius'].map((p) => cs.getPropertyValue(p));
  for (const a of document.querySelectorAll('.ch-avatar')) {
    const w = a.getBoundingClientRect();
    out.push({ n: 'avatar', r: lire(getComputedStyle(a)), carre: Math.abs(w.width - w.height) < 0.5 });
    out.push({ n: 'avatar::before', r: lire(getComputedStyle(a, '::before')) });
    out.push({ n: 'avatar::after', r: lire(getComputedStyle(a, '::after')) });
    for (const d of a.querySelectorAll('*')) out.push({ n: 'descendant ' + d.tagName.toLowerCase(), r: lire(getComputedStyle(d)) });
  }
  return out;
};
async function avatar(browser, server, theme) {
  const tag = `[avatar ${theme}]`;
  const o = await newPage(browser, server, { theme });
  await open(o, server, P.avatar);
  const lot = async (w) => {
    const r = await o.page.evaluate(RAYONS);
    avatars += r.filter((x) => x.n === 'avatar').length;
    check(r.filter((x) => x.n === 'avatar').length === 20, `${tag} ${w} : ${r.filter((x) => x.n === 'avatar').length} avatar(s) lus (attendu 20 : 3 + 4 + 4 + 3 × 3 copies de thème)`);
    const mauvais = r.filter((x) => x.r.some((v) => v !== '0px'));
    check(mauvais.length === 0, `${tag} ${w} : border-radius calculé 0 partout (${mauvais.slice(0, 3).map((m) => `${m.n} ${m.r.join(' ')}`).join(' ; ')}${mauvais.length > 3 ? ` … ${mauvais.length} au total` : ''})`);
    check(r.filter((x) => x.carre === false).length === 0, `${tag} ${w} : chaque avatar est carré (largeur = hauteur)`);
  };
  await lot('feuille normale');
  await o.page.addStyleTag({ content: ':root { --ch-radius: 8px; }' });
  await o.page.evaluate(() => {
    document.body.insertAdjacentHTML('beforeend', '<div id="sonde"><article class="ch-card">x</article><button class="ch-btn" type="button">x</button><button class="ch-chip" type="button">x</button></div>');
  });
  await stop(o.page);
  const sonde = await o.page.evaluate(() => ['.ch-card', '.ch-btn', '.ch-chip'].map((s) => [s, getComputedStyle(document.querySelector('#sonde ' + s)).borderTopLeftRadius]));
  for (const [s, v] of sonde) check(v === '8px', `${tag} fixture --ch-radius: 8px : ${s} a bien ${v} (attendu 8px : la feuille agit)`);
  await lot('avec --ch-radius: 8px');
  await done(tag, o);
}

try {
  await withBench(async ({ server, launch }) => {
    const { browser } = await launch('chromium');
    await sansJs(browser, server);
    await refus(browser, server, 'refusée');
    await refus(browser, server, 'absente');
    for (const theme of THEMES) {
      await tri(browser, server, theme);
      await copie(browser, server, theme);
      await carteLien(browser, server, theme);
      await puces(browser, server, theme);
      await avatar(browser, server, theme);
    }
  });
} catch (e) {
  fails.push(`exception : ${e.stack || e}`);
}
for (const f of fails) console.log('ÉCHEC ' + f);
console.log(`contenu : ${checks} vérification(s), ${tables} tableau(x) triable(s) lu(s) (3 thèmes), ${sorts} tri(s) vérifié(s) ligne par ligne, ${copies} copie(s) comparée(s) au presse-papiers, ${refusals} copie(s) refusée(s) ou impossible(s), ${cards} carte(s)-lien, ${chips} puce(s), ${avatars} avatar(s) (× 2 feuilles), ${fails.length} échec(s), ${((Date.now() - t0) / 1000).toFixed(1)} s`);
process.exit(fails.length ? 1 : 0);
