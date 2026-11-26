// Contraste des paires autorisées (docs/ARCHITECTURE.md, section 9) :
//   node scripts/static/check-contrast.mjs                  chopa.css (3 thèmes) + les fixtures de tests/fixtures/
//   node scripts/static/check-contrast.mjs --fixture f.css  chopa.css suivi de f.css (feuille de réglages d'un site)
//   node scripts/static/check-contrast.mjs --derive #rrggbb calcule acc-text, on-acc, dim-pct par thème (information)
//   option -v : toutes les paires. Code 1 si une paire autorisée est sous son seuil ou si une attente échoue.
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { DIST, ROOT } from '../lib/paths.mjs';
import { THEMES, themeColors } from '../../src/lib/css-tokens.mjs';
import { allowedPairs, forbiddenPairs, MIN_TEXT } from '../../src/lib/pairs.mjs';
import { deriveForTheme } from '../../src/lib/derive.mjs';
import { toHex } from '../../src/lib/color.mjs';

const args = process.argv.slice(2);
const verbose = args.includes('-v');
const opt = (name) => { const i = args.indexOf(name); return i < 0 ? null : args[i + 1]; };
const f2 = (n) => n.toFixed(2);
const cssPath = join(DIST, 'chopa.css');
if (!existsSync(cssPath)) { console.error(`check-contrast : ${cssPath} absent (lancer npm run build)`); process.exit(1); }
const base = readFileSync(cssPath, 'utf8');
const DEFAULT_PCT = { sombre: 13.3, clair: 12.2, chaud: 13.3 };

const failures = [];
const fail = (msg) => failures.push(msg);

// Mesure un CSS complet : rend { themes: [{ theme, pairs }], bad: [pairs sous seuil avec thème] }.
function measure(css) {
  const themes = THEMES.map((t) => {
    const tc = themeColors(css, t);
    return { ...tc, pairs: allowedPairs(tc), forbidden: forbiddenPairs(tc) };
  });
  const bad = themes.flatMap((t) => t.pairs.filter((p) => p.ratio < p.min).map((p) => ({ ...p, theme: t.theme })));
  return { themes, bad };
}
const label = (p) => `${p.theme} : ${p.id} = ${f2(p.ratio)} (< ${p.min})`;

// ---------- --derive ----------
if (opt('--derive')) {
  const hex = opt('--derive');
  const css = base;
  for (const t of THEMES) {
    const d = deriveForTheme(hex, themeColors(css, t), DEFAULT_PCT[t]);
    console.log(`${t} : acc-text ${d.accText.hex}${d.accText.refused ? ' REFUSÉ' : ''} (${f2(d.accText.ratio)}) ; on-acc ${d.onAcc.hex} (${f2(d.onAcc.ratio)})${d.onAcc.refused ? ' REFUSÉ' : ''} ; dim-pct ${d.dim.pct}%${d.dim.ok ? '' : ' REFUSÉ'} (pire : ${d.dim.worst.pair} ${f2(d.dim.worst.ratio)})`);
  }
  process.exit(0);
}

// ---------- --fixture : une feuille de réglages ----------
if (opt('--fixture')) {
  const file = resolve(opt('--fixture'));
  const m = measure(base + '\n' + readFileSync(file, 'utf8'));
  for (const b of m.bad) fail(label(b));
  report(`fixture ${relative(ROOT, file)}`, m);
  finish();
}

function report(title, m) {
  const n = m.themes.reduce((s, t) => s + t.pairs.length, 0);
  console.log(`${title} : ${n} paires sur ${m.themes.length} thèmes, ${m.bad.length} sous le seuil`);
  for (const t of m.themes) {
    const text = t.pairs.filter((p) => p.kind === 'text');
    const worst = text.reduce((a, b) => (b.ratio < a.ratio ? b : a));
    const foc = t.pairs.filter((p) => p.kind === 'focus').reduce((a, b) => (b.ratio < a.ratio ? b : a));
    console.log(`  ${t.theme.padEnd(6)} pire texte ${f2(worst.ratio)} (${worst.id}) ; pire focus ${f2(foc.ratio)} (${foc.id})`);
    if (verbose) for (const p of t.pairs) console.log(`    ${p.ratio >= p.min ? 'ok ' : 'KO '} ${f2(p.ratio).padStart(5)} / ${p.min}  ${p.id}`);
  }
}
function finish() {
  if (failures.length) {
    console.error(`check-contrast : ${failures.length} échec(s)`);
    for (const f of failures) console.error('  - ' + f);
    process.exit(1);
  }
  console.log('check-contrast : 0 échec');
  process.exit(0);
}

// ---------- défaut : thèmes Chopa ----------
const main = measure(base);
for (const b of main.bad) fail(label(b));
report('chopa.css', main);
const byTheme = Object.fromEntries(main.themes.map((t) => [t.theme, t]));
const get = (theme, id) => byTheme[theme].pairs.find((p) => p.id === id);

