// Fenêtres (J5a) : modale, tiroir, infobulle, bulle d'info, sur les pages de pièces construites (site/dist, CH_OUT compris),
// Chromium, 3 thèmes de page, exemple principal et copies par thème (chaque ouvreur de chaque aperçu).
//  A. modale et tiroir : à l'ouverture le focus est dans la fenêtre (autofocus, sinon le 1er élément qui n'est pas la croix) ;
//     Tab et Maj+Tab restent dedans et passent par tous les éléments ; la position de défilement du fond ne bouge pas après
//     molette (sur la fenêtre et sur le fond) et touches ; aria-labelledby (et aria-describedby) pointe un texte visible ;
//     Échap, chaque bouton de fermeture, un clic sur le fond ferment et rendent le focus à l'ouvreur ; un clic dedans ou un
//     glisser qui finit sur le fond ne ferme pas ; le voile est le rôle bg à 72 % ; axe-core sur l'état ouvert : 0 violation.
//  B. 375 px : la fenêtre tient dans la fenêtre du navigateur (tiroir : au plus 100 %), la page ne déborde pas.
//  C. mouvement : sans préférence, des transitions existent à l'ouverture ; avec prefers-reduced-motion: reduce, 0 animation.
//  D. infobulle : role="tooltip" et aria-describedby ; au survol et au focus ; reste affichée quand le pointeur passe sur elle et
//     après 600 ms ; Échap la masque sans bouger le focus ; revient après être sorti puis rentré ; reste dans la fenêtre à 375 px.
//  E. bulle d'info : s'ouvre, Échap ferme et rend le focus, la croix et un clic à côté ferment ; axe ouvert : 0 violation.
//  F. sans JavaScript (javaScriptEnabled: false) : aucun ouvreur ni bouton de fermeture visible, le contenu des fenêtres est
//     dans la page, la bulle d'infobulle reste masquée, la bulle d'info s'ouvre (natif).
//  G. init idempotent (aucun écouteur de plus), erreur forcée dans le module (data-ch-failed, contenu visible).
// Variable CH_FEN_MUTATION (mutations du J5a, jamais dans src/ : la source servie de chopa.js est réécrite en mémoire) :
//   focus (appel de retour du focus remplacé par un blur() : neutralise aussi la restauration native ; focus-seul : l'appel est seulement retiré, informatif), hover (infobulle masquée à la sortie du
//   déclencheur seul), lock (verrou de défilement retiré).
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { withBench, THEMES } from '../lib/browser.mjs';

