// Test croisé de « créer ton thème » (J1c, docs/ARCHITECTURE.md sections 3 et 10).
// La page et ce script importent le MÊME module (site/src/theme-maker/maker.mjs) : le navigateur et node donnent la
// même sortie. Ici : (1) accents #2563eb et #ffd400 : la sortie est égale aux fixtures tests/fixtures/maker-*.css ;
// (2) check-contrast --fixture -v relit ces fixtures par un autre chemin (css-tokens) : aucune paire sous le seuil et
// mêmes rapports (2 décimales) que ceux du maker ; (3) jaune : dim-pct corrigé ; (4) un accent refusé (#757575) :
// le maker le refuse en nommant la paire, et check-contrast échoue sur la même paire.
// Attentes écrites ici, jamais déduites des fichiers. Code 1 au premier écart.
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { DIST, OUT, ROOT } from '../lib/paths.mjs';
import { baseFromCss, parseInputs, makeTheme, THEMES, MIN_TEXT } from '../../site/src/theme-maker/maker.mjs';
import { allowedPairs } from '../../src/lib/pairs.mjs';
import { parseColor } from '../../src/lib/color.mjs';

const f2 = (n) => n.toFixed(2);
const failures = [];
const fail = (m) => failures.push(m);
const cssPath = join(DIST, 'chopa.css');
if (!existsSync(cssPath)) { console.error(`theme-maker : ${cssPath} absent (lancer npm run build)`); process.exit(1); }
const base = baseFromCss(readFileSync(cssPath, 'utf8'));
const tmp = join(OUT, 'tm-tmp');
mkdirSync(tmp, { recursive: true });

const SITE = { radius: '8px', sans: 'system-ui, sans-serif', display: 'var(--ch-sans)', mono: 'ui-monospace, monospace' };
const make = (acc) => { const p = parseInputs({ acc, ...SITE }); if (!p.ok) throw new Error(JSON.stringify(p.errors)); return makeTheme(p.values, base); };

// check-contrast en processus séparé (sans shell, HOME dans le dossier temporaire du projet).
function checkContrast(file) {
  const r = spawnSync(process.execPath, [join(ROOT, 'scripts', 'static', 'check-contrast.mjs'), '--fixture', file, '-v'],
    { encoding: 'utf8', env: { ...process.env, HOME: tmp } });
  return { code: r.status, out: r.stdout, err: r.stderr };
}
// Relit les lignes « -v » : { theme: { id: ratio texte } } et le nombre de paires.
function parseVerbose(out) {
  const res = {}; let cur = null; let n = 0;
  for (const line of out.split('\n')) {
    const h = line.match(/^ {2}(sombre|clair|chaud)\s+pire texte/);
    if (h) { cur = h[1]; res[cur] = {}; continue; }
    const p = line.match(/^ {4}(?:ok|KO)\s+(\d+\.\d\d) \/ (\d+(?:\.\d+)?)\s{2}(.+)$/);
    if (p && cur) { res[cur][p[3]] = p[1]; n++; }
  }
  return { res, n };
}

