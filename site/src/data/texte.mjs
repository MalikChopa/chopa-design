export default {
  titre: 'Texte',
  famille: 'Fondations',
  jalon: 'J1b-2',
  ref: 'P',
  but: 'Échelle de texte de l\'identité : un titre géant, deux niveaux de titre, le texte courant, le petit texte, le mono et le libellé.',
  quand: 'Pour tout texte d\'une page. Choisir le niveau du titre (h1 à h6) pour la structure, puis la classe pour la taille. Pour un long article, préférer la prose, qui met en forme les balises sans classes.',
  variantes: [
    { titre: 'Hiérarchie complète', exemple: 'texte/hierarchie', texte: 'Libellé, titre de niveau 2, titre de niveau 3, texte, petit texte, mono.' },
    { titre: 'Titre géant', exemple: 'texte/giant', texte: 'Pour le titre d\'une page d\'accueil ou d\'un écran-titre : un seul par page, en général le h1 (ici un h2, pour garder le plan de cette page de doc).' },
    { titre: 'Titre sémantique, taille choisie', exemple: 'texte/semantique', texte: 'Un h2 peut porter la taille h3, un h3 celle du mono : la taille ne dépend pas de la balise.' },
  ],
  etats: ['Aucun état : le texte est statique. Les liens du texte courant suivent le thème (couleur d\'accent de texte).'],
  a11y: [
    'Un seul h1 par page, pas de niveau sauté (h2 puis h4) : les classes de taille ne changent pas la structure.',
    'Contrastes : texte courant en soft, petit texte et libellé en mute, sur bg, bg2 et card, au moins 4,5 : 1 dans les trois thèmes.',
    'Les tailles de titre sont fluides (clamp()) : le texte reste lisible de 375 à 1440 px, sans débordement des mots longs.',
  ],
  js: 'aucun',
  classes: ['ch-t-giant', 'ch-t-h2', 'ch-t-h3', 'ch-t-body', 'ch-t-small', 'ch-t-mono', 'ch-label'],
};
