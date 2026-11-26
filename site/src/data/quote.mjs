export default {
  titre: 'Citation',
  famille: 'Contenu et médias',
  jalon: 'J4a',
  ref: 'N',
  but: 'Mettre en valeur une phrase citée, avec sa source.',
  quand: 'Pour une parole rapportée : témoignage, extrait, épigraphe. Pour une simple phrase importante du texte, un titre ou du gras.',
  variantes: [
    { titre: 'Avec source', exemple: 'quote/defaut', texte: 'figure.ch-quote > blockquote.ch-quote__text (cite="adresse" si la source en a une) + figcaption.ch-quote__source, où le titre de l\'œuvre est dans un <cite>.' },
    { titre: 'Sans source', exemple: 'quote/sans-source', texte: 'Le blockquote seul, quand la phrase se passe de légende.' },
  ],
  etats: ['Pièce statique : filet acc à gauche, fond bg2.'],
  a11y: [
    'Éléments natifs : blockquote, figure, figcaption, cite ; la source est rattachée à la citation par la figure.',
    'Texte fg et mute sur bg2 : 4,5 : 1 au moins dans les 3 thèmes.',
  ],
  js: 'aucun',
  classes: ['ch-quote'],
};
