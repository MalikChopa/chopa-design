// Calcul de « créer ton thème » (J1c, docs/ARCHITECTURE.md section 3). UN SEUL chemin de dérivation : la page
// (navigateur, via client.mjs) et scripts/static/theme-maker.mjs (node) importent ce module, qui n'ajoute rien aux maths
// de src/lib (gelé) : il les assemble. Pur : aucun accès disque, aucun DOM ; il reçoit les couleurs de base des 3 thèmes
// (baseFromCss, lu dans dist-lib/chopa.css au build) et rend des objets simples et du texte.
import { parseColor, toHex, ratio, INK, PAPER } from '../../../src/lib/color.mjs';
import { THEMES, themeColors, rawTokens } from '../../../src/lib/css-tokens.mjs';
import { allowedPairs, SURFACES, MIN_TEXT } from '../../../src/lib/pairs.mjs';
import { deriveForTheme } from '../../../src/lib/derive.mjs';

export { THEMES, MIN_TEXT };

// Couleurs de base des 3 thèmes Chopa + réglages par défaut, lus dans le CSS construit. Sérialisable en JSON.
export function baseFromCss(css) {
  const themes = THEMES.map((t) => { const tc = themeColors(css, t); return { theme: t, colors: tc.colors, dimPct: tc.dimPct }; });
  const raw = rawTokens(css, 'sombre');
  const sombre = themes[0].colors;
  return {
    themes,
    defaults: { acc: toHex(sombre.acc), radius: raw['ch-radius'], sans: raw['ch-sans'], display: raw['ch-display'], mono: raw['ch-mono'] },
  };
}

