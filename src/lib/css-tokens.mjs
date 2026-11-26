// Lecture des jetons par thème dans le CSS construit (dist-lib/chopa.css), éventuellement suivi d'une feuille de
// réglages (fixture ou bloc de « créer ton thème »). Sans dépendance, sans accès disque (on lui passe du texte).
// Seules formes de valeur résolues : var(--x[, repli]) et, pour les couleurs, color-mix(in srgb, …) (voir color.mjs).
// Les blocs d'at-rules (@media…) ne sont pas lus : s'ils posent un jeton --ch-, la lecture échoue (pas de silence).
import { parseColor, composite } from './color.mjs';

export const THEMES = ['sombre', 'clair', 'chaud'];
export const COLOR_ROLES = ['bg', 'bg2', 'card', 'line', 'fg', 'soft', 'mute', 'acc', 'acc-text', 'on-acc', 'acc-dim', 'focus'];

const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');

// Parcourt les blocs de premier niveau : [{ selector, body }] ; les at-rules sont rendues avec selector « @… ».
function topBlocks(css) {
  const out = []; let i = 0; let buf = ''; let quote = null;
  while (i < css.length) {
    const c = css[i];
    if (quote) { buf += c; if (c === '\\') { buf += css[i + 1] ?? ''; i += 2; continue; } if (c === quote) quote = null; i++; continue; }
    if (c === '"' || c === "'") { quote = c; buf += c; i++; continue; }
    if (c === ';') { buf = ''; i++; continue; } // at-rule sans bloc (@import…)
    if (c === '{') {
      let depth = 1, j = i + 1, q = null;
      while (j < css.length && depth) {
        const d = css[j];
        if (q) { if (d === '\\') j++; else if (d === q) q = null; } else if (d === '"' || d === "'") q = d; else if (d === '{') depth++; else if (d === '}') depth--;
        j++;
      }
      out.push({ selector: buf.trim(), body: css.slice(i + 1, j - 1) });
      buf = ''; i = j; continue;
    }
    buf += c; i++;
  }
  return out;
}

// Déclarations d'un corps : coupe aux « ; » hors parenthèses et guillemets.
function decls(body) {
  const out = []; let depth = 0, quote = null, buf = '';
  const flush = () => {
    const k = buf.indexOf(':');
    if (k > 0) out.push({ prop: buf.slice(0, k).trim(), value: buf.slice(k + 1).trim() });
    buf = '';
  };
  for (let i = 0; i < body.length; i++) {
    const c = body[i];
    if (quote) { buf += c; if (c === quote) quote = null; continue; }
    if (c === '"' || c === "'") { quote = c; buf += c; continue; }
    if (c === '(') depth++;
    if (c === ')') depth--;
    if (c === ';' && depth === 0) flush(); else buf += c;
  }
  flush();
  return out;
}

// Un sélecteur de la liste vise-t-il ce thème ? `:root` et `[data-ch-theme]` : tous ; `[data-ch-theme="x"]` : x.
function appliesTo(selector, theme) {
  return selector.split(',').map((s) => s.trim()).some((s) => {
    if (s === ':root' || s === '[data-ch-theme]') return true;
    const m = s.match(/^\[data-ch-theme="([a-z]+)"\]$/);
    return m ? m[1] === theme : false;
  });
}

// Jetons bruts (--ch-*) d'un thème, dans l'ordre de la cascade : { 'ch-bg': '#050505', … } (clé sans « -- »).
export function rawTokens(css, theme) {
  const map = {};
  for (const b of topBlocks(stripComments(css))) {
    if (b.selector.startsWith('@')) {
      if (/--ch-[\w-]+\s*:/.test(b.body)) throw new Error(`jeton --ch- dans un at-rule (${b.selector.slice(0, 40)}) : forme non gérée`);
      continue;
    }
    if (!appliesTo(b.selector, theme)) continue;
    for (const d of decls(b.body)) if (d.prop.startsWith('--')) map[d.prop.slice(2)] = d.value;
  }
  return map;
}

// Substitue les var() (récursivement, repli compris) ; erreur si un jeton manque ou boucle.
export function resolve(value, map, trail = []) {
  let out = ''; let i = 0;
  while (i < value.length) {
    const k = value.indexOf('var(', i);
    if (k < 0) { out += value.slice(i); break; }
    out += value.slice(i, k);
    let depth = 1, j = k + 4;
    while (j < value.length && depth) { if (value[j] === '(') depth++; else if (value[j] === ')') depth--; j++; }
    const inner = value.slice(k + 4, j - 1);
    const comma = inner.indexOf(',');
    const name = (comma < 0 ? inner : inner.slice(0, comma)).trim().slice(2);
    const fallback = comma < 0 ? null : inner.slice(comma + 1).trim();
    if (trail.includes(name)) throw new Error(`boucle de var() : ${[...trail, name].join(' > ')}`);
    if (map[name] !== undefined) out += resolve(map[name], map, [...trail, name]);
    else if (fallback !== null) out += resolve(fallback, map, trail);
    else throw new Error(`jeton absent : --${name}`);
    i = j;
  }
  return out;
}

// Tous les jetons d'un thème, valeurs résolues (texte).
export function resolvedTokens(css, theme) {
  const raw = rawTokens(css, theme);
  const out = {};
  for (const [k, v] of Object.entries(raw)) out[k] = resolve(v, raw, [k]);
  return out;
}

// Couleurs des rôles d'un thème : { bg: {r,g,b,a}, …, 'acc-dim': {…a<1} } + `texts` (valeurs résolues) et `dimPct`.
export function themeColors(css, theme) {
  const tokens = resolvedTokens(css, theme);
  const colors = {};
  for (const role of COLOR_ROLES) {
    const v = tokens[`ch-${role}`];
    if (v === undefined) throw new Error(`rôle absent dans le thème ${theme} : --ch-${role}`);
    try { colors[role] = parseColor(v); } catch (e) { throw new Error(`thème ${theme}, --ch-${role} : ${e.message}`); }
  }
  const pct = tokens['ch-dim-pct'];
  return { theme, colors, texts: tokens, dimPct: pct === undefined ? null : parseFloat(pct) };
}

// `acc-dim` posé sur chacune des trois surfaces : { bg, bg2, card } opaques.
export function dimOn(colors) {
  return { bg: composite(colors['acc-dim'], colors.bg), bg2: composite(colors['acc-dim'], colors.bg2), card: composite(colors['acc-dim'], colors.card) };
}
