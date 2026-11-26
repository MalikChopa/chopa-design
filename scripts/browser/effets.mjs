// Effets (J8b) : bandes liées au défilement, titres qui apparaissent, grain, chopa-effects.js.
// Mesures (Chromium, 3 thèmes) sur une page d'essai servie en mémoire (aucun fichier écrit) et sur la page construite /effets/ :
//  1. sans JavaScript, et avec chopa-effects.js qui échoue à se charger : tout le texte des bandes et des titres est visible
//     (opacité effective 1, aucune transformation, rien de caché) ;
//  2. avec JavaScript : après 500 px de défilement la transform d'une bande a changé (dans les deux sens) ; un titre sous la fenêtre
//     est d'abord à l'état « wait » (opacité 0, témoin), passe à l'opacité 1 une fois dans la fenêtre et y reste ;
//  3. mouvement réduit : 0 animation (getAnimations vide), transform: none, rien d'écrit par le script (style en ligne vide,
//     aucun data-ch-reveal), titres visibles dès le départ ;
//  4. grain : absent par défaut (aucun contenu généré), puis, avec la classe : fixed, pointer-events: none, z-index explicite,
//     couleur du rôle fg, masque présent, rendu différent d'une capture sans grain ; elementFromPoint rend le contenu
//     (5 points) ; contraste du texte sous le grain recalculé au pire cas (masque entièrement opaque) >= 4,5 ;
//  5. axe-core : 0 violation sur /effets/ (3 thèmes, 375 px, grain activé) ; aucun défilement latéral de la page.
// Mutations (processus fils, copie en mémoire servie à la place du fichier, rien n'est écrit) : sans la garde de mouvement
// réduit de chopa-effects.js, ou sans pointer-events: none sur le grain, ce script doit sortir en code 1.
// Variables : CH_OUT (build copié), CH_EFFETS_MUTATION (garde | pointer : usage interne du script).
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { withBench, openPage, THEMES } from '../lib/browser.mjs';
import { DIST } from '../lib/paths.mjs';

