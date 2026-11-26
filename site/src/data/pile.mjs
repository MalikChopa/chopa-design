export default {
  titre: 'Pile',
  famille: 'Fondations',
  jalon: 'J1b-2',
  ref: 'N',
  but: 'Empiler des éléments en colonne avec un écart régulier, choisi parmi les espacements du système.',
  quand: 'Pour espacer des blocs sans écrire de marge sur chacun. Les marges verticales des enfants directs sont remises à zéro : c\'est la pile qui règle l\'espace. Pour aligner des éléments sur une ligne, utiliser la rangée.',
  variantes: [
    { titre: 'Écart par défaut', exemple: 'pile/reglages', texte: '16 px (espacement 4).' },
    { titre: 'Les six écarts', exemple: 'pile/echelle', texte: 'De --s2 (8 px) à --s7 (48 px), côte à côte dans une grille.' },
    { titre: 'Sections espacées', exemple: 'pile/sections', texte: 'Un grand écart (--s7) entre des sections, un petit (--s3) à l\'intérieur : les piles s\'imbriquent.' },
  ],
  etats: ['Aucun état.'],
  a11y: ['Aucun rôle : l\'ordre du HTML est l\'ordre de lecture et de tabulation. L\'écart est purement visuel.'],
  js: 'aucun',
  classes: ['ch-stack', 'ch-stack--s2', 'ch-stack--s3', 'ch-stack--s4', 'ch-stack--s5', 'ch-stack--s6', 'ch-stack--s7'],
};
