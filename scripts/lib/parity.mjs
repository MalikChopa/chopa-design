// Parité avec la planche (J2a-2) : moteur partagé par parity.mjs, host.mjs et mutation.mjs.
// Deux pages sans script : la planche (`maquette/index.html`, corps vidé, même <head> : feuille et polices intactes)
// et une page Chopa (chopa.css seule, un corps d'hôte minimal). Chaque cas injecte le balisage `board` d'un côté,
// `ch` (ou un exemple de site/src/examples/) de l'autre, puis compare TOUTES les propriétés calculées des paires
// déclarées, par thème, état (repos, :hover, :focus-visible) et pseudo-élément, une fois les transitions terminées.
// Rien n'est écrit sur disque : la feuille de test mutée de mutation.mjs vit en mémoire.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT, DIST } from './paths.mjs';
import { THEMES } from './browser.mjs';

// Même couleur, écrite autrement (Diapason, J4a) : « rgba(255, 90, 31, 0.133) » et « color(srgb 1 0.352941 0.121569 / 0.133) »
// désignent la même couleur (la planche écrit #ff5a1f22, Chopa calcule color-mix). Égales si la valeur entière est une seule
// couleur sRGB des deux côtés, à 1/255 près par canal et à 0,005 près pour l'alpha. Toute autre valeur reste comparée en texte.
function lireCouleur(v) {
  let m = /^rgba?\(\s*([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\s*\)$/.exec(v);
  if (m) return [m[1] / 255, m[2] / 255, m[3] / 255, m[4] === undefined ? 1 : +m[4]];
  m = /^color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\s*\)$/.exec(v);
  if (m) return [+m[1], +m[2], +m[3], m[4] === undefined ? 1 : +m[4]];
  return null;
}
function memeCouleur(x, y) {
  const a = lireCouleur(String(x).trim()), b = lireCouleur(String(y).trim());
  if (!a || !b) return false;
  return a.slice(0, 3).every((c, i) => Math.abs(c - b[i]) <= 1 / 255 + 1e-9) && Math.abs(a[3] - b[3]) <= 0.005;
}

export const PARITY_DIR = join(ROOT, 'tests', 'parity');
export const EXAMPLES_DIR = join(ROOT, 'site', 'src', 'examples');
export const DATA_DIR = process.env.CH_DATA ? process.env.CH_DATA : join(ROOT, 'site', 'src', 'data');

const HOST_BODY = 'body{margin:0;font-family:var(--ch-sans);font-size:16px;line-height:1.5;-webkit-font-smoothing:antialiased;color:var(--ch-fg);background:var(--ch-bg);overflow-x:hidden}';
const STAGE = '#stage{margin-top:40px}';

/** Options du serveur pour les pages de parité. `chopaCss` : texte de chopa.css à servir à la place du fichier (mutation). */
export function parityServer({ chopaCss } = {}) {
  const board = readFileSync(join(ROOT, 'maquette', 'index.html'), 'utf8')
    .replace(/<body[\s\S]*<\/body>/, '<body><div id="stage"></div></body>')
    .replace('</head>', `<style>${STAGE}</style></head>`);
  const chPage = (extraHead, htmlAttrs) => `<!doctype html><html lang="fr" data-ch-theme="sombre"${htmlAttrs}><head><meta charset="utf-8"><title>parité</title>`
    + `<link rel="stylesheet" href="/chopa/chopa.css">${extraHead}<style>${HOST_BODY}${STAGE}</style></head><body><div id="stage"></div></body></html>`;
  const virtual = {
    '/maquette/board.html': board,
    '/parity/chopa.html': chPage('', ''),
    '/parity/chopa-hostile.html': chPage('<link rel="stylesheet" href="/tests/host-hostile.css">', ' data-theme="light"'),
    '/parity/chopa-reset.html': chPage('<link rel="stylesheet" href="/chopa/chopa-reset.css">', ''),
  };
  if (chopaCss !== undefined) virtual['/chopa/chopa.css'] = { body: chopaCss, type: 'text/css; charset=utf-8' };
  return { mounts: { '/chopa/': DIST, '/maquette/': join(ROOT, 'maquette'), '/tests/': join(ROOT, 'tests') }, virtual };
}

/** Fichiers de parité : [{ file, data }] triés. */
export function loadParityFiles(dir = PARITY_DIR) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => f.endsWith('.json')).sort()
    .map((f) => ({ file: f, data: JSON.parse(readFileSync(join(dir, f), 'utf8')) }));
}

