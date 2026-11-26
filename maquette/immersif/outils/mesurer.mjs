// Mesures de la maquette immersive (brief 31), Chromium sans fenêtre (cache Playwright, aucun téléchargement).
// Usage, depuis la racine du projet : node maquette/immersif/outils/mesurer.mjs
// Lit maquette/immersif/ par un serveur statique sur un port libre (port 0) ; n'écrit aucun fichier.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { startServer, launch } from '../../../scripts/lib/browser.mjs';

const ICI = dirname(fileURLToPath(import.meta.url));
const MAQ = join(ICI, '..');
const AXE = readFileSync(join(ICI, '../../../node_modules/axe-core/axe.min.js'), 'utf8');
const THEMES = ['sombre', 'clair', 'chaud'];
const PAGES = ['/index.html', '/bouton.html', '/piece.html?p=input'];
const res = { echecs: [] };
const log = (...a) => console.log(...a);
const echec = (m) => { res.echecs.push(m); log('  ÉCHEC :', m); };

const server = await startServer(MAQ);
const { browser, note } = await launch('chromium');
if (note) log(note);
log(`Chromium ${browser.version()}`);

async function ouvrir(chemin, { theme = 'sombre', width = 1440, height = 900, reduit = false, js = true, attendreMur = true, init = null } = {}) {
  const context = await browser.newContext({ viewport: { width, height }, reducedMotion: reduit ? 'reduce' : 'no-preference', javaScriptEnabled: js });
  await context.addInitScript((t) => { try { localStorage.setItem('ch-theme', t); } catch (_) {} }, theme);
  if (init) await context.addInitScript(init);
  const page = await context.newPage();
  const problemes = [];
  page.on('console', (m) => { if (m.type() === 'error') problemes.push(`console : ${m.text()}`); });
  page.on('pageerror', (e) => problemes.push(`erreur de page : ${e.message}`));
  page.on('requestfailed', (r) => problemes.push(`requête en échec : ${r.url()} (${r.failure()?.errorText})`));
  page.on('response', (r) => { if (r.status() >= 400) problemes.push(`réponse ${r.status()} : ${r.url()}`); });
  await page.goto(server.url + chemin, { waitUntil: 'load' });
  if (js) {
    await page.evaluate(() => document.fonts.ready);
    if (attendreMur && chemin.startsWith('/index')) {
      await page.waitForFunction(() => window.__imMur && (window.__imMur.mode === 'mur' || !document.documentElement.classList.contains('im-mur')), null, { timeout: 10000 }).catch(() => {});
    }
  }
  return { page, context, problemes, fermer: () => context.close().catch(() => {}) };
}

async function axe(page) {
  await page.addScriptTag({ content: AXE });
  return page.evaluate(async () => {
    const r = await window.axe.run(document);
    return r.violations.map((v) => ({ id: v.id, n: v.nodes.length, cibles: v.nodes.slice(0, 3).map((n) => n.target.join(' ')) }));
  });
}

// Images par seconde pendant `ms` : compte des requestAnimationFrame et pire intervalle.
async function fps(page, ms, avant) {
  return page.evaluate(async ({ ms, avant }) => {
    const t = [];
    let go = true;
    const f = (x) => { t.push(x); if (go) requestAnimationFrame(f); };
    requestAnimationFrame(f);
    if (avant) eval(avant); // eslint-disable-line no-eval -- texte fixe de ce script, pas une donnée extérieure
    await new Promise((ok) => setTimeout(ok, ms));
    go = false;
    const d = t.slice(1).map((x, i) => x - t[i]);
    const duree = (t[t.length - 1] - t[0]) / 1000;
    return { images: t.length, fps: +((t.length - 1) / duree).toFixed(1), pire: +Math.max(...d).toFixed(1), mediane: +d.sort((a, b) => a - b)[Math.floor(d.length / 2)].toFixed(1) };
  }, { ms, avant });
}

