// Couleurs : lecture, composition alpha, contraste WCAG 2.x, OKLCH, calcul de l'accent « sûr pour le texte ».
// Sans dépendance, sans accès disque : sert au contrôle `scripts/static/check-contrast.mjs`, à la page des jetons
// (build) et, plus tard, à la page « créer ton thème » (navigateur). Une couleur = { r, g, b, a } (0-255, a 0-1).

// ---------- lecture ----------
const clamp255 = (n) => Math.max(0, Math.min(255, n));

// Coupe `s` aux virgules de premier niveau (hors parenthèses).
function splitTop(s) {
  const out = []; let depth = 0; let buf = '';
  for (const c of s) {
    if (c === '(') depth++;
    if (c === ')') depth--;
    if (c === ',' && depth === 0) { out.push(buf.trim()); buf = ''; } else buf += c;
  }
  if (buf.trim()) out.push(buf.trim());
  return out;
}

// Formes gérées : #rgb #rgba #rrggbb #rrggbbaa, rgb()/rgba() à virgules, transparent, color-mix(in srgb, …).
// Toute autre forme lève une erreur (pas de repli silencieux).
export function parseColor(input) {
  const s = String(input).trim().toLowerCase();
  if (s === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };
  let m = s.match(/^#([0-9a-f]{3,8})$/);
  if (m) {
    let h = m[1];
    if (h.length === 3 || h.length === 4) h = [...h].map((c) => c + c).join('');
    if (h.length !== 6 && h.length !== 8) throw new Error(`couleur illisible : ${input}`);
    const n = (i) => parseInt(h.slice(i, i + 2), 16);
    return { r: n(0), g: n(2), b: n(4), a: h.length === 8 ? n(6) / 255 : 1 };
  }
  m = s.match(/^rgba?\((.*)\)$/);
  if (m) {
    const p = splitTop(m[1]);
    if (p.length < 3 || p.length > 4 || p.slice(0, 3).some((x) => !/^\d+(\.\d+)?$/.test(x))) throw new Error(`rgb() non géré : ${input}`);
    const a = p[3] === undefined ? 1 : p[3].endsWith('%') ? parseFloat(p[3]) / 100 : parseFloat(p[3]);
    return { r: clamp255(+p[0]), g: clamp255(+p[1]), b: clamp255(+p[2]), a };
  }
  m = s.match(/^color-mix\((.*)\)$/);
  if (m) {
    const p = splitTop(m[1]);
    if (p.length !== 3 || !/^in\s+srgb$/.test(p[0])) throw new Error(`color-mix non géré (seul « in srgb » à deux couleurs) : ${input}`);
    const parse = (item) => {
      const mm = item.match(/^(.*?)(?:\s+(\d+(?:\.\d+)?)%)?$/);
      return { color: parseColor(mm[1]), pct: mm[2] === undefined ? null : parseFloat(mm[2]) };
    };
    return mixSrgb(parse(p[1]), parse(p[2]));
  }
  throw new Error(`forme de couleur non gérée : ${input}`);
}

// color-mix en sRGB, alpha pré-multiplié (comportement de la spécification CSS Color 5).
function mixSrgb(A, B) {
  let p1 = A.pct, p2 = B.pct;
  if (p1 === null && p2 === null) { p1 = 50; p2 = 50; }
  else if (p1 === null) p1 = 100 - p2;
  else if (p2 === null) p2 = 100 - p1;
  const sum = p1 + p2;
  if (sum <= 0) throw new Error('color-mix : somme des pourcentages nulle');
  const w1 = p1 / sum, w2 = p2 / sum;
  const alpha = A.color.a * w1 + B.color.a * w2;
  const ch = (k) => (alpha === 0 ? 0 : (A.color[k] * A.color.a * w1 + B.color[k] * B.color.a * w2) / alpha);
  // Somme < 100 % : l'alpha est multiplié par la somme (spécification).
  return { r: ch('r'), g: ch('g'), b: ch('b'), a: alpha * Math.min(1, sum / 100) };
}

export const toHex = ({ r, g, b }) => '#' + [r, g, b].map((v) => Math.round(clamp255(v)).toString(16).padStart(2, '0')).join('');

// ---------- composition et contraste ----------
// `top` (avec alpha) posé sur `under` (opaque).
export function composite(top, under) {
  const a = top.a;
  return { r: top.r * a + under.r * (1 - a), g: top.g * a + under.g * (1 - a), b: top.b * a + under.b * (1 - a), a: 1 };
}

export function luminance({ r, g, b }) {
  const f = (v) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
// Rapport de contraste WCAG 2.x entre deux couleurs opaques.
export function ratio(c1, c2) {
  const a = luminance(c1), b = luminance(c2);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

// ---------- OKLCH (Ottosson) ----------
const lin = (v) => { const c = v / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const unlin = (c) => 255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

export function srgbToOklch({ r, g, b }) {
  const R = lin(r), G = lin(g), B = lin(b);
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
  const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
  const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return { L, C: Math.hypot(a, bb), h: Math.atan2(bb, a) };
}
// Rend le sRGB (0-255, non borné) ; `inGamut` dit si les 3 canaux sont dans [0, 255] (tolérance 0,05).
export function oklchToSrgb({ L, C, h }) {
  const a = C * Math.cos(h), b = C * Math.sin(h);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const R = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const G = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const B = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;
  const rgb = { r: unlin(R), g: unlin(G), b: unlin(B), a: 1 };
  rgb.inGamut = [rgb.r, rgb.g, rgb.b].every((v) => v >= -0.05 && v <= 255.05);
  return rgb;
}
// Ramène L, h fixes dans le gamut en réduisant le chroma si besoin (recherche par dichotomie).
function fitGamut({ L, C, h }) {
  let c = oklchToSrgb({ L, C, h });
  if (c.inGamut) return c;
  let lo = 0, hi = C;
  for (let i = 0; i < 30; i++) {
    const mid = (lo + hi) / 2;
    if (oklchToSrgb({ L, C: mid, h }).inGamut) lo = mid; else hi = mid;
  }
  return oklchToSrgb({ L, C: lo, h });
}

// ---------- paires et accent ----------
export const INK = '#050505';      // noir des textes sur accent
export const PAPER = '#f4f4f1';    // blanc cassé

// Pire contraste d'une couleur de texte sur une liste de fonds opaques.
export const worstRatio = (text, backs) => Math.min(...backs.map((b) => ratio(text, b)));

// Accent « sûr pour le texte » : même teinte et même chroma que `acc`, clarté déplacée par pas de 0,002 vers le
// clair (`direction` = 'lighter', thèmes sombre et chaud) ou vers le foncé ('darker', thème clair), jusqu'à
// `target` (4,6) sur le pire des fonds `backs`. Rend { hex, ratio, moved } ou { refused: true, … } si le blanc ou le
// noir est atteint sans y parvenir. Le chroma est réduit seulement si la couleur sort du gamut sRGB.
export function textSafeAccent(accHex, backs, direction, target = 4.6) {
  const acc = parseColor(accHex);
  const lch = srgbToOklch(acc);
  const rounded = (c) => ({ r: Math.round(clamp255(c.r)), g: Math.round(clamp255(c.g)), b: Math.round(clamp255(c.b)), a: 1 });
  const start = rounded(acc);
  if (worstRatio(start, backs) >= target) return { hex: toHex(start), ratio: worstRatio(start, backs), moved: false };
  const step = direction === 'lighter' ? 0.002 : -0.002;
  for (let L = lch.L + step; L >= 0 && L <= 1.0001; L += step) {
    const c = rounded(fitGamut({ L, C: lch.C, h: lch.h }));
    const r = worstRatio(c, backs);
    if (r >= target) return { hex: toHex(c), ratio: r, moved: true };
  }
  const end = direction === 'lighter' ? '#ffffff' : '#000000';
  return { refused: true, hex: end, ratio: worstRatio(parseColor(end), backs), moved: true };
}

// Texte sur accent : noir #050505 ou blanc cassé #f4f4f1, le meilleur ; refusé sous 4,5.
export function onAccent(accHex) {
  const acc = parseColor(accHex);
  const cands = [INK, PAPER].map((hex) => ({ hex, ratio: ratio(parseColor(hex), acc) }));
  const best = cands.reduce((x, y) => (y.ratio > x.ratio ? y : x));
  return { ...best, refused: best.ratio < 4.5 };
}