const t0 = Date.now();
const fails = [];
const MUT = process.env.CH_EFFETS_MUTATION || '';
const RUN_THEMES = MUT ? ['sombre'] : THEMES;
const axeSrc = readFileSync(createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8');
const JS = readFileSync(join(DIST, 'chopa-effects.js'), 'utf8');
const CSS = readFileSync(join(DIST, 'chopa.css'), 'utf8');
const stats = { sansJs: 0, echec: 0, defil: 0, titres: 0, reduit: 0, grain: 0, axe: 0, contrastes: 0, debord: 0 };
let minContrast = 99;

// --- mutations : copies en mémoire ---
const virtual = {};
const GARDE = 'if (!reduce || reduce.matches) return;';
const PTR = 'z-index: calc(var(--ch-z-overlay) - 10); pointer-events: none;';
if (MUT === 'garde') {
  if (JS.split(GARDE).length !== 2) { console.log('ÉCHEC motif de la garde introuvable ou ambigu : la mutation ne prouve rien'); process.exit(2); }
  virtual['/chopa/chopa-effects.js'] = { body: JS.replace(GARDE, 'if (!reduce) return;'), type: 'text/javascript; charset=utf-8' };
}
if (MUT === 'pointer') {
  if (CSS.split(PTR).length !== 2) { console.log('ÉCHEC motif pointer-events introuvable ou ambigu : la mutation ne prouve rien'); process.exit(2); }
  virtual['/chopa/chopa.css'] = { body: CSS.replace(PTR, 'z-index: calc(var(--ch-z-overlay) - 10);'), type: 'text/css; charset=utf-8' };
}

// --- page d'essai (en mémoire) : thème écrit dans l'attribut, pour que le thème tienne même sans JavaScript ---
const PROBES = [[40, 40], [1240, 40], [640, 450], [40, 860], [1240, 860]];
const testPage = (theme) => `<!doctype html><html lang="fr" data-ch-theme="${theme}"><head><meta charset="utf-8"><title>essai effets</title>
<link rel="stylesheet" href="/chopa/chopa.css"><script src="/chopa/chopa-effects.js" defer></script>
<style>body{margin:0;background:var(--ch-bg);color:var(--ch-fg);font-family:var(--ch-sans)} .sp{height:1400px}
.probe{position:fixed;width:60px;height:60px;margin:-30px 0 0 -30px;background:var(--ch-card);border:1px solid var(--ch-line);display:block}
.txt{position:fixed;left:200px;top:540px;width:600px;margin:0;padding:12px;background:var(--ch-bg);display:flex;flex-direction:column;gap:6px}
.txt p{margin:0;padding:6px;font-size:17px}</style></head><body>
<div class="ch-band" id="b1"><p class="ch-band__track"><span class="ch-band__item">Atelier ouvert</span></p></div>
<div class="ch-band" id="b2" data-ch-dir="reverse" data-ch-speed="0.6"><p class="ch-band__track"><span class="ch-band__item">Pièces neuves</span></p></div>
<h1 class="ch-t-h2 ch-reveal" id="r0">Titre déjà visible</h1>
<div class="sp"></div><h2 class="ch-t-h2 ch-reveal" id="r1">Premier titre plus bas</h2>
<div class="sp"></div><h2 class="ch-t-h2 ch-reveal" id="r2">Second titre plus bas</h2>
<div class="sp"></div>
${PROBES.map(([x, y], i) => `<a class="probe" id="p${i}" href="#p${i}" style="left:${x}px;top:${y}px" aria-label="sonde ${i}"></a>`).join('\n')}
<div class="txt" id="txt"><p style="color:var(--ch-fg);background:var(--ch-bg)" data-pair="fg|bg">Texte fg sur bg</p><p style="color:var(--ch-soft);background:var(--ch-bg2)" data-pair="soft|bg2">Texte soft sur bg2</p><p style="color:var(--ch-mute);background:var(--ch-card)" data-pair="mute|card">Texte mute sur card</p><p style="color:var(--ch-mute);background:var(--ch-bg)" data-pair="mute|bg">Texte mute sur bg</p><p style="color:var(--ch-mute);background:var(--ch-bg2)" data-pair="mute|bg2">Texte mute sur bg2</p></div>
</body></html>`;
for (const t of THEMES) virtual[`/essai-effets-${t}.html`] = testPage(t);

// --- outils ---
const raf = (page, n = 3) => page.evaluate(async (k) => { for (let i = 0; i < k; i++) await new Promise((r) => requestAnimationFrame(r)); }, n);
const scrollTo = async (page, y) => { await page.evaluate((v) => window.scrollTo({ top: v, behavior: 'instant' }), y); await raf(page); };
const fail = (msg) => fails.push(msg);

// Dans la page : liste des problèmes de visibilité du texte des bandes et des titres.
const VISIBLE = () => {
  const probs = []; let n = 0;
  const eff = (el) => { let o = 1; for (let e = el; e && e.nodeType === 1; e = e.parentElement) o *= parseFloat(getComputedStyle(e).opacity); return o; };
  for (const el of document.querySelectorAll('.ch-band__item, .ch-reveal')) {
    n++;
    const cs = getComputedStyle(el), r = el.getBoundingClientRect(), id = el.className.split(' ')[0] + ' « ' + el.textContent.trim().slice(0, 24) + ' »';
    if (eff(el) !== 1) probs.push(id + ' : opacité effective ' + eff(el));
    if (cs.transform !== 'none') probs.push(id + ' : transform ' + cs.transform);
    if (el.matches('.ch-band__item') && getComputedStyle(el.parentElement).transform !== 'none') probs.push(id + ' : piste transform ' + getComputedStyle(el.parentElement).transform);
    if (cs.visibility !== 'visible' || cs.display === 'none' || r.width === 0 || r.height === 0) probs.push(id + ' : caché (' + cs.visibility + ', ' + cs.display + ', ' + r.width + 'x' + r.height + ')');
    if (el.hasAttribute('data-ch-reveal')) probs.push(id + ' : data-ch-reveal présent sans script');
  }
  return { n, probs };
};

const pages = (server) => [
  ...THEMES.map((t) => ({ nom: `essai/${t}`, url: server.url + `/essai-effets-${t}.html`, theme: t, essai: true })),
  ...THEMES.map((t) => ({ nom: `/effets/ ${t}`, url: server.url + '/effets/', theme: t, essai: false })),
].filter((p) => RUN_THEMES.includes(p.theme));

// Contexte pour 1 et 2 : sans JavaScript, ou script bloqué.
async function sansScript(browser, p, mode) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, javaScriptEnabled: mode !== 'nojs' });
  if (mode === 'abort') {
    await ctx.addInitScript((t) => { try { localStorage.setItem('ch-theme', t); } catch (_) {} }, p.theme);
    await ctx.route('**/chopa-effects.js', (r) => r.abort());
  }
  const page = await ctx.newPage();
  await page.goto(p.url, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready).catch(() => {});
  if (mode === 'nojs') {
    // Sans JavaScript, page.evaluate n'existe pas : on mesure par un contexte jumeau avec JavaScript, mais sans le script ni la feuille de thème.
    await ctx.close();
    const ctx2 = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    await ctx2.route('**/*', (r) => { const u = r.request().url(); (/chopa-effects\.js|chopa-theme\.js|chopa\.js/.test(u) ? r.abort() : r.continue()); });
    const pg = await ctx2.newPage();
    await pg.goto(p.url, { waitUntil: 'load' });
    await pg.evaluate(() => document.fonts.ready);
    const r = await pg.evaluate(VISIBLE);
    await ctx2.close();
    return r;
  }
  const r = await page.evaluate(VISIBLE);
  await ctx.close();
  return r;
}

