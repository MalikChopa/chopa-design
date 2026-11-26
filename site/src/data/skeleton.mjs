export default {
  titre: 'Squelette',
  famille: 'Retours et fenêtres',
  jalon: 'J5b',
  ref: 'N',
  but: 'Des blocs gris qui tiennent la place d\'un contenu en cours de chargement et évitent que la page saute quand il arrive.',
  quand: 'Pour une carte, une liste ou une image qui se charge. Pour une tâche avec avancement, la barre de progression ; pour un chargement court sans forme prévisible, l\'indicateur.',
  variantes: [
    { titre: 'Fiche d\'un niveau', exemple: 'skeleton/carte', texte: 'ch-skeleton--media (16:9), --title, --line. Le conteneur porte aria-busy="true" ; chaque bloc aria-hidden="true".' },
    { titre: 'Liste d\'articles', exemple: 'skeleton/liste', texte: 'Des paires titre et ligne, et un bloc libre (ch-skeleton seul, 16 px minimum, hauteur de l\'hôte).' },
  ],
  etats: [
    'Reflet : un dégradé gris clair qui glisse (1,6 s). Mouvement réduit : bloc gris uni, sans reflet.',
    'Toujours carré : border-radius 0, même quand le site arrondit ses coins.',
    'Quand le contenu arrive : remplacer les blocs et retirer aria-busy (ou le passer à false).',
  ],
  a11y: [
    'Les blocs sont aria-hidden="true" : ils ne portent aucune information. La région en chargement porte aria-busy="true" ; un texte visible (« Chargement de la fiche du niveau… ») dit la situation à qui lit.',
    'Pas de role="status" sur les blocs ; si le chargement doit être annoncé, utiliser l\'indicateur ou une notification.',
    'Aucun texte dans les blocs : pas de paire de contraste. Les blocs (line, bg2) restent distincts de la surface dans les 3 thèmes (non mesuré par un seuil).',
  ],
  js: 'aucun',
  classes: ['ch-skeleton', 'ch-skeleton--line', 'ch-skeleton--title', 'ch-skeleton--media'],
};
