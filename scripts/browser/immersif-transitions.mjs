// Transitions et intégration de la doc immersive (I4, docs/ARCHITECTURE.md §16.7, §16.8, §16.6 M14). Page « / » et pages de pièce construites (CH_OUT).
//  1. Boucles de navigations enchaînées, en mode mur : plongée (clic ou Entrée sur une tuile) -> page de pièce -> « Le mur »
//     (retour : la caméra part de la même tuile et finit libre) -> autre pièce -> pièce voisine -> autre page -> rechargement ->
//     accueil -> plongée dans « Marque » -> retour du navigateur. 60 navigations en Chromium (3 thèmes × 20), 20 en WebKit.
//     0 erreur console ou de page, 0 requête en échec ; transition présente à chaque arrivée (data-im-vt = ok), et, pour la plongée
//     et le retour, les deux côtés de « im-piece » capturés (::view-transition-old et ::view-transition-new de im-piece).
//  2. Mouvement réduit et version calme : plongée impossible, 0 animation à l'arrivée et après ; version calme : fondu seul (aucun im-piece).
//  3. Garde de lenteur (M14) : ralentissement du processeur (Emulation.setCPUThrottlingRate), requestAnimationFrame ralenti ;
//     grille en moins de 5 s, message role="status", clé de session, 0 erreur ; machine rapide : jamais déclenchée ;
//     déclenchée pendant une plongée : la page demandée s'ouvre ; WebKit : requestAnimationFrame ralenti.
// Lit CH_OUT. N'écrit aucun fichier.
import { withBench, THEMES } from '../lib/browser.mjs';

const t0 = Date.now();
const fails = [];
const echec = (m) => { fails.push(m); console.error('immersif-transitions : ÉCHEC ' + m); };
const verifie = (cond, m) => { if (!cond) echec(m); return cond; };
const note = (m) => console.log('immersif-transitions : ' + m);
const stats = { nav: 0, navWebkit: 0, vtOk: 0, morph2: 0, retours: 0, plongees: 0, rechargements: 0, retourNavigateur: 0 };

// ---- Scripts injectés avant tout script de la page ----
// Enregistre, à chaque arrivée : présence de la transition, côtés de im-piece capturés, échantillons de la caméra de la scène.
function initMesures() {
  addEventListener('pagereveal', (e) => {
    try {
      const vt = e.viewTransition;
      sessionStorage.setItem('__vt', vt ? '1' : '0');
      sessionStorage.setItem('__anim', String(document.getAnimations().length));
      if (!vt) { sessionStorage.setItem('__morph', 'aucune'); return; }
      vt.ready.then(() => {
        const noms = new Set(document.getAnimations().map((a) => a.effect && a.effect.pseudoElement).filter(Boolean));
        sessionStorage.setItem('__morph', JSON.stringify([...noms].filter((n) => /im-piece/.test(n)).sort()));
      }, () => { try { sessionStorage.setItem('__morph', 'refuse'); } catch (_) { /* refusé */ } });
    } catch (_) { /* refusé */ }
  });
  window.__ech = [];
  const iv = setInterval(() => {
    const e = window.__imMur;
    if (e && e.cam) { window.__ech.push([e.phase, e.cam.x, e.cam.d, Math.round(performance.now())]); if (window.__ech.length > 600) clearInterval(iv); }
  }, 16);
}
const rafLent = (ms) => {
  window.requestAnimationFrame = (f) => setTimeout(() => f(performance.now()), ms);
  window.cancelAnimationFrame = (id) => clearTimeout(id);
};

class Fin extends Error {}

