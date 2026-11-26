// Hôte (J2a-2) : chopa.css dans un site qui a ses propres règles (tests/host.html, tests/host-hostile.css).
//  A/B. Page nue, puis page hostile (marges, remplissages, box-sizing, puces sur p, ul, h1-h6, button, input, textarea ;
//       <html data-theme="light"> ; class avec saut de ligne ou tabulation) :
//       - les éléments de l'hôte (data-host) gardent EXACTEMENT leurs styles calculés : comparés à la même page sans chopa.css
//         (feuille vidée) ; seule exception documentée : l'enfant direct d'une ch-stack (marges verticales remises à zéro) ;
//       - les éléments Chopa dont le class contient un saut de ligne ou une tabulation ont les styles de leur jumeau ;
//       - le data-theme de l'hôte ne change pas le thème Chopa (fond, accent).
//  C.   Parité avec la planche sous la feuille hostile (moteur de parity.mjs, repos, thèmes sombre et clair).
//  D.   chopa-reset.css (remise à zéro globale facultative) : atteint dist-lib/ et site/dist/chopa/, remet à zéro les
//       éléments nus, laisse les puces, et la parité reste vraie avec lui.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { withBench } from '../lib/browser.mjs';
import { ROOT, DIST, SITE_DIST } from '../lib/paths.mjs';
import { parityServer, loadParityFiles, runParity } from '../lib/parity.mjs';

const t0 = Date.now();
const fails = [];
const log = [];

const SNAP = () => {
  const grab = (cs) => { const o = {}; for (const n of cs) if (!n.startsWith('--')) o[n] = cs.getPropertyValue(n); return o; };
  const out = {};
  const els = document.querySelectorAll('[data-host], [data-twin], [id^="t-"], #label, #btn, #btn-a, #row, #grid');
  els.forEach((el, i) => {
    const key = el.id || ('host-' + i);
    el.setAttribute('data-key', key);
    out[key] = {
      host: el.getAttribute('data-host'), twin: el.getAttribute('data-twin'),
      el: grab(getComputedStyle(el)), '::before': grab(getComputedStyle(el, '::before')), '::after': grab(getComputedStyle(el, '::after')),
      '::marker': el.tagName === 'LI' ? grab(getComputedStyle(el, '::marker')) : {},
      text: (el.textContent || '').trim().slice(0, 30),
    };
  });
  const root = getComputedStyle(document.documentElement);
  out.__root = { background: root.backgroundColor, scheme: root.colorScheme, bg: root.getPropertyValue('--ch-bg').trim(), dataTheme: document.documentElement.getAttribute('data-theme') };
  return out;
};

async function load(context, url, { withChopa }) {
  const page = await context.newPage();
  const problems = [];
  page.on('console', (m) => { if (m.type() === 'error') problems.push(`console : ${m.text()}`); });
  page.on('pageerror', (e) => problems.push(`erreur de page : ${e.message}`));
  // Référence : chopa.css vidé, sauf l'effet documenté du thème par défaut sur la racine : `color-scheme: dark`
  // (décision Diapason du 2026-11-15, vérif. J2a-2 : une page qui charge chopa.css est sombre par défaut, ses
  // contrôles natifs aussi ; restreindre `color-scheme` aux cadres laisserait des champs clairs sur fond sombre).
  // Tout autre écart d'un élément de l'hôte reste une fuite, et la racine est toujours contrôlée plus bas (fond, scheme).
  if (!withChopa) await page.route('**/chopa/chopa.css', (r) => r.fulfill({ status: 200, contentType: 'text/css', body: '/* feuille vidée pour la référence */ :root { color-scheme: dark; }' }));
  await page.goto(url, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(async () => { for (let i = 0; i < 45; i++) { await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))); if (!document.getAnimations().length) return; } });
  return { page, problems };
}

