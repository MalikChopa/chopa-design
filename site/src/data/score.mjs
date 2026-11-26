export default {
  titre: 'Pastille de score',
  famille: 'Contenu et médias',
  jalon: 'J4b',
  ref: 'P',
  but: 'Afficher un score de 0 à 100 dans une pastille carrée, teintée quand il est élevé et neutre quand il est bas.',
  quand: 'Pour la note d\'un niveau, la progression d\'une série, un indice. Le nombre porte l\'information ; la teinte seulement la renforce.',
  variantes: [
    { titre: 'Chaude, tiède, froide', exemple: 'score/defaut', texte: 'span.ch-score : filet acc et fond acc-dim, nombre fg. ch-score--cold : filet line, sans fond, nombre mute. Même rendu que la planche (.score, .score.cold). role="img" et aria-label donnent la phrase lue (« Score 87 sur 100 »).' },
    { titre: 'Dans une liste', exemple: 'score/contexte', texte: 'Le nom accessible dit aussi le sens (« : niveau maîtrisé ») : le lecteur d\'écran n\'entend pas une couleur.' },
  ],
  etats: ['Statique. La pastille chaude et la froide se distinguent par le nombre, le filet et le fond ; l\'état n\'est jamais porté par la couleur seule (aria-label).'],
  a11y: [
    'Un nombre seul n\'est pas clair (« 87 » de quoi ?) : role="img" avec aria-label « Score 87 sur 100 ». Si un libellé visible précède déjà la pastille (« Score »), le texte brut suffit.',
    'Nombre fg sur acc-dim composé sur bg, bg2, card ; pastille froide : mute sur bg, bg2, card : 4,5 : 1 au moins.',
    'Hauteur de 44 px, largeur de 44 px au moins (pièce non interactive).',
  ],
  js: 'aucun',
  classes: ['ch-score', 'ch-score--cold'],
};
