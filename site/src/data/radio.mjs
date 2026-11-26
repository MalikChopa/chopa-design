export default {
  titre: 'Radio',
  famille: 'Base et formulaires',
  jalon: 'J2c',
  ref: 'N',
  but: 'Choisir une seule option parmi plusieurs, avec le <input type="radio"> natif ; c\'est le seul élément rond de la bibliothèque.',
  quand: 'Pour 2 à 5 options qui s\'excluent, toutes visibles. Pour plus d\'options, la liste déroulante ; pour des choix cumulables, les cases à cocher.',
  variantes: [
    { titre: 'Groupe avec légende', exemple: 'radio/defaut', texte: 'Un fieldset ch-fieldset et sa legend nomment le groupe ; les radios partagent le même name. Le groupe est dans un form : sans form, deux groupes de même name sur une page ne feraient qu\'un.' },
    { titre: 'Désactivé', exemple: 'radio/desactive', texte: 'Un radio désactivé, puis un groupe entier désactivé par fieldset disabled.' },
    { titre: 'Erreur', exemple: 'radio/erreur', texte: 'is-error sur le groupe, aria-describedby vers un texte ch-field__error, bordure d\'accent sur les radios.' },
  ],
  etats: [
    'Repos, coché (fond accent, point on-acc), désactivé (coché ou non), erreur ; focus visible.',
    'Cercle de 20 px et point de 8 px : border-radius 50 %. Seule exception à « coins carrés » (CLAUDE.md, 2026-11-15) ; check-radius n\'accepte 50 % que sur les sélecteurs .ch-radio.',
    'Pièce nouvelle : pas de parité avec la planche (la palette la couvre).',
  ],
  a11y: [
    'Flèches : passent au radio suivant ou précédent du groupe ET le cochent (natif) ; Tab entre dans le groupe sur le radio coché, ou le premier, et en sort d\'un seul coup.',
    'Un groupe a toujours une légende (fieldset + legend) : sans elle, les options n\'ont pas de contexte.',
    'Erreur : un texte relié à la légende par aria-describedby ; la couleur ne porte jamais seule l\'erreur.',
    'Cible de 44 px de haut grâce à l\'étiquette ch-choice.',
  ],
  js: 'aucun',
  classes: ['ch-radio', 'ch-fieldset'],
};