const axeSrc = readFileSync(createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8');
const t0 = Date.now();
const fails = [];
const st = { checks: 0, pages: 0, dialogs: 0, tooltips: 0, popovers: 0, axe: 0, keys: 0 };
const check = (ok, msg) => { st.checks++; if (!ok) fails.push(msg); };
const MUTATION = process.env.CH_FEN_MUTATION || '';
const MUTATIONS = {
  focus: [['if (o && o.isConnected) o.focus();', 'if (o) o.blur();']],
  'focus-seul': [['if (o && o.isConnected) o.focus();', '']],
  hover: [['el.addEventListener("mouseleave"', 't.addEventListener("mouseleave"']],
  lock: [['function lock() {', 'function lock() { return;']],
};
let mutated = 0;

const P = { modal: '/composants/modal/', drawer: '/composants/drawer/', tooltip: '/composants/tooltip/', popover: '/composants/popover/' };
const VIS = (el) => { const cs = getComputedStyle(el); return cs.display !== 'none' && cs.visibility !== 'hidden' && el.getClientRects().length > 0; };

async function newPage(browser, { theme = 'sombre', js = true, width = 1280, height = 900, reducedMotion = 'no-preference' } = {}) {
  const context = await browser.newContext({ viewport: { width, height }, javaScriptEnabled: js, reducedMotion });
  await context.addInitScript((t) => { try { localStorage.setItem('ch-theme', t); } catch (_) {} }, theme);
  const page = await context.newPage();
  const problems = [];
  page.on('pageerror', (e) => problems.push(`erreur de page : ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') problems.push(`console : ${m.text()}`); });
  page.on('requestfailed', (r) => problems.push(`requête en échec : ${r.url()}`));
  page.on('response', (r) => { if (r.status() >= 400) problems.push(`réponse ${r.status()} : ${r.url()}`); });
  if (MUTATION && MUTATIONS[MUTATION] && js) {
    await page.route('**/chopa/chopa.js', async (route) => {
      const resp = await route.fetch();
      let src = await resp.text();
      for (const [from, to] of MUTATIONS[MUTATION]) { if (src.includes(from)) { src = src.replace(from, to); mutated++; } }
      await route.fulfill({ response: resp, body: src });
    });
  }
  return { page, context, problems };
}
const finish = async (tag, o) => { for (const p of o.problems) fails.push(`${tag} : ${p}`); st.checks++; await o.context.close().catch(() => {}); };
const settle = (page) => page.evaluate(() => document.getAnimations().forEach((a) => a.finish()));
async function go(o, server, route, theme) {
  await o.page.goto(server.url + route, { waitUntil: 'load' });
  await o.page.evaluate(() => document.fonts.ready);
  await o.page.waitForFunction(() => window.chopa && document.documentElement.classList.contains('ch-js'));
  const got = await o.page.evaluate(() => document.documentElement.getAttribute('data-ch-theme'));
  check(got === theme, `${route} : thème de page attendu « ${theme} », trouvé « ${got} »`);
  await o.page.waitForTimeout(80); // init de chopa.js (micro-tâche après le chargement)
  st.pages++;
}
const frames = (page, n = 8) => page.evaluate(async (k) => { for (let i = 0; i < k; i++) await new Promise((r) => requestAnimationFrame(r)); }, n);

// Marque chaque ouvreur d'un numéro et décrit sa portée (exemple principal ou copie de thème).
const MARK = () => {
  const out = [];
  document.querySelectorAll('[data-ch-dialog-open]').forEach((o, i) => {
    o.setAttribute('data-fen', String(i));
    const pv = o.closest('.doc-example__preview');
    const dlg = document.querySelector(o.getAttribute('data-ch-dialog-open'));
    out.push({ i, scope: pv && pv.getAttribute('data-ch-theme') ? 'copie ' + pv.getAttribute('data-ch-theme') : 'exemple', dialog: o.getAttribute('data-ch-dialog-open'), kind: dlg.classList.contains('ch-drawer') ? 'tiroir' : 'modale' });
  });
  return out;
};
const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),summary,[tabindex]:not([tabindex="-1"])';
const STATE = ({ dlg, opener }) => {
  const D = document.querySelector(dlg), O = document.querySelector(opener);
  const ae = document.activeElement;
  return { open: D.open, modal: D.matches(':modal'), focusIn: D.contains(ae), focusOpener: ae === O, focusBody: ae === document.body, scrollY: Math.round(window.scrollY),
    lock: document.documentElement.classList.contains('ch-scroll-lock'), label: ae ? (ae.getAttribute('aria-label') || ae.textContent.trim().slice(0, 30)) : '' };
};

// ---------- A, C. modale et tiroir ----------
async function fenetre(browser, server, route, theme) {
  const o = await newPage(browser, { theme });
  await go(o, server, route, theme);
  const list = await o.page.evaluate(MARK);
  const kind = route === P.modal ? 'modale' : 'tiroir';
  check(list.length >= 4 && list.every((x) => x.kind === kind), `${route} [${theme}] : ${list.length} ouvreur(s) trouvé(s) (attendu ≥ 4 : exemples + 3 copies)`);
  const scopes = new Set(list.map((x) => x.scope));
  check(['copie sombre', 'copie clair', 'copie chaud', 'exemple'].every((s) => scopes.has(s)), `${route} [${theme}] : exemple principal et 3 copies de thème présents (${[...scopes].join(', ')})`);
  await o.page.evaluate(axeSrc);
  for (const t of list) {
    st.dialogs++;
    const tag = `${kind} ${t.dialog} (${t.scope}) [${theme}]`;
    const op = `[data-fen="${t.i}"]`, dl = t.dialog;
    const S = async () => { await frames(o.page, 2); return o.page.evaluate(STATE, { dlg: dl, opener: op }); };
    // 1. ouverture à la souris, état de départ
    await o.page.click(op);
    await settle(o.page);
    let s = await S();
    check(s.open && s.modal, `${tag} : ouverte en modal (showModal) après un clic`);
    check(s.focusIn && !s.focusBody, `${tag} : le focus est dans la fenêtre à l'ouverture (« ${s.label} »)`);
    const first = await o.page.evaluate((d) => {
      const D = document.querySelector(d), a = document.activeElement;
      const af = D.querySelector('[autofocus]');
      const list = [...D.querySelectorAll('button:not([disabled]),a[href],input:not([disabled]),[tabindex]:not([tabindex="-1"])')].filter((e) => e.getClientRects().length);
      const sens = list.find((e) => String(e.className).indexOf('__close') < 0) || list[0];
      return { ok: a === (af || sens), isClose: String(a.className).indexOf('__close') >= 0, hasOther: list.some((e) => String(e.className).indexOf('__close') < 0) };
    }, dl);
    check(first.ok && !(first.isClose && first.hasOther), `${tag} : premier focus = élément autofocus, sinon le premier qui n'est pas la croix`);
    check(s.lock, `${tag} : classe ch-scroll-lock posée sur <html> pendant l'ouverture`);
    // 2. étiquette et description
    const lab = await o.page.evaluate((d) => {
      const D = document.querySelector(d), r = {};
      for (const k of ['aria-labelledby', 'aria-describedby']) {
        const v = D.getAttribute(k); if (!v) continue;
        r[k] = v.split(/\s+/).map((id) => { const e = document.getElementById(id); return e ? { text: e.textContent.trim().length > 0, vis: (function (el) { const cs = getComputedStyle(el); return cs.display !== 'none' && cs.visibility !== 'hidden' && el.getClientRects().length > 0; })(e), inDlg: D.contains(e) } : null; });
      }
      return r;
    }, dl);
    check(lab['aria-labelledby'] && lab['aria-labelledby'].every((x) => x && x.text && x.vis && x.inDlg), `${tag} : aria-labelledby pointe un titre visible, non vide, dans la fenêtre`);
    if (lab['aria-describedby']) check(lab['aria-describedby'].every((x) => x && x.text && x.vis), `${tag} : aria-describedby pointe un texte visible`);
    // 3. défilement du fond
    const y0 = s.scrollY;
    await o.page.mouse.move(640, 450); await o.page.mouse.wheel(0, 700); await frames(o.page, 4);
    await o.page.mouse.move(6, 6); await o.page.mouse.wheel(0, 700); await frames(o.page, 4);
    for (const k of ['PageDown', 'End', 'ArrowDown', 'PageDown', 'ArrowDown']) { await o.page.keyboard.press(k); st.keys++; }
    await frames(o.page, 4);
    s = await S();
    check(s.scrollY === y0, `${tag} : la page ne défile pas pendant l'ouverture (scrollY ${y0} puis ${s.scrollY} après molette et touches)`);
    // 4. Tab et Maj+Tab restent dedans et passent partout
    const nb = await o.page.evaluate(({ d, f }) => [...document.querySelector(d).querySelectorAll(f)].filter((e) => { const cs = getComputedStyle(e); return e.getClientRects().length && cs.visibility !== 'hidden'; }).length, { d: dl, f: FOCUSABLE });
    for (const [dir, key] of [['Tab', 'Tab'], ['Maj+Tab', 'Shift+Tab']]) {
      const vus = new Set(); let dehors = 0;
      for (let k = 0; k < nb + 3; k++) {
        await o.page.keyboard.press(key); st.keys++;
        const r = await o.page.evaluate((d) => { const D = document.querySelector(d), a = document.activeElement; return { dans: D.contains(a), id: Array.from(D.querySelectorAll('*')).indexOf(a) }; }, dl);
        if (!r.dans) dehors++; else vus.add(r.id);
      }
      check(dehors === 0, `${tag} : ${dir} reste dans la fenêtre (${nb} élément(s) focalisable(s), ${dehors} sortie(s) en ${nb + 3} touches)`);
      check(vus.size === nb, `${tag} : ${dir} passe par les ${nb} éléments focalisables (${vus.size} vus)`);
    }
    // 5. couleurs : voile = rôle bg à 72 %, fenêtre = card, texte = fg
    await settle(o.page);
    const col = await o.page.evaluate((d) => {
      const D = document.querySelector(d), probe = document.createElement('span');
      D.appendChild(probe);
      const rd = (role, prop) => { probe.style[prop] = 'var(--ch-' + role + ')'; const v = getComputedStyle(probe)[prop]; probe.style[prop] = ''; return v; };
      const num = (s) => { let m = s.match(/^rgba?\(([^)]*)\)/); if (m) { const p = m[1].split(/[\s,\/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1]; }
        m = s.match(/^color\(srgb\s+([^)]*)\)/); if (m) { const p = m[1].split(/[\s\/]+/).filter(Boolean).map(Number); return [p[0] * 255, p[1] * 255, p[2] * 255, p.length > 3 ? p[3] : 1]; } return null; };
      const bg = num(rd('bg', 'color')), card = num(rd('card', 'color')), fg = num(rd('fg', 'color'));
      const veil = num(getComputedStyle(D, '::backdrop').backgroundColor), cs = getComputedStyle(D);
      probe.remove();
      return { bg, card, fg, veil, dlgBg: num(cs.backgroundColor), dlgFg: num(cs.color), td: cs.transitionDuration };
    }, dl);
    const near = (a, b, tol = 1.5) => a && b && a.slice(0, 3).every((x, i) => Math.abs(x - b[i]) <= tol);
    check(col.veil && near(col.veil, col.bg) && Math.abs(col.veil[3] - 0.72) < 0.01, `${tag} : voile = rôle bg à 72 % (lu ${JSON.stringify(col.veil && col.veil.map((x) => Math.round(x * 100) / 100))}, bg ${JSON.stringify(col.bg && col.bg.map(Math.round))})`);
    check(near(col.dlgBg, col.card) && near(col.dlgFg, col.fg), `${tag} : fond = card, texte = fg`);
    // 6. axe sur l'état ouvert
    const ax = await o.page.evaluate(() => axe.run(document));
    st.axe++;
    for (const v of ax.violations) for (const n of v.nodes) fails.push(`${tag} axe ${v.id} (${v.impact}) : ${n.target.join(' ')}`);
    // 7. un clic dedans ne ferme pas
    await o.page.click(`${dl} [id$="titre"], ${dl} .ch-modal__title, ${dl} .ch-drawer__title`);
    s = await S();
    check(s.open, `${tag} : un clic sur le titre de la fenêtre ne la ferme pas`);
    // un glisser qui commence dedans et finit sur le fond ne ferme pas
    const rect = await o.page.evaluate((d) => { const r = document.querySelector(d).getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: innerWidth, h: innerHeight }; }, dl);
    const out = rect.l > 20 ? [6, 6] : rect.r < rect.w - 20 ? [rect.w - 6, 6] : rect.t > 20 ? [rect.w / 2, 6] : [rect.w / 2, rect.h - 6];
    const inn = [(rect.l + rect.r) / 2, rect.t + 14];
    await o.page.mouse.move(inn[0], inn[1]); await o.page.mouse.down(); await o.page.mouse.move(out[0], out[1], { steps: 4 }); await o.page.mouse.up();
    s = await S();
    check(s.open, `${tag} : un glisser qui commence dans la fenêtre et finit sur le fond ne la ferme pas`);
    // 8. Échap : ferme, focus rendu à l'ouvreur
    await o.page.keyboard.press('Escape'); st.keys++;
    s = await S();
    check(!s.open, `${tag} : Échap ferme la fenêtre`);
    check(s.focusOpener, `${tag} : après Échap le focus est rendu à l'ouvreur (« ${s.label} »)`);
    check(!s.lock && s.scrollY === y0, `${tag} : après la fermeture, verrou retiré et page à la même place (${y0} avant, ${s.scrollY} après)`);
    // 9. chaque bouton de fermeture : ouverture au clavier, puis fermeture
    const closers = await o.page.evaluate((d) => [...document.querySelector(d).querySelectorAll('[data-ch-dialog-close]')].map((b) => b.getAttribute('aria-label') || b.textContent.trim()), dl);
    check(closers.length >= 1, `${tag} : au moins un bouton de fermeture (${closers.length})`);
    for (let c = 0; c < closers.length; c++) {
      await o.page.focus(op); await o.page.keyboard.press('Enter'); st.keys++;
      s = await S();
      check(s.open && s.focusIn, `${tag} : Entrée sur l'ouvreur ouvre la fenêtre, focus dedans`);
      await o.page.evaluate(([d, k]) => document.querySelectorAll(d + ' [data-ch-dialog-close]')[k].click(), [dl, c]);
      s = await S();
      check(!s.open && s.focusOpener, `${tag} : « ${closers[c]} » ferme et rend le focus à l'ouvreur (ouvert ${s.open}, focus « ${s.label} »)`);
    }
    // 10. clic sur le fond
    await o.page.click(op);
    await settle(o.page);
    await o.page.mouse.click(out[0], out[1]);
    s = await S();
    check(!s.open, `${tag} : un clic sur le fond ferme la fenêtre`);
    check(s.focusOpener, `${tag} : après le clic sur le fond le focus est rendu à l'ouvreur (« ${s.label} »)`);
    // 11. ouvreur qui n'avait pas le focus (clic de script, ou Safari qui ne focalise pas un bouton cliqué) : le module le lui rend quand même
    await o.page.evaluate((op) => { document.activeElement && document.activeElement.blur(); document.querySelector(op).click(); }, op);
    await settle(o.page);
    s = await S();
    check(s.open && s.focusIn, `${tag} : ouverte par un clic de script sur un ouvreur sans focus, focus dans la fenêtre`);
    await o.page.keyboard.press('Escape'); st.keys++;
    s = await S();
    check(!s.open && s.focusOpener, `${tag} : l'ouvreur qui n'avait pas le focus le retrouve après Échap (focus « ${s.label} »)`);
    await o.page.evaluate(() => window.scrollTo(0, 0));
  }
  await finish(`${route} [${theme}]`, o);
}

