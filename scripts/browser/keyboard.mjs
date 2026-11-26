// Clavier (J2c) : pour chaque pièce interactive (tests/keyboard/<slug>.json), un exemple est posé seul dans la page de
// parité (chopa.css seule), entre deux boutons repères (#kb-before, #kb-after), puis on joue des touches réelles.
// Contrôles : ordre de Tab (tabOrder), puis aucun piège (Tab suivant = #kb-after, Maj+Tab en sens inverse = #kb-before),
// focus visible à chaque arrêt (contour ≥ 2 px ou bordure changée par rapport au repos), puis les étapes du JSON.
// Format d'un cas : { id, example, tabOrder?: [sélecteur], setup?: [{ sel, prop, value } | { sel, listen, as }], steps?: [étape] }
// Option `js: true` (J3a) : charge /chopa/chopa.js dans la page de banc (puis chopa.init()) ; les cas sans `js` restent sans script.
// Étape : { key | type | click | wait (ms), expect? } ; expect : { focus, count:{nom:n}, checked:{sel:bool}, value:{sel:str}, prop:{sel,name,value}, attr:{sel,name,value}, attrOneOf:{sel,name,values:[…]} (J4a), matches:{sel,query,value} (J5a : el.matches(query) === value, ex. :popover-open, :modal), visible:false }
// Sélecteurs relatifs à #stage. Variables : CH_KB_DIR (autre dossier de JSON), CH_KB_EXAMPLES (copie des exemples, pour les mutations).
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { withBench, THEMES } from '../lib/browser.mjs';
import { ROOT } from '../lib/paths.mjs';
import { parityServer } from '../lib/parity.mjs';

const KB_DIR = process.env.CH_KB_DIR || join(ROOT, 'tests', 'keyboard');
const EX_DIR = process.env.CH_KB_EXAMPLES || join(ROOT, 'site', 'src', 'examples');
const t0 = Date.now();
const fails = [];
let steps = 0, cases = 0, stops = 0;

const files = existsSync(KB_DIR) ? readdirSync(KB_DIR).filter((f) => f.endsWith('.json')).sort() : [];
if (!files.length) fails.push(`aucun fichier dans ${KB_DIR}`);

const SNAP = () => {
  const out = [];
  for (const el of document.querySelectorAll('#stage *')) { const cs = getComputedStyle(el); out.push(cs.borderTopColor + '|' + cs.borderLeftColor + '|' + cs.boxShadow); }
  return out;
};
const STATE = ({ checks }) => {
  const stage = document.getElementById('stage');
  const ae = document.activeElement;
  const cs = ae ? getComputedStyle(ae) : null;
  const all = [...stage.querySelectorAll('*')];
  const idx = all.indexOf(ae);
  const r = { id: ae ? (ae.id || '') : '', inStage: stage.contains(ae), idx,
    outline: cs ? { style: cs.outlineStyle, width: parseFloat(cs.outlineWidth), color: cs.outlineColor } : null,
    border: cs ? cs.borderTopColor + '|' + cs.borderLeftColor + '|' + cs.boxShadow : '' };
  const sel = (s) => stage.querySelector(s);
  r.focusMatches = {}; r.checked = {}; r.value = {}; r.prop = []; r.attr = [];
  for (const s of checks.focus || []) r.focusMatches[s] = !!ae && ae.matches(s) && stage.contains(ae);
  for (const s of Object.keys(checks.checked || {})) r.checked[s] = sel(s) ? sel(s).checked : 'introuvable';
  for (const s of Object.keys(checks.value || {})) r.value[s] = sel(s) ? sel(s).value : 'introuvable';
  for (const p of checks.prop || []) r.prop.push(sel(p.sel) ? String(sel(p.sel)[p.name]) : 'introuvable');
  for (const p of checks.attr || []) r.attr.push(sel(p.sel) ? sel(p.sel).getAttribute(p.name) : 'introuvable');
  return r;
};

