export default {
  titre: 'État vide',
  famille: 'Retours et fenêtres',
  jalon: 'J5b',
  ref: 'N',
  but: 'Un cadre qui dit pourquoi une liste ou une page est vide et propose quoi faire ensuite.',
  quand: 'Pour une liste sans élément, une recherche sans résultat, une boîte à vide. Pour une page qui n\'existe pas, la page 404.',
  variantes: [
    { titre: 'Liste vide, avec une action', exemple: 'empty/playlist', texte: 'ch-empty > ch-empty__title (titre de niveau 2 dans l\'exemple, à choisir selon la page), ch-empty__text, et un bouton ch-btn ch-btn--primary ch-empty__action.' },
    { titre: 'Recherche sans résultat', exemple: 'empty/recherche', texte: 'Même marquage ; l\'action efface la recherche (bouton secondaire).' },
  ],
  etats: ['Pièce statique : le bouton a les états du bouton (survol, focus, désactivé).'],
  a11y: [
    'Un vrai titre (h2, h3…) : le niveau suit la page. L\'action est un vrai bouton ou lien, de 44 px.',
    'Si l\'état vide apparaît après une recherche, le message peut être aussi annoncé par une région vivante de la page ; la pièce n\'en pose pas.',
    'Couleurs : fg (titre) et soft (texte) sur bg, bg2 ou card ; bouton : paires de ch-btn.',
  ],
  js: 'aucun',
  classes: ['ch-empty'],
};
