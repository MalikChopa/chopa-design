// Le mur de l'accueil (I2, docs/ARCHITECTURE.md §16.8) : page « / » construite (CH_OUT), Chromium (WebKit : ouverture seulement).
//  1. 1 440 × 900 : mode mur, 72 tuiles 3D, 72 liens distincts (hors de la vue), scène aria-hidden sans lien, id ni name ;
//     un seul `im-piece` (la scène) et un seul `im-barre` ; introduction inert, h1 dehors ; licence de three servie.
//  2. Clic sur une tuile 3D -> la bonne page ; Entrée sur une tuile -> la page en moins de 2 s.
//  3. Tab : lien d'évitement, puis les 10 premières tuiles dans l'ordre, la caméra suit, 1 seul anneau 3D ; flèches = tuile voisine.
//  4. Retombées sur la grille immobile de 72 liens, 0 image de scène : sans JavaScript, sans WebGL, sans 3D CSS, mouvement réduit,
//     800 × 600, version calme, module du mur bloqué, scène bloquée. Seuil franchi et calme basculé sans recharger, dans les deux sens.
//  5. 375 px : 0 défilement horizontal (3 thèmes).
//  6. Orbite au repos 5 s : >= 50 images par seconde, pire intervalle <= 50 ms (banc sans GPU) ; tuiles 3D affichées <= 30
//     à six positions du mur ; nœuds DOM <= 8 000 (Performance.getMetrics) ; 0 erreur console.
//  7. Textes de la scène : couleur et fond dans les paires autorisées (section 9), contraste >= 4,5, 3 thèmes.
//  8. axe-core : 0 violation en mode mur et en mode grille, 3 thèmes. Arbre ARIA de la grille (#pieces, h1, familles) identique
//     en mode mur et en mode grille (ariaSnapshot).
//  9. Garde de lenteur (écrite ici, mesurée à fond à I4) : requestAnimationFrame ralenti -> grille, message role="status", clé de session ;
//     déclenchée pendant une plongée, la page demandée s'ouvre quand même.
// Lit CH_OUT. N'écrit aucun fichier.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { withBench, THEMES } from '../lib/browser.mjs';

