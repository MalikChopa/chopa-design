export default {
  titre: 'Carte',
  famille: 'Contenu et médias',
  jalon: 'J4a',
  ref: 'P',
  but: 'Regrouper un titre, un court texte et, au besoin, une image ou des actions dans un cadre que l\'œil repère d\'un coup.',
  quand: 'Pour une série, une recette, un niveau, un article : un objet qui se suffit à lui-même, souvent en grille. Une carte-lien quand tout le cadre mène à une seule page ; une carte à actions quand elle porte un ou deux boutons (jamais les deux à la fois : une carte-lien ne contient aucun autre élément interactif).',
  variantes: [
    { titre: 'Carte à actions', exemple: 'card/defaut', texte: 'article.ch-card > ch-card__top (ch-label + ch-card__title, puis un badge ou une pastille) + ch-card__body + ch-card__foot (boutons). Même rendu que la carte de la planche.' },
    { titre: 'Avec une image', exemple: 'card/media', texte: 'ch-card--media : une image ch-card__media (16 : 9, bord à bord, rognée par object-fit) en tête. L\'attribut alt décrit l\'image, ou reste vide si elle ne fait que décorer.' },
    { titre: 'Carte-lien', exemple: 'card/lien', texte: 'ch-card--link : un seul lien (ch-card__link, dans le titre) étendu à toute la carte par un ::after. C\'est le seul arrêt de Tab de la carte ; un clic n\'importe où dans le cadre le suit. Aucun bouton ni autre lien dans la carte ; des badges (non interactifs) restent permis.' },
    { titre: 'Carte-lien avec image', exemple: 'card/lien-media', texte: 'Les deux variantes se combinent.' },
    { titre: 'Horizontale', exemple: 'card/horizontale', texte: 'ch-card--horizontal : l\'image et le texte (rangé dans ch-card__main) côte à côte ; quand la carte est trop étroite, le texte passe sous l\'image sans requête de média.' },
  ],
  etats: [
    'Repos : fond card, filet line. Les cartes à actions n\'ont pas de survol (la planche n\'en a pas) ; seuls leurs boutons réagissent.',
    'Carte-lien : au survol, le filet passe à mute et le titre se souligne ; au focus clavier, le titre prend le contour de focus et le filet passe à acc-text.',
    'Horizontale : en dessous d\'environ 480 px de large, l\'image passe au-dessus du texte.',
  ],
  a11y: [
    'Carte-lien : un seul lien par carte, nommé par son titre ; la zone de clic est toute la carte (au moins 44 px de haut et de large, mesuré par scripts/browser/contenu.mjs). Pas de lien « Lire la suite » en plus.',
    'Le titre est un vrai titre (h3 dans les exemples : adaptez le niveau à la page) ; la carte est un article.',
    'Image : alt renseigné, ou alt="" si elle est purement décorative.',
    'Texte fg et soft sur card, mute pour l\'étiquette : 4,5 : 1 au moins dans les 3 thèmes. Le survol et le focus ne reposent pas sur la couleur seule (soulignement du titre).',
  ],
  js: 'aucun',
  classes: ['ch-card', 'ch-card--media', 'ch-card--link', 'ch-card--horizontal'],
};
