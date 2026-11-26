export default {
  titre: 'Sommaire',
  famille: 'Navigation',
  jalon: 'J3a',
  ref: 'N',
  but: 'La liste des sections d\'une longue page, avec la section en cours marquée.',
  quand: 'Pour un article, une page de documentation ou des règles de plus de trois ou quatre sections. Pour une courte page, rien.',
  variantes: [
    { titre: 'Sommaire d\'une page', exemple: 'toc/defaut', texte: 'data-ch-toc sur ch-toc ; une liste ordonnée de ch-toc__link dont le href est l\'id d\'un titre. Le module marque la section en vue par aria-current="true". Un <nav aria-label="Sommaire"> en fait un repère nommé.' },
    { titre: 'Sommaire d\'article', exemple: 'toc/repere', texte: 'Un second sommaire sur la même page : son nom (aria-label) le distingue du premier.' },
  ],
  etats: [
    'Lien : repos (soft), survol (fg), section en cours (aria-current="true" : fg et filet de 2 px à gauche), focus visible.',
    'Sans JavaScript : une liste d\'ancres ordinaire, sans lien marqué (celui du HTML reste).',
  ],
  a11y: [
    '<nav> avec un aria-label ; liste ordonnée : le lecteur d\'écran annonce le nombre de sections.',
    'aria-current="true" suit la section dont le titre a passé le haut de la fenêtre (observateur d\'intersection, avec le défilement en renfort).',
    'La section en cours se reconnaît au filet et non à la seule couleur ; chaque lien fait 44 px de haut.',
  ],
  js: 'module toc de chopa.js (data-ch-toc), facultatif',
  classes: ['ch-toc'],
};
