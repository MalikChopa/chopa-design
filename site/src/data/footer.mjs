export default {
  titre: 'Pied de page',
  famille: 'Navigation',
  jalon: 'J3b',
  ref: 'N',
  but: 'Le bas de chaque page : nom du site, colonnes de liens, mentions.',
  quand: 'Au bas de toutes les pages d\'un site. Pour une page qui doit rester sans distraction (connexion, paiement), une version compacte, ou aucun pied de page.',
  variantes: [
    { titre: 'Pied de page à colonnes', exemple: 'footer/defaut', texte: 'footer.ch-footer > ch-footer__inner > ch-footer__brand (nom + texte) et nav.ch-footer__nav (nommé) > ch-footer__col (ch-footer__title + liste ch-footer__list de ch-footer__link). Mentions en bas : ch-footer__legal. Les colonnes s\'adaptent à la largeur (160 px au minimum) et passent à une seule colonne sous 640 px.' },
    { titre: 'Pied de page compact', exemple: 'footer/compact', texte: 'ch-footer--compact : une seule rangée de liens, sans colonnes ni titres.' },
  ],
  etats: [
    'Lien : soft ; survol : fg et souligné ; focus visible.',
    'Titre de colonne et mentions : mute.',
    'Colonnes : une grille qui s\'adapte, une seule colonne sous 640 px.',
  ],
  a11y: [
    '<footer> d\'une page (hors d\'un autre repère) est le repère « contentinfo ».',
    'Les liens sont dans un <nav> nommé (« Pied de page ») : un nom différent par repère sur une page.',
    'Chaque lien fait 44 px de haut (ligne entière), même en colonne serrée.',
    'Les titres de colonne sont des paragraphes, pas des titres : ils ne perturbent pas le plan de la page.',
  ],
  js: 'aucun',
  classes: ['ch-footer'],
};
