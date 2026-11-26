// Calcul des réglages d'un site à partir d'un accent (docs/ARCHITECTURE.md, section 3) : `acc-text`, `on-acc` et
// `dim-pct` par thème. Utilise les surfaces d'un thème lu par css-tokens.mjs. Sert au banc et à « créer ton thème ».
import { textSafeAccent, onAccent, parseColor, ratio, composite } from './color.mjs';
import { SURFACES, MIN_TEXT } from './pairs.mjs';

export const DIM_STEP = 0.5;   // pas de --ch-dim-pct, en points
export const DIM_FLOOR = 6;    // plancher, en %

// theme = résultat de themeColors() ; defaultPct = --ch-dim-pct du thème Chopa.
export function deriveForTheme(accHex, theme, defaultPct) {
  const direction = theme.theme === 'clair' ? 'darker' : 'lighter';
  const backs = SURFACES.map((s) => theme.colors[s]);
  const text = textSafeAccent(accHex, backs, direction);
  const on = onAccent(accHex);
  const dim = deriveDimPct(accHex, theme, defaultPct);
  return { theme: theme.theme, accText: text, onAcc: on, dim };
}

// Abaisse la part par pas de 0,5 point jusqu'à ce que fg, soft et mute atteignent 4,5 sur la teinte posée sur
// chaque surface. Rend { pct, ok, worst: { pair, ratio } } ; ok = false : plancher atteint sans succès.
export function deriveDimPct(accHex, theme, defaultPct) {
  const acc = parseColor(accHex);
  const worstAt = (pct) => {
    const tint = { ...acc, a: pct / 100 };
    let worst = { ratio: Infinity, pair: '' };
    for (const s of SURFACES) {
      const back = composite(tint, theme.colors[s]);
      for (const t of ['fg', 'soft', 'mute']) {
        const r = ratio(theme.colors[t], back);
        if (r < worst.ratio) worst = { ratio: r, pair: `${t} sur acc-dim (${s})` };
      }
    }
    return worst;
  };
  for (let pct = defaultPct; pct >= DIM_FLOOR - 1e-9; pct = Math.round((pct - DIM_STEP) * 10) / 10) {
    const w = worstAt(pct);
    if (w.ratio >= MIN_TEXT) return { pct, ok: true, worst: w };
  }
  return { pct: DIM_FLOOR, ok: false, worst: worstAt(DIM_FLOOR) };
}