// ---------- B. 375 px ----------
async function etroit(browser, server, route) {
  const o = await newPage(browser, { theme: 'sombre', width: 375, height: 700 });
  await go(o, server, route, 'sombre');
  const list = await o.page.evaluate(MARK);
  for (const t of list) {
    const tag = `${t.kind} ${t.dialog} (${t.scope}) à 375 px`;
    await o.page.click(`[data-fen="${t.i}"]`);
    await settle(o.page);
    const r = await o.page.evaluate((d) => { const D = document.querySelector(d), b = D.getBoundingClientRect(), root = document.documentElement;
      const body = D.querySelector('[class$="__body"]');
      return { l: b.left, r: b.right, t: b.top, b: b.bottom, w: root.clientWidth, h: innerHeight, sw: root.scrollWidth, bodyScroll: body ? body.scrollHeight > body.clientHeight + 1 : false, bodyOverflow: body ? getComputedStyle(body).overflowY : '' }; }, t.dialog);
    check(r.l >= -0.5 && r.r <= r.w + 0.5 && r.t >= -0.5 && r.b <= r.h + 0.5, `${tag} : la fenêtre tient dans la fenêtre du navigateur (${Math.round(r.l)}..${Math.round(r.r)} × ${Math.round(r.t)}..${Math.round(r.b)} pour ${r.w} × ${r.h})`);
    if (t.kind === 'tiroir') check(r.r - r.l <= r.w + 0.5 && Math.round(r.b - r.t) === r.h, `${tag} : tiroir au plus 100 % de la largeur (${Math.round(r.r - r.l)} px) et pleine hauteur (${Math.round(r.b - r.t)} px)`);
    check(r.sw <= r.w, `${tag} : la page ne déborde pas (scrollWidth ${r.sw} pour ${r.w})`);
    if (r.bodyScroll) check(r.bodyOverflow === 'auto' || r.bodyOverflow === 'scroll', `${tag} : le corps défile à l'intérieur`);
    await o.page.keyboard.press('Escape');
  }
  await finish(`${route} 375`, o);
}

