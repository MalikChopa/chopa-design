export default {
  titre: 'Section',
  famille: 'Fondations',
  jalon: 'Mise en page',
  ref: 'N',
  but: 'Donner de l\'air entre les grands blocs d\'une page : un espace vertical régulier au-dessus et au-dessous de chaque bloc.',
  quand: 'Pour chaque grand bloc d\'une page (présentation, chiffres, contact), le conteneur à l\'intérieur. Pour espacer des éléments dans un bloc, la pile ; pour poser des colonnes, la grille. Sur une page, mets ch-section sur un <section> titré (son titre le nomme) ; les exemples ci-dessous sont des <div> parce que la doc les montre plusieurs fois.',
  variantes: [
    { titre: 'Espace par défaut', exemple: 'section/defaut', texte: '48 px au-dessus et au-dessous (32 px sous 800 px). Le fond de bande de l\'exemple sert seulement à voir l\'espace.' },
    { titre: 'Serrée', exemple: 'section/serree', texte: 'ch-section--tight : 24 px (16 px sous 800 px).' },
    { titre: 'Ample', exemple: 'section/ample', texte: 'ch-section--loose : 72 px (48 px sous 800 px).' },
    { titre: 'Bandes alternées', exemple: 'section/bandes', texte: 'ch-section--alt : fond bg2, pour alterner avec le fond de page. Les textes du système restent lisibles sur ce fond.' },
  ],
  etats: ['Aucun état. L\'espace est un remplissage vertical (aucune marge) : la première section sous l\'en-tête a le même espace que les autres, et deux sections voisines s\'ajoutent (48 px + 48 px).'],
  a11y: ['Une <section> dont le titre est lié (aria-labelledby) devient un repère de région : son nom doit être unique sur la page (deux bandes de même titre échouent au contrôle axe « landmark-unique »). Sans titre propre, prendre un <div> : les exemples de cette page en utilisent.', 'Le fond alterné ne porte aucune information : l\'ordre et les titres restent les seuls repères.'],
  js: 'aucun',
  classes: ['ch-section', 'ch-section--tight', 'ch-section--loose', 'ch-section--alt'],
};