// ---------- lecture des champs ----------
// Les polices et l'arrondi finissent dans du CSS (sortie copiée, et feuille d'aperçu) : on n'accepte qu'un jeu restreint
// de caractères (pas de ; { } < > @ / \), des guillemets et parenthèses équilibrés.
const FONT_CHARS = /^[A-Za-z0-9 ,"'\-_.()]+$/;
const balanced = (s) => (s.match(/"/g) || []).length % 2 === 0 && (s.match(/'/g) || []).length % 2 === 0
  && (s.match(/\(/g) || []).length === (s.match(/\)/g) || []).length;

// raw : { acc, radius, sans, display, mono } (textes). Rend { ok, values, errors: { champ: message } }.
export function parseInputs(raw) {
  const errors = {}; const values = {};
  const acc = String(raw.acc ?? '').trim().toLowerCase();
  const m = acc.match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/);
  if (!m) errors.acc = 'Écris un code hexadécimal de 3 ou 6 chiffres, par exemple #2563eb.';
  else values.acc = '#' + (m[1].length === 3 ? [...m[1]].map((c) => c + c).join('') : m[1]);
  const radius = String(raw.radius ?? '').trim();
  if (!/^(0|\d+(\.\d+)?(px|rem|em))$/.test(radius) || parseFloat(radius) > 100) errors.radius = 'Écris 0 ou une longueur comme 8px ou 0.5rem (100 au plus).';
  else values.radius = radius;
  for (const k of ['sans', 'display', 'mono']) {
    const v = String(raw[k] ?? '').trim().replace(/\s+/g, ' ');
    if (!v) errors[k] = 'Ce champ ne peut pas être vide.';
    else if (v.length > 200 || !FONT_CHARS.test(v) || !balanced(v)) errors[k] = 'Seuls les lettres, chiffres, espaces, virgules, guillemets, points, tirets et parenthèses sont admis (pas de ; { } < > @ /), guillemets et parenthèses fermés.';
    else values[k] = v;
  }
  return { ok: Object.keys(errors).length === 0, values, errors };
}

// ---------- calcul ----------
const f2 = (n) => n.toFixed(2);

// values : sortie de parseInputs ; base : sortie de baseFromCss.
// Rend { acc, onAcc, themes: [{ theme, accText, dim, defaultPct, colors, pairs, bad }], refused: [{ theme?, pair, ratio, raison }], ok, css }.
export function makeTheme(values, base) {
  const acc = values.acc;
  const accColor = parseColor(acc);
  const onCands = [INK, PAPER].map((hex) => ({ hex, ratio: ratio(parseColor(hex), accColor) }));
  const refused = [];
  let onAcc = null;
  const themes = base.themes.map((bt) => {
    const d = deriveForTheme(acc, bt, bt.dimPct);
    onAcc = d.onAcc;
    const accText = d.accText;
    const colors = { ...bt.colors };
    colors.acc = accColor;
    colors['acc-text'] = parseColor(accText.hex);
    colors['on-acc'] = parseColor(d.onAcc.hex);
    colors['acc-dim'] = { ...accColor, a: d.dim.pct / 100 };
    colors.focus = colors['acc-text'];
    const pairs = allowedPairs({ colors });
    const bad = pairs.filter((p) => p.ratio < p.min);
    if (accText.refused) {
      const pire = SURFACES.map((s) => ({ s, r: ratio(colors['acc-text'], bt.colors[s]) })).reduce((a, b) => (b.r < a.r ? b : a));
      refused.push({ kind: 'acc-text', theme: bt.theme, pair: `acc-text sur ${pire.s}`, ratio: pire.r, raison: `thème ${bt.theme} : même en poussant la clarté jusqu'à ${accText.hex}, acc-text ne dépasse pas ${f2(pire.r)} sur ${pire.s}` });
    }
    if (!d.dim.ok) refused.push({ kind: 'dim', theme: bt.theme, pair: d.dim.worst.pair, ratio: d.dim.worst.ratio, raison: `thème ${bt.theme} : dim-pct au plancher de 6 %, ${d.dim.worst.pair} reste à ${f2(d.dim.worst.ratio)}` });
    return { theme: bt.theme, accText, dim: d.dim, defaultPct: bt.dimPct, colors, pairs, bad };
  });
  if (onAcc.refused) {
    refused.push({ kind: 'on-acc', pair: 'on-acc sur acc', ratio: onAcc.ratio, raison: `${acc} : texte noir ${INK} = ${f2(onCands[0].ratio)}, texte blanc cassé ${PAPER} = ${f2(onCands[1].ratio)} ; le meilleur reste sous ${MIN_TEXT}` });
  }
  // Filet : toute paire sous son seuil doit être expliquée par un refus du même genre (aucune ne passe en silence).
  const kindOf = (p) => (p.on === 'acc-dim' ? 'dim' : p.text === 'on-acc' ? 'on-acc' : 'acc-text');
  for (const t of themes) {
    for (const p of t.bad) {
      if (!refused.some((r) => r.kind === kindOf(p) && (r.theme === undefined || r.theme === t.theme))) {
        refused.push({ kind: 'autre', theme: t.theme, pair: p.id, ratio: p.ratio, raison: `thème ${t.theme} : ${p.id} = ${f2(p.ratio)}, seuil ${p.min}` });
      }
    }
  }
  const ok = refused.length === 0 && themes.every((t) => t.bad.length === 0);
  const result = { acc, onAcc: { ...onAcc, candidates: onCands }, themes, refused, ok, css: null };
  if (ok) result.css = renderCss(values, result);
  return result;
}

// ---------- sortie ----------
// Même forme que les fixtures de tests/fixtures : un bloc :root, un bloc par thème.
export function renderCss(values, result) {
  const lines = [];
  lines.push(`/* Réglages d'un site, à poser après chopa.css. Accent ${values.acc}.`);
  lines.push('   Produit par « créer ton thème » : acc-text, on-acc et dim-pct recalculés, toutes les paires autorisées à 4,5 : 1 au moins dans les 3 thèmes.');
  if (values.radius !== '0') lines.push(`   Écart assumé : arrondi ${values.radius} (la palette stricte et les coins carrés ne valent que pour les 3 thèmes Chopa). */`);
  else lines[lines.length - 1] += ' */';
  lines.push(':root {');
  lines.push(`  --ch-acc: ${values.acc}; --ch-on-acc: ${result.onAcc.hex};`);
  lines.push(`  --ch-radius: ${values.radius};`);
  lines.push(`  --ch-sans: ${values.sans}; --ch-display: ${values.display}; --ch-mono: ${values.mono};`);
  lines.push('}');
  for (const t of result.themes) {
    const sel = t.theme === 'sombre' ? ':root, [data-ch-theme="sombre"]' : `[data-ch-theme="${t.theme}"]`;
    lines.push(`${sel} { --ch-acc-text: ${t.accText.hex}; --ch-dim-pct: ${t.dim.pct}%; }`);
  }
  return lines.join('\n') + '\n';
}

// Feuille de l'aperçu : mêmes valeurs, portées par .doc-tm-frame (jamais par :root). Rien d'inline dans le HTML.
export function previewCss(values, result) {
  const out = [`.doc-tm-frame[data-ch-theme] { --ch-acc: ${values.acc}; --ch-on-acc: ${result.onAcc.hex}; --ch-radius: ${values.radius}; --ch-sans: ${values.sans}; --ch-display: ${values.display}; --ch-mono: ${values.mono}; }`];
  for (const t of result.themes) out.push(`.doc-tm-frame[data-ch-theme="${t.theme}"] { --ch-acc-text: ${t.accText.hex}; --ch-dim-pct: ${t.dim.pct}%; }`);
  return out.join('\n');
}
