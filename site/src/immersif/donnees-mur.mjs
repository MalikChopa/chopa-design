// Données des tuiles (docs/ARCHITECTURE.md §16.4, décision M8) : lues des fiches (pieces.mjs, non modifié), des
// miniatures (site/src/tuiles/<slug>.html, découvertes par glob) et de familles-mur.mjs. Sous Vite seulement (glob).
//   familles : [{ nom, ancre, num, propre, pieces: [{ slug, titre, but, href, num, html }] }]
// Les 5 familles des fiches d'abord (ordre de FAMILLES, puis de `pieces`), puis les 2 familles propres au mur.
import { pieces, FAMILLES } from '../lib/pieces.mjs';
import { FAMILLES_MUR } from './familles-mur.mjs';

const fichiers = import.meta.glob('../tuiles/*.html', { query: '?raw', import: 'default', eager: true });
const tuile = (slug) => {
  const html = fichiers[`../tuiles/${slug}.html`];
  if (typeof html !== 'string') throw new Error(`miniature manquante : site/src/tuiles/${slug}.html`);
  return html.trim();
};
const ancre = (f) => f.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const groupes = [
  ...FAMILLES.map((nom) => ({ nom, propre: false, pieces: pieces.filter((p) => p.famille === nom).map((p) => ({ slug: p.slug, titre: p.titre, but: p.but ?? '', href: `/composants/${p.slug}/` })) })),
  ...FAMILLES_MUR.map((g) => ({ nom: g.famille, propre: true, pieces: g.pieces.map((p) => ({ ...p })) })),
];

export const familles = groupes.map((g, gi) => {
  const num = String(gi + 1).padStart(2, '0');
  return {
    nom: g.nom, ancre: ancre(g.nom), num, propre: g.propre,
    pieces: g.pieces.map((p, pi) => ({ ...p, num: `${num}·${String(pi + 1).padStart(2, '0')}`, html: tuile(p.slug) })),
  };
});
export const total = familles.reduce((n, f) => n + f.pieces.length, 0);
