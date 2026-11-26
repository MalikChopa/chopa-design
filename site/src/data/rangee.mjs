export default {
  titre: 'Rangée',
  famille: 'Fondations',
  jalon: 'J1b-2',
  ref: 'P',
  but: 'Aligner des éléments sur une ligne, centrés verticalement, avec un écart régulier ; ils passent à la ligne si la place manque.',
  quand: 'Pour des boutons côte à côte, un titre et son action, une barre d\'étiquettes. Pour empiler, utiliser la pile ; pour des colonnes égales, la grille.',
  variantes: [
    { titre: 'Par défaut', exemple: 'rangee/defaut', texte: 'Écart de 12 px, retour à la ligne permis.' },
    { titre: 'Écartée', exemple: 'rangee/between', texte: 'ch-row--between : un élément à gauche, un à droite.' },
    { titre: 'Sans retour à la ligne', exemple: 'rangee/nowrap', texte: 'ch-row--nowrap : à réserver à quelques éléments courts, sinon la ligne déborde sur téléphone.' },
  ],
  etats: ['Aucun état.'],
  a11y: ['Aucun rôle. Les boutons et liens d\'une rangée gardent leur zone de clic de 44 px.'],
  js: 'aucun',
  classes: ['ch-row', 'ch-row--between', 'ch-row--nowrap'],
};