// ---------- C. mouvement ----------
async function mouvement(browser, server, route, theme, reduce) {
  const o = await newPage(browser, { theme, reducedMotion: reduce ? 'reduce' : 'no-preference' });
  await go(o, server, route, theme);
  const list = await o.page.evaluate(MARK);
  for (const t of list) {
    const tag = `${t.kind} ${t.dialog} (${t.scope}) [${theme}${reduce ? ', mouvement réduit' : ''}]`;
    const n = await o.page.evaluate(([op]) => { const b = document.querySelector(op); b.click(); const D = document.querySelector(b.getAttribute('data-ch-dialog-open'));
      const cs = getComputedStyle(D), bd = getComputedStyle(D, '::backdrop');
      return { anims: document.getAnimations().filter((a) => a.effect && a.effect.target === D).length, tp: cs.transitionProperty, td: cs.transitionDuration, bp: bd.transitionProperty, bdur: bd.transitionDuration }; }, [`[data-fen="${t.i}"]`]);
    if (reduce) {
      await frames(o.page, 8);
      const after = await o.page.evaluate(() => document.getAnimations().length);
      check(n.anims === 0 && after === 0, `${tag} : 0 animation sur la fenêtre au clic (${n.anims}) et 0 animation dans le document 8 images plus tard (${after})`);
      check(n.tp === 'none' && n.bp === 'none', `${tag} : transition-property none sur la fenêtre et son voile (« ${n.tp} », « ${n.bp} »)`);
    } else {
      check(n.anims > 0, `${tag} : des transitions démarrent sur la fenêtre à l'ouverture (${n.anims} animation(s) au clic)`);
      check(/opacity/.test(n.tp) && parseFloat(n.td) >= 0.2 && /opacity/.test(n.bp), `${tag} : transitions déclarées sur la fenêtre (${n.tp} ${n.td}) et son voile (${n.bp})`);
    }
    await o.page.keyboard.press('Escape');
  }
  await finish(`${route} mouvement ${reduce ? 'réduit' : 'normal'} [${theme}]`, o);
}

