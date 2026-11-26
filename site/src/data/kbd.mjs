export default {
  titre: 'Touche clavier',
  famille: 'Contenu et médias',
  jalon: 'J4a',
  ref: 'N',
  but: 'Montrer une touche ou une combinaison de touches dans une phrase.',
  quand: 'Pour les raccourcis, les commandes d\'un jeu, les instructions d\'une doc. Pour du code, un bloc de code.',
  variantes: [
    { titre: 'Une touche', exemple: 'kbd/defaut', texte: 'kbd.ch-kbd dans la phrase.' },
    { titre: 'Une combinaison', exemple: 'kbd/combinaisons', texte: 'span.ch-kbd__combo : kbd, un « + » (ch-kbd__plus, lu par les lecteurs d\'écran comme du texte), kbd, etc.' },
  ],
  etats: ['Pièce statique.'],
  a11y: [
    'Élément natif <kbd> ; le « + » est du vrai texte, pas un décor : « Ctrl plus K ».',
    'Texte fg sur bg2 ; « + » en mute : 4,5 : 1 au moins dans les 3 thèmes.',
  ],
  js: 'aucun',
  classes: ['ch-kbd'],
};
