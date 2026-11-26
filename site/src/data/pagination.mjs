export default {
  titre: 'Pagination',
  famille: 'Navigation',
  jalon: 'J3b',
  ref: 'N',
  but: 'Parcourir une liste découpée en plusieurs pages : numéros, page courante, précédent et suivant.',
  quand: 'Pour un catalogue, un journal ou une galerie de plus d\'une page. Pour une liste qui se charge à la demande, un bouton « Voir plus » ; pour quelques étapes dans un ordre fixe, les étapes.',
  variantes: [
    { titre: 'Milieu de liste, avec des points', exemple: 'pagination/defaut', texte: '<nav aria-label> > ch-pagination__list (ul) > li > ch-pagination__link. La page courante porte aria-current="page" (fond acc, texte on-acc). « … » (ch-pagination__gap) est masqué aux lecteurs d\'écran. Précédent et suivant : chevron + texte (ch-pagination__label, masqué visuellement sous 640 px mais toujours lu).' },
    { titre: 'Première page', exemple: 'pagination/premiere', texte: '« Précédent » devient un <span aria-disabled="true"> : plus un lien, donc ni arrêt de Tab ni clic. Bordure en tirets et texte mute : l\'état ne tient pas à la couleur seule.' },
    { titre: 'Dernière page', exemple: 'pagination/derniere', texte: 'Même règle pour « Suivant » sur la dernière page.' },
  ],
  etats: [
    'Lien : bordure line ; survol : bordure acc-text ; focus visible.',
    'Courant : fond acc, texte on-acc, aria-current="page".',
    'Désactivé : aria-disabled="true" sur un <span> (jamais un lien sans href ni un tabindex), tirets, texte mute, curseur interdit.',
  ],
  a11y: [
    '<nav> nommé, liste ul ; le numéro garde un aria-label « Page N » pour lever l\'ambiguïté hors contexte.',
    'La page courante est annoncée par aria-current="page" ; l\'élément désactivé n\'est pas atteignable au clavier.',
    'Le chevron est décoratif (aria-hidden) ; le texte du bouton reste lu même quand il est masqué visuellement.',
    'Chaque cible fait 44 x 44 px au moins.',
  ],
  js: 'aucun',
  classes: ['ch-pagination'],
};