async function readState(page, expect = {}) {
  return page.evaluate(STATE, { checks: { focus: expect.focus ? [expect.focus] : [], checked: expect.checked, value: expect.value,
    prop: expect.prop ? [].concat(expect.prop) : [], attr: expect.attr ? [].concat(expect.attr) : [] } });
}
function visible(st, base) {
  if (st.outline && st.outline.style !== 'none' && st.outline.width >= 2) return true;
  return st.idx >= 0 && base[st.idx] !== undefined && base[st.idx] !== st.border;
}
async function activeLabel(page) {
  return page.evaluate(() => { const a = document.activeElement; return a ? (a.id || a.tagName.toLowerCase() + (a.className ? '.' + String(a.className).split(' ')[0] : '')) : 'rien'; });
}

try {
  await withBench(async ({ server, launch }) => {
    const { browser } = await launch('chromium');
    for (const f of files) {
      const data = JSON.parse(readFileSync(join(KB_DIR, f), 'utf8'));
      for (const c of data.cases) {
        const ex = join(EX_DIR, c.example + '.html');
        if (!existsSync(ex)) { fails.push(`${data.slug}/${c.id} : exemple introuvable (${c.example})`); continue; }
        const html = readFileSync(ex, 'utf8').trim();
        for (const theme of THEMES) {
          cases++;
          const tag = `${data.slug}/${c.id} [${theme}]`;
          const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'no-preference' });
          const page = await ctx.newPage();
          const problems = [];
          page.on('pageerror', (e) => problems.push(`erreur de page : ${e.message}`));
          try {
            await page.goto(server.url + '/parity/chopa.html', { waitUntil: 'load' });
            await page.evaluate(([h, t]) => {
              document.documentElement.setAttribute('data-ch-theme', t);
              const st = document.getElementById('stage');
              st.innerHTML = h;
              const b = document.createElement('button'); b.id = 'kb-before'; b.textContent = 'avant'; st.before(b);
              const a = document.createElement('button'); a.id = 'kb-after'; a.textContent = 'après'; st.after(a);
            }, [html, theme]);
            for (const s of c.setup || []) await page.evaluate((s) => {
              const el = document.querySelector('#stage ' + s.sel);
              if (s.listen) { window.__c = window.__c || {}; window.__c[s.as] = 0; el.addEventListener(s.listen, () => { window.__c[s.as]++; }); } else el[s.prop] = s.value;
            }, s);
            if (c.js) {
              await page.addScriptTag({ url: server.url + '/chopa/chopa.js' });
              await page.evaluate(() => window.chopa.init());
            }
            await page.evaluate(() => document.fonts.ready);
            await page.evaluate(() => document.getAnimations().forEach((a) => a.finish()));
            const base = await page.evaluate(SNAP);
            await page.focus('#kb-before');
            // 1. Ordre de Tab, puis aucun piège.
            if (c.tabOrder) {
              for (const sel of c.tabOrder) {
                await page.keyboard.press('Tab'); steps++; stops++;
                await page.evaluate(() => document.getAnimations().forEach((a) => a.finish()));
                const st = await readState(page, { focus: sel });
                if (!st.focusMatches[sel]) fails.push(`${tag} Tab : attendu le focus sur « ${sel} », trouvé ${await activeLabel(page)}`);
                else if (!visible(st, base)) fails.push(`${tag} Tab sur « ${sel} » : focus invisible (contour ${JSON.stringify(st.outline)}, bordure inchangée)`);
              }
              await page.keyboard.press('Tab'); steps++;
              if (await page.evaluate(() => document.activeElement && document.activeElement.id) !== 'kb-after') fails.push(`${tag} piège du focus : le Tab après le dernier arrêt n'atteint pas #kb-after (${await activeLabel(page)})`);
              for (const sel of [...c.tabOrder].reverse()) {
                await page.keyboard.press('Shift+Tab'); steps++;
                const st = await readState(page, { focus: sel });
                if (!st.focusMatches[sel]) fails.push(`${tag} Maj+Tab : attendu « ${sel} », trouvé ${await activeLabel(page)}`);
              }
              await page.keyboard.press('Shift+Tab'); steps++;
              if (await page.evaluate(() => document.activeElement && document.activeElement.id) !== 'kb-before') fails.push(`${tag} piège du focus : Maj+Tab ne revient pas à #kb-before (${await activeLabel(page)})`);
              // retour au premier arrêt pour les étapes
              if (c.tabOrder.length) { await page.keyboard.press('Tab'); }
            }
            // 2. Étapes.
            let n = 0;
            for (const s of c.steps || []) {
              n++; steps++;
              const where = `${tag} étape ${n}${s.key ? ' ' + s.key : s.type ? ' « ' + s.type + ' »' : s.click ? ' clic ' + s.click : ''}`;
              if (s.key) await page.keyboard.press(s.key);
              else if (s.type !== undefined) await page.keyboard.type(s.type);
              else if (s.click) await page.click('#stage ' + s.click);
              else if (s.wait) await page.waitForTimeout(s.wait);
              await page.evaluate(() => document.getAnimations().forEach((a) => a.finish()));
              const e = s.expect || {};
              const st = await readState(page, e);
              if (e.focus) {
                stops++;
                if (!st.focusMatches[e.focus]) fails.push(`${where} : attendu le focus sur « ${e.focus} », trouvé ${await activeLabel(page)}`);
                else if (e.visible !== false && !visible(st, base)) fails.push(`${where} : focus invisible`);
              }
              for (const [k, v] of Object.entries(e.count || {})) { const got = await page.evaluate((k) => (window.__c || {})[k], k); if (got !== v) fails.push(`${where} : compteur « ${k} » = ${got}, attendu ${v}`); }
              for (const [k, v] of Object.entries(e.checked || {})) if (st.checked[k] !== v) fails.push(`${where} : « ${k} » coché = ${st.checked[k]}, attendu ${v}`);
              for (const [k, v] of Object.entries(e.value || {})) if (st.value[k] !== v) fails.push(`${where} : valeur de « ${k} » = « ${st.value[k]} », attendu « ${v} »`);
              [].concat(e.prop || []).forEach((p, i) => { if (st.prop[i] !== String(p.value)) fails.push(`${where} : ${p.sel}.${p.name} = ${st.prop[i]}, attendu ${p.value}`); });
              [].concat(e.attr || []).forEach((p, i) => { if (st.attr[i] !== p.value) fails.push(`${where} : ${p.sel}[${p.name}] = ${st.attr[i]}, attendu ${p.value}`); });
              for (const p of [].concat(e.matches || [])) { // J5a : état porté par une pseudo-classe (:popover-open, :modal)
                const got = await page.evaluate(([q, m]) => { const el = document.querySelector('#stage ' + q); return el ? el.matches(m) : 'introuvable'; }, [p.sel, p.query]);
                if (got !== p.value) fails.push(`${where} : ${p.sel}:matches(${p.query}) = ${got}, attendu ${p.value}`);
              }
              for (const p of [].concat(e.attrOneOf || [])) { // J4a : attribut dont la valeur peut être l'une de plusieurs (ex. presse-papiers accordé ou refusé)
                const got = await page.evaluate(([q, n]) => { const el = document.querySelector('#stage ' + q); return el ? el.getAttribute(n) : 'introuvable'; }, [p.sel, p.name]);
                if (!p.values.includes(got)) fails.push(`${where} : ${p.sel}[${p.name}] = ${got}, attendu l'une de ${JSON.stringify(p.values)}`);
              }
            }
            for (const p of problems) fails.push(`${tag} : ${p}`);
          } catch (e) {
            fails.push(`${tag} : exception ${String(e.message).split('\n')[0]}`);
          } finally { await ctx.close().catch(() => {}); }
        }
      }
    }
  }, parityServer());
} catch (e) { fails.push(`exception : ${e.stack || e}`); }
for (const f of fails) console.log('ÉCHEC ' + f);
console.log(`keyboard : ${files.length} fichier(s), ${cases} cas (× 3 thèmes compris), ${steps} touche(s) jouée(s), ${stops} arrêt(s) de focus vérifié(s), ${fails.length} échec(s), ${((Date.now() - t0) / 1000).toFixed(1)} s`);
process.exit(fails.length ? 1 : 0);
