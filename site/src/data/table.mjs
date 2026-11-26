export default {
  titre: 'Tableau triable',
  famille: 'Contenu et médias',
  jalon: 'J4a',
  ref: 'P',
  but: 'Présenter des données en lignes et en colonnes, avec des nombres alignés à droite et, au besoin, un tri par colonne.',
  quand: 'Pour comparer des valeurs de même nature : classement, catalogue, relevé. Sur un téléphone, le tableau défile dans son cadre. Pour une liste simple à une colonne, une liste.',
  variantes: [
    { titre: 'Triable', exemple: 'table/triable', texte: 'data-ch-sort sur le table : le module met un bouton dans chaque th de thead. Un clic trie en ordre croissant, un second en ordre décroissant ; aria-sort n\'est posé que sur l\'en-tête trié. Les colonnes ch-table__num (sur le th ET les td) se trient par valeur : espaces, espaces insécables, virgule décimale et unités sont compris ; data-ch-value sur un td l\'emporte. Le tri est stable (les ex æquo gardent leur ordre). Sans JavaScript : tableau lisible, non trié, sans bouton. data-ch-nosort sur un th le garde sans bouton.' },
    { titre: 'Sans tri', exemple: 'table/defaut', texte: 'Le tableau de la planche : en-têtes mono mute, chiffres alignés à droite, ligne survolée en bg2. Posez-le dans ch-table__wrap pour qu\'il défile dans son cadre.' },
    { titre: 'Avec une tendance', exemple: 'table/tendance', texte: 'ch-table__up (acc-text) et ch-table__down (mute) sur le td, avec une flèche dans le texte : jamais la couleur seule. data-ch-value="-7" donne la valeur signée au tri.' },
    { titre: 'Large', exemple: 'table/large', texte: 'Quand le tableau est plus large que la page, ch-table__wrap défile à l\'horizontale ; la région est focalisable (tabindex="0", role="region", aria-label) pour que le clavier puisse la faire défiler.' },
  ],
  etats: [
    'En-tête : mute ; trié : fg et glyphe en acc-text (moitié haute pour croissant, moitié basse pour décroissant). Bouton de tri : survol fg, focus visible (contour de 2 px à l\'intérieur de la cellule).',
    'Ligne : survol en bg2 (sur les td).',
  ],
  a11y: [
    'Motif Sortable Table de l\'APG : chaque en-tête triable contient un vrai <button> (Entrée et Espace marchent), aria-sort sur le seul en-tête trié ; l\'annonce « Trié par … » passe par la région aria-live de chopa.js.',
    'Cible du bouton : toute la cellule d\'en-tête, 44 px de haut au moins.',
    'En-têtes th scope="col" ; légende (caption) pour nommer le tableau ; région défilante nommée et focalisable.',
    'Tendance : la flèche (↑ ↓) porte le sens, la couleur ne fait que le redoubler. Texte fg, mute, acc-text sur bg et bg2 : 4,5 : 1 au moins.',
  ],
  js: 'module sort de chopa.js (data-ch-sort) ; facultatif : sans lui, tableau lisible non trié',
  classes: ['ch-table', 'ch-table__wrap', 'ch-table__caption', 'ch-table__num', 'ch-table__up', 'ch-table__down', 'ch-table__sort'],
};