// ---------- D. infobulle ----------
async function infobulle(browser, server, theme, width = 1280, height = 900) {
  const o = await newPage(browser, { theme, width, height });
  await go(o, server, P.tooltip, theme);
  const list = await o.page.evaluate(() => [...document.querySelectorAll('.ch-tooltip')].map((t, i) => { t.setAttribute('data-fen', String(i)); const pv = t.closest('.doc-example__preview'); return { i, scope: pv && pv.getAttribute('data-ch-theme') ? 'copie ' + pv.getAttribute('data-ch-theme') : 'exemple' }; }));
  check(list.length >= 6, `tooltip [${theme}] : ${list.length} infobulle(s) trouvée(s) (attendu ≥ 6)`);
  const small = width <= 500;
  for (const t of list) {
    st.tooltips++;
    const tag = `infobulle ${t.i} (${t.scope}) [${theme}, ${width} px]`;
    const q = `[data-fen="${t.i}"]`;
    const info = await o.page.evaluate((s) => { const w = document.querySelector(s), b = w.querySelector('[role="tooltip"]'), tr = w.querySelector('[aria-describedby]');
      return { bid: b && b.id, desc: tr && tr.getAttribute('aria-describedby'), resolves: !!b && document.getElementById(tr.getAttribute('aria-describedby')) === b, hidden: getComputedStyle(b).display === 'none' && !w.classList.contains('is-open'), name: !!(tr.getAttribute('aria-label') || tr.textContent.trim()), inter: b.querySelector('a,button,input') !== null }; }, q);
    check(info.bid && info.resolves, `${tag} : aria-describedby du déclencheur pointe la bulle role="tooltip" (${info.desc})`);
    check(info.hidden && info.name && !info.inter, `${tag} : bulle masquée au départ, déclencheur nommé, pas de contenu interactif dans la bulle`);
    const shown = () => o.page.evaluate((s) => { const w = document.querySelector(s), b = w.querySelector('[role="tooltip"]'), cs = getComputedStyle(b); return w.classList.contains('is-open') && cs.display !== 'none' && cs.visibility !== 'hidden' && b.getClientRects().length > 0; }, q);
    const trig = `${q} [aria-describedby]`;
    const bubble = `${q} [role="tooltip"]`;
    // survol
    await o.page.hover(trig);
    await settle(o.page);
    check(await shown(), `${tag} : affichée au survol du déclencheur`);
    // dans la fenêtre (375 px surtout, mais on le mesure toujours)
    const box = await o.page.evaluate((s) => { const r = document.querySelector(s).getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top, b: r.bottom, w: document.documentElement.clientWidth, h: innerHeight, cx: r.left + r.width / 2, cy: r.top + r.height / 2 }; }, bubble);
    check(box.l >= 7.5 && box.r <= box.w - 7.5 && box.t >= 7.5 && box.b <= box.h - 7.5, `${tag} : la bulle est dans la fenêtre${small ? ' (375 px)' : ''} (${Math.round(box.l)}..${Math.round(box.r)} × ${Math.round(box.t)}..${Math.round(box.b)} pour ${box.w} × ${box.h})`);
    // le pointeur passe du déclencheur à la bulle
    const tb = await o.page.evaluate((s) => { const r = document.querySelector(s).getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, trig);
    await o.page.mouse.move(box.cx, box.cy, { steps: 12 });
    await settle(o.page);
    check(await shown(), `${tag} : toujours affichée quand le pointeur passe sur la bulle (survolable)`);
    await o.page.waitForTimeout(600);
    check(await shown(), `${tag} : toujours affichée 600 ms plus tard (persistante)`);
    // Échap pendant le survol
    await o.page.keyboard.press('Escape'); st.keys++;
    check(!(await shown()), `${tag} : Échap masque la bulle pendant le survol`);
    // sortie puis retour : revient
    await o.page.mouse.move(2, 2, { steps: 3 });
    await o.page.mouse.move(tb.x, tb.y, { steps: 6 });
    await settle(o.page);
    check(await shown(), `${tag} : revient quand le pointeur sort puis revient`);
    await o.page.mouse.move(2, 2, { steps: 3 });
    check(!(await shown()), `${tag} : masquée quand le pointeur sort`);
    // focus
    await o.page.focus(trig);
    await settle(o.page);
    check(await shown(), `${tag} : affichée au focus du déclencheur`);
    await o.page.waitForTimeout(300);
    check(await shown(), `${tag} : reste affichée tant que le focus dure`);
    await o.page.keyboard.press('Escape'); st.keys++;
    const focusKept = await o.page.evaluate((s) => document.activeElement === document.querySelector(s), trig);
    check(!(await shown()) && focusKept, `${tag} : Échap masque la bulle et le focus ne bouge pas (focus gardé : ${focusKept})`);
    const stillRefs = await o.page.evaluate((s) => { const w = document.querySelector(s); return document.getElementById(w.querySelector('[aria-describedby]').getAttribute('aria-describedby')) === w.querySelector('[role="tooltip"]'); }, q);
    check(stillRefs, `${tag} : aria-describedby pointe toujours la bulle après Échap`);
    await o.page.evaluate(() => document.activeElement && document.activeElement.blur());
    check(!(await shown()), `${tag} : masquée quand le focus part`);
  }
  await finish(`infobulle [${theme}] ${width}`, o);
}

