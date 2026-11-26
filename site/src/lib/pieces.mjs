// Lecture des fiches de pièces (site/src/data/<slug>.mjs) et liste de la navigation de premier niveau.
// Une fiche = un fichier, découvert par glob : ajouter une pièce n'édite aucun fichier partagé.
//
// FORMAT D'UNE FICHE (export par défaut, JavaScript pur : les contrôles de scripts/checks/ l'importent aussi) :
//   titre     : string, obligatoire, nom de la pièce (« Bouton »)
//   famille   : string, obligatoire (Fondations, Base et formulaires, Navigation, Contenu et médias, Retours et fenêtres)
//   jalon     : string, obligatoire (« J2b »)
//   ref       : 'P' (présente dans la planche, parité automatique) ou 'N' (nouvelle), obligatoire
//   but       : string, obligatoire, une phrase
//   quand     : string, quand l'employer (et quand ne pas le faire)
//   variantes : [{ titre, exemple: 'slug/nom', texte? }], l'exemple est site/src/examples/<slug>/<nom>.html
//   etats     : [string]   (survol, focus, désactivé…)
//   a11y      : [string]   (points d'accessibilité)
//   js        : string     (« aucun » ou le module de chopa.js requis)
//   classes   : [string]   facultatif, classes ch- à retrouver par la recherche (les classes des exemples sont ajoutées seules)
// Le nom du fichier (sans .mjs) est le slug ; la page est /composants/<slug>/.

export const FAMILLES = ['Fondations', 'Base et formulaires', 'Navigation', 'Contenu et médias', 'Retours et fenêtres'];

const brut = import.meta.glob('../data/*.mjs', { eager: true });
const exemples = import.meta.glob('../examples/**/*.html', { query: '?raw', import: 'default', eager: true });

const rang = (f) => { const i = FAMILLES.indexOf(f); return i < 0 ? FAMILLES.length : i; };

export const pieces = Object.entries(brut)
  .map(([chemin, mod]) => ({ slug: chemin.replace(/^.*\/([^/]+)\.mjs$/, '$1'), ...mod.default }))
  .sort((a, b) => rang(a.famille) - rang(b.famille) || (a.famille ?? '').localeCompare(b.famille ?? '', 'fr') || a.titre.localeCompare(b.titre, 'fr'));

// [{ famille, pieces: [...] }] dans l'ordre des familles.
export const parFamille = [...new Set(pieces.map((p) => p.famille))].map((famille) => ({ famille, pieces: pieces.filter((p) => p.famille === famille) }));

// Classes ch- d'une pièce : celles de la fiche et celles trouvées dans le HTML de ses exemples.
export function classesDe(piece) {
  const set = new Set(piece.classes ?? []);
  for (const v of piece.variantes ?? []) {
    const src = exemples[`../examples/${v.exemple}.html`] ?? '';
    for (const m of src.matchAll(/\bch-[a-z0-9_-]+/g)) set.add(m[0]);
  }
  return [...set].sort();
}

// Navigation de premier niveau, écrite une fois. Une page qui n'existe pas encore s'affiche en texte (« à venir ») :
// elle devient un lien d'elle-même quand son fichier est créé dans pages/, sans éditer cette liste.
// `toujours` : lien posé d'avance (la page « thème » sera créée à J1c).
const fichiersPages = Object.keys(import.meta.glob('../pages/**/*.astro'));
const existe = (chemin) => {
  const sans = chemin.replace(/^\/|\/$/g, '') || 'index';
  return fichiersPages.some((f) => f === `../pages/${sans}.astro` || f === `../pages/${sans}/index.astro`);
};
const PAGES = [
  { titre: 'Accueil', chemin: '/', but: 'Présentation de la bibliothèque' },
  { titre: 'Installation', chemin: '/installation/', but: 'Copier dist-lib et brancher chopa.css en moins de 5 minutes' },
  { titre: 'Jetons', chemin: '/jetons/', but: 'Couleurs, contrastes, espacements, thèmes' },
  { titre: 'Créer ton thème', chemin: '/theme/', but: 'Choisir un accent et obtenir les réglages calculés', toujours: true },
  { titre: 'Gabarits', chemin: '/gabarits/', but: 'Pages complètes : portfolio, jeu, appli, boutique, blog, doc' },
  { titre: 'Marque', chemin: '/marque/', but: 'Logo CHOPA et point carré' },
  { titre: 'Icônes', chemin: '/icones/', but: 'Jeu d\'icônes' },
  { titre: 'Effets', chemin: '/effets/', but: 'Bandes, apparition des titres, grain' },
];
export const pagesNav = PAGES.map((p) => ({ ...p, existe: existe(p.chemin), lien: Boolean(p.toujours) || existe(p.chemin) }));