try {
  // ---------- 1. Erreurs console et requêtes : 3 pages × 3 thèmes, mode mur ; plus la grille (mouvement réduit) ----------
  log('\n1. Console et requêtes');
  for (const theme of THEMES) for (const p of PAGES) for (const reduit of [false, true]) {
    if (reduit && p !== '/index.html') continue;
    const o = await ouvrir(p, { theme, reduit });
    await o.page.mouse.move(700, 400);
    await o.page.waitForTimeout(1200);
    const mode = await o.page.evaluate(() => window.__imMur?.mode ?? '-');
    log(`  ${p} ${theme}${reduit ? ' (réduit)' : ''} mode=${mode} : ${o.problemes.length} problème(s)`);
    o.problemes.forEach((x) => echec(`${p} ${theme} : ${x}`));
    if (p === '/index.html' && mode !== (reduit ? 'grille' : 'mur')) echec(`${p} ${theme} : mode ${mode}`);
    await o.fermer();
  }

  // ---------- 2. Images par seconde ----------
  log('\n2. Images par seconde (Chromium sans fenêtre)');
  {
    const o = await ouvrir('/index.html');
    const gpu = await o.page.evaluate(() => {
      const c = document.createElement('canvas');
      const gl = c.getContext('webgl');
      const ext = gl && gl.getExtension('WEBGL_debug_renderer_info');
      return gl ? (ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : 'webgl sans nom') : 'pas de WebGL';
    });
    log(`  rendu du navigateur : ${gpu}`);
    await o.page.mouse.move(720, 450);
    await o.page.waitForTimeout(2600); // la dérive d'orbite démarre après 2,2 s sans pointeur
    const c0 = await o.page.evaluate(() => ({ ...window.__imMur.cam }));
    const repos = await fps(o.page, 5000);
    const c1 = await o.page.evaluate(() => ({ ...window.__imMur.cam }));
    const bouge = Math.abs(c1.yaw - c0.yaw) + Math.abs(c1.pitch - c0.pitch);
    log(`  orbite au repos, 5 s : ${JSON.stringify(repos)} ; caméra : lacet ${c0.yaw.toFixed(4)} → ${c1.yaw.toFixed(4)}`);
    if (bouge < 1e-4) echec('orbite au repos : la caméra ne bouge pas');
    res.fpsRepos = repos;
    // Plongée vers la 20e tuile, sans navigation (puis sortie) : 1,15 s de plongée + 1,4 s de sortie.
    const plongee = await fps(o.page, 1150, 'window.__imMur.plonger(20, false)');
    log(`  plongée (1,15 s) : ${JSON.stringify(plongee)}`);
    res.fpsPlongee = plongee;
    await o.page.waitForTimeout(1800);
    const libre = await o.page.evaluate(() => window.__imMur.phase);
    if (libre !== 'libre') echec(`après la plongée et la sortie, phase ${libre}`);
    // Défilement : 3 000 px en 2 s par la molette.
    const t0 = await o.page.evaluate(() => window.__imMur.cam.x);
    const defile = await fps(o.page, 2000, 'let k=0; const id=setInterval(()=>{ scrollBy(0,50); if(++k>=60) clearInterval(id); }, 16)');
    const t1 = await o.page.evaluate(() => window.__imMur.cam.x);
    log(`  trajet le long du mur (défilement 3 000 px) : ${JSON.stringify(defile)} ; caméra x ${t0.toFixed(0)} → ${t1.toFixed(0)}`);
    if (t1 - t0 < 1000) echec('le défilement ne fait pas avancer la caméra');
    await o.fermer();
  }

  // ---------- 3. Mouvement réduit ----------
  log('\n3. Mouvement réduit');
  for (const p of ['/index.html', '/bouton.html']) {
    const o = await ouvrir(p, { reduit: true });
    await o.page.mouse.move(600, 300);
    await o.page.waitForTimeout(1500);
    const a = await o.page.evaluate(() => ({
      anims: document.getAnimations().length,
      mur: document.documentElement.classList.contains('im-mur'),
      images: window.__imMur?.images ?? null,
      scene: document.querySelector('.im-scene') ? getComputedStyle(document.querySelector('.im-scene')).display : null,
      vivant: window.__imPage?.vivant ?? null, aimants: window.__imPage?.aimants ?? null,
      curseur: document.documentElement.classList.contains('im-curseur-on'),
      tr: [...document.querySelectorAll('.im-tuile, .im-vivant__l, .ch-btn')].map((e) => getComputedStyle(e).transform).filter((t) => t !== 'none').length,
    }));
    await o.page.mouse.move(900, 500);
    await o.page.mouse.wheel(0, 600);
    await o.page.waitForTimeout(800);
    const b = await o.page.evaluate(() => ({ anims: document.getAnimations().length, images: window.__imMur?.images ?? null, tr: [...document.querySelectorAll('.im-tuile, .im-vivant__l, .ch-btn')].map((e) => getComputedStyle(e).transform).filter((t) => t !== 'none').length }));
    log(`  ${p} : ${JSON.stringify(a)} ; après pointeur et molette : ${JSON.stringify(b)}`);
    if (a.anims || b.anims) echec(`${p} réduit : ${a.anims}/${b.anims} animation(s)`);
    if (a.mur || (a.images ?? 0) > 0 || (b.images ?? 0) > 0) echec(`${p} réduit : scène lancée`);
    if (a.tr || b.tr) echec(`${p} réduit : ${a.tr}/${b.tr} élément(s) transformé(s)`);
    if (a.vivant || a.aimants || a.curseur) echec(`${p} réduit : typo vivante, aimants ou curseur actifs`);
    await o.fermer();
  }

  // ---------- 4. Sans JavaScript ----------
  log('\n4. Sans JavaScript');
  {
    const o = await ouvrir('/index.html', { js: false });
    const t = await o.page.evaluate(() => [...document.querySelectorAll('.im-tuile')].map((li) => {
      const r = li.getBoundingClientRect(); const a = li.querySelector('.im-tuile__lien');
      return { vu: r.width > 100 && r.height > 100 && getComputedStyle(li).visibility === 'visible', href: a && a.getAttribute('href'), nom: a && a.textContent.trim() };
    }));
    const invisibles = t.filter((x) => !x.vu).length;
    let ko = 0;
    for (const x of new Set(t.map((x) => x.href))) {
      const r = await o.context.request.get(new URL(x, server.url + '/').href);
      if (r.status() !== 200) { ko++; echec(`sans JS : ${x} → ${r.status()}`); }
    }
    await o.page.click('#p-button .im-tuile__lien');
    await o.page.waitForURL(/bouton\.html/, { timeout: 5000 }).catch(() => {});
    const arrive = o.page.url();
    log(`  ${t.length} tuiles, ${invisibles} invisible(s), ${new Set(t.map((x) => x.href)).size} cibles distinctes, ${ko} lien(s) en échec ; clic sur « Bouton » → ${arrive.replace(server.url, '')}`);
    if (t.length !== 72 || invisibles) echec('sans JS : tuiles manquantes ou cachées');
    if (!/bouton\.html/.test(arrive)) echec('sans JS : le clic n\'ouvre pas la page Bouton');
    await o.fermer();
  }

  // ---------- 4 bis. Sans WebGL (getContext('webgl') rendu nul par un script d'initialisation) ----------
  log('\n4 bis. Sans WebGL');
  {
    const o = await ouvrir('/index.html', { init: () => {
      const g = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (t, ...r) { return /webgl/.test(String(t)) ? null : g.call(this, t, ...r); };
    } });
    await o.page.waitForTimeout(800);
    const m = await o.page.evaluate(() => ({ mode: window.__imMur.mode, images: window.__imMur.images, vues: [...document.querySelectorAll('.im-tuile')].filter((li) => li.getBoundingClientRect().width > 100).length }));
    await o.page.click('#p-input .im-tuile__lien');
    await o.page.waitForURL(/piece\.html\?p=input/, { timeout: 5000 }).catch(() => {});
    log(`  mode ${m.mode}, ${m.images} image(s) de scène, ${m.vues} tuiles visibles ; clic sur « Champ texte » → ${o.page.url().replace(server.url, '')}`);
    if (m.mode !== 'grille' || m.vues !== 72 || !/p=input/.test(o.page.url())) echec('sans WebGL : la grille immobile n\'est pas servie');
    o.problemes.forEach((x) => echec(`sans WebGL : ${x}`));
    await o.fermer();
  }

  // ---------- 5. Clavier ----------
  log('\n5. Clavier');
  for (const reduit of [false, true]) {
    const o = await ouvrir('/index.html', { reduit });
    const mode = await o.page.evaluate(() => window.__imMur.mode);
    await o.page.keyboard.press('Tab');
    const premier = await o.page.evaluate(() => document.activeElement.className);
    await o.page.keyboard.press('Enter'); // lien d'évitement → #pieces
    const attendu = await o.page.evaluate(() => [...document.querySelectorAll('.im-tuile')].slice(0, 10).map((t) => t.dataset.slug));
    const vu = [];
    const xs = [];
    for (let k = 0; k < 10; k++) {
      await o.page.keyboard.press('Tab');
      await o.page.waitForTimeout(mode === 'mur' ? 250 : 30);
      vu.push(await o.page.evaluate(() => document.activeElement.closest('.im-tuile')?.dataset.slug ?? document.activeElement.className));
      if (mode === 'mur') xs.push(await o.page.evaluate(() => Math.round(window.__imMur.cam.x)));
    }
    const ordreOk = JSON.stringify(vu) === JSON.stringify(attendu);
    const anneau = mode === 'mur' ? await o.page.evaluate(() => document.querySelectorAll('.im-tuile3d.is-focus').length) : null;
    log(`  ${mode} : 1er Tab = ${premier} ; 10 tuiles ${ordreOk ? 'dans l\'ordre' : 'HORS ORDRE'} (${vu.join(', ')})${mode === 'mur' ? ` ; caméra x : ${xs.join(' → ')} ; anneau sur ${anneau} tuile 3D` : ''}`);
    if (!ordreOk) echec(`clavier ${mode} : ordre ${vu.join(',')}`);
    if (mode === 'mur' && anneau !== 1) echec('clavier mur : pas d\'anneau sur la tuile 3D');
    // Flèches depuis la 1re tuile.
    await o.page.focus('#p-conteneur .im-tuile__lien');
    await o.page.waitForTimeout(100);
    const fl = {};
    for (const k of ['ArrowDown', 'ArrowRight', 'ArrowLeft', 'ArrowUp']) {
      await o.page.keyboard.press(k);
      await o.page.waitForTimeout(mode === 'mur' ? 200 : 30);
      fl[k] = await o.page.evaluate(() => document.activeElement.closest('.im-tuile')?.dataset.slug);
    }
    log(`  flèches depuis « conteneur » : ${JSON.stringify(fl)}`);
    if (!fl.ArrowDown || fl.ArrowDown === 'conteneur' || !fl.ArrowRight) echec(`flèches ${mode} : ${JSON.stringify(fl)}`);
    // Entrée ouvre la pièce.
    await o.page.focus('#p-button .im-tuile__lien');
    await o.page.waitForTimeout(mode === 'mur' ? 400 : 30);
    const t0 = Date.now();
    await o.page.keyboard.press('Enter');
    await o.page.waitForURL(/bouton\.html/, { timeout: 6000 }).catch(() => {});
    log(`  Entrée sur « Bouton » → ${o.page.url().replace(server.url, '')} en ${Date.now() - t0} ms`);
    if (!/bouton\.html/.test(o.page.url())) echec(`clavier ${mode} : Entrée n'ouvre pas la page`);
    o.problemes.forEach((x) => echec(`clavier ${mode} : ${x}`));
    await o.fermer();
  }

  // ---------- 6. Transition de vue (plongée → page, retour → mur) ----------
  log('\n6. Transitions de page');
  {
    const o = await ouvrir('/index.html', { init: () => {
      addEventListener('pagereveal', (e) => { window.__vt = Boolean(e.viewTransition); });
      addEventListener('pageswap', (e) => { sessionStorage.setItem('vt-swap', String(Boolean(e.viewTransition))); });
    } });
    await o.page.mouse.move(700, 450);
    await o.page.evaluate(() => scrollTo(0, 1200));
    await o.page.waitForTimeout(900);
    await o.page.evaluate(() => window.__imMur.plonger([...document.querySelectorAll('.im-tuile')].findIndex((t) => t.dataset.slug === 'button')));
    await o.page.waitForURL(/bouton\.html/, { timeout: 6000 });
    await o.page.waitForTimeout(800);
    const allerVT = await o.page.evaluate(() => ({ swap: sessionStorage.getItem('vt-swap'), reveal: window.__vt, nom: getComputedStyle(document.querySelector('.im-piece-hero')).viewTransitionName }));
    await o.page.click('.im-retour');
    await o.page.waitForURL(/index\.html#p-button/, { timeout: 6000 });
    await o.page.waitForFunction(() => window.__imMur?.mode === 'mur');
    const phase0 = await o.page.evaluate(() => ({ phase: window.__imMur.phase, d: Math.round(window.__imMur.cam.d) }));
    await o.page.waitForTimeout(2000);
    const phase1 = await o.page.evaluate(() => ({ phase: window.__imMur.phase, d: Math.round(window.__imMur.cam.d), x: Math.round(window.__imMur.cam.x), vt: window.__vt }));
    log(`  aller : ${JSON.stringify(allerVT)} ; retour : départ ${JSON.stringify(phase0)} → ${JSON.stringify(phase1)}`);
    if (allerVT.reveal !== true) echec('pas de transition de vue à l\'arrivée sur la pièce');
    if (phase1.phase !== 'libre' || phase0.d >= phase1.d) echec('retour : la caméra ne sort pas de la tuile');
    o.problemes.forEach((x) => echec(`transitions : ${x}`));
    await o.fermer();
  }

  // ---------- 7. axe-core ----------
  log('\n7. axe-core');
  let analyses = 0, violations = 0;
  for (const theme of THEMES) for (const [p, reduit] of [['/index.html', false], ['/index.html', true], ['/bouton.html', false], ['/piece.html?p=input', false]]) {
    const o = await ouvrir(p, { theme, reduit });
    await o.page.waitForTimeout(1300);
    const v = await axe(o.page);
    analyses++; violations += v.length;
    log(`  ${p} ${theme}${reduit ? ' (grille)' : ''} : ${v.length} violation(s)${v.length ? ' ' + JSON.stringify(v) : ''}`);
    v.forEach((x) => echec(`axe ${p} ${theme} : ${x.id}`));
    await o.fermer();
  }
  // Toutes les pages modèles, thème sombre : l'aperçu vivant de chaque pièce.
  const { pieces } = await import(join(MAQ, 'donnees.js'));
  let vm = 0;
  for (const x of pieces.filter((p) => p.slug !== 'button')) {
    const o = await ouvrir(`/piece.html?p=${x.slug}`, { reduit: true });
    const v = await axe(o.page);
    analyses++; vm += v.length; violations += v.length;
    if (v.length) { log(`  piece.html?p=${x.slug} : ${JSON.stringify(v)}`); v.forEach((y) => echec(`axe piece ${x.slug} : ${y.id}`)); }
    o.problemes.forEach((y) => echec(`piece ${x.slug} : ${y}`));
    await o.fermer();
  }
  log(`  pages modèles : ${pieces.length - 1} analysées, ${vm} violation(s)`);
  log(`  total : ${analyses} analyses, ${violations} violation(s)`);

  // ---------- 8. 375 px ----------
  log('\n8. Largeur 375 px');
  for (const p of PAGES) for (const theme of ['sombre']) {
    const o = await ouvrir(p, { theme, width: 375, height: 812 });
    await o.page.waitForTimeout(600);
    const m = await o.page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, mode: window.__imMur?.mode ?? '-', petites: [...document.querySelectorAll('a[href], button, input, select')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.height < 44 && !e.closest('[inert]') && !e.closest('.im-tuile__pied') && !e.closest('.ch-skip, .im-sr'); }).map((e) => e.textContent.trim().slice(0, 20) || e.className).slice(0, 5) }));
    log(`  ${p} : scrollWidth ${m.sw} / clientWidth ${m.cw}, mode ${m.mode}${m.petites.length ? ', cibles < 44 px : ' + JSON.stringify(m.petites) : ''}`);
    if (m.sw > m.cw) echec(`${p} 375 px : défilement horizontal (${m.sw} > ${m.cw})`);
    o.problemes.forEach((x) => echec(`${p} 375 px : ${x}`));
    await o.fermer();
  }

  // ---------- 9. Poids ----------
  log('\n9. Poids (octets, gzip niveau 9)');
  const fichiers = ['mur.js', 'scene.js', 'page.js', 'curseur.js', 'donnees.js', 'immersif.css', 'index.html', 'bouton.html', 'piece.html', 'vendor/three.core.js', 'vendor/CSS3DRenderer.js'];
  for (const f of fichiers) {
    const b = readFileSync(join(MAQ, f));
    log(`  ${f} : ${b.length} o, ${gzipSync(b, { level: 9 }).length} o gzip`);
  }
  const chopa = readdirSync(join(MAQ, 'chopa')).filter((f) => statSync(join(MAQ, 'chopa', f)).isFile()).reduce((n, f) => n + statSync(join(MAQ, 'chopa', f)).size, 0);
  log(`  chopa/ (copie de dist-lib, hors polices) : ${chopa} o`);
} finally {
  await browser.close();
  await server.close();
}
log(`\nRésultat : ${res.echecs.length} échec(s)`);
process.exitCode = res.echecs.length ? 1 : 0;
