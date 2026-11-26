export default {
  titre: 'Image, vidéo légendée',
  famille: 'Contenu et médias',
  jalon: 'J4b',
  ref: 'N',
  but: 'Montrer une image ou une vidéo avec sa légende, dans un ratio fixe, sans que la page saute au chargement.',
  quand: 'Pour une photo d\'une série, une capture d\'un jeu, une bande-annonce. Pour plusieurs images côte à côte, la galerie ; pour une image en tête d\'une carte, la carte avec image.',
  variantes: [
    { titre: 'Image légendée', exemple: 'figure/defaut', texte: 'figure.ch-figure > img.ch-figure__media + figcaption.ch-figure__caption. Ratio de base 16 : 9 (ch-figure--16x9 le dit explicitement). L\'image est rognée par object-fit: cover ; width et height dans le HTML réservent la place.' },
    { titre: 'Trois ratios', exemple: 'figure/ratios', texte: 'ch-figure--16x9, ch-figure--4x3, ch-figure--1x1 : le ratio est posé sur le média par aspect-ratio, sur la boîte de bordure. Mesuré par scripts/browser/medias.mjs (écart de moins de 1 px).' },
    { titre: 'Vidéo légendée', exemple: 'figure/video', texte: 'video.ch-figure__media avec controls et un poster. Cet exemple n\'a pas de fichier vidéo (aucune requête, donc aucun échec) : ajoutez vos propres <source> et gardez le <track kind="captions"> (ici une piste de données minimale, à remplacer par vos sous-titres).' },
  ],
  etats: [
    'Statique : aucun survol ni focus propre. La vidéo prend le contour de focus de la base quand ses commandes natives sont atteintes au clavier.',
    'Fond bg2 derrière le média : la place reste tenue tant que le fichier n\'est pas arrivé.',
  ],
  a11y: [
    'Image : l\'attribut alt est obligatoire (scripts/checks/figure.mjs fait échouer la construction sans lui). alt="" seulement si l\'image est décorative ; ces cas sont comptés et affichés par le contrôle.',
    'Vidéo : l\'attribut controls est obligatoire (même contrôle). Prévoyez des sous-titres (track kind="captions") ; le mot « Votre navigateur… » à l\'intérieur sert de repli.',
    'Légende en figcaption (mute sur bg, bg2, card : 4,5 : 1 au moins). Pas de média externe dans les exemples : les images sont des rectangles gris de données.',
  ],
  js: 'aucun',
  classes: ['ch-figure', 'ch-figure--16x9', 'ch-figure--4x3', 'ch-figure--1x1'],
};