// ---------- E. bulle d'info ----------
async function bulle(browser, server, theme) {
  const o = await newPage(browser, { theme });
  await go(o, server, P.popover, theme);
  await o.page.evaluate(axeSrc);
  const list = await o.page.evaluate(() => [...document.querySelectorAll('[popovertarget]:not([popovertargetaction])')].map((b, i) => { b.setAttribute('data-fen', String(i)); const pv = b.closest('.doc-example__preview'); return { i, id: b.getAttribute('popovertarget'), scope: pv && pv.getAttribute('data-ch-theme') ? 'copie ' + pv.getAttribute('data-ch-theme') : 'exemple' }; }));
  check(list.length >= 5, `popover [${theme}] : ${list.length} bulle(s) trouvée(s) (attendu ≥ 5)`);
  for (const t of list) {
    st.popovers++;
    const tag = `bulle d'info ${t.id} (${t.scope}) [${theme}]`;
    const op = `[data-fen="${t.i}"]`;
    const S = () => o.page.evaluate(([id, op]) => { const p = document.getElementById(id); return { open: p.matches(':popover-open'), focusOpener: document.activeElement === document.querySelector(op) }; }, [t.id, op]);
    await o.page.click(op); await settle(o.page);
    let s = await S();
    check(s.open, `${tag} : s'ouvre au clic`);
    const r = await o.page.evaluate((id) => { const b = document.getElementById(id).getBoundingClientRect(); return { l: b.left, r: b.right, t: b.top, b: b.bottom, w: innerWidth, h: innerHeight }; }, t.id);
    check(r.l >= 0 && r.r <= r.w && r.t >= 0 && r.b <= r.h, `${tag} : dans la fenêtre à l'ouverture`);
    const ax = await o.page.evaluate(() => axe.run(document));
    st.axe++;
    for (const v of ax.violations) for (const n of v.nodes) fails.push(`${tag} axe ${v.id} (${v.impact}) : ${n.target.join(' ')}`);
    await o.page.keyboard.press('Escape'); st.keys++;
    s = await S();
    check(!s.open, `${tag} : Échap la ferme`);
    check(s.focusOpener, `${tag} : le focus revient au bouton après Échap`);
    await o.page.click(op); await settle(o.page);
    await o.page.click(`#${t.id} [popovertargetaction="hide"]`);
    s = await S();
    check(!s.open, `${tag} : la croix la ferme`);
    await o.page.click(op); await settle(o.page);
    await o.page.mouse.click(3, 3);
    s = await S();
    check(!s.open, `${tag} : un clic à côté la ferme (light dismiss)`);
    await o.page.evaluate(() => window.scrollTo(0, 0));
  }
  await finish(`bulle d'info [${theme}]`, o);
}