async function avecScript(browser, p) {
  const o = await openPage(browser, p.url, { theme: p.theme });
  const { page } = o;
  try {
    for (const pr of o.problems) fail(`${p.nom} : ${pr}`);
    await raf(page, 4);
    // Témoin : au moins un titre sous la fenêtre est « en attente » et invisible.
    const wait = await page.evaluate(() => [...document.querySelectorAll('.ch-reveal[data-ch-reveal="wait"]')].map((e) => getComputedStyle(e).opacity));
    if (!wait.length) fail(`${p.nom} : aucun titre en attente au chargement (témoin absent : le test ne prouverait rien)`);
    else if (wait.some((x) => x !== '0')) fail(`${p.nom} : un titre en attente n'a pas l'opacité 0 (${wait.join(', ')})`);
    const bands = await page.evaluate(() => [...document.querySelectorAll('.ch-band__track')].map((e) => e.style.transform));
    if (!bands.length) fail(`${p.nom} : aucune bande`);
    // Défilement de 500 px : la transform de chaque bande change.
    const t1 = await page.evaluate(() => [...document.querySelectorAll('.ch-band__track')].map((e) => getComputedStyle(e).transform));
    await scrollTo(page, 500);
    const t2 = await page.evaluate(() => [...document.querySelectorAll('.ch-band__track')].map((e) => getComputedStyle(e).transform));
    t1.forEach((v, i) => { stats.defil++; if (v === t2[i] || t2[i] === 'none') fail(`${p.nom} : bande ${i} : transform inchangée après 500 px (${v} -> ${t2[i]})`); });
    // Sens inverse sur l'essai : la première bande recule, la seconde avance.
    if (p.essai) {
      const dx = (s) => parseFloat(s.match(/matrix\([^)]*?,\s*[^,]*?,\s*[^,]*?,\s*[^,]*?,\s*([-\d.e]+),/)?.[1] ?? 'NaN');
      const d0 = dx(t2[0]) - dx(t1[0]), d1 = dx(t2[1]) - dx(t1[1]);
      if (!(d0 < 0 && d1 > 0)) fail(`${p.nom} : sens des bandes inattendu (variations ${d0} et ${d1}, attendu < 0 puis > 0)`);
    }
    // Un défilement de plus : toujours en mouvement (pas de saut vers le même point).
    // Titres : chacun passe à l'opacité 1 une fois dans la fenêtre, et y reste.
    const ids = await page.evaluate(() => { document.querySelectorAll('.ch-reveal').forEach((e, i) => { e.dataset.fxi = i; }); return [...document.querySelectorAll('.ch-reveal')].map((e) => e.dataset.fxi); });
    for (const i of ids) {
      const h = page.locator(`[data-fxi="${i}"]`);
      await h.evaluate((e) => e.scrollIntoView({ block: 'center', behavior: 'instant' }));
      let ok = false, last = '';
      for (let k = 0; k < 40 && !ok; k++) {
        await raf(page, 2);
        last = await h.evaluate((e) => getComputedStyle(e).opacity + '|' + (e.getAttribute('data-ch-reveal') || '-'));
        ok = last.startsWith('1|') && !last.endsWith('|wait');
      }
      stats.titres++;
      if (!ok) fail(`${p.nom} : titre ${i} : opacité/état ${last} après 40 images dans la fenêtre`);
    }
    await scrollTo(page, 0);
    const after = await page.evaluate(() => [...document.querySelectorAll('.ch-reveal')].map((e) => getComputedStyle(e).opacity + '|' + (e.getAttribute('data-ch-reveal') || '-')));
    if (after.some((s) => !s.startsWith('1|'))) fail(`${p.nom} : un titre est redevenu invisible après être sorti de la fenêtre (${after.join(', ')})`);
    // Pas de défilement latéral de la page ; les bandes rognent dans leur boîte.
    const ov = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, ov: [...document.querySelectorAll('.ch-band')].map((b) => getComputedStyle(b).overflowX) }));
    stats.debord++;
    if (ov.sw > ov.cw) fail(`${p.nom} : la page défile de côté (${ov.sw} > ${ov.cw})`);
    if (ov.ov.some((v) => v !== 'hidden')) fail(`${p.nom} : une bande ne rogne pas (${ov.ov.join(', ')})`);
  } finally { await o.close(); }
}

