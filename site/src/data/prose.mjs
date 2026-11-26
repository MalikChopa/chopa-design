export default {
  titre: 'Prose',
  famille: 'Fondations',
  jalon: 'J1b-2',
  ref: 'N',
  but: 'Mettre en forme un texte long écrit en HTML simple : titres, paragraphes, listes, citation, code, tableau, figure et liens, sans une classe sur chaque balise.',
  quand: 'Pour un article, une page de documentation ou un texte de contenu. Pour un composant précis (carte, formulaire), utiliser les classes du composant, pas la prose. La prose limite la ligne à 65 caractères ; la placer dans un conteneur pour la centrer.',
  variantes: [
    { titre: 'Article : titres, listes, citation, liens', exemple: 'prose/article', texte: 'h1 à h6, paragraphes, liste à puces, liste numérotée, citation avec source, filet, lien et gras.' },
    { titre: 'Code', exemple: 'prose/code', texte: 'Code en ligne et bloc de code ; le bloc défile dans son cadre (tabindex="0" pour le défiler au clavier).' },
    { titre: 'Tableau', exemple: 'prose/tableau', texte: 'Un tableau se pose dans ch-prose__scroll, une région défilante nommée : à 375 px il défile dans sa boîte.' },
    { titre: 'Figure', exemple: 'prose/figure', texte: 'Image avec légende ; l\'image ne dépasse pas la colonne. Toujours un attribut alt.' },
    { titre: 'Mots longs et adresses', exemple: 'prose/mots-longs', texte: 'Les mots et les adresses trop longs se coupent au lieu d\'élargir la page.' },
  ],
  etats: ['Lien : survol en couleur de texte normale. Focus visible sur les liens et sur les blocs défilants (contour orange).'],
  a11y: [
    'Sémantique native : h1 à h6 dans l\'ordre, ul, ol, blockquote, figure, table. Ne pas sauter de niveau.',
    'Liens soulignés (pas seulement colorés) ; dans une phrase ils sont exemptés de la cible de 44 px, comme le prévoit l\'architecture.',
    'Un bloc de code ou un tableau qui défile doit pouvoir recevoir le focus (tabindex="0"), et le tableau porter role="region" et aria-label.',
    'Un tableau a un caption ou un nom, des th scope="col" et scope="row".',
  ],
  js: 'aucun',
  classes: ['ch-prose', 'ch-prose__scroll'],
};