// ---------- F. sans JavaScript ----------
async function sansJs(browser, server) {
  for (const route of [P.modal, P.drawer]) {
    const o = await newPage(browser, { js: false });
    await o.page.goto(server.url + route, { waitUntil: 'load' });
    const r = await o.page.evaluate(`(() => { const vis = ${VIS.toString()};
      const sel = '[data-ch-dialog-open],[data-ch-dialog-close],[data-ch-needs-js]';
      const dialogs = [...document.querySelectorAll('dialog')];
      return { ouvreurs: [...document.querySelectorAll(sel)].map(vis), dialogs: dialogs.map((d) => ({ vis: vis(d), titre: vis(d.querySelector('[class$="__title"]')), texte: d.textContent.trim().length > 40, open: d.open })) }; })()`);
    check(r.ouvreurs.length >= 8 && r.ouvreurs.every((v) => !v), `${route} sans JS : aucun ouvreur ni bouton de fermeture visible (${r.ouvreurs.filter(Boolean).length} visible(s) sur ${r.ouvreurs.length})`);
    check(r.dialogs.length >= 4 && r.dialogs.every((d) => d.vis && d.titre && d.texte && !d.open), `${route} sans JS : le contenu de chaque fenêtre est dans la page (${r.dialogs.filter((d) => d.vis).length} sur ${r.dialogs.length} visibles)`);
    await finish(`${route} sans JS`, o);
  }
  let o = await newPage(browser, { js: false });
  await o.page.goto(server.url + P.tooltip, { waitUntil: 'load' });
  let r = await o.page.evaluate(() => [...document.querySelectorAll('.ch-tooltip')].map((t) => { const b = t.querySelector('[role="tooltip"]'), tr = t.querySelector('[aria-describedby]'); return { cache: getComputedStyle(b).display === 'none', nom: !!(tr.getAttribute('aria-label') || tr.textContent.trim()), lie: document.getElementById(tr.getAttribute('aria-describedby')) === b }; }));
  check(r.length >= 6 && r.every((x) => x.cache && x.nom && x.lie), `infobulle sans JS : bulle masquée, déclencheur nommé, description reliée (${r.length})`);
  await finish('infobulle sans JS', o);
  o = await newPage(browser, { js: false });
  await o.page.goto(server.url + P.popover, { waitUntil: 'load' });
  await o.page.click('.doc-example__preview:not([data-ch-theme]) [popovertarget]:not([popovertargetaction])');
  r = await o.page.evaluate(() => [...document.querySelectorAll('[popover]')].filter((p) => p.matches(':popover-open')).length);
  check(r === 1, `bulle d'info sans JS : s'ouvre au clic, en natif (${r} ouverte)`);
  await o.page.keyboard.press('Escape');
  r = await o.page.evaluate(() => [...document.querySelectorAll('[popover]')].filter((p) => p.matches(':popover-open')).length);
  check(r === 0, 'bulle d\'info sans JS : Échap la ferme');
  await finish('bulle d\'info sans JS', o);
}