// Regroupe les écarts : une ligne par (contexte, propriété, valeurs), avec le nombre d'éléments et les premiers noms.
const groups = new Map();
function addGroup(ctx, prop, a, b, who) {
  const key = `${ctx}|${prop}|${a}|${b}`;
  const g = groups.get(key) || { ctx, prop, a, b, who: [] };
  if (!g.who.includes(who)) g.who.push(who);
  groups.set(key, g);
}
// Écarts de parité : une ligne par (cas, paire, propriété, valeurs) quel que soit le thème ; les propriétés logiques ou
// dérivées (margin-block-*, inline-size, transform-origin…) qui répètent une propriété physique déjà listée sont comptées, non affichées.
const DERIVED = /^(margin|padding)-(block|inline)|^(inline|block)-size$|^(perspective|transform)-origin$|^border-(block|inline)|^(min|max)-(inline|block)-size$/;
const parityGroups = new Map();
let parityDerived = 0;
function addParity(ctx, msg) {
  const m = msg.match(/^(\S+) (\S+) @(\d+) \[(\w+)\] (\w+) (.+?) : chopa « (.*?) » ≠ planche « (.*?) »$/);
  if (!m) { fails.push(`${ctx} : ${msg}`); return; }
  const [, tag, pair, width, theme, state, prop, a, b] = m;
  if (DERIVED.test(prop.replace(/^::\w+ /, ''))) { parityDerived++; return; }
  const key = `${ctx}|${tag}|${pair}|${prop}|${a}|${b}`;
  const g = parityGroups.get(key) || { ctx, tag, pair, prop, a, b, where: new Set() };
  g.where.add(`${theme}/${state}/${width}`);
  parityGroups.set(key, g);
}
const diff = (a, b) => {
  const out = [];
  for (const n of new Set([...Object.keys(a), ...Object.keys(b)])) if (a[n] !== b[n]) out.push([n, a[n], b[n]]);
  return out;
};

async function hostPage(browser, server, variant) {
  const suffix = variant === 'nue' ? '' : '?hostile';
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'no-preference' });
  try {
    const url = server.url + '/tests/host.html' + suffix;
    const w = await load(context, url, { withChopa: true });
    const r = await load(context, url, { withChopa: false });
    for (const p of [...w.problems, ...r.problems]) fails.push(`hôte ${variant} : ${p}`);
    const a = await w.page.evaluate(SNAP);
    const b = await r.page.evaluate(SNAP);
    let nHost = 0, nProps = 0;
    for (const key of Object.keys(a)) {
      if (key === '__root') continue;
      const e = a[key];
      if (e.host !== null) {
        if (e.host === 'stack-direct') {
          nHost++;
          const mt = e.el['margin-top'], mb = e.el['margin-bottom'];
          if (mt !== '0px' || mb !== '0px') fails.push(`hôte ${variant} : enfant direct de ch-stack : marges verticales attendues 0, mesurées ${mt} / ${mb}`);
          if (b[key].el['margin-top'] === '0px') fails.push(`hôte ${variant} : la référence sans chopa.css n'a pas de marge sur l'enfant de ch-stack (le test ne prouve rien)`);
          log.push(`hôte ${variant} : enfant direct de ch-stack : marge verticale ${b[key].el['margin-top']} (hôte seul) -> ${mt} (avec chopa.css), exception documentée`);
          continue;
        }
        nHost++;
        for (const k of ['el', '::marker']) { // ::before et ::after d'un élément nu : rien à peindre, ils ne font que répéter l'héritage
          // dans un ch-wrap, la LARGEUR de l'enfant change à cause du remplissage du conteneur (c'est son rôle) : seule la mise en page est exclue
          const d = diff(a[key][k], b[key][k]).filter(([n]) => !(e.host === 'in-wrap' && /^(width|inline-size|(perspective|transform)-origin)$/.test(n)));
          nProps += Object.keys(a[key][k]).length;
          for (const [n, va, vb] of d) addGroup(`hôte ${variant} : élément de l'hôte, avec chopa.css ≠ sans`, (k === 'el' ? '' : k + ' ') + n, va, vb, `${key}« ${e.text.slice(0, 18)} »`);
        }
      } else if (e.twin) {
        const ref = a[e.twin];
        for (const k of ['el', '::before', '::after']) {
          const d = diff(a[key][k], ref[k]);
          nProps += Object.keys(ref[k]).length;
          for (const [n, va, vb] of d) addGroup(`hôte ${variant} : jumeau à class multiligne ≠ référence`, (k === 'el' ? '' : k + ' ') + n, va, vb, `${key} ≠ ${e.twin}`);
        }
      }
    }
    // le data-theme de l'hôte ne change pas le thème Chopa
    const root = a.__root;
    if (root.background !== 'rgb(5, 5, 5)') fails.push(`hôte ${variant} : fond de <html> « ${root.background} » au lieu du sombre rgb(5, 5, 5)`);
    if (root.scheme !== 'dark') fails.push(`hôte ${variant} : color-scheme « ${root.scheme} » au lieu de dark`);
    if (variant === 'hostile' && root.dataTheme !== 'light') fails.push('hôte hostile : data-theme="light" absent (le test ne prouve rien)');
    if (a.btn.el['background-color'] !== 'rgb(255, 90, 31)') fails.push(`hôte ${variant} : fond du bouton primaire « ${a.btn.el['background-color']} » au lieu de rgb(255, 90, 31)`);
    // les formes à saut de ligne ont bien reçu le style Chopa (et pas seulement le même défaut que le jumeau)
    for (const k of ['btn-nl', 'btn-nl2']) if (a[k].el['min-height'] !== '44px') fails.push(`hôte ${variant} : ${k} (class avec saut de ligne) : min-height « ${a[k].el['min-height']} » au lieu de 44px`);
    if (a['t-small-nl'].el['font-size'] !== '14px') fails.push(`hôte ${variant} : t-small-nl : font-size « ${a['t-small-nl'].el['font-size']} » au lieu de 14px`);
    if (a['label-tab'].el['text-transform'] !== 'uppercase') fails.push(`hôte ${variant} : label-tab (tabulation) : text-transform « ${a['label-tab'].el['text-transform']} » au lieu de uppercase`);
    if (variant === 'hostile') {
      const h = a['host-0'] || Object.values(a).find((x) => x.host !== null);
      if (b[Object.keys(b).find((k) => b[k].text === 'Titre de l\'hôte')].el['margin-top'] !== '23px') fails.push('hôte hostile : la feuille hostile ne s\'applique pas (marge du h1 ≠ 23px)');
    }
    log.push(`hôte ${variant} : ${nHost} élément(s) de l'hôte, ${nProps} propriété(s) comparées (avec chopa.css contre sans), jumeaux à class multiligne comparés`);
  } finally { await context.close().catch(() => {}); }
}

