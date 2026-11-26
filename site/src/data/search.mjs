export default {
  titre: 'Recherche',
  famille: 'Base et formulaires',
  jalon: 'J2b',
  ref: 'N',
  but: 'Un champ de recherche et son bouton, soudés sur une ligne.',
  quand: 'Pour chercher dans un site, un journal, un inventaire. Le conteneur est un repère de navigation : une seule recherche par page, ou chacune avec son nom.',
  variantes: [
    { titre: 'Champ et bouton', exemple: 'search/defaut', texte: 'ch-search : un ch-input type="search" nommé par aria-label, et un bouton texte. Ici sans repère : un <div> à poser dans un formulaire de recherche ou une barre de filtres existants.' },
    { titre: 'Formulaire de recherche, bouton icône', exemple: 'search/icone', texte: '<form class="ch-search" role="search" aria-label="…"> : le repère « recherche » nommé. Le bouton ne montre que la loupe : aria-label obligatoire.' },
    { titre: 'Élément <search>', exemple: 'search/element', texte: 'L\'élément <search> porte le rôle sans attribut (navigateurs récents) ; donne-lui un aria-label. Le bouton peut être d\'une autre variante.' },
  ],
  etats: ['Repos, survol, focus visible du champ et du bouton : comme le champ texte et le bouton.'],
  a11y: [
    'role="search" (ou <search>) : le repère « recherche » est annoncé ; si la page en a plusieurs (la recherche du site et celle-ci), chacun porte un aria-label différent, sinon les lecteurs d\'écran ne les distinguent pas.',
    'Le champ a un nom (aria-label ou libellé visible) : un placeholder seul ne suffit pas.',
    'Le bouton a un nom ; en version icône, aria-label.',
    'Le bouton d\'effacement natif de WebKit est masqué (Échap efface dans les navigateurs qui le gèrent).',
  ],
  js: 'aucun',
  classes: ['ch-search'],
};
