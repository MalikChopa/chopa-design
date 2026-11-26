// Palette (J2a-2) + critères navigateur de J1 rejoués :
//  1. toute couleur calculée (texte, fond, filets, contour, soulignement, ombres, ::before/::after) de chaque élément des
//     exemples (.doc-example__preview) de chaque page construite appartient aux valeurs de son thème : rôles de jetons,
//     acc-dim et acc-dim composé sur bg/bg2/card, transparent. Au repos, puis au survol des éléments interactifs.
//     3 thèmes de page ; les cadres data-ch-theme locaux lisent leurs propres rôles.
//  2. J1 « acc-dim suit --ch-acc » : un autre accent posé sur un cadre change acc-dim composé ; --ch-dim-pct local aussi.
//  3. J1 « axe sur les pièces » avec chaque fixture de tests/fixtures/ appliquée (accueil et une page de pièce, 3 thèmes).
//  4. J1 « prose à 375 px sans débordement » : déjà mesuré par check-overflow.mjs (toutes les pages, dont /composants/prose/, à 375 px) ; non répété ici.
import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { listPages, openPage, withBench, THEMES } from '../lib/browser.mjs';
import { ROOT } from '../lib/paths.mjs';

const t0 = Date.now();
const fails = [];
const st = { pages: 0, runs: 0, elements: 0, colours: 0, hovered: 0, hoverSkipped: 0, axe: 0 };