async function resetChecks(browser, server) {
  for (const f of [join(ROOT, 'src', 'extras', 'chopa-reset.css'), join(DIST, 'chopa-reset.css'), join(SITE_DIST, 'chopa', 'chopa-reset.css')]) {
    if (!existsSync(f)) fails.push(`chopa-reset.css absent : ${f}`);
  }
  if (existsSync(join(DIST, 'chopa-reset.css')) && readFileSync(join(DIST, 'chopa-reset.css'), 'utf8') !== readFileSync(join(ROOT, 'src', 'extras', 'chopa-reset.css'), 'utf8')) fails.push('dist-lib/chopa-reset.css diffère de src/extras/chopa-reset.css');
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  let nHostileWins = 0;
  try {
    const { page, problems } = await load(context, server.url + '/tests/host.html?hostile&reset', { withChopa: true });
    for (const p of problems) fails.push(`reset : ${p}`);
    const m = await page.evaluate(() => {
      const g = (sel, props) => { const cs = getComputedStyle(document.querySelector(sel)); return Object.fromEntries(props.map((p) => [p, cs.getPropertyValue(p)])); };
      const all = ['margin-top', 'margin-left', 'padding-top', 'padding-left', 'box-sizing'];
      return {
        h1: g('h1[data-host]', all), p: g('p[data-host]', all), ul: g('ul[data-host]', [...all, 'list-style-type']),
        button: g('button[data-host]', [...all, 'font-family', 'font-size']), input: g('input[data-host]', all), textarea: g('textarea[data-host]', all),
        a: g('a[data-host]', ['text-decoration-line', 'color']), body: g('body', ['font-family', 'font-size']), pa: g('p[data-host]', ['color']),
      };
    });
    for (const k of ['h1', 'p', 'ul', 'button', 'input', 'textarea']) {
      for (const [prop, want] of Object.entries({ 'margin-top': '0px', 'margin-left': '0px', 'padding-top': '0px', 'padding-left': '0px', 'box-sizing': 'border-box' })) {
        // la feuille hostile (règles d'élément) est plus forte que le :where() du reset : attendu, compté seulement
        if (m[k][prop] !== want) nHostileWins++;
      }
    }
    log.push(`reset + feuille hostile : ${nHostileWins} des 30 valeurs restent à l'hôte (règles d'élément, spécificité 0,0,1 > :where() du reset) : attendu, la remise à zéro n'écrase jamais l'hôte`);
    const bare = await load(context, server.url + '/tests/host.html?reset', { withChopa: true });
    for (const p of bare.problems) fails.push(`reset nue : ${p}`);
    const n = await bare.page.evaluate(() => {
      const g = (sel, props) => { const cs = getComputedStyle(document.querySelector(sel)); return Object.fromEntries(props.map((p) => [p, cs.getPropertyValue(p)])); };
      const all = ['margin-top', 'margin-left', 'padding-top', 'padding-left', 'box-sizing'];
      return {
        h1: g('h1[data-host]', all), p: g('p[data-host]', all), ul: g('ul[data-host]', [...all, 'list-style-type']),
        button: g('button[data-host]', [...all, 'font-family']), input: g('input[data-host]', all), textarea: g('textarea[data-host]', all),
        li: g('li[data-host]', ['margin-top', 'display']), a: g('a[data-host]', ['text-decoration-line']), body: g('body', ['font-family']),
        bodyMargin: g('body', ['margin-top']),
      };
    });
    let nReset = 0;
    for (const k of ['h1', 'p', 'ul', 'button', 'input', 'textarea']) {
      for (const [prop, want] of Object.entries({ 'margin-top': '0px', 'margin-left': '0px', 'padding-top': '0px', 'padding-left': '0px', 'box-sizing': 'border-box' })) {
        nReset++;
        if (n[k][prop] !== want) fails.push(`reset nue : ${k} ${prop} = ${n[k][prop]} au lieu de ${want}`);
      }
    }
    if (n.ul['list-style-type'] !== 'disc') fails.push(`reset nue : les puces de liste doivent rester (list-style-type ${n.ul['list-style-type']})`);
    if (n.a['text-decoration-line'] !== 'none') fails.push(`reset nue : lien non remis à zéro (text-decoration-line ${n.a['text-decoration-line']})`);
    if (n.button['font-family'] !== n.body['font-family']) fails.push(`reset nue : le bouton n'hérite pas la police du corps (${n.button['font-family']} / ${n.body['font-family']})`);
    if (n.bodyMargin['margin-top'] !== '0px') fails.push(`reset nue : body margin-top ${n.bodyMargin['margin-top']}`);
    log.push(`reset : atteint src/extras, dist-lib/ et site/dist/chopa/ ; page nue : ${nReset} valeurs remises à zéro (h1, p, ul, button, input, textarea), puces conservées, lien sans soulignement`);
  } finally { await context.close().catch(() => {}); }
}