// ---------- (1) et (2) : bleu et jaune ----------
const CAS = [['bleu', '#2563eb'], ['jaune', '#ffd400']];
const made = {};
for (const [nom, acc] of CAS) {
  const r = make(acc); made[nom] = r;
  const file = join(ROOT, 'tests', 'fixtures', `maker-${nom}.css`);
  if (!r.ok) { fail(`${nom} ${acc} : refusé par le maker : ${r.refused.map((x) => x.raison).join(' ; ')}`); continue; }
  const attendu = existsSync(file) ? readFileSync(file, 'utf8') : null;
  if (attendu === null) { fail(`fixture absente : tests/fixtures/maker-${nom}.css`); continue; }
  const same = attendu === r.css;
  console.log(`${nom} ${acc} : sortie ${same ? 'égale' : 'DIFFÉRENTE'} à tests/fixtures/maker-${nom}.css`);
  if (!same) { fail(`${nom} : la sortie du maker diffère de tests/fixtures/maker-${nom}.css`); continue; }
  for (const t of r.themes) if (t.bad.length) fail(`${nom} ${t.theme} : ${t.bad.length} paire(s) sous le seuil selon le maker`);
  const cc = checkContrast(file);
  if (cc.code !== 0) fail(`${nom} : check-contrast --fixture sort en code ${cc.code} : ${cc.err.trim().split('\n').slice(0, 3).join(' / ')}`);
  const v = parseVerbose(cc.out);
  let compared = 0, diff = 0;
  for (const t of r.themes) {
    const theirs = v.res[t.theme];
    if (!theirs) { fail(`${nom} : thème ${t.theme} absent de la sortie de check-contrast`); continue; }
    for (const p of t.pairs) {
      const x = theirs[p.id];
      if (x === undefined) { fail(`${nom} ${t.theme} : paire « ${p.id} » absente chez check-contrast`); diff++; continue; }
      compared++;
      if (x !== f2(p.ratio)) { fail(`${nom} ${t.theme} : « ${p.id} » maker ${f2(p.ratio)} ≠ check-contrast ${x}`); diff++; }
    }
    if (Object.keys(theirs).length !== t.pairs.length) fail(`${nom} ${t.theme} : ${t.pairs.length} paires chez le maker, ${Object.keys(theirs).length} chez check-contrast`);
  }
  const pire = Math.min(...r.themes.flatMap((t) => t.pairs.filter((p) => p.kind === 'text').map((p) => p.ratio)));
  console.log(`  ${compared} paires comparées à check-contrast, ${diff} écart(s) ; pire texte ${f2(pire)} (seuil ${MIN_TEXT}) ; check-contrast code ${cc.code}`);
  for (const t of r.themes) console.log(`  ${t.theme.padEnd(6)} acc-text ${t.accText.hex} (${f2(t.accText.ratio)}) ; dim-pct ${t.dim.pct} % (défaut ${t.defaultPct}) ; on-acc ${r.onAcc.hex} (${f2(r.onAcc.ratio)})`);
}

// ---------- (3) jaune : correction de dim-pct ----------
if (made.jaune?.ok) {
  const sombre = made.jaune.themes.find((t) => t.theme === 'sombre');
  const idDim = 'mute sur acc-dim (card)';
  const apres = sombre.pairs.find((p) => p.id === idDim).ratio;
  const colors = { ...sombre.colors, 'acc-dim': { ...parseColor('#ffd400'), a: sombre.defaultPct / 100 } };
  const avant = allowedPairs({ colors }).find((p) => p.id === idDim).ratio;
  console.log(`jaune sombre : ${idDim} = ${f2(avant)} à ${sombre.defaultPct} %, ${f2(apres)} à ${sombre.dim.pct} %`);
  if (f2(avant) !== '4.20') fail(`jaune : ${idDim} avant correction = ${f2(avant)} au lieu de 4.20`);
  if (sombre.dim.pct !== 10.3) fail(`jaune : dim-pct sombre ${sombre.dim.pct} au lieu de 10.3`);
  if (!(apres >= MIN_TEXT)) fail(`jaune : ${idDim} après correction = ${f2(apres)} < ${MIN_TEXT}`);
  const clair = made.jaune.themes.find((t) => t.theme === 'clair');
  if (clair.accText.hex !== '#7d6700') fail(`jaune clair : acc-text ${clair.accText.hex} au lieu de #7d6700`);
  if (made.jaune.onAcc.hex !== '#050505') fail(`jaune : on-acc ${made.jaune.onAcc.hex} au lieu de #050505`);
}
if (made.bleu?.ok) {
  if (made.bleu.onAcc.hex !== '#f4f4f1' || f2(made.bleu.onAcc.ratio) !== '4.69') fail(`bleu : on-acc ${made.bleu.onAcc.hex} ${f2(made.bleu.onAcc.ratio)} au lieu de #f4f4f1 4.69`);
}