// ---- code exécuté dans la page (source texte : un seul exemplaire, injecté une fois par page) ----
const LIB = `(() => {
  const PROPS = ['color', 'background-color', 'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color',
    'outline-color', 'text-decoration-color', 'column-rule-color', '-webkit-text-stroke-color', 'caret-color', 'box-shadow', 'text-shadow', 'fill', 'stroke'];
  const COLOUR_RE = /(rgba?\\([^)]*\\)|color\\([^)]*\\)|#[0-9a-f]{3,8}\\b|\\b(?:transparent|currentcolor)\\b)/gi;
  const ROLES = ['bg', 'bg2', 'card', 'fg', 'soft', 'mute', 'line', 'acc', 'acc-text', 'on-acc', 'focus'];
  function parse(s) {
    s = s.trim().toLowerCase();
    if (s === 'transparent') return [0, 0, 0, 0];
    let m = s.match(/^rgba?\\(([^)]*)\\)$/);
    if (m) { const p = m[1].split(/[\\s,\\/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1]; }
    m = s.match(/^color\\(srgb\\s+([^)]*)\\)$/);
    if (m) { const p = m[1].split(/[\\s\\/]+/).filter(Boolean).map(Number); return [p[0] * 255, p[1] * 255, p[2] * 255, p.length > 3 ? p[3] : 1]; }
    return null;
  }
  const over = (a, b) => [0, 1, 2].map((i) => a[i] * a[3] + b[i] * (1 - a[3])).concat([1]);
  const same = (a, b) => Math.abs(a[0] - b[0]) < 1 && Math.abs(a[1] - b[1]) < 1 && Math.abs(a[2] - b[2]) < 1 && Math.abs(a[3] - b[3]) < 0.004;
  const cache = new Map();
  function allowed(frame) {
    if (cache.has(frame)) return cache.get(frame);
    const probe = document.createElement('span');
    frame.appendChild(probe);
    const read = (role) => { probe.style.color = 'var(--ch-' + role + ')'; return parse(getComputedStyle(probe).color); };
    const roles = {};
    for (const r of ROLES) roles[r] = read(r);
    const dim = read('acc-dim');
    probe.remove();
    const set = [...Object.values(roles), dim, [0, 0, 0, 0]];
    for (const b of ['bg', 'bg2', 'card']) set.push(over(dim, roles[b]));
    cache.set(frame, set);
    return set;
  }
  function describe(el) {
    let s = el.tagName.toLowerCase();
    if (el.id) s += '#' + el.id;
    const c = (el.getAttribute('class') || '').trim().split(/\\s+/).filter(Boolean).slice(0, 3);
    if (c.length) s += '.' + c.join('.');
    return s;
  }
  function checkEl(el, pseudo, bag) {
    const cs = getComputedStyle(el, pseudo || null);
    if (pseudo && (cs.content === 'none' || cs.content === 'normal')) return;
    const frame = el.closest('[data-ch-theme]') || document.documentElement;
    const ok = allowed(frame);
    bag.elements++;
    const own = [...(pseudo ? [] : el.childNodes)].some((n) => n.nodeType === 3 && n.textContent.trim());
    const control = /^(INPUT|SELECT|TEXTAREA|BUTTON)$/.test(el.tagName) && !pseudo;
    // Seules les propriétés RENDUES comptent : une bordure sans style ni épaisseur, un contour « none », un soulignement
    // absent, un trait de colonne ou un contour de texte sans épaisseur ne se voient pas (leur couleur n'est que la valeur initiale).
    const rendered = (p) => {
      const side = p.match(/^border-(top|right|bottom|left)-color$/);
      if (side) return cs.getPropertyValue('border-' + side[1] + '-style') !== 'none' && parseFloat(cs.getPropertyValue('border-' + side[1] + '-width')) > 0;
      if (p === 'outline-color') return cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0;
      if (p === 'text-decoration-color') return cs.textDecorationLine !== 'none';
      if (p === 'column-rule-color') return cs.columnRuleStyle !== 'none' && parseFloat(cs.columnRuleWidth) > 0;
      if (p === '-webkit-text-stroke-color') return parseFloat(cs.webkitTextStrokeWidth) > 0;
      if (p === 'caret-color') return control || el.isContentEditable;
      if (p === 'color') return own || control || (pseudo && cs.content !== '""') || el instanceof SVGElement;
      return true;
    };
    for (const p of PROPS) {
      if ((p === 'fill' || p === 'stroke') && !(el instanceof SVGElement)) continue;
      if (!rendered(p)) continue;
      const v = cs.getPropertyValue(p);
      if (!v || v === 'none' || v === 'auto' || v === 'normal') continue;
      for (const col of v.match(COLOUR_RE) || []) {
        if (/^currentcolor$/i.test(col)) continue;
        bag.colours++;
        const c = parse(col);
        if (!c) { bag.bad.push({ el: describe(el) + (pseudo || ''), prop: p, colour: col, why: 'format de couleur non lu' }); continue; }
        if (!ok.some((a) => same(a, c))) bag.bad.push({ el: describe(el) + (pseudo || ''), prop: p, colour: col, theme: frame.getAttribute('data-ch-theme') || '(page)' });
      }
    }
  }
  window.__pal = {
    scan(root) {
      const bag = { elements: 0, colours: 0, bad: [] };
      const list = [root, ...root.querySelectorAll('*')].filter((e) => !['SCRIPT', 'STYLE'].includes(e.tagName));
      for (const e of list) { checkEl(e, null, bag); checkEl(e, '::before', bag); checkEl(e, '::after', bag); }
      return bag;
    },
    previews() { return [...document.querySelectorAll('.doc-example__preview')]; },
    mark() {
      const sel = 'button:not([disabled]), a[href], summary, input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
      // Élément caché (panneau d'onglet inactif, popover ou menu fermés) : compté « non atteignable » d'emblée, sans attendre
      // l'échec du survol (Diapason, J3a : 132 attentes de 1,5 s évitées ; même couverture qu'avant).
      const out = []; let hidden = 0;
      document.querySelectorAll('.doc-example__preview').forEach((p, pi) => p.querySelectorAll(sel).forEach((e, i) => {
        if (e.checkVisibility && !e.checkVisibility({ visibilityProperty: true })) { hidden++; return; }
        const id = pi + '-' + i; e.setAttribute('data-pal-i', id); out.push(id);
      }));
      return { ids: out, hidden };
    },
    clear() { cache.clear(); },
  };
})();`;

