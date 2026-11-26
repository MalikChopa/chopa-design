export default {
  titre: 'Fil d\'Ariane',
  famille: 'Navigation',
  jalon: 'J3b',
  ref: 'N',
  but: 'Montrer où l\'on se trouve dans l\'arborescence du site et permettre de remonter d\'un niveau.',
  quand: 'Sur les pages à plusieurs niveaux (catalogue, documentation, boutique). Sur un site à un seul niveau, rien : l\'en-tête suffit.',
  variantes: [
    { titre: 'Page courante en texte', exemple: 'breadcrumb/defaut', texte: '<nav aria-label="Fil d\'Ariane"> > ch-breadcrumb__list (ol) > un ch-breadcrumb__item par niveau. Les niveaux parents sont des liens (ch-breadcrumb__link) ; la page courante est un <span aria-current="page"> : pas un lien, donc pas un arrêt de Tab.' },
    { titre: 'Page courante en lien', exemple: 'breadcrumb/lien-courant', texte: 'Variante du motif Breadcrumb de WAI-ARIA : la page courante reste un lien, marqué aria-current="page" (utile si elle porte une ancre ou si on veut la recharger). Elle prend un arrêt de Tab de plus.' },
  ],
  etats: [
    'Lien parent : soft et souligné ; survol : fg ; focus visible.',
    'Page courante : fg, sans soulignement (le soulignement des autres liens porte la différence, pas seulement la couleur).',
    'Sur téléphone, la liste passe à la ligne.',
  ],
  a11y: [
    '<nav> avec un aria-label (« Fil d\'Ariane ») et une liste ordonnée ol : l\'ordre des niveaux est annoncé.',
    'Le séparateur est un petit trait dessiné par CSS, sans texte généré : il n\'est ni lu ni présent dans l\'arbre d\'accessibilité.',
    'aria-current="page" sur la page courante.',
    'Chaque lien et la ligne de la page courante font 44 px de haut ; le choix du nom suit la règle des repères : un nom différent par <nav> sur une page.',
  ],
  js: 'aucun',
  classes: ['ch-breadcrumb'],
};
