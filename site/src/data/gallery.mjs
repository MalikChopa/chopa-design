export default {
  titre: 'Galerie',
  famille: 'Contenu et médias',
  jalon: 'J4b',
  ref: 'N',
  but: 'Aligner plusieurs images légendées en grille, de deux à quatre colonnes, qui passe en une colonne sur téléphone.',
  quand: 'Pour une série de photos, les niveaux d\'un jeu, les plats d\'un carnet. Il n\'y a pas de visionneuse : l\'image ne s\'agrandit pas. Pour des cartes avec texte, la grille.',
  variantes: [
    { titre: 'Deux colonnes', exemple: 'gallery/deux-colonnes', texte: 'ch-gallery--2 : des images 16 : 9 plus grandes.' },
    { titre: 'Trois colonnes', exemple: 'gallery/defaut', texte: 'ul.ch-gallery (role="list") > li.ch-gallery__item > figure.ch-figure. Trois colonnes par défaut (ou ch-gallery--3), images 4 : 3.' },
    { titre: 'Quatre colonnes, images décoratives', exemple: 'gallery/quatre-colonnes', texte: 'ch-gallery--4 avec des images carrées. Ici la légende dit déjà ce que montre l\'image : alt est vide (décoratif), ce que le contrôle figure.mjs compte et affiche.' },
  ],
  etats: [
    'Sous 800 px de fenêtre, toutes les variantes passent en une seule colonne (comme la grille). Mesuré à 375 px : une colonne, aucun élément au-delà de la fenêtre (scripts/browser/medias.mjs, et check-overflow à 375, 1024 et 1440 px).',
  ],
  a11y: [
    'Liste native ul : le nombre d\'images est annoncé ; role="list" garde la sémantique dans Safari malgré list-style: none.',
    'Chaque image a un alt (vide seulement si la légende suffit) et une légende en figcaption.',
    'Aucun lien ni bouton : rien à atteindre au clavier, aucune visionneuse à piéger.',
  ],
  js: 'aucun',
  classes: ['ch-gallery', 'ch-gallery--2', 'ch-gallery--3', 'ch-gallery--4'],
};
