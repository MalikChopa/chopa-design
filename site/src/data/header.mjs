export default {
  titre: 'En-tête et navigation',
  famille: 'Navigation',
  jalon: 'J3a',
  ref: 'P',
  but: 'La barre du haut d\'un site (ch-header) et sa rangée de liens (ch-nav), avec un menu qui se replie en un bouton sur téléphone.',
  quand: 'En haut de chaque page d\'un site, avec le nom du site à gauche et la navigation principale. Pour une navigation secondaire (dans une page), le sommaire ; pour un choix parmi des actions, le menu déroulant.',
  variantes: [
    { titre: 'En-tête complet', exemple: 'header/defaut', texte: 'Nom du site (fictif ici), bouton « Menu » et liens. Large : les liens sont toujours affichés. Dans une colonne étroite (les copies des 3 thèmes ci-dessous), le bouton apparaît et les liens se replient. La navigation est un <nav aria-label="Principale"> : sur une page, un seul repère « navigation » par nom.' },
    { titre: 'Navigation seule', exemple: 'header/nav', texte: 'ch-nav : liens en mono capitales, 26 px d\'écart. Le lien courant (aria-current="page") est souligné et en fg ; au survol, le filet se déploie. C\'est la pièce de la planche (.nav).' },
    { titre: 'Menu téléphone, fermé et ouvert', exemple: 'header/menu-telephone', texte: 'À gauche, menu fermé (aria-expanded="false") ; à droite, ouvert : les liens s\'empilent en lignes de 44 px. Le bouton ouvert passe en acc/on-acc. Les deux états sont côte à côte pour la démonstration : sur une page, un seul <header> (copie plutôt l\'en-tête complet ci-dessus).' },
  ],
  etats: [
    'Lien : repos (soft), survol (filet déployé), courant (aria-current="page" : filet + fg), focus visible.',
    'Menu téléphone : fermé, ouvert (aria-expanded), échec du module (data-ch-failed : liens affichés, bouton masqué).',
    'Passage au téléphone : requête de conteneur (largeur de l\'en-tête ≤ 720 px) et non requête de média : l\'en-tête se replie aussi dans une colonne étroite d\'un grand écran, et il suit sa propre largeur dans un site qui l\'enferme dans une barre latérale.',
    'Les liens ont une zone de clic de 44 px de haut (::before invisible) ; en menu téléphone, des lignes de 44 px.',
  ],
  a11y: [
    'Motif Disclosure Navigation : un bouton avec aria-expanded et aria-controls, jamais role="menu". Échap ferme le menu et rend le focus au bouton.',
    'aria-current="page" sur le lien de la page courante : posé dans le HTML, ou par le module si aucun lien n\'en porte (adresse identique).',
    'Sans JavaScript : le bouton n\'est pas affiché (il ne ferait rien), les liens passent à la ligne.',
    'Un repère <nav> par rôle : si la page en a plusieurs, chacun a un aria-label différent.',
    'Texte soft ou fg sur bg ; le lien courant se reconnaît au filet et non à la seule couleur.',
  ],
  js: 'module menu de chopa.js (data-ch-menu sur ch-header) pour le menu téléphone ; ch-nav seul : aucun',
  classes: ['ch-header', 'ch-nav'],
};