// ---------- (4) accent refusé ----------
{
  const acc = '#757575';
  const r = make(acc);
  const on = r.refused.find((x) => x.kind === 'on-acc');
  console.log(`${acc} : ${r.ok ? 'ACCEPTÉ' : 'refusé'} ; ${r.refused.map((x) => `${x.pair} = ${f2(x.ratio)}`).join(' ; ')}`);
  if (r.ok || r.css !== null) fail(`${acc} : devait être refusé sans sortie`);
  if (!on || on.pair !== 'on-acc sur acc') fail(`${acc} : paire en cause attendue « on-acc sur acc », reçu ${on ? on.pair : 'aucune'}`);
  else {
    const [noir, blanc] = r.onAcc.candidates.map((c) => f2(c.ratio));
    if (noir !== '4.42' || blanc !== '4.18') fail(`${acc} : rapports attendus noir 4.42 / blanc cassé 4.18, reçus ${noir} / ${blanc}`);
    if (!/4\.42/.test(on.raison) || !/4\.18/.test(on.raison)) fail(`${acc} : la raison ne donne pas les deux rapports : ${on.raison}`);
  }
  // Autre chemin : check-contrast, sur les valeurs que le maker aurait posées si on l'avait laissé faire.
  const lignes = [`:root { --ch-acc: ${acc}; --ch-on-acc: ${r.onAcc.hex}; }`];
  for (const t of r.themes) lignes.push(`${t.theme === 'sombre' ? ':root, [data-ch-theme="sombre"]' : `[data-ch-theme="${t.theme}"]`} { --ch-acc-text: ${t.accText.hex}; --ch-dim-pct: ${t.dim.pct}%; }`);
  const f = join(tmp, 'refuse.css');
  writeFileSync(f, lignes.join('\n') + '\n');
  const cc = checkContrast(f);
  const nomme = /on-acc sur acc = 4\.42/.test(cc.err);
  console.log(`  check-contrast sur ce refus : code ${cc.code}, nomme « on-acc sur acc = 4.42 » : ${nomme ? 'oui' : 'NON'}`);
  if (cc.code !== 1 || !nomme) fail(`${acc} : check-contrast devait échouer sur « on-acc sur acc = 4.42 » (code ${cc.code})`);
}

// ---------- (5) champs refusés ----------
for (const [champ, raw] of [['acc', { acc: 'zzz' }], ['acc', { acc: '#12345' }], ['sans', { sans: 'a; } body { x' }], ['mono', { mono: 'url(//x)' }], ['radius', { radius: '8' }], ['display', { display: '' }]]) {
  const p = parseInputs({ acc: '#2563eb', ...SITE, ...raw });
  if (p.ok || !p.errors[champ]) fail(`champ ${champ} = « ${Object.values(raw)[0]} » : devait être refusé`);
}
const defaut = parseInputs({ acc: base.defaults.acc, ...base.defaults });
console.log(`valeurs par défaut de chopa.css acceptées : ${defaut.ok ? 'oui' : 'NON'} (accent ${base.defaults.acc}, arrondi ${base.defaults.radius})`);
if (!defaut.ok) fail('les valeurs par défaut de chopa.css doivent passer la validation : ' + JSON.stringify(defaut.errors));
else { const r = makeTheme(defaut.values, base); if (!r.ok) fail('l\'accent Chopa doit être accepté : ' + r.refused.map((x) => x.raison).join(' ; ')); }

rmSync(tmp, { recursive: true, force: true });
if (failures.length) {
  console.error(`theme-maker : ${failures.length} échec(s)`);
  for (const f of failures) console.error('  - ' + f);
  process.exit(1);
}
console.log('theme-maker : 0 échec');
