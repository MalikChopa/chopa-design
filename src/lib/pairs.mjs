// Paires autorisées (docs/ARCHITECTURE.md, section 9, D5) : texte × fonds où il peut se trouver, calculées des rôles.
// Partagé par scripts/static/check-contrast.mjs, la page des jetons et (J1c) « créer ton thème ».
import { ratio } from './color.mjs';
import { dimOn } from './css-tokens.mjs';

export const SURFACES = ['bg', 'bg2', 'card'];
export const MIN_TEXT = 4.5;
export const MIN_FOCUS = 3;

// Interdits : listés, jamais utilisés ; check-contrast vérifie qu'ils restent hors des paires autorisées et que
// l'interdit du thème clair se justifie encore par la mesure (< 4,5 sur bg et bg2).
export const FORBIDDEN = [
  { text: 'acc-text', on: 'acc-dim', raison: 'en clair, l\'orange foncé posé sur la teinte d\'accent tombe sous 4,5 sur bg et bg2 (la surface card passe, mais la paire reste interdite : le texte ne doit pas dépendre de la surface)', mustFail: { clair: ['bg', 'bg2'] } },
];

// Rend [{ id, text, on, back: 'bg'|'bg2'|'card'|'acc', surface, kind: 'text'|'focus', min, ratio }] pour un thème.
export function allowedPairs({ colors }) {
  const out = [];
  const add = (text, on, backColor, surface, kind, min) =>
    out.push({ id: `${text} sur ${on}${surface ? ` (${surface})` : ''}`, text, on, surface, kind, min, ratio: ratio(colors[text], backColor) });
  for (const t of ['fg', 'soft', 'mute', 'acc-text']) for (const s of SURFACES) add(t, s, colors[s], null, 'text', MIN_TEXT);
  const dim = dimOn(colors);
  for (const t of ['fg', 'soft', 'mute']) for (const s of SURFACES) add(t, 'acc-dim', dim[s], s, 'text', MIN_TEXT);
  add('on-acc', 'acc', colors.acc, null, 'text', MIN_TEXT);
  for (const s of SURFACES) add('focus', s, colors[s], null, 'focus', MIN_FOCUS);
  return out;
}

// Mesure des paires interdites : [{ text, on, surface, ratio, raison }].
export function forbiddenPairs(theme) {
  const dim = dimOn(theme.colors);
  const out = [];
  for (const f of FORBIDDEN) {
    for (const s of SURFACES) {
      const back = f.on === 'acc-dim' ? dim[s] : theme.colors[f.on];
      out.push({ ...f, surface: s, ratio: ratio(theme.colors[f.text], back) });
    }
  }
  return out;
}