await withBench(async ({ server, launch }) => {
  const base = server.url;
  const { browser, note: repli } = await launch('chromium');
  if (repli) note(repli);
  note(`Chromium ${browser.version()}`);

  async function ouvrir(br, chemin, { theme = 'sombre', width = 1440, height = 900, init = [], cpu = 0, ...ctxOpts } = {}) {
    const context = await br.newContext({ viewport: { width, height }, ...ctxOpts });
    const problems = [];
    await context.addInitScript((t) => { try { localStorage.setItem('ch-theme', t); } catch (_) { /* refusé */ } }, theme);
    await context.addInitScript(initMesures);
    for (const f of init) await context.addInitScript(f.fn || f, f.arg);
    const page = await context.newPage();
    page.on('console', (m) => { if (m.type() === 'error') problems.push(`console : ${m.text()}`); });
    page.on('pageerror', (e) => problems.push(`erreur de page : ${e.message}`));
    page.on('requestfailed', (r) => problems.push(`requête en échec : ${r.url()} (${r.failure()?.errorText})`));
    page.on('response', (r) => { if (r.status() >= 400) problems.push(`réponse ${r.status()} : ${r.url()}`); });
    if (cpu) { const cdp = await context.newCDPSession(page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu }); }
    await page.goto(base + chemin, { waitUntil: 'load' });
    return { page, context, problems, close: () => context.close().catch(() => {}) };
  }

  const murPret = (page, images = 3) => page.waitForFunction((n) => window.__imMur && window.__imMur.mode === 'mur' && window.__imMur.images > n, images, { timeout: 15000 });
  const libre = (page) => page.waitForFunction(() => window.__imMur && window.__imMur.phase === 'libre', null, { timeout: 8000 });
  const lireNoms = () => {
    const r = {};
    for (const el of document.querySelectorAll('*')) { const nm = getComputedStyle(el).viewTransitionName; if (nm && nm !== 'none') r[nm] = (r[nm] || 0) + 1; }
    return r;
  };
  const lire = (page) => page.evaluate((fn) => ({
    vt: sessionStorage.getItem('__vt'), raison: document.documentElement.getAttribute('data-im-vt'), morph: sessionStorage.getItem('__morph'),
    nommes: (new Function('return ' + fn))()(), chemin: location.pathname + location.hash, mur: document.documentElement.classList.contains('im-mur'),
    mode: window.__imMur ? window.__imMur.mode : null, lent: sessionStorage.getItem('doc-mur-lent'),
  }), lireNoms.toString());
  const reinit = (page) => page.evaluate(() => { sessionStorage.removeItem('__vt'); sessionStorage.removeItem('__morph'); window.__ech = []; });
  // Attend que la garde de tete.js ait vu la transition (data-im-vt) et que l'état « ready » soit connu (2 s au plus).
  const attendreVt = (page) => page.waitForFunction(() => document.documentElement.hasAttribute('data-im-vt') && sessionStorage.getItem('__morph') !== null, null, { timeout: 3000 }).catch(() => {});

  // ============ 1. Boucles de navigations ============
  async function tour(br, label, theme, max) {
    const o = await ouvrir(br, '/', { theme });
    const { page, problems } = o;
    let nav = 0;
    const tag = (r) => `${label} [${theme}] nav ${nav + 1} ${r}`;
    try {
      await murPret(page);
      const tuiles = await page.evaluate(() => [...document.querySelectorAll('.im-pieces .im-tuile')].map((t) => ({ slug: t.dataset.slug, href: t.querySelector('.im-tuile__lien').getAttribute('href') })));
      const pieces = tuiles.map((t, i) => ({ ...t, i })).filter((t) => t.href.startsWith('/composants/'));
      const marque = tuiles.map((t, i) => ({ ...t, i })).find((t) => t.href === '/marque/');
      const decalage = THEMES.indexOf(theme) * 7;
      verifie(pieces.length === 63 && marque, tag(`tuiles : ${pieces.length} pièces, marque ${!!marque}`));

      // Compte une navigation réussie ; la dernière lève Fin (le reste du cycle n'est pas joué).
      const compter = () => { nav++; if (label === 'chromium') stats.nav++; else stats.navWebkit++; if (nav >= max) throw new Fin(); };

      // Vérifie l'arrivée : { type: 'piece' | 'mur' | 'autre', morph: côtés de im-piece attendus, reload }
      async function arrivee(type, { morph = false, reload = false, chemin = null } = {}) {
        await attendreVt(page);
        const e = await lire(page);
        if (chemin) verifie(e.chemin === chemin, tag(`chemin ${e.chemin} (attendu ${chemin})`));
        if (reload) verifie(e.vt === '0' || e.raison === 'saute-rechargement', tag(`rechargement : transition non sautée (vt ${e.vt}, raison ${e.raison})`));
        else {
          verifie(e.vt === '1', tag(`${e.chemin} : pagereveal.viewTransition absent`));
          verifie(e.raison === 'ok', tag(`${e.chemin} : data-im-vt = ${e.raison} (ok attendu)`));
          if (e.vt === '1' && e.raison === 'ok') stats.vtOk++;
          if (morph) {
            const m = e.morph && e.morph.startsWith('[') ? JSON.parse(e.morph) : [];
            const deux = m.some((n) => /view-transition-old\(im-piece\)/.test(n)) && m.some((n) => /view-transition-new\(im-piece\)/.test(n));
            if (label === 'chromium') verifie(deux, tag(`${e.chemin} : ancien et nouveau « im-piece » non capturés tous les deux (${e.morph})`));
            else note(`WebKit ${e.chemin} : côtés de im-piece capturés = ${deux} (${e.morph})`);
            if (deux) stats.morph2++;
          }
        }
        verifie((e.nommes['im-barre'] || 0) === 1, tag(`${e.chemin} : ${e.nommes['im-barre'] || 0} « im-barre »`));
        const attenduPiece = type === 'piece' || (type === 'mur' && e.mur) ? 1 : 0;
        verifie((e.nommes['im-piece'] || 0) === attenduPiece, tag(`${e.chemin} : ${e.nommes['im-piece'] || 0} « im-piece » (${attenduPiece} attendu)`));
        if (type === 'mur') verifie(e.mode === 'mur' && e.lent === null, tag(`${e.chemin} : mode ${e.mode}, garde de lenteur ${e.lent} (mur attendu)`));
        return e;
      }

      async function plonger(p, comment) {
        await libre(page);
        await page.evaluate((i) => document.querySelectorAll('.im-pieces .im-tuile__lien')[i].focus(), p.i);
        if (comment === 'clic') {
          await page.waitForFunction((i) => {
            const el = document.querySelector(`.im-tuile3d[data-i="${i}"]`); const r = el.getBoundingClientRect();
            const c = [r.left + r.width / 2, r.top + r.height / 2], prev = window.__c; window.__c = c;
            return prev && Math.abs(prev[0] - c[0]) < 1.5 && Math.abs(prev[1] - c[1]) < 1.5 && c[0] > 40 && c[0] < innerWidth - 40 && c[1] > 40 && c[1] < innerHeight - 40;
          }, p.i, { polling: 120, timeout: 8000 });
          const c = await page.evaluate((i) => {
            const r = document.querySelector(`.im-tuile3d[data-i="${i}"]`).getBoundingClientRect(); const x = r.left + r.width / 2, y = r.top + r.height / 2;
            const t = document.elementFromPoint(x, y); const k = t && t.closest && t.closest('.im-tuile3d');
            return { x, y, bon: !!k && k.dataset.i === String(i) };
          }, p.i);
          verifie(c.bon, tag(`clic : le point (${c.x.toFixed(0)}, ${c.y.toFixed(0)}) n'est pas sur la tuile ${p.slug}`));
          await page.mouse.move(c.x, c.y, { steps: 3 });
          await page.mouse.click(c.x, c.y);
        } else await page.keyboard.press('Enter');
        stats.plongees++;
      }
      const vers = async (declencheur, test, nom) => {
        await reinit(page);
        const attente = page.waitForURL(test, { waitUntil: 'load', timeout: 15000 });
        await declencheur();
        await attente;
        return nom;
      };

      for (let k = 0; ; k++) {
        const A = pieces[(k * 17 + 5 + decalage) % pieces.length];
        const B = pieces[(k * 29 + 11 + decalage) % pieces.length];
        // a) plongée dans A -> page de pièce
        await vers(() => plonger(A, k % 2 === 0 ? 'clic' : 'entree'), (u) => u.pathname === A.href, 'plongée');
        await arrivee('piece', { morph: true, chemin: A.href });
        compter();
        // b) « Le mur » : retour au mur, la caméra part de la tuile A et finit libre
        await vers(() => page.locator('.im-piece-hero__fil a').click(), (u) => u.pathname === '/' && u.hash === `#p-${A.slug}`, 'retour');
        await murPret(page, 0).catch(() => {});
        await arrivee('mur', { morph: true, chemin: `/#p-${A.slug}` });
        // Avant la scène, la phase vaut déjà « libre » : on attend d'abord la sortie, puis qu'elle finisse.
        await page.waitForFunction(() => (window.__ech || []).some((s) => s[0] === 'sortie') && window.__imMur.phase === 'libre', null, { timeout: 8000 });
        const c = await page.evaluate((slug) => {
          const ech = window.__ech || [], i = [...document.querySelectorAll('.im-pieces .im-tuile')].findIndex((t) => t.dataset.slug === slug);
          const debut = ech.find((s) => s[0] === 'sortie'), fin = [window.__imMur.phase, window.__imMur.cam.x, window.__imMur.cam.d], px = window.__imMur.pos[i].x;
          return { debut, fin, px, n: ech.length };
        }, A.slug);
        stats.retours++;
        if (!c.debut) echec(tag(`retour ${A.slug} : aucune image de la phase « sortie » vue (${c.n} échantillons)`));
        else {
          verifie(Math.abs(c.debut[1] - c.px) < 90 && c.debut[2] < 700, tag(`retour ${A.slug} : la caméra ne part pas de la tuile (x ${c.debut[1].toFixed(0)} pour ${c.px.toFixed(0)}, distance ${c.debut[2].toFixed(0)})`));
          verifie(c.fin[0] === 'libre' && c.fin[2] > 1200, tag(`retour ${A.slug} : la caméra ne finit pas libre (phase ${c.fin[0]}, distance ${c.fin[2].toFixed(0)})`));
        }
        compter();
        // c) plongée dans B
        await vers(() => plonger(B, k % 2 === 0 ? 'entree' : 'clic'), (u) => u.pathname === B.href, 'plongée');
        await arrivee('piece', { morph: true, chemin: B.href });
        compter();
        // d) pièce voisine (suivante, sinon précédente)
        const voisine = await page.evaluate(() => { const a = document.querySelector('a[rel="next"]') || document.querySelector('a[rel="prev"]'); return a ? a.getAttribute('href') : null; });
        await vers(() => page.locator(`a.im-voisines__lien[href="${voisine}"]`).click(), (u) => u.pathname === voisine, 'voisine');
        await arrivee('piece', { chemin: voisine });
        compter();
        // e) autre page de la doc (menu natif de la barre) puis rechargement
        const autre = ['/installation/', '/jetons/', '/theme/', '/icones/'][k % 4];
        await vers(() => page.evaluate((u) => location.assign(u), autre), (u) => u.pathname === autre, 'autre');
        await arrivee('autre', { chemin: autre });
        compter();
        await page.reload({ waitUntil: 'load' });
        stats.rechargements++;
        await arrivee('autre', { reload: true, chemin: autre });
        // f) accueil par la marque de la barre : le mur revient
        await vers(() => page.locator('.doc-bar a[href="/"]').first().click(), (u) => u.pathname === '/' && !u.hash, 'accueil');
        await murPret(page, 0).catch(() => {});
        await arrivee('mur', { chemin: '/' });
        compter();
        // g) tous les trois cycles : plongée dans « Marque » (page sans pièce), puis retour du navigateur
        if (k % 3 === 2) {
          await vers(() => plonger(marque, 'entree'), (u) => u.pathname === '/marque/', 'plongée');
          await arrivee('autre', { chemin: '/marque/' });
          compter();
          await reinit(page);
          const att = page.waitForURL((u) => u.pathname === '/', { waitUntil: 'load', timeout: 15000 });
          await page.goBack();
          await att;
          stats.retourNavigateur++;
          await murPret(page, 0).catch(() => {});
          await libre(page);
          const e = await lire(page);
          verifie(e.mode === 'mur' && e.mur, tag(`retour du navigateur : mode ${e.mode}`));
          compter();
        }
      }
    } catch (e) {
      if (!(e instanceof Fin)) echec(`${label} [${theme}] exception après ${nav} navigation(s) : ${String(e.message).split('\n')[0]}`);
    }
    for (const p of problems) echec(`${label} [${theme}] : ${p}`);
    await o.close();
  }

  console.log('\n1. Boucles de navigations (Chromium)');
  for (const th of THEMES) await tour(browser, 'chromium', th, 20);
  note(`Chromium : ${stats.nav} navigations, ${stats.rechargements} rechargements, ${stats.plongees} plongées, ${stats.retours} retours « Le mur » vérifiés, ${stats.retourNavigateur} retours du navigateur, transition présente (data-im-vt = ok) ${stats.vtOk} fois, ancien et nouveau « im-piece » capturés ${stats.morph2} fois`);
  verifie(stats.nav === 60, `Chromium : ${stats.nav} navigations au lieu de 60`);

  console.log('\n1b. Boucle de navigations (WebKit)');
  const wk = await launch('webkit');
  await tour(wk.browser, 'webkit', 'sombre', 20);
  note(`WebKit : ${stats.navWebkit} navigations`);
  verifie(stats.navWebkit === 20, `WebKit : ${stats.navWebkit} navigations au lieu de 20`);

  // ============ 2. Mouvement réduit et version calme ============
  console.log('\n2. Mouvement réduit et version calme');
  {
    const o = await ouvrir(browser, '/', { reducedMotion: 'reduce' });
    const { page, problems } = o;
    await page.waitForTimeout(700);
    const e0 = await page.evaluate(() => ({ mur: document.documentElement.classList.contains('im-mur'), scene: getComputedStyle(document.querySelector('.im-scene')).display, anim: document.getAnimations().length, images: window.__imMur ? window.__imMur.images : null }));
    verifie(!e0.mur && e0.scene === 'none' && e0.anim === 0 && !e0.images, `mouvement réduit : accueil ${JSON.stringify(e0)}`);
    await reinit(page);
    const lien = page.locator('.im-pieces .im-tuile__lien', { hasText: 'Bouton' }).first();
    const href = await lien.getAttribute('href');
    const att = page.waitForURL((u) => u.pathname === href, { waitUntil: 'load', timeout: 10000 });
    await lien.click();
    await att;
    await page.mouse.move(300, 300, { steps: 3 }); await page.mouse.wheel(0, 300);
    await page.waitForTimeout(500);
    const e1 = await page.evaluate(() => ({ pendant: sessionStorage.getItem('__anim'), apres: document.getAnimations().length, vt: document.documentElement.getAttribute('data-im-vt') }));
    verifie(e1.pendant === '0' && e1.apres === 0, `mouvement réduit : pièce ${JSON.stringify(e1)} (0 animation attendue)`);
    await reinit(page);
    const att2 = page.waitForURL((u) => u.pathname === '/' && u.hash.startsWith('#p-'), { waitUntil: 'load', timeout: 10000 });
    await page.locator('.im-piece-hero__fil a').click();
    await att2;
    await page.waitForTimeout(700);
    const e2 = await page.evaluate(() => ({ pendant: sessionStorage.getItem('__anim'), apres: document.getAnimations().length, mur: document.documentElement.classList.contains('im-mur'), images: window.__imMur ? window.__imMur.images : null }));
    verifie(e2.pendant === '0' && e2.apres === 0 && !e2.mur && !e2.images, `mouvement réduit : retour ${JSON.stringify(e2)}`);
    note(`mouvement réduit : accueil, pièce, retour : animations 0, 0, 0 ; scène jamais lancée (images ${e2.images}) ; ${JSON.stringify(e1)}`);
    problems.forEach((p) => echec(`mouvement réduit : ${p}`));
    await o.close();
  }
  {
    // Version calme mémorisée : grille, fondu seul (aucun im-piece des deux côtés), page de pièce puis retour.
    const o = await ouvrir(browser, '/', { init: [() => { try { localStorage.setItem('doc-calme', '1'); } catch (_) { /* refusé */ } }] });
    const { page, problems } = o;
    await page.waitForTimeout(700);
    const lien = page.locator('.im-pieces .im-tuile__lien', { hasText: 'Bouton' }).first();
    const href = await lien.getAttribute('href');
    await reinit(page);
    const att = page.waitForURL((u) => u.pathname === href, { waitUntil: 'load', timeout: 10000 });
    await lien.click();
    await att;
    await attendreVt(page);
    const e1 = await lire(page);
    verifie(e1.vt === '1' && e1.raison === 'ok' && !(e1.nommes['im-piece']), `calme : pièce, fondu attendu sans im-piece : ${JSON.stringify({ vt: e1.vt, raison: e1.raison, nommes: e1.nommes })}`);
    await reinit(page);
    const att2 = page.waitForURL((u) => u.pathname === '/' && u.hash.startsWith('#p-'), { waitUntil: 'load', timeout: 10000 });
    await page.locator('.im-piece-hero__fil a').click();
    await att2;
    await attendreVt(page);
    const e2 = await lire(page);
    verifie(e2.vt === '1' && !e2.mur && !(e2.nommes['im-piece']) && e2.mode === 'grille', `calme : retour : ${JSON.stringify({ vt: e2.vt, mur: e2.mur, mode: e2.mode, nommes: e2.nommes })}`);
    note(`version calme : fondu seul (vt ${e1.vt}/${e2.vt}, aucun im-piece), retour sur la grille (mode ${e2.mode})`);
    problems.forEach((p) => echec(`calme : ${p}`));
    await o.close();
  }

  // ============ 3. Garde de lenteur ============
  console.log('\n3. Garde de lenteur (M14)');
  // Attend le passage à la grille ; le temps est compté depuis la première image de la scène (et depuis le début de la navigation).
  async function mesurerGarde(nom, o, debutNav) {
    const { page, problems } = o;
    const vu = await page.waitForFunction(() => window.__imMur && window.__imMur.mode === 'mur' && window.__imMur.images >= 1, null, { timeout: 30000, polling: 25 }).then(() => Date.now()).catch(() => 0);
    const tMur = vu || Date.now();
    await page.waitForFunction(() => window.__imMur.lent === true, null, { timeout: 30000, polling: 25 }).catch(() => {});
    const tGrille = Date.now();
    await page.waitForTimeout(300);
    const g = await page.evaluate(() => ({
      lent: window.__imMur.lent === true, mode: window.__imMur.mode, classe: document.documentElement.classList.contains('im-mur'), garde: window.__imMur.garde,
      message: document.querySelector('[data-im-statut]').textContent, role: document.querySelector('[data-im-statut]').getAttribute('role'),
      cle: sessionStorage.getItem('doc-mur-lent'), intro: document.querySelector('[data-im-intro]').inert,
      visibles: [...document.querySelectorAll('.im-pieces .im-tuile__lien')].filter((a) => { const r = a.getBoundingClientRect(); return r.width > 0 && r.height > 0; }).length,
      scene: getComputedStyle(document.querySelector('.im-scene')).display, images: window.__imMur.images,
    }));
    const dt = tGrille - tMur;
    note(`${nom} : grille ${dt} ms après la première image de la scène (${tGrille - debutNav} ms après le début de la navigation) ; ${JSON.stringify(g)}`);
    verifie(g.lent && g.mode === 'grille' && !g.classe && !g.intro && g.scene === 'none', `${nom} : retour à la grille manqué ${JSON.stringify(g)}`);
    verifie(dt < 5000, `${nom} : grille après ${dt} ms (moins de 5 000 ms attendu)`);
    verifie(/trop lent/.test(g.message) && g.role === 'status' && g.cle === '1', `${nom} : message « ${g.message} », rôle ${g.role}, clé ${g.cle}`);
    verifie(g.visibles === 72, `${nom} : ${g.visibles} liens de tuile visibles (72 attendus)`);
    await page.reload({ waitUntil: 'load' });
    await page.waitForTimeout(800);
    const apres = await page.evaluate(() => ({ mode: window.__imMur.mode, classe: document.documentElement.classList.contains('im-mur'), images: window.__imMur.images }));
    verifie(apres.mode === 'grille' && !apres.classe && !apres.images, `${nom} : la grille ne tient pas pour la session ${JSON.stringify(apres)}`);
    problems.forEach((p) => echec(`${nom} : ${p}`));
    return { dt, garde: g.garde };
  }
  {
    const d = Date.now();
    const o = await ouvrir(browser, '/', { cpu: 100 });
    const r = await mesurerGarde('processeur ralenti ×100 (CDP)', o, d);
    await o.close();
    stats.cpu100 = r;
  }
  {
    const d = Date.now();
    const o = await ouvrir(browser, '/', { init: [{ fn: rafLent, arg: 70 }] });
    stats.raf70 = await mesurerGarde('requestAnimationFrame ralenti à 70 ms', o, d);
    await o.close();
  }
  {
    const d = Date.now();
    const o = await ouvrir(browser, '/', { init: [{ fn: rafLent, arg: 130 }] });
    stats.raf130 = await mesurerGarde('requestAnimationFrame ralenti à 130 ms', o, d);
    await o.close();
  }
  // Machine rapide, ou ralentie sans que l'affichage souffre (processeur ×1, ×6, ×20 : l'affichage est composé hors du fil principal) :
  // la garde ne se déclenche jamais.
  for (const rate of [0, 0, 0, 6, 20]) {
    const o = await ouvrir(browser, '/', { cpu: rate });
    await o.page.waitForFunction(() => window.__imMur && window.__imMur.garde, null, { timeout: 20000 }).catch(() => {});
    const g = await o.page.evaluate(() => ({ garde: window.__imMur.garde, lent: window.__imMur.lent === true, mode: window.__imMur.mode, cle: sessionStorage.getItem('doc-mur-lent') }));
    note(`machine ${rate ? `ralentie ×${rate}` : 'rapide'} : garde ${JSON.stringify(g)}`);
    verifie(!g.lent && g.mode === 'mur' && g.cle === null && g.garde && g.garde.images === 90, `machine ${rate || 1} : garde déclenchée à tort ou jamais conclue ${JSON.stringify(g)}`);
    o.problems.forEach((p) => echec(`machine ${rate || 1} : ${p}`));
    await o.close();
  }
  {
    // Pendant une plongée : la garde arrête le mur, la page demandée s'ouvre quand même.
    const o = await ouvrir(browser, '/', { init: [{ fn: rafLent, arg: 70 }] });
    await o.page.waitForFunction(() => window.__imMur && window.__imMur.mode === 'mur' && window.__imMur.images >= 8, null, { timeout: 15000 }).catch(() => {});
    await o.page.evaluate(() => document.querySelectorAll('.im-pieces .im-tuile__lien')[5].focus());
    const href = await o.page.evaluate(() => document.activeElement.getAttribute('href'));
    await o.page.keyboard.press('Enter');
    const phase = await o.page.evaluate(() => window.__imMur.phase);
    await o.page.waitForURL((u) => u.pathname !== '/', { timeout: 15000 }).catch(() => {});
    const chemin = new URL(o.page.url()).pathname;
    note(`garde pendant une plongée (phase au départ : ${phase}) : ${chemin} (attendu ${href})`);
    verifie(phase === 'plongee', `garde pendant une plongée : la phase n'était pas « plongee » (${phase})`);
    verifie(chemin === href, `garde pendant une plongée : la page ${href} ne s'ouvre pas (${chemin})`);
    await o.close();
  }
  {
    // WebKit : requestAnimationFrame ralenti (pas de CDP).
    const d = Date.now();
    const o = await ouvrir(wk.browser, '/', { init: [{ fn: rafLent, arg: 70 }] });
    stats.rafWk = await mesurerGarde('WebKit, requestAnimationFrame ralenti à 70 ms', o, d);
    await o.close();
  }
}, {});

const total = ((Date.now() - t0) / 1000).toFixed(1);
if (fails.length) {
  console.error(`\nimmersif-transitions : ${fails.length} échec(s) en ${total} s`);
  process.exit(1);
}
console.log(`\nimmersif-transitions : OK en ${total} s (${stats.nav} navigations Chromium, ${stats.navWebkit} WebKit)`);