// 3. Mouvement réduit.
async function reduit(browser, p) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
  await ctx.addInitScript((t) => { try { localStorage.setItem('ch-theme', t); } catch (_) {} }, p.theme);
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  try {
    await page.goto(p.url, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    const read = () => page.evaluate(() => ({
      anims: document.getAnimations().length,
      tr: [...document.querySelectorAll('.ch-band__track')].map((e) => getComputedStyle(e).transform + ' | ' + (e.style.transform || '(vide)')),
      copies: document.querySelectorAll('.ch-band__item[aria-hidden="true"]').length,
      attrs: document.querySelectorAll('[data-ch-reveal]').length,
      op: [...document.querySelectorAll('.ch-reveal')].map((e) => getComputedStyle(e).opacity + '/' + getComputedStyle(e).transform),
    }));
    for (const y of [0, 500, 1500]) {
      await scrollTo(page, y); await raf(page, 8);
      const r = await read();
      stats.reduit++;
      if (r.anims !== 0) fail(`${p.nom} (réduit, y=${y}) : ${r.anims} animation(s)`);
      if (!r.tr.length) fail(`${p.nom} (réduit) : aucune bande`);
      r.tr.forEach((s, i) => { if (s !== 'none | (vide)') fail(`${p.nom} (réduit, y=${y}) : bande ${i} : transform calculée | style en ligne = ${s} (attendu « none | (vide) » : le script ne doit rien écrire)`); });
      if (r.attrs) fail(`${p.nom} (réduit, y=${y}) : ${r.attrs} titre(s) marqué(s) par le script`);
      r.op.forEach((s, i) => { if (s !== '1/none') fail(`${p.nom} (réduit, y=${y}) : titre ${i} : opacité/transform ${s}`); });
    }
    for (const e of errs) fail(`${p.nom} (réduit) : erreur de page : ${e}`);
  } finally { await ctx.close(); }
}

// 4. Grain.
const rgb = (s) => (s.match(/[\d.]+/g) || []).slice(0, 3).map(Number);
const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const mix = (c, o, a) => c.map((v, i) => v * (1 - a) + o[i] * a);