try {
  const parityFiles = loadParityFiles();
  await withBench(async ({ server, launch }) => {
    const c = await launch('chromium');
    if (c.note) console.log(c.note);
    await hostPage(c.browser, server, 'nue');
    await hostPage(c.browser, server, 'hostile');
    const h = await runParity({ browser: c.browser, server, parityFiles, hostile: true, themes: ['sombre', 'clair'], onlyStates: ['rest'] });
    for (const f of h.fails) addParity('parité sous feuille hostile', f);
    log.push(`parité sous feuille hostile : ${h.stats.cases} cas, ${h.stats.comparisons} comparaisons, ${h.stats.props} propriétés, ${h.fails.length} écart(s)`);
    const r = await runParity({ browser: c.browser, server, parityFiles, reset: true, themes: ['sombre'], onlyStates: ['rest'] });
    for (const f of r.fails) addParity('parité avec chopa-reset.css', f);
    log.push(`parité avec chopa-reset.css : ${r.stats.cases} cas, ${r.stats.comparisons} comparaisons, ${r.stats.props} propriétés, ${r.fails.length} écart(s)`);
    await resetChecks(c.browser, server);
  }, parityServer(), SITE_DIST);
} catch (e) {
  fails.push(`exception : ${e.stack || e}`);
}
for (const g of parityGroups.values()) fails.push(`${g.ctx} : ${g.tag} (${g.pair}) ${g.prop} : chopa « ${g.a} » ≠ planche « ${g.b} » [${[...g.where].length} mesure(s) : thème/état/largeur, ex. ${[...g.where][0]}]`);
if (parityDerived) log.push(`(${parityDerived} écart(s) de propriétés logiques ou dérivées répétant les propriétés physiques ci-dessus, non listés)`);
// fusion : mêmes valeurs sur les mêmes éléments = une seule ligne, propriétés jointes
const merged = new Map();
for (const g of groups.values()) {
  const key = `${g.ctx}|${g.a}|${g.b}|${[...g.who].sort().join(',')}`;
  const m = merged.get(key) || { ...g, props: [] };
  m.props.push(g.prop);
  merged.set(key, m);
}
for (const g of merged.values()) fails.push(`${g.ctx} : ${g.props.length > 4 ? g.props.slice(0, 4).join(', ') + ` (+${g.props.length - 4} propriétés)` : g.props.join(', ')} : « ${g.a} » ≠ « ${g.b} » sur ${g.who.length} élément(s) : ${g.who.slice(0, 4).join(', ')}${g.who.length > 4 ? ', …' : ''}`);
for (const l of log) console.log('host : ' + l);
for (const f of fails) console.log('ÉCHEC ' + f);
console.log(`host : ${fails.length} échec(s), ${((Date.now() - t0) / 1000).toFixed(1)} s`);
process.exit(fails.length ? 1 : 0);