// Valeurs de référence de l'architecture.
const refs = [['clair', 'acc-text sur bg', 5.06], ['chaud', 'mute sur bg', 6.71]];
for (const [theme, id, expected] of refs) {
  const p = get(theme, id);
  if (!p) { fail(`référence absente : ${theme} ${id}`); continue; }
  const ok = f2(p.ratio) === f2(expected);
  console.log(`  référence ${theme} ${id} = ${f2(p.ratio)} (attendu ${f2(expected)}) ${ok ? 'ok' : 'ÉCART'}`);
  if (!ok) fail(`référence ${theme} ${id} : ${f2(p.ratio)} au lieu de ${f2(expected)}`);
}

// Interdits : hors des paires autorisées, et justifiés par la mesure là où l'architecture le dit.
for (const t of main.themes) {
  for (const f of t.forbidden) {
    if (t.pairs.some((p) => p.text === f.text && p.on === f.on)) fail(`${t.theme} : ${f.text} sur ${f.on} est interdit mais figure dans les paires autorisées`);
    if ((f.mustFail[t.theme] || []).includes(f.surface) && f.ratio >= MIN_TEXT) fail(`${t.theme} : ${f.text} sur ${f.on} (${f.surface}) = ${f2(f.ratio)} : l'interdit n'est plus justifié par la mesure, revoir le tableau`);
  }
}
const interdits = main.themes.flatMap((t) => t.forbidden.map((f) => `${t.theme}/${f.surface} ${f2(f.ratio)}`));
console.log(`  interdit : acc-text sur acc-dim, mesuré ${interdits.join(', ')} (doit rester < ${MIN_TEXT} en clair sur bg et bg2)`);

// Fixtures : accent bleu et jaune (tests/fixtures/). Attentes écrites ici, jamais déduites du fichier.
const FIXTURES = join(ROOT, 'tests', 'fixtures');
const readFix = (name) => { const p = join(FIXTURES, name); if (!existsSync(p)) { fail(`fixture absente : tests/fixtures/${name}`); return null; } return readFileSync(p, 'utf8'); };

// Bleu #2563eb : réglages calculés, paires toutes >= seuil, et la fixture est égale au calcul.
const accBleu = '#2563eb';
const bleu = readFix('retheme-bleu.css');
if (bleu) {
  const m = measure(base + '\n' + bleu);
  for (const b of m.bad) fail(`bleu, ${label(b)}`);
  console.log(`fixture retheme-bleu.css : ${m.bad.length} paire(s) sous le seuil`);
  for (const t of THEMES) {
    const d = deriveForTheme(accBleu, themeColors(base, t), DEFAULT_PCT[t]);
    const tc = m.themes.find((x) => x.theme === t);
    const got = toHex(tc.colors['acc-text']);
    const worstSurface = Math.min(...['bg', 'bg2', 'card'].map((s) => get2(tc, 'acc-text', s)));
    console.log(`  bleu ${t.padEnd(6)} acc-text ${got} (calcul ${d.accText.hex}), pire surface ${f2(worstSurface)} ; on-acc/acc ${f2(get2(tc, 'on-acc', 'acc'))} ; dim-pct ${tc.dimPct}%`);
    if (got !== d.accText.hex) fail(`bleu ${t} : acc-text de la fixture ${got} ≠ calcul ${d.accText.hex}`);
    if (d.accText.refused) fail(`bleu ${t} : acc-text refusé`);
    if (t === 'sombre' && worstSurface < 4.6) fail(`bleu sombre : acc-text ${f2(worstSurface)} < 4,6`);
  }
}
function get2(tc, text, on) { return tc.pairs.find((p) => p.text === text && p.on === on).ratio; }

// Jaune #ffd400 : avant correction, `mute` sur acc-dim sur card, sombre, = 4,20 (échec attendu) ; après : >= 4,5.
const avant = readFix('retheme-jaune-avant.css');
if (avant) {
  const m = measure(base + '\n' + avant);
  const p = m.themes.find((t) => t.theme === 'sombre').pairs.find((x) => x.id === 'mute sur acc-dim (card)');
  const isBad = p.ratio < p.min;
  console.log(`fixture retheme-jaune-avant.css : sombre mute sur acc-dim (card) = ${f2(p.ratio)} (attendu 4.20, échec attendu : ${isBad ? 'oui' : 'NON'})`);
  if (f2(p.ratio) !== '4.20') fail(`jaune avant : mute sur acc-dim (card) sombre = ${f2(p.ratio)} au lieu de 4.20`);
  if (!isBad) fail('jaune avant : la paire devait échouer (cas d\'essai de dim-pct)');
}
const apres = readFix('retheme-jaune.css');
if (apres) {
  const m = measure(base + '\n' + apres);
  for (const b of m.bad) fail(`jaune, ${label(b)}`);
  const tc = m.themes.find((t) => t.theme === 'sombre');
  console.log(`fixture retheme-jaune.css : ${m.bad.length} paire(s) sous le seuil ; sombre dim-pct ${tc.dimPct}%, mute sur acc-dim (card) = ${f2(tc.pairs.find((x) => x.id === 'mute sur acc-dim (card)').ratio)}`);
  for (const t of THEMES) {
    const d = deriveForTheme('#ffd400', themeColors(base, t), DEFAULT_PCT[t]);
    const got = toHex(m.themes.find((x) => x.theme === t).colors['acc-text']);
    if (got !== d.accText.hex) fail(`jaune ${t} : acc-text de la fixture ${got} ≠ calcul ${d.accText.hex}`);
  }
}
finish();
