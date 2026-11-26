export default {
  titre: 'Lien d\'évitement',
  famille: 'Navigation',
  jalon: 'J3b',
  ref: 'N',
  but: 'Permettre à qui navigue au clavier de passer directement au contenu, sans retraverser l\'en-tête à chaque page.',
  quand: 'Sur chaque page qui a une navigation avant le contenu : le lien est le premier élément du <body>. Il ne se voit qu\'au focus.',
  variantes: [
    { titre: 'Un lien vers le contenu', exemple: 'skip/defaut', texte: '<a class="ch-skip" href="#id"> en tout premier. Sa cible existe : un élément avec cet id et tabindex="-1" (pour recevoir le focus à l\'Entrée). Appuie sur Tab pour le voir.' },
    { titre: 'Plusieurs liens', exemple: 'skip/plusieurs', texte: 'Deux liens à la suite (contenu, recherche) : un seul est visible à la fois, celui qui a le focus.' },
  ],
  etats: [
    'Repos : rogné à 1 px, hors de la vue (jamais display: none, sinon il ne prendrait pas le focus).',
    'Focus : bouton plein (acc, texte on-acc), en haut à gauche de la fenêtre, 44 px de haut, entièrement visible ; le contour de focus de la base s\'y ajoute.',
    'Dans les copies par thème de cette page, le lien est le premier élément de l\'exemple mais pas de la page : appuyer sur Tab jusqu\'à lui.',
  ],
  a11y: [
    'Lien natif, premier arrêt de Tab ; Entrée déplace le focus vers la cible (tabindex="-1" si elle n\'est pas déjà focalisable).',
    'Paire de couleurs : on-acc sur acc (paire autorisée).',
    'Visible au focus seulement : jamais caché par display: none ni visibility: hidden.',
    'La cible doit exister : à vérifier à chaque gabarit (le contrôle ids-uniques ne lit pas href).',
  ],
  js: 'aucun',
  classes: ['ch-skip'],
};