/** Fiches de site/src/data (ou CH_DATA) : [{ slug, ref }]. */
export async function loadDataFiles(dir = DATA_DIR) {
  const out = [];
  for (const f of readdirSync(dir).filter((n) => n.endsWith('.mjs')).sort()) {
    const m = await import(pathToFileURL(join(dir, f)).href);
    out.push({ slug: f.replace(/\.mjs$/, ''), ref: m.default?.ref });
  }
  return out;
}

/** Une fiche `ref: 'P'` sans JSON de parité (slug ou alias) est un échec. Retourne la liste des messages. */
export function missingParity(dataFiles, parityFiles) {
  const known = new Set();
  for (const { data } of parityFiles) { known.add(data.slug); for (const a of data.aliases || []) known.add(a); }
  return dataFiles.filter((d) => d.ref === 'P' && !known.has(d.slug))
    .map((d) => `fiche « ${d.slug} » (ref: 'P') sans fichier tests/parity/${d.slug}.json`);
}

const SETTLE = async () => {
  for (let i = 0; i < 45; i++) {
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    if (document.getAnimations().length === 0) return true;
  }
  return false;
};
const GRAB = ({ sel, pseudos }) => {
  const el = document.querySelector('#stage ' + sel);
  if (!el) return null;
  const grab = (cs) => { const o = {}; for (const n of cs) if (!n.startsWith('--')) o[n] = cs.getPropertyValue(n); return o; };
  const r = { el: grab(getComputedStyle(el)) };
  for (const p of pseudos) r[p] = grab(getComputedStyle(el, p));
  return r;
};

async function settle(page, label, fails) {
  const ok = await page.evaluate(SETTLE);
  if (!ok) fails.push(`${label} : transitions non terminées après 1,5 s`);
}

async function applyState(page, sel, state) {
  await page.mouse.move(1, 1);
  await page.evaluate(() => document.activeElement && document.activeElement.blur());
  if (state === 'hover') await page.hover('#stage ' + sel);
  if (state === 'focus') {
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press('Tab');
      const hit = await page.evaluate((s) => document.activeElement === document.querySelector('#stage ' + s), sel);
      if (hit) return true;
    }
    return false;
  }
  return true;
}

function exampleHtml(name) {
  const f = join(EXAMPLES_DIR, name + '.html');
  if (!existsSync(f)) throw new Error(`exemple introuvable : ${name}`);
  return readFileSync(f, 'utf8').trim();
}
const words = (html) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

/**
 * Lance la comparaison. `parityFiles` : [{ file, data }]. Options : themes, hostile (page Chopa avec la feuille hostile),
 * reset (page Chopa avec chopa-reset.css), onlyStates (ex. ['rest']).
 * Retourne { fails: string[], stats: { cases, comparisons, props } }.
 */