// Une ligne par (page, thème de page, élément, couleur) : les propriétés concernées sont regroupées, le survol ne répète pas le repos.
const seen = new Map();
function report(route, theme, state, bad) {
  for (const b of bad) {
    const key = `${route}|${theme}|${b.theme}|${b.el}|${b.colour}`;
    if (seen.has(key)) { const e = seen.get(key); if (!e.props.includes(b.prop)) e.props.push(b.prop); continue; }
    const e = { route, theme, state, b, props: [b.prop] };
    seen.set(key, e);
  }
}

async function scanPage(browser, url, route, theme) {
  const o = await openPage(browser, url, { theme });
  try {
    st.pages++;
    for (const p of o.problems) fails.push(`${route} [${theme}] ${p}`);
    await o.page.evaluate(LIB);
    // Diapason (testeur n° 2) : le repos se lit à l'état final, transitions de chargement finies (l'onglet choisi passait
    // de soft à fg en 150 ms et la lecture tombait parfois au milieu). Les animations infinies sont laissées telles quelles.
    await o.page.evaluate(() => document.getAnimations().forEach((a) => { try { a.finish(); } catch (_) { /* infinie */ } }));
    const bag = await o.page.evaluate(() => {
      const total = { elements: 0, colours: 0, bad: [] };
      for (const pv of window.__pal.previews()) { const b = window.__pal.scan(pv); total.elements += b.elements; total.colours += b.colours; total.bad.push(...b.bad); }
      return total;
    });
    st.runs++; st.elements += bag.elements; st.colours += bag.colours;
    report(route, theme, 'repos', bag.bad);
    // survol : chaque élément interactif des exemples, puis re-lecture de son exemple
    const { ids, hidden } = await o.page.evaluate(() => window.__pal.mark());
    st.hoverSkipped += hidden;
    for (const id of ids) {
      const sel = `[data-pal-i="${id}"]`;
      try {
        await o.page.hover(sel, { timeout: 1500 });
      } catch (_) { st.hoverSkipped++; continue; }
      await o.page.evaluate(async () => { for (let i = 0; i < 45; i++) { await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))); if (!document.getAnimations().filter((a) => a.effect && a.effect.getComputedTiming().endTime !== Infinity).length) return; } });
      const b = await o.page.evaluate((s) => { window.__pal.clear(); return window.__pal.scan(document.querySelector(s).closest('.doc-example__preview')); }, sel);
      st.hovered++; st.elements += b.elements; st.colours += b.colours;
      report(route, theme, 'survol', b.bad);
      await o.page.mouse.move(1, 1);
    }
  } finally { await o.close(); }
}

async function accDim(browser, url) {
  const o = await openPage(browser, url, { theme: 'sombre' });
  try {
    const r = await o.page.evaluate(() => {
      const read = (frame) => {
        const probe = document.createElement('span');
        probe.style.backgroundColor = 'var(--ch-acc-dim)';
        frame.appendChild(probe);
        const v = getComputedStyle(probe).backgroundColor;
        probe.remove();
        const m = v.match(/color\(srgb\s+([^)]*)\)/) || v.match(/rgba?\(([^)]*)\)/);
        const p = m[1].split(/[\s,\/]+/).filter(Boolean).map(Number);
        const k = v.startsWith('color(') ? 255 : 1;
        return [p[0] * k, p[1] * k, p[2] * k, p.length > 3 ? p[3] : 1].map((x) => Math.round(x * 1000) / 1000);
      };
      const mk = (theme) => { const d = document.createElement('div'); d.setAttribute('data-ch-theme', theme); document.body.appendChild(d); return d; };
      const sombre = mk('sombre'), clair = mk('clair');
      const out = { sombre: read(sombre), clair: read(clair) };
      sombre.style.setProperty('--ch-acc', '#2563eb');
      out.sombreBleu = read(sombre);
      clair.style.setProperty('--ch-dim-pct', '30%');
      out.clair30 = read(clair);
      sombre.remove(); clair.remove();
      return out;
    });
    const near = (a, b, tol) => a.every((x, i) => Math.abs(x - b[i]) <= tol);
    const check = (nom, got, want, tol) => { if (!near(got, want, tol)) fails.push(`acc-dim ${nom} : mesuré [${got}] attendu ≈ [${want}]`); };
    check('sombre par défaut (#ff5a1f à 13,3 %)', r.sombre, [255, 90, 31, 0.133], 1.5);
    check('sombre avec --ch-acc #2563eb posé sur le cadre', r.sombreBleu, [37, 99, 235, 0.133], 1.5);
    check('clair par défaut (12,2 %)', r.clair, [255, 90, 31, 0.122], 1.5);
    check('clair avec --ch-dim-pct 30 % sur le cadre', r.clair30, [255, 90, 31, 0.3], 1.5);
    console.log(`acc-dim : sombre [${r.sombre}], sombre + accent #2563eb [${r.sombreBleu}], clair [${r.clair}], clair + dim-pct 30 % [${r.clair30}]`);
  } finally { await o.close(); }
}