async function grain(browser, p) {
  const o = await openPage(browser, p.url, { theme: p.theme });
  const { page } = o;
  try {
    await page.evaluate(() => document.getAnimations().forEach((a) => { try { a.finish(); } catch (_) {} }));
    const G = () => page.evaluate(() => {
      const cs = getComputedStyle(document.documentElement, '::after');
      return { content: cs.content, position: cs.position, pe: cs.pointerEvents, z: cs.zIndex, op: cs.opacity, bg: cs.backgroundColor, mask: cs.webkitMaskImage || cs.maskImage || 'none', hex: /#[0-9a-f]{3,8}/i.test(cs.backgroundImage) };
    });
    const hit = () => page.evaluate((pts) => pts.map(([x, y]) => { const e = document.elementFromPoint(x, y); return e ? e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (e.className && typeof e.className === 'string' ? '.' + e.className.split(' ')[0] : '') : 'null'; }), PROBES);
    // Hors essai : cinq points de la fenêtre.
    const pts = p.essai ? PROBES : [[40, 120], [640, 120], [640, 450], [200, 700], [1000, 700]];
    const hitPts = () => page.evaluate((pp) => pp.map(([x, y]) => { const e = document.elementFromPoint(x, y); return e ? e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (e.className && typeof e.className === 'string' ? '.' + e.className.split(' ')[0] : '') : 'null'; }), pts);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await raf(page);
    const off = await G();
    const hitsOff = await hitPts();
    const shotOff = await page.screenshot({ clip: { x: 0, y: 0, width: 640, height: 450 } });
    // Absent par défaut.
    if (off.content !== 'none' && off.content !== 'normal') fail(`${p.nom} : contenu généré présent sans la classe ch-grain (${off.content})`);
    await page.evaluate(() => document.documentElement.classList.add('ch-grain'));
    await raf(page);
    const on = await G();
    const hitsOn = await hitPts();
    const shotOn = await page.screenshot({ clip: { x: 0, y: 0, width: 640, height: 450 } });
    stats.grain++;
    if (on.content === 'none' || on.content === 'normal') fail(`${p.nom} : avec ch-grain, le calque n'existe pas`);
    if (on.position !== 'fixed') fail(`${p.nom} : position ${on.position} (attendu fixed)`);
    if (on.pe !== 'none') fail(`${p.nom} : pointer-events ${on.pe} (attendu none)`);
    if (!/^\d+$/.test(on.z) || Number(on.z) < 1) fail(`${p.nom} : z-index non explicite (${on.z})`);
    if (on.mask === 'none') fail(`${p.nom} : pas de masque de grain`);
    if (on.hex) fail(`${p.nom} : couleur hexadécimale dans le grain`);
    const fgc = await page.evaluate(() => { const s = document.createElement('span'); s.style.color = 'var(--ch-fg)'; document.body.appendChild(s); const c = getComputedStyle(s).color; s.remove(); return c; });
    if (on.bg !== fgc) fail(`${p.nom} : couleur du grain ${on.bg}, attendu le rôle fg ${fgc}`);
    if (JSON.stringify(shotOff) === JSON.stringify(shotOn) || Buffer.compare(shotOff, shotOn) === 0) fail(`${p.nom} : la capture est identique avec et sans grain (rien n'est peint)`);
    // elementFromPoint : le contenu, pas le calque.
    if (p.essai) {
      PROBES.forEach((_, i) => { if (hitsOn[i] !== `a#p${i}.probe`) fail(`${p.nom} : point ${i} : elementFromPoint rend « ${hitsOn[i]} » au lieu de a#p${i}.probe`); });
    }
    pts.forEach((_, i) => { if (hitsOn[i] !== hitsOff[i]) fail(`${p.nom} : point ${i} : avec le grain « ${hitsOn[i]} », sans « ${hitsOff[i]} »`); });
    // Contraste sous le grain (essai) : texte et fond mêlés à fg à l'opacité du calque, masque supposé entièrement opaque (pire cas).
    if (p.essai) {
      const pairs = await page.evaluate(() => [...document.querySelectorAll('[data-pair]')].map((e) => { const cs = getComputedStyle(e); return { nom: e.dataset.pair, c: cs.color, b: cs.backgroundColor }; }));
      const a = parseFloat(on.op), over = rgb(fgc);
      for (const q of pairs) {
        stats.contrastes++;
        const base = ratio(rgb(q.c), rgb(q.b)), sous = ratio(mix(rgb(q.c), over, a), mix(rgb(q.b), over, a));
        minContrast = Math.min(minContrast, sous);
        if (base < 4.5) fail(`${p.nom} : ${q.nom} : contraste sans grain ${base.toFixed(2)} < 4,5`);
        if (sous < 4.5) fail(`${p.nom} : ${q.nom} : contraste sous le grain (pire cas) ${sous.toFixed(2)} < 4,5 (sans grain ${base.toFixed(2)})`);
      }
    }
  } finally { await o.close(); }
}

// 5. axe-core et débordement sur /effets/.
async function axe(browser, theme, width, avecGrain) {
  const o = await openPage(browser, SERVER.url + '/effets/', { width, height: width < 800 ? 812 : 900, theme });
  const { page } = o;
  try {
    for (const pr of o.problems) fail(`axe /effets/ ${theme} ${width} : ${pr}`);
    const n = await page.evaluate(() => document.querySelectorAll('.ch-reveal').length);
    for (let i = 0; i < n; i++) await page.locator('.ch-reveal').nth(i).evaluate((e) => e.scrollIntoView({ block: 'center', behavior: 'instant' }));
    await scrollTo(page, 0);
    if (avecGrain) await page.evaluate(() => { document.documentElement.classList.add('ch-grain'); document.getElementById('fx-grain')?.click(); });
    await raf(page, 6);
    await page.evaluate(() => document.getAnimations().forEach((a) => { try { a.finish(); } catch (_) {} }));
    await page.evaluate(axeSrc);
    const r = await page.evaluate(() => axe.run(document));
    stats.axe++;
    for (const v of r.violations) fail(`axe /effets/ ${theme} ${width}${avecGrain ? ' grain' : ''} : ${v.id} (${v.nodes.length}) ${v.nodes[0]?.target?.join(' ')}`);
    const ov = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
    stats.debord++;
    if (ov.sw > ov.cw) fail(`/effets/ ${theme} ${width} : la page défile de côté (${ov.sw} > ${ov.cw})`);
  } finally { await o.close(); }
}

let SERVER;
try {
  await withBench(async ({ server, launch }) => {
    SERVER = server;
    const { browser } = await launch('chromium');
    for (const p of pages(server)) {
      for (const mode of ['nojs', 'abort']) {
        const r = await sansScript(browser, p, mode);
        stats[mode === 'nojs' ? 'sansJs' : 'echec']++;
        if (!r.n) fail(`${p.nom} (${mode}) : aucun élément mesuré`);
        for (const pr of r.probs) fail(`${p.nom} (${mode === 'nojs' ? 'sans script ni JavaScript' : 'script bloqué'}) : ${pr}`);
      }
      await avecScript(browser, p);
      await reduit(browser, p);
      await grain(browser, p);
    }
    for (const t of RUN_THEMES) { await axe(browser, t, 1280, false); await axe(browser, t, 1280, true); }
    await axe(browser, 'sombre', 375, false);
    if (!MUT) { await axe(browser, 'clair', 375, true); await axe(browser, 'chaud', 375, false); }
  }, { virtual });
} catch (e) { fail(`exception : ${e.stack || e}`); }

// Mutations : seulement dans l'exécution principale.
const mutLog = [];
if (!MUT) {
  for (const m of ['garde', 'pointer']) {
    const r = spawnSync(process.execPath, [fileURLToPath(import.meta.url)], { env: { ...process.env, CH_EFFETS_MUTATION: m }, encoding: 'utf8' });
    const attendu = m === 'garde' ? /\(réduit/ : /elementFromPoint|pointer-events/;
    const lignes = (r.stdout || '').split('\n').filter((l) => l.startsWith('ÉCHEC') && attendu.test(l));
    mutLog.push(`${m} : exit ${r.status}`);
    if (r.status !== 1) fail(`mutation « ${m} » : code ${r.status} (attendu 1) : l'écart n'est pas détecté`);
    else if (!lignes.length) fail(`mutation « ${m} » : code 1 sans l'échec attendu (échec pour une autre raison ?)`);
    else console.log(`mutation « ${m} » : exit 1, ${lignes.length} échec(s), ex. ${lignes[0].slice(0, 150)}`);
  }
}
for (const f of fails) console.log('ÉCHEC ' + f);
console.log(`effets${MUT ? ` [mutation ${MUT}]` : ''} : sans JS ${stats.sansJs}, script bloqué ${stats.echec}, défilement 500 px ${stats.defil} bande(s), ${stats.titres} titre(s) révélé(s), mouvement réduit ${stats.reduit} lecture(s), grain ${stats.grain} thème(s), ${stats.contrastes} contraste(s) sous grain (min ${minContrast === 99 ? 'n/a' : minContrast.toFixed(2)}), axe ${stats.axe} analyse(s), ${stats.debord} mesure(s) de débordement, mutations ${mutLog.join(' ; ') || (MUT ? 'n/a' : 'aucune')}, ${fails.length} échec(s), ${((Date.now() - t0) / 1000).toFixed(1)} s`);
process.exit(fails.length ? 1 : 0);
