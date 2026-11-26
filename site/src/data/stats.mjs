export default {
  titre: 'Chiffres clés',
  famille: 'Contenu et médias',
  jalon: 'J4b',
  ref: 'P',
  but: 'Mettre quelques nombres en vedette, chacun avec son étiquette et, au besoin, sa tendance.',
  quand: 'Pour le résumé d\'un mois, d\'une partie, d\'un tableau de bord. Pour comparer beaucoup de valeurs, le tableau.',
  variantes: [
    { titre: 'Deux colonnes', exemple: 'stats/deux', texte: 'ch-stats--2.' },
    { titre: 'Trois colonnes avec tendance', exemple: 'stats/defaut', texte: 'dl.ch-stats > div.ch-stats__item > dt.ch-stats__label + dd.ch-stats__value. La tendance est un small.ch-stats__trend dans la valeur : flèche et nombre (« ↑ 3 », acc-text) ; ch-stats__trend--down pour une baisse (mute). Même rendu que la planche (.m-stats).' },
    { titre: 'Quatre colonnes', exemple: 'stats/quatre', texte: 'ch-stats--4. Sous 800 px de fenêtre, toutes les variantes passent en une colonne.' },
  ],
  etats: [
    'Statique. Tendance à la hausse : flèche ↑ en acc-text ; à la baisse : flèche ↓ en mute. La flèche porte le sens, la couleur le renforce.',
  ],
  a11y: [
    'Liste de définitions dl : chaque étiquette (dt) est lue avec sa valeur (dd).',
    'La tendance a aussi des mots masqués visuellement (ch-stats__sr : « de plus que le mois dernier ») pour qu\'« ↑ 3 » ne soit pas lu comme un symbole.',
    'Étiquette mute, valeur fg, tendance acc-text ou mute sur bg, bg2, card : 4,5 : 1 au moins.',
  ],
  js: 'aucun',
  classes: ['ch-stats', 'ch-stats--2', 'ch-stats--4'],
};