async function axeFixtures(browser, serverUrl) {
  const axeSrc = readFileSync(createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8');
  const dir = join(ROOT, 'tests', 'fixtures');
  const fixtures = readdirSync(dir).filter((f) => f.endsWith('.css')).sort();
  for (const route of ['/', '/composants/texte/']) {
    for (const f of fixtures) {
      const css = readFileSync(join(dir, f), 'utf8');
      for (const theme of THEMES) {
        const o = await openPage(browser, serverUrl + route, { theme });
        try {
          await o.page.addStyleTag({ content: css });
          await o.page.evaluate(() => document.fonts.ready);
          // la fixture change les couleurs : attendre la fin des transitions avant de mesurer (sinon axe lit des couleurs intermédiaires)
          await o.page.evaluate(async () => { for (let i = 0; i < 45; i++) { await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))); if (!document.getAnimations().filter((a) => a.effect && a.effect.getComputedTiming().endTime !== Infinity).length) return; } });
          await o.page.evaluate(axeSrc);
          const r = await o.page.evaluate(() => axe.run(document));
          st.axe++;
          for (const v of r.violations) for (const n of v.nodes) fails.push(`axe + ${f} ${route} [${theme}] ${v.id} (${v.impact}) : ${n.target.join(' ')}`);
          for (const p of o.problems) fails.push(`axe + ${f} ${route} [${theme}] ${p}`);
        } finally { await o.close(); }
      }
    }
  }
  return fixtures.length;
}

let nFix = 0;
try {
  await withBench(async ({ server, launch }) => {
    const c = await launch('chromium');
    if (c.note) console.log(c.note);
    const pages = listPages();
    for (const p of pages) for (const t of THEMES) await scanPage(c.browser, server.url + p.route, p.route, t);
    await accDim(c.browser, server.url + '/');
    nFix = await axeFixtures(c.browser, server.url);
  });
} catch (e) {
  fails.push(`exception : ${e.stack || e}`);
}
for (const e of seen.values()) fails.push(`palette ${e.route} [page ${e.theme}] ${e.state} : élément ${e.b.el} (cadre ${e.b.theme}), couleur ${e.b.colour} hors des valeurs du thème, propriétés : ${e.props.join(', ')}${e.b.why ? ' (' + e.b.why + ')' : ''}`);
for (const f of fails) console.log('ÉCHEC ' + f);
console.log(`palette : ${st.runs} lectures (page × thème), ${st.hovered} survol(s) (${st.hoverSkipped} non atteignable(s)), ${st.elements} élément(s)/pseudo lus, ${st.colours} couleur(s) vérifiée(s) ; axe + ${nFix} fixture(s) : ${st.axe} analyses ; ${fails.length} échec(s), ${((Date.now() - t0) / 1000).toFixed(1)} s`);
process.exit(fails.length ? 1 : 0);