export async function runParity({ browser, server, parityFiles, themes = THEMES, hostile = false, reset = false, onlyStates = null }) {
  const fails = [];
  const stats = { cases: 0, comparisons: 0, props: 0 };
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'no-preference' });
  const chPage = await context.newPage();
  const boardPage = await context.newPage();
  const problems = [];
  for (const [name, p] of [['planche', boardPage], ['chopa', chPage]]) {
    p.on('console', (m) => { if (m.type() === 'error') problems.push(`${name} console : ${m.text()}`); });
    p.on('pageerror', (e) => problems.push(`${name} erreur de page : ${e.message}`));
    p.on('requestfailed', (r) => problems.push(`${name} requête en échec : ${r.url()}`));
    p.on('response', (r) => { if (r.status() >= 400) problems.push(`${name} réponse ${r.status()} : ${r.url()}`); });
  }
  const chUrl = server.url + (hostile ? '/parity/chopa-hostile.html' : reset ? '/parity/chopa-reset.html' : '/parity/chopa.html');
  await boardPage.goto(server.url + '/maquette/board.html', { waitUntil: 'load' });
  await chPage.goto(chUrl, { waitUntil: 'load' });
  try {
    for (const { file, data } of parityFiles) {
      for (const c of data.cases) {
        stats.cases++;
        const tag = `${data.slug}/${c.id}`;
        let chHtml, boardHtml;
        try { chHtml = c.example ? exampleHtml(c.example) : c.ch; boardHtml = c.board; } catch (e) { fails.push(`${tag} : ${e.message}`); continue; }
        if (!chHtml || !boardHtml) { fails.push(`${tag} : balisage ch ou board manquant (${file})`); continue; }
        if (words(chHtml) !== words(boardHtml)) fails.push(`${tag} : le texte des deux balisages diffère (« ${words(chHtml)} » / « ${words(boardHtml)} »)`);
        for (const width of c.widths || [1280]) {
          for (const p of [chPage, boardPage]) await p.setViewportSize({ width, height: 900 });
          await chPage.evaluate((h) => { document.getElementById('stage').innerHTML = h; }, chHtml);
          await boardPage.evaluate((h) => { document.getElementById('stage').innerHTML = h; }, boardHtml);
          for (const theme of themes) {
            await chPage.evaluate((t) => document.documentElement.setAttribute('data-ch-theme', t), theme);
            await boardPage.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme);
            for (const p of [chPage, boardPage]) await p.evaluate(() => document.fonts.ready);
            for (const pair of c.pairs) {
              const states = (pair.states || ['rest']).filter((s) => !onlyStates || onlyStates.includes(s));
              const pseudos = pair.pseudos || ['::before', '::after'];
              for (const state of states) {
                const where = `${tag} ${pair.id} @${width} [${theme}] ${state}`;
                const okC = await applyState(chPage, pair.ch, state);
                const okB = await applyState(boardPage, pair.board, state);
                if (!okC || !okB) { fails.push(`${where} : état impossible à atteindre (${!okC ? 'chopa' : 'planche'})`); continue; }
                await settle(chPage, where, fails); await settle(boardPage, where, fails);
                const a = await chPage.evaluate(GRAB, { sel: pair.ch, pseudos });
                const b = await boardPage.evaluate(GRAB, { sel: pair.board, pseudos });
                if (!a || !b) { fails.push(`${where} : élément introuvable (${!a ? 'chopa ' + pair.ch : 'planche ' + pair.board})`); continue; }
                stats.comparisons++;
                for (const key of ['el', ...pseudos]) {
                  const ignored = (pair.ignore || []).find((i) => i.target === (key === 'el' ? 'el' : key));
                  if (ignored) continue;
                  const only = pair.only ? new Set(pair.only) : null;
                  const skip = new Set(pair.ignoreProps || []);
                  const names = new Set([...Object.keys(a[key]), ...Object.keys(b[key])]);
                  for (const n of names) {
                    if ((only && !only.has(n)) || skip.has(n)) continue;
                    stats.props++;
                    if (a[key][n] !== b[key][n] && !memeCouleur(a[key][n], b[key][n])) fails.push(`${where} ${key === 'el' ? '' : key + ' '}${n} : chopa « ${a[key][n]} » ≠ planche « ${b[key][n]} »`);
                  }
                }
                for (const as of pair.asserts || []) {
                  if (as.state && as.state !== state) continue;
                  const got = (a[as.target || 'el'] || {})[as.prop];
                  if (got !== as.value) fails.push(`${where} assertion ${as.target || 'el'} ${as.prop} : attendu « ${as.value} », mesuré « ${got} »`);
                }
              }
            }
          }
        }
      }
    }
  } finally {
    await context.close().catch(() => {});
  }
  for (const p of problems) fails.push(p);
  return { fails, stats };
}