const t0 = Date.now();
const fails = [];
const mesures = [];
const echec = (m) => { fails.push(m); console.error('immersif-mur : ÉCHEC ' + m); };
const verifie = (cond, m) => { if (!cond) echec(m); return cond; };
const note = (m) => { mesures.push(m); console.log('immersif-mur : ' + m); };
const AXE = readFileSync(createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8');

const sansWebgl = () => {
  const g = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (t, ...r) { return /webgl/.test(String(t)) ? null : g.call(this, t, ...r); };
};
const sans3d = () => {
  const s = CSS.supports.bind(CSS);
  CSS.supports = (...a) => (String(a[0]).includes('transform-style') ? false : s(...a));
};
const calmeAuDepart = () => { try { localStorage.setItem('doc-calme', '1'); } catch (_) { /* ignoré */ } };
// requestAnimationFrame ralenti à environ 70 ms : machine lente simulée (la garde de M14 doit renvoyer à la grille).
const rafLent = () => {
  window.requestAnimationFrame = (f) => setTimeout(() => f(performance.now()), 70);
  window.cancelAnimationFrame = (id) => clearTimeout(id);
};

await withBench(async ({ server, launch }) => {
  const { browser, note: repli } = await launch('chromium');
  if (repli) console.log('immersif-mur : ' + repli);
  console.log(`immersif-mur : Chromium ${browser.version()}`);

  async function ouvrir(chemin, { theme = 'sombre', width = 1440, height = 900, reduit = false, js = true, init = [], attendre = true, bloquer = [] } = {}) {
    const context = await browser.newContext({ viewport: { width, height }, reducedMotion: reduit ? 'reduce' : 'no-preference', javaScriptEnabled: js });
    await context.addInitScript((t) => { try { localStorage.setItem('ch-theme', t); } catch (_) { /* ignoré */ } }, theme);
    for (const f of init) await context.addInitScript(f);
    const problemes = [];
    const page = await context.newPage();
    for (const motif of bloquer) await page.route(motif, (r) => r.abort());
    page.on('console', (m) => { if (m.type() === 'error') problemes.push(`console : ${m.text()}`); });
    page.on('pageerror', (e) => problemes.push(`erreur de page : ${e.message}`));
    page.on('requestfailed', (r) => problemes.push(`requête en échec : ${r.url()} (${r.failure()?.errorText})`));
    page.on('response', (r) => { if (r.status() >= 400) problemes.push(`réponse ${r.status()} : ${r.url()}`); });
    await page.goto(server.url + chemin, { waitUntil: 'load' });
    if (js) {
      await page.evaluate(() => document.fonts.ready);
      if (attendre) await page.waitForFunction(() => window.__imMur && (window.__imMur.mode === 'mur' || !document.documentElement.classList.contains('im-mur')), null, { timeout: 10000 }).catch(() => {});
    }
    return { page, context, problemes, fermer: () => context.close().catch(() => {}) };
  }

  // ---- lectures dans la page ----
  const lireMode = (page) => page.evaluate(() => ({
    mode: window.__imMur?.mode ?? null, classe: document.documentElement.classList.contains('im-mur'), images: window.__imMur?.images ?? null,
    scene: getComputedStyle(document.querySelector('.im-scene')).display, vues: window.__imMur?.tuilesVues ?? null,
    intro: document.querySelector('[data-im-intro]').inert,
  }));
  const grilleVisible = (page) => page.evaluate(() => {
    const tuiles = [...document.querySelectorAll('.im-pieces .im-tuile')];
    const vues = tuiles.filter((li) => { const r = li.getBoundingClientRect(); return r.width > 100 && r.height > 100 && getComputedStyle(li).visibility === 'visible'; }).length;
    const hrefs = tuiles.map((li) => li.querySelector('.im-tuile__lien')?.getAttribute('href'));
    return { tuiles: tuiles.length, vues, distincts: new Set(hrefs).size, hrefs };
  });

  // ============ 1. Mode mur à 1 440 × 900 ============
  console.log('\n1. Mode mur');
  {
    const o = await ouvrir('/');
    await o.page.mouse.move(720, 450);
    await o.page.waitForTimeout(1200);
    const m = await lireMode(o.page);
    verifie(m.mode === 'mur' && m.classe, `mode attendu mur, lu ${m.mode} (classe im-mur : ${m.classe})`);
    verifie(m.images > 20, `la scène ne tourne pas (${m.images} image(s))`);
    const d = await o.page.evaluate(() => ({
      tuiles3d: document.querySelectorAll('.im-scene .im-tuile3d').length,
      liens: [...document.querySelectorAll('.im-pieces .im-tuile__lien')].map((a) => a.getAttribute('href')),
      sceneAria: document.querySelector('.im-scene').getAttribute('aria-hidden'),
      cloneLiens: document.querySelectorAll('.im-scene [id], .im-scene [name], .im-scene .im-tuile3d > a, .im-scene .im-tuile__pied a').length
        + [...document.querySelectorAll('.im-scene a[href], .im-scene button, .im-scene input, .im-scene select, .im-scene textarea, .im-scene [tabindex]')].filter((e) => !e.closest('[inert]')).length,
      piece: [...document.querySelectorAll('*')].filter((e) => getComputedStyle(e).viewTransitionName === 'im-piece').map((e) => e.className),
      barre: [...document.querySelectorAll('*')].filter((e) => getComputedStyle(e).viewTransitionName === 'im-barre').length,
      introInert: document.querySelector('[data-im-intro]').inert,
      h1Inert: !!document.querySelector('h1').closest('[inert]'),
      h2: [...document.querySelectorAll('#pieces h2')].map((h) => h.textContent.replace(/\s+/g, ' ').trim()),
      focalisablesIntro: document.querySelector('[data-im-intro]').querySelectorAll('a[href], button').length,
      calmeBtn: (() => { const b = document.querySelector('[data-im-calme]'); return b && { cache: b.hidden, h: b.getBoundingClientRect().height }; })(),
      scrollMax: document.documentElement.scrollHeight - innerHeight,
    }));
    note(`mur : ${d.tuiles3d} tuiles 3D, ${d.liens.length} liens (${new Set(d.liens).size} distincts), nœuds ${await o.page.evaluate(() => document.getElementsByTagName('*').length)}`);
    verifie(d.tuiles3d === 72, `${d.tuiles3d} tuiles 3D au lieu de 72`);
    verifie(d.liens.length === 72 && new Set(d.liens).size === 72, `${d.liens.length} liens, ${new Set(d.liens).size} distincts (72 attendus)`);
    verifie(d.sceneAria === 'true', 'la scène n\'est pas aria-hidden');
    verifie(d.cloneLiens === 0, `${d.cloneLiens} lien de tuile, id, name ou élément focalisable (hors inert) dans la scène`);
    verifie(d.piece.length === 1 && /im-scene/.test(d.piece[0]), `view-transition-name im-piece : ${JSON.stringify(d.piece)} (la scène seule attendue)`);
    verifie(d.barre === 1, `${d.barre} élément(s) im-barre`);
    verifie(d.introInert && d.focalisablesIntro > 0, `introduction : inert ${d.introInert}, ${d.focalisablesIntro} focalisable(s) cachés par inert`);
    verifie(!d.h1Inert, 'le h1 est dans une partie inert');
    const h1 = await o.page.locator('h1').ariaSnapshot();
    verifie(/heading "Chopa Design" \[level=1\]/.test(h1), `nom accessible du h1 : ${h1}`);
    verifie(d.h2.length === 7 && d.h2.every((t) => /pièces?$/.test(t)), `h2 des familles : ${JSON.stringify(d.h2)}`);
    verifie(d.calmeBtn && !d.calmeBtn.cache && d.calmeBtn.h >= 44, `bouton « Version calme » : ${JSON.stringify(d.calmeBtn)}`);
    const lic = await o.context.request.get(server.url + '/licences/three.txt');
    const txt = await lic.text();
    verifie(lic.status() === 200 && /MIT License/i.test(txt) && /three/i.test(txt), `licence de three : ${lic.status()}, ${txt.length} o, MIT ${/MIT License/i.test(txt)}`);
    verifie(/<a[^>]+href="\/licences\/three\.txt"/.test(await o.page.content()), 'lien « three.js (MIT) » absent de la page');
    const hrefs = [...new Set(d.liens)];
    let ko = 0;
    for (const h of hrefs) { const r = await o.context.request.get(new URL(h, server.url + '/').href); if (r.status() !== 200) { ko++; echec(`lien ${h} : ${r.status()}`); } }
    note(`${hrefs.length} cibles distinctes, ${ko} en échec`);
    o.problemes.forEach((p) => echec(`mur : ${p}`));
    await o.fermer();
  }

  // ============ 2. Clic et Entrée ============
  console.log('\n2. Clic et Entrée');
  {
    const o = await ouvrir('/');
    await o.page.mouse.move(720, 450);
    // On amène la tuile « Bouton » devant la caméra (focus programmatique : la caméra suit), puis on clique en son centre.
    const cible = await o.page.evaluate(() => { const t = document.querySelector('#p-button'); return { i: [...document.querySelectorAll('.im-pieces .im-tuile')].indexOf(t), href: t.querySelector('a').getAttribute('href') }; });
    await o.page.evaluate((i) => document.querySelectorAll('.im-pieces .im-tuile__lien')[i].focus(), cible.i);
    await o.page.waitForTimeout(1600);
    await o.page.evaluate(() => document.activeElement.blur());
    const r = await o.page.evaluate((i) => { const b = document.querySelector(`.im-tuile3d[data-i="${i}"]`).getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; }, cible.i);
    const touche = await o.page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.closest('.im-tuile3d')?.dataset.i ?? null, r);
    verifie(String(touche) === String(cible.i), `le point cliqué (${Math.round(r.x)}, ${Math.round(r.y)}) vise la tuile ${touche}, pas ${cible.i}`);
    await o.page.mouse.click(r.x, r.y);
    await o.page.waitForURL((u) => u.pathname !== '/', { timeout: 6000 }).catch(() => {});
    const url = new URL(o.page.url());
    note(`clic sur « Bouton » : ${url.pathname} (attendu ${cible.href})`);
    verifie(url.pathname === cible.href, `le clic ouvre ${url.pathname} au lieu de ${cible.href}`);
    o.problemes.forEach((p) => echec(`clic : ${p}`));
    await o.fermer();
  }
  {
    const o = await ouvrir('/');
    await o.page.mouse.move(720, 450);
    await o.page.evaluate(() => document.querySelectorAll('.im-pieces .im-tuile__lien')[5].focus());
    await o.page.waitForTimeout(500);
    const href = await o.page.evaluate(() => document.activeElement.getAttribute('href'));
    const debut = Date.now();
    await o.page.keyboard.press('Enter');
    await o.page.waitForURL((u) => u.pathname !== '/', { timeout: 6000 }).catch(() => {});
    const duree = Date.now() - debut;
    note(`Entrée sur la 6e tuile : ${new URL(o.page.url()).pathname} en ${duree} ms (attendu ${href}, seuil 2 000 ms)`);
    verifie(new URL(o.page.url()).pathname === href, `Entrée ouvre ${new URL(o.page.url()).pathname} au lieu de ${href}`);
    verifie(duree < 2000, `Entrée -> page en ${duree} ms (>= 2 000)`);
    await o.fermer();
  }

  // ============ 3. Clavier ============
  console.log('\n3. Clavier');
  {
    const o = await ouvrir('/');
    await o.page.mouse.move(720, 450);
    const slugs = await o.page.evaluate(() => [...document.querySelectorAll('.im-pieces .im-tuile')].map((t) => t.dataset.slug));
    // Lien d'évitement « Aller aux pièces » : atteint par Tab, Entrée envoie le focus sur #pieces.
    let trouve = false;
    for (let k = 0; k < 30 && !trouve; k++) {
      await o.page.keyboard.press('Tab');
      trouve = await o.page.evaluate(() => document.activeElement.matches('a.ch-skip[href="#pieces"]'));
    }
    verifie(trouve, 'lien d\'évitement « Aller aux pièces » introuvable en 30 Tab');
    await o.page.keyboard.press('Enter');
    verifie(await o.page.evaluate(() => document.activeElement.id === 'pieces'), 'Entrée sur le lien d\'évitement n\'envoie pas le focus sur #pieces');
    const vus = [];
    let maxAnneaux = 0, minAnneaux = 9, suivies = 0;
    for (let k = 0; k < 10; k++) {
      await o.page.keyboard.press('Tab');
      await o.page.waitForTimeout(900);
      const e = await o.page.evaluate(() => {
        const a = document.activeElement, li = a.closest('.im-tuile');
        const i = li ? [...document.querySelectorAll('.im-pieces .im-tuile')].indexOf(li) : -1;
        const c = i >= 0 ? document.querySelector(`.im-tuile3d[data-i="${i}"]`) : null;
        const r = c && c.getBoundingClientRect();
        const cs = c && getComputedStyle(c);
        return {
          slug: li?.dataset.slug ?? a.className, visible: a.matches(':focus-visible'),
          anneaux: document.querySelectorAll('.im-tuile3d.is-focus').length,
          dans: !!r && getComputedStyle(c).display !== 'none' && r.left + r.width / 2 > 0 && r.left + r.width / 2 < innerWidth && r.top + r.height / 2 > 70 && r.top + r.height / 2 < innerHeight - 45,
          contour: cs && `${cs.outlineStyle} ${cs.outlineWidth} ${cs.outlineOffset}`,
          focus: cs && cs.outlineColor, jeton: (() => { const p = document.createElement('i'); p.style.color = 'var(--ch-focus)'; document.body.appendChild(p); const v = getComputedStyle(p).color; p.remove(); return v; })(),
        };
      });
      vus.push(e.slug);
      maxAnneaux = Math.max(maxAnneaux, e.anneaux); minAnneaux = Math.min(minAnneaux, e.anneaux);
      if (e.dans) suivies++;
      else echec(`Tab ${k + 1} (${e.slug}) : la tuile focalisée n'est pas dans la vue`);
      if (e.visible === false) echec(`Tab ${k + 1} : :focus-visible faux`);
      if (!/^solid 2px 3px/.test(e.contour ?? '') || e.focus !== e.jeton) echec(`Tab ${k + 1} : anneau ${e.contour} ${e.focus} (attendu solid 2px 3px ${e.jeton})`);
    }
    note(`Tab : ${vus.join(', ')} ; anneaux 3D par pas : min ${minAnneaux}, max ${maxAnneaux} ; caméra qui suit : ${suivies}/10`);
    verifie(JSON.stringify(vus) === JSON.stringify(slugs.slice(0, 10)), `ordre des 10 premières tuiles : ${vus.join(',')} (attendu ${slugs.slice(0, 10).join(',')})`);
    verifie(minAnneaux === 1 && maxAnneaux === 1, `anneaux 3D : min ${minAnneaux}, max ${maxAnneaux} (1 attendu)`);
    // Flèches : la tuile voisine (colonne par colonne, 3 lignes). On repart de la 1re tuile.
    await o.page.evaluate(() => document.querySelectorAll('.im-pieces .im-tuile__lien')[0].focus());
    const attendu = [['ArrowDown', 1], ['ArrowRight', 4], ['ArrowUp', 3], ['ArrowLeft', 0]];
    const lu = [];
    for (const [touche, i] of attendu) {
      await o.page.keyboard.press(touche);
      await o.page.waitForTimeout(150);
      const s = await o.page.evaluate(() => document.activeElement.closest('.im-tuile')?.dataset.slug);
      lu.push(s);
      verifie(s === slugs[i], `${touche} : ${s} (attendu ${slugs[i]})`);
    }
    note(`flèches bas, droite, haut, gauche : ${lu.join(' > ')}`);
    // Index des familles : un clic mène la caméra à la famille.
    const x0 = await o.page.evaluate(() => window.__imMur.cam.x);
    const hash0 = await o.page.evaluate(() => location.hash);
    await o.page.click('.im-ancres__lien[href="#famille-navigation"]');
    await o.page.waitForTimeout(1800);
    const x1 = await o.page.evaluate(() => ({ x: window.__imMur.cam.x, courant: document.querySelector('.im-ancres__lien[aria-current="true"]')?.textContent.trim(), hash: location.hash }));
    note(`index des familles : caméra x ${Math.round(x0)} -> ${Math.round(x1.x)}, famille courante « ${x1.courant} », hash « ${x1.hash} » (avant : « ${hash0} »)`);
    verifie(x1.x > x0 + 500 && /Navigation/.test(x1.courant ?? '') && x1.hash === hash0, `index des familles : x ${x0} -> ${x1.x}, courant ${x1.courant}, hash ${x1.hash}`);
    o.problemes.forEach((p) => echec(`clavier : ${p}`));
    await o.fermer();
  }

  // ============ 4. Retombées sur la grille ============
  console.log('\n4. Retombées sur la grille');
  const cas = [
    ['sans JavaScript', { js: false }],
    ['sans WebGL', { init: [sansWebgl] }],
    ['sans 3D CSS', { init: [sans3d] }],
    ['mouvement réduit', { reduit: true }],
    ['800 × 600', { width: 800, height: 600 }],
    ['version calme', { init: [calmeAuDepart] }],
    ['module du mur bloqué', { bloquer: ['**/index.astro_astro_type_script_index_0_lang.*.js'], attendre: false, filet: true }],
    ['scène bloquée', { bloquer: ['**/scene.*.js'] }],
  ];
  for (const [nom, opt] of cas) {
    const { filet, ...options } = opt;
    const o = await ouvrir('/', options);
    if (filet) await o.page.waitForTimeout(2200); // filet de mode.js : la grille revient 1,5 s après « load »
    else await o.page.waitForTimeout(900);
    if (options.reduit) { await o.page.mouse.move(600, 300); await o.page.mouse.wheel(0, 500); await o.page.waitForTimeout(600); }
    const g = await grilleVisible(o.page);
    const m = options.js === false ? null : await lireMode(o.page);
    const anim = options.js === false ? 0 : await o.page.evaluate(() => document.getAnimations().length);
    const pas = m ? `mode ${m.mode}, classe im-mur ${m.classe}, ${m.images} image(s), scène ${m.scene}, intro inert ${m.intro}` : 'sans script';
    note(`${nom} : ${g.tuiles} tuiles, ${g.vues} visibles, ${g.distincts} liens distincts ; ${pas}${options.reduit ? `, ${anim} animation(s)` : ''}`);
    verifie(g.tuiles === 72 && g.vues === 72 && g.distincts === 72, `${nom} : ${g.tuiles} tuiles, ${g.vues} visibles, ${g.distincts} liens distincts`);
    if (m) verifie((m.mode === 'grille' || (filet && m.mode === null)) && !m.classe && !m.images && m.scene === 'none' && !m.intro, `${nom} : ${JSON.stringify(m)}`);
    if (options.js === false) {
      const b = await o.page.evaluate(() => ({ calme: document.querySelector('[data-im-calme]').hidden, scene: getComputedStyle(document.querySelector('.im-scene')).display, intro: document.querySelector('[data-im-intro]').inert, h1: document.querySelector('h1').textContent.trim() }));
      verifie(b.calme && b.scene === 'none' && !b.intro && b.h1 === 'Chopa Design', `sans JavaScript : ${JSON.stringify(b)}`);
      let ko = 0;
      for (const h of new Set(g.hrefs)) { const r = await o.context.request.get(new URL(h, server.url + '/').href); if (r.status() !== 200) ko++; }
      verifie(ko === 0, `sans JavaScript : ${ko} lien(s) en échec`);
      await o.page.click('#p-button .im-tuile__lien');
      await o.page.waitForURL(/\/composants\/button\//, { timeout: 5000 }).catch(() => {});
      verifie(/\/composants\/button\//.test(o.page.url()), `sans JavaScript : le clic sur « Bouton » mène à ${o.page.url()}`);
    }
    if (options.reduit) {
      const r = await o.page.evaluate(() => ({ anims: document.getAnimations().length, lettres: [...document.querySelectorAll('.im-vivant__l')].filter((l) => getComputedStyle(l).transform !== 'none').length, curseur: !!document.querySelector('.im-curseur'), calme: document.querySelector('[data-im-calme]').hidden }));
      verifie(r.anims === 0 && r.lettres === 0 && !r.curseur && r.calme, `mouvement réduit : ${JSON.stringify(r)}`);
    }
    // Erreurs attendues quand on bloque un fichier : seule la requête bloquée est tolérée.
    const attendues = (p) => (options.bloquer?.length ? /requête en échec|Failed to load resource|net::ERR_FAILED|Failed to fetch dynamically imported module|error loading dynamically imported/.test(p) : false);
    o.problemes.filter((p) => !attendues(p)).forEach((p) => echec(`${nom} : ${p}`));
    await o.fermer();
  }

  // Seuil franchi et version calme : sans recharger, dans les deux sens.
  {
    const o = await ouvrir('/');
    await o.page.evaluate(() => { window.__marque = 'meme-document'; });
    const etapes = [];
    const etat = async (nom) => { await o.page.waitForTimeout(1200); const m = await lireMode(o.page); etapes.push(`${nom} : ${m.mode}`); return m; };
    verifie((await etat('départ 1440')).mode === 'mur', 'départ : pas de mur');
    await o.page.setViewportSize({ width: 800, height: 600 });
    const a = await etat('800 × 600'); verifie(a.mode === 'grille' && !a.classe && !a.intro && a.scene === 'none', `à 800 × 600 : ${JSON.stringify(a)}`);
    await o.page.setViewportSize({ width: 1440, height: 900 });
    const b = await etat('1440 × 900'); verifie(b.mode === 'mur' && b.classe && b.intro, `retour à 1440 : ${JSON.stringify(b)}`);
    await o.page.click('[data-im-calme]');
    const c = await etat('calme actif'); verifie(c.mode === 'grille' && !c.classe && !c.intro, `calme : ${JSON.stringify(c)}`);
    const aria = await o.page.evaluate(() => document.querySelector('[data-im-calme]').getAttribute('aria-pressed'));
    verifie(aria === 'true', `aria-pressed après clic : ${aria}`);
    await o.page.click('[data-im-calme]');
    const d = await etat('calme levé'); verifie(d.mode === 'mur' && d.classe, `sortie du calme : ${JSON.stringify(d)}`);
    verifie(await o.page.evaluate(() => window.__marque === 'meme-document'), 'la page a été rechargée');
    note(`bascules sans recharger : ${etapes.join(' ; ')}`);
    o.problemes.forEach((p) => echec(`bascules : ${p}`));
    await o.fermer();
  }

  // ============ 5. 375 px ============
  console.log('\n5. Téléphone');
  for (const theme of THEMES) {
    const o = await ouvrir('/', { theme, width: 375, height: 800 });
    await o.page.waitForTimeout(500);
    const r = await o.page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, bw: document.body.scrollWidth, mur: document.documentElement.classList.contains('im-mur') }));
    const g = await grilleVisible(o.page);
    note(`375 px [${theme}] : scrollWidth ${r.sw} / clientWidth ${r.cw}, mur ${r.mur}, ${g.vues} tuiles visibles`);
    verifie(r.sw <= r.cw && r.bw <= r.cw && !r.mur, `375 px [${theme}] : défilement horizontal ${JSON.stringify(r)}`);
    verifie(g.vues === 72, `375 px [${theme}] : ${g.vues} tuiles visibles`);
    o.problemes.forEach((p) => echec(`375 px [${theme}] : ${p}`));
    await o.fermer();
  }

  // ============ 6. Images par seconde, élagage, nœuds ============
  console.log('\n6. Fluidité (banc sans GPU), élagage, nœuds');
  {
    const o = await ouvrir('/');
    const gpu = await o.page.evaluate(() => { const c = document.createElement('canvas'); const gl = c.getContext('webgl'); const e = gl && gl.getExtension('WEBGL_debug_renderer_info'); return gl ? (e ? gl.getParameter(e.UNMASKED_RENDERER_WEBGL) : 'webgl sans nom') : 'pas de WebGL'; });
    await o.page.mouse.move(720, 450);
    await o.page.waitForTimeout(2600); // la dérive d'orbite démarre après 2,2 s sans pointeur
    const c0 = await o.page.evaluate(() => ({ ...window.__imMur.cam }));
    const f = await o.page.evaluate(async (ms) => {
      const t = []; let go = true;
      const fn = (x) => { t.push(x); if (go) requestAnimationFrame(fn); };
      requestAnimationFrame(fn);
      await new Promise((ok) => setTimeout(ok, ms));
      go = false;
      const d = t.slice(1).map((x, i) => x - t[i]);
      return { images: t.length, fps: +((t.length - 1) / ((t[t.length - 1] - t[0]) / 1000)).toFixed(1), pire: +Math.max(...d).toFixed(1) };
    }, 5000);
    const c1 = await o.page.evaluate(() => ({ ...window.__imMur.cam }));
    note(`orbite au repos 5 s (${gpu}) : ${f.images} images, ${f.fps} i/s, pire intervalle ${f.pire} ms ; lacet ${c0.yaw.toFixed(4)} -> ${c1.yaw.toFixed(4)}`);
    verifie(f.fps >= 50, `${f.fps} images par seconde (< 50)`);
    verifie(f.pire <= 50, `pire intervalle ${f.pire} ms (> 50)`);
    verifie(Math.abs(c1.yaw - c0.yaw) + Math.abs(c1.pitch - c0.pitch) > 1e-4, 'l\'orbite au repos ne bouge pas la caméra');
    // Élagage : six positions du mur, au repos.
    const S = await o.page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
    const vues = [];
    for (const p of [0, 0.2, 0.4, 0.6, 0.8, 1]) {
      await o.page.evaluate((y) => scrollTo(0, y), Math.round(S * p));
      await o.page.waitForTimeout(1600);
      vues.push(await o.page.evaluate(() => [...document.querySelectorAll('.im-tuile3d')].filter((e) => getComputedStyle(e).display !== 'none').length));
    }
    note(`tuiles 3D affichées à 0, 20, 40, 60, 80, 100 % du mur : ${vues.join(', ')} (seuil 30)`);
    verifie(Math.max(...vues) <= 30, `tuiles 3D affichées : ${vues.join(', ')} (> 30)`);
    verifie(Math.max(...vues) >= 6, `trop peu de tuiles affichées : ${vues.join(', ')}`);
    const cdp = await o.context.newCDPSession(o.page);
    await cdp.send('Performance.enable');
    const { metrics } = await cdp.send('Performance.getMetrics');
    const nodes = metrics.find((x) => x.name === 'Nodes')?.value;
    const elems = await o.page.evaluate(() => document.getElementsByTagName('*').length);
    note(`nœuds DOM (Performance.getMetrics « Nodes ») : ${nodes} ; éléments du document : ${elems} (seuil 8 000)`);
    verifie(typeof nodes === 'number' && nodes <= 8000, `${nodes} nœuds DOM (> 8 000)`);
    o.problemes.forEach((p) => echec(`fluidité : ${p}`));
    await o.fermer();
  }

  // ============ 7. Contraste des textes de la scène ============
  console.log('\n7. Contraste des textes de la scène');
  for (const theme of THEMES) {
    const o = await ouvrir('/', { theme });
    await o.page.mouse.move(720, 450);
    await o.page.evaluate(() => document.querySelector('.im-tuile3d').classList.add('is-survol'));
    await o.page.evaluate(() => scrollTo(0, (document.documentElement.scrollHeight - innerHeight) * 0.5));
    await o.page.waitForTimeout(1600);
    const r = await o.page.evaluate(() => {
      const parse = (s) => {
        s = s.trim().toLowerCase();
        if (s === 'transparent') return [0, 0, 0, 0];
        let m = s.match(/^rgba?\(([^)]*)\)$/);
        if (m) { const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1]; }
        m = s.match(/^color\(srgb\s+([^)]*)\)$/);
        if (m) { const p = m[1].split(/[\s/]+/).filter(Boolean).map(Number); return [p[0] * 255, p[1] * 255, p[2] * 255, p.length > 3 ? p[3] : 1]; }
        return null;
      };
      const probe = document.createElement('i'); document.body.appendChild(probe);
      const role = (n) => { probe.style.color = `var(--ch-${n})`; return parse(getComputedStyle(probe).color); };
      const R = {}; for (const n of ['bg', 'bg2', 'card', 'fg', 'soft', 'mute', 'acc-text']) R[n] = role(n);
      probe.remove();
      const egal = (a, b) => Math.abs(a[0] - b[0]) < 1 && Math.abs(a[1] - b[1]) < 1 && Math.abs(a[2] - b[2]) < 1;
      const nomDe = (c, noms) => noms.find((n) => egal(R[n], c)) ?? null;
      const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
      const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
      const fond = (el) => { for (let e = el; e; e = e.parentElement) { const c = parse(getComputedStyle(e).backgroundColor); if (c && c[3] === 1) return c; } return null; };
      const cibles = ['.im-etiquette', '.im-etiquette b', '.im-etiquette span', '.im-legende', '.im-legende .ch-label', '.im-mot', '.im-mot__l',
        '.im-tuile3d .im-tuile__lien', '.im-tuile3d .im-tuile__num', '.im-tuile3d.is-survol .im-tuile__lien', '.im-aide', '.im-licence', '.im-licence a',
        '.im-ancres__lien', '.im-ancres__num', '.im-ancres__lien[aria-current="true"]'];
      const lignes = []; const mauvais = [];
      for (const sel of cibles) {
        const el = document.querySelector(sel);
        if (!el) { mauvais.push(`${sel} : absent`); continue; }
        const cs = getComputedStyle(el); const c = parse(cs.color); const b = fond(el);
        const nc = nomDe(c, ['fg', 'soft', 'mute', 'acc-text']), nb = nomDe(b, ['bg', 'bg2', 'card']);
        const k = ratio(c, b);
        lignes.push(`${sel} ${nc}/${nb} ${k.toFixed(2)}`);
        if (!nc || !nb) mauvais.push(`${sel} : paire hors des rôles (${cs.color} sur rgb(${b.slice(0, 3).map(Math.round)}))`);
        else if (k < 4.5) mauvais.push(`${sel} : ${nc} sur ${nb} = ${k.toFixed(2)} < 4,5`);
        else if (nc === 'acc-text' && nb === 'acc-dim') mauvais.push(`${sel} : paire interdite`);
      }
      // Les particules sont dans le canevas, derrière le calque 3D : jamais sous un texte (le canevas précède le calque 3D).
      const ordre = document.querySelector('.im-scene__fond').compareDocumentPosition(document.querySelector('.im-scene__3d')) & Node.DOCUMENT_POSITION_FOLLOWING;
      return { lignes, mauvais, canevasDerriere: !!ordre };
    });
    note(`contraste [${theme}] : ${r.lignes.length} textes lus, ${r.mauvais.length} hors paires ; min ${Math.min(...r.lignes.map((l) => +l.split(' ').pop())).toFixed(2)}`);
    if (theme === 'sombre') console.log('  ' + r.lignes.join('\n  '));
    r.mauvais.forEach((m) => echec(`contraste [${theme}] ${m}`));
    verifie(r.canevasDerriere, 'le canevas des particules n\'est pas derrière le calque 3D');
    await o.fermer();
  }

  // ============ 8. axe-core et arbre ARIA ============
  console.log('\n8. axe-core et arbre ARIA');
  let nAxe = 0;
  for (const theme of THEMES) {
    for (const mode of ['mur', 'grille']) {
      const o = await ouvrir('/', { theme, reduit: mode === 'grille' });
      await o.page.mouse.move(720, 450);
      await o.page.waitForTimeout(800);
      const m = await lireMode(o.page);
      verifie(m.mode === mode, `axe [${theme}] : mode ${m.mode} au lieu de ${mode}`);
      await o.page.evaluate(AXE);
      const v = await o.page.evaluate(async () => (await axe.run(document)).violations.map((x) => ({ id: x.id, impact: x.impact, n: x.nodes.map((n) => n.target.join(' ')).slice(0, 3) })));
      nAxe++;
      v.forEach((x) => echec(`axe [${theme}, ${mode}] ${x.id} (${x.impact}) : ${x.n.join(' | ')}`));
      o.problemes.forEach((p) => echec(`axe [${theme}, ${mode}] : ${p}`));
      await o.fermer();
    }
  }
  note(`axe-core 4.14.0 : ${nAxe} passes (mur et grille, 3 thèmes), violations : ${fails.filter((f) => f.startsWith('axe')).length}`);
  {
    const o = await ouvrir('/');
    const lire = async () => ({
      pieces: await o.page.locator('#pieces').ariaSnapshot(),
      titre: await o.page.locator('h1').ariaSnapshot(),
      familles: await o.page.locator('nav[aria-label="Familles de pièces"]').ariaSnapshot(),
    });
    const mur = await lire();
    await o.page.click('[data-im-calme]');
    await o.page.waitForTimeout(1000);
    const grille = await lire();
    const mode = (await lireMode(o.page)).mode;
    note(`arbre ARIA (ariaSnapshot) : #pieces ${mur.pieces.split('\n').length} lignes en mur, ${grille.pieces.split('\n').length} en grille (mode lu : ${mode}) ; h1 « ${mur.titre.replace(/\s+/g, ' ')} »`);
    verifie(mode === 'grille', 'l\'arbre ARIA de la grille n\'a pas été lu en mode grille');
    verifie(mur.pieces === grille.pieces, 'arbre ARIA de #pieces différent entre mode mur et mode grille');
    verifie(mur.titre === grille.titre, 'arbre ARIA du h1 différent entre mode mur et mode grille');
    verifie(mur.familles === grille.familles, 'arbre ARIA de l\'index des familles différent entre mode mur et mode grille');
    verifie((mur.pieces.match(/link "/g) ?? []).length === 72, `${(mur.pieces.match(/link "/g) ?? []).length} liens nommés dans #pieces (72 attendus)`);
    await o.fermer();
  }

  // ============ 9. Garde de lenteur ============
  console.log('\n9. Garde de lenteur (rAF ralenti)');
  {
    const o = await ouvrir('/', { init: [rafLent], attendre: false });
    await o.page.waitForFunction(() => window.__imMur && window.__imMur.mode === 'mur', null, { timeout: 8000 }).catch(() => {});
    const debut = Date.now();
    await o.page.waitForFunction(() => window.__imMur.lent === true, null, { timeout: 25000 }).catch(() => {});
    await o.page.waitForTimeout(400);
    const g = await o.page.evaluate(() => ({ lent: window.__imMur.lent, mode: window.__imMur.mode, classe: document.documentElement.classList.contains('im-mur'), garde: window.__imMur.garde, message: document.querySelector('[data-im-statut]').textContent, role: document.querySelector('[data-im-statut]').getAttribute('role'), cle: sessionStorage.getItem('doc-mur-lent'), intro: document.querySelector('[data-im-intro]').inert }));
    note(`garde de lenteur : déclenchée après ${Date.now() - debut} ms ; ${JSON.stringify(g)}`);
    verifie(g.lent === true && g.mode === 'grille' && !g.classe && !g.intro, `garde : ${JSON.stringify(g)}`);
    verifie(/trop lent/.test(g.message) && g.role === 'status' && g.cle === '1', `garde : message « ${g.message} », clé ${g.cle}`);
    await o.page.reload({ waitUntil: 'load' });
    await o.page.waitForTimeout(600);
    const apres = await lireMode(o.page);
    note(`après rechargement dans la même session : mode ${apres.mode}, classe im-mur ${apres.classe}`);
    verifie(apres.mode === 'grille' && !apres.classe, `la grille ne tient pas pour la session : ${JSON.stringify(apres)}`);
    o.problemes.forEach((p) => echec(`garde : ${p}`));
    await o.fermer();
  }
  // La garde se déclenche pendant une plongée : la page demandée s'ouvre quand même (le mur s'arrête, la navigation continue).
  {
    const o = await ouvrir('/', { init: [rafLent], attendre: false });
    await o.page.waitForFunction(() => window.__imMur && window.__imMur.mode === 'mur' && window.__imMur.images >= 80, null, { timeout: 15000 }).catch(() => {});
    await o.page.evaluate(() => document.querySelectorAll('.im-pieces .im-tuile__lien')[5].focus());
    const href = await o.page.evaluate(() => document.activeElement.getAttribute('href'));
    await o.page.keyboard.press('Enter');
    await o.page.waitForURL((u) => u.pathname !== '/', { timeout: 15000 }).catch(() => {});
    note(`garde pendant une plongée : ${new URL(o.page.url()).pathname} (attendu ${href})`);
    verifie(new URL(o.page.url()).pathname === href, `garde pendant une plongée : la page ${href} ne s'ouvre pas (${o.page.url()})`);
    await o.fermer();
  }
  // Une machine rapide ne déclenche pas la garde (cas de tous les passages précédents) : 90 images, 0 lente lues sur la scène.
  {
    const o = await ouvrir('/');
    await o.page.waitForTimeout(2500);
    const g = await o.page.evaluate(() => window.__imMur.garde);
    note(`garde sur machine rapide : ${JSON.stringify(g)}`);
    verifie(g && g.images === 90 && g.lentes <= 30, `garde sur machine rapide : ${JSON.stringify(g)}`);
    await o.fermer();
  }

  // ============ WebKit : ouverture seulement ============
  console.log('\nWebKit');
  {
    const w = await launch('webkit');
    const context = await w.browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    const pb = [];
    page.on('pageerror', (e) => pb.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') pb.push(m.text()); });
    await page.goto(server.url + '/', { waitUntil: 'load' });
    await page.waitForTimeout(1500);
    const r = await page.evaluate(() => ({ mode: window.__imMur?.mode, webgl: window.__imWebgl, liens: document.querySelectorAll('.im-pieces .im-tuile__lien').length, tuiles3d: document.querySelectorAll('.im-tuile3d').length }));
    note(`WebKit ${w.browser.version()} : ${JSON.stringify(r)}, ${pb.length} erreur(s) (mode non exigé : WebGL de WebKit non vérifié)`);
    verifie(r.liens === 72 && (r.mode === 'grille' ? r.tuiles3d === 0 : r.tuiles3d === 72), `WebKit : ${JSON.stringify(r)}`);
    pb.forEach((p) => echec(`WebKit : ${p}`));
    await context.close();
  }
});

console.log(`\nimmersif-mur : ${mesures.length} mesure(s), ${fails.length} échec(s), ${((Date.now() - t0) / 1000).toFixed(1)} s`);
process.exit(fails.length ? 1 : 0);
