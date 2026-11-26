export default {
  titre: 'Groupe de champs',
  famille: 'Base et formulaires',
  jalon: 'J2c',
  ref: 'N',
  but: 'Réunir des champs liés sous un nom, avec le <fieldset> et sa <legend> natifs.',
  quand: 'Pour un groupe de radios ou de cases (la légende est obligatoire) et pour un bloc de champs qui vont ensemble, comme une adresse. Pas pour décorer.',
  variantes: [
    { titre: 'Champs liés', exemple: 'fieldset/defaut', texte: 'Une adresse : la légende nomme le groupe, les champs gardent leur propre libellé.' },
    { titre: 'Cases à cocher', exemple: 'fieldset/choix', texte: 'Plusieurs choix cumulables sous une légende.' },
    { titre: 'Erreur', exemple: 'fieldset/erreur', texte: 'is-error, aria-describedby sur le fieldset vers un ch-field__error.' },
    { titre: 'Désactivé', exemple: 'fieldset/desactive', texte: 'disabled sur le fieldset désactive tous ses champs (natif).' },
  ],
  etats: [
    'Sans bordure ni marge : la structure est sémantique, le style reste discret. Légende mute (mono, majuscules).',
    'Erreur : bordures d\'accent sur les contrôles du groupe ; désactivé : géré par chaque contrôle.',
  ],
  a11y: [
    'Le lecteur d\'écran annonce la légende en entrant dans le groupe : indispensable pour des radios.',
    'Légende mute sur le fond de la page : paire autorisée, ≥ 4,5 : 1.',
    'Erreur de groupe : aria-describedby sur le fieldset ; la phrase dit quoi faire.',
  ],
  js: 'aucun',
  classes: ['ch-fieldset', 'ch-fieldset__legend'],
};