// ---------- G. idempotence et erreur forcée ----------
const COUNT = () => {
  window.__ael = [];
  const o = EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener = function (t, f, x) { window.__ael.push(this); return o.call(this, t, f, x); };
};
async function idempotence(browser, server) {
  for (const route of [P.modal, P.tooltip]) {
    const o = await newPage(browser, {});
    await o.context.addInitScript(COUNT);
    await o.page.goto(server.url + route, { waitUntil: 'load' });
    await o.page.waitForFunction(() => window.chopa && document.documentElement.classList.contains('ch-js'));
    await o.page.waitForTimeout(100);
    const n0 = await o.page.evaluate(() => window.__ael.length);
    await o.page.evaluate(() => { chopa.init(); chopa.init(); chopa.init(document.body); });
    const n1 = await o.page.evaluate(() => window.__ael.length);
    check(n1 === n0 && n0 > 0, `${route} : init idempotent, 3 appels de plus n'ajoutent aucun écouteur (${n0} avant, ${n1} après)`);
    if (route === P.modal) {
      await o.page.evaluate(() => { window.__sm = 0; const f = HTMLDialogElement.prototype.showModal; HTMLDialogElement.prototype.showModal = function () { window.__sm++; return f.call(this); }; });
      await o.page.click('.doc-example__preview:not([data-ch-theme]) [data-ch-dialog-open]');
      check(await o.page.evaluate(() => window.__sm === 1), `${route} : un clic appelle showModal une seule fois après 3 init`);
    }
    await finish(`${route} idempotence`, o);
  }
}
async function erreurForcee(browser, server) {
  const o = await newPage(browser, {});
  let replaced = false;
  await o.page.route('**/chopa/chopa.js', async (route) => {
    const resp = await route.fetch();
    const src = await resp.text();
    const line = '      wire(dlg);';
    replaced = src.includes(line);
    await route.fulfill({ response: resp, body: src.replace(line, line + ' throw new Error("erreur forcée par le test");') });
  });
  const logs = [];
  o.page.on('console', (m) => { if (m.type() === 'warning') logs.push(m.text()); });
  await o.page.goto(server.url + P.modal, { waitUntil: 'load' });
  await o.page.waitForFunction(() => window.chopa);
  await o.page.waitForTimeout(150);
  check(replaced, 'erreur forcée : ligne « wire(dlg); » du module dialog trouvée (réécriture en mémoire)');
  const r = await o.page.evaluate(`(() => { const vis = ${VIS.toString()};
    return [...document.querySelectorAll('[data-ch-dialog-open]')].map((b) => { const d = document.querySelector(b.getAttribute('data-ch-dialog-open'));
      return { failed: b.getAttribute('data-ch-failed'), dFailed: d.getAttribute('data-ch-failed'), opener: vis(b), dialog: vis(d), closers: [...d.querySelectorAll('[data-ch-dialog-close]')].some(vis) }; }); })()`);
  check(r.length >= 6 && r.every((x) => x.failed === 'dialog' && x.dFailed === 'dialog'), `erreur forcée : data-ch-failed="dialog" posé sur chaque ouvreur et chaque fenêtre (${r.length})`);
  check(r.every((x) => !x.opener && x.dialog && !x.closers), 'erreur forcée : ouvreur et boutons de fermeture masqués, contenu de la fenêtre visible dans la page');
  check(logs.some((l) => /dialog/.test(l)), 'erreur forcée : un avertissement console nomme le module');
  await finish('erreur forcée', o);
}

// ---------- exécution ----------
try {
  await withBench(async ({ server, launch }) => {
    const c = await launch('chromium');
    if (c.note) console.log(c.note);
    const b = c.browser;
    const only = process.env.CH_FEN_ONLY || '';
    const run = (k) => !only || only.split(',').includes(k);
    for (const theme of THEMES) {
      if (run('fenetre')) for (const route of [P.modal, P.drawer]) await fenetre(b, server, route, theme);
      if (run('infobulle')) await infobulle(b, server, theme);
      if (run('bulle')) await bulle(b, server, theme);
    }
    if (run('etroit')) { for (const route of [P.modal, P.drawer]) await etroit(b, server, route); await infobulle(b, server, 'sombre', 375, 700); await infobulle(b, server, 'clair', 375, 700); }
    if (run('mouvement')) for (const theme of THEMES) for (const route of [P.modal, P.drawer]) { await mouvement(b, server, route, theme, true); await mouvement(b, server, route, theme, false); }
    if (run('sansjs')) await sansJs(b, server);
    if (run('idem')) { await idempotence(b, server); await erreurForcee(b, server); }
  });
} catch (e) { fails.push(`exception : ${e.stack || e}`); }
if (MUTATION) {
  if (!MUTATIONS[MUTATION]) fails.push(`mutation inconnue « ${MUTATION} »`);
  else if (!mutated) { fails.push(`mutation « ${MUTATION} » sans effet : le texte à remplacer n'a pas été trouvé dans chopa.js`); }
  else console.log(`mutation « ${MUTATION} » appliquée ${mutated} fois (source servie réécrite en mémoire)`);
}
for (const f of fails) console.log('ÉCHEC ' + f);
console.log(`fenetres : ${st.pages} page(s) ouvertes, ${st.dialogs} fenêtre(s) modale(s) ou tiroir(s), ${st.tooltips} infobulle(s), ${st.popovers} bulle(s) d'info, ${st.keys} touche(s) jouée(s), axe ${st.axe} analyse(s), ${st.checks} vérification(s), ${fails.length} échec(s), ${((Date.now() - t0) / 1000).toFixed(1)} s`);
process.exit(fails.length ? 1 : 0);
