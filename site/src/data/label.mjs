export default {
  titre: 'Libellé, aide et erreur',
  famille: 'Base et formulaires',
  jalon: 'J2c',
  ref: 'P',
  but: 'Nommer un champ, l\'expliquer et dire ce qui ne va pas : ch-field__label, ch-field__help, ch-field__error.',
  quand: 'Dans tout ch-field. Le libellé est toujours visible (le repère d\'un champ n\'en tient pas lieu) ; l\'aide dit le format attendu ; l\'erreur dit quoi corriger. Deux écritures, au choix : un message à part, ch-field__error, sous l\'aide (ici) ; ou l\'aide elle-même qui passe en erreur, ch-field__help dans un ch-field.is-error (comme sur la planche, voir Champ texte). Dans les deux cas : aria-invalid et aria-describedby.',
  variantes: [
    { titre: 'Libellé et aide', exemple: 'label/defaut', texte: 'Le <label class="ch-field"> enveloppe le libellé, le champ et l\'aide : aucun identifiant nécessaire.' },
    { titre: 'Erreur', exemple: 'label/erreur', texte: 'is-error sur ch-field, aria-invalid="true" sur le champ, aria-describedby vers l\'aide et l\'erreur ; l\'erreur porte un glyphe et une phrase.' },
  ],
  etats: [
    'Libellé mute (mono, majuscules) ; aide mute 13 px ; erreur acc-text 13 px.',
    'Comparé à la planche (tests/parity/label.json) : .field .label, .field .help, .field.is-error .help.',
  ],
  a11y: [
    'Libellé : un vrai <label> (enveloppant, ou for et id) pour que le champ ait un nom.',
    'Aide et erreur reliées au champ par aria-describedby ; une erreur n\'est jamais dite par la couleur seule : glyphe et phrase.',
    'Aide mute et erreur acc-text sur bg, bg2, card : paires autorisées, ≥ 4,5 : 1 dans les trois thèmes.',
  ],
  js: 'aucun',
  classes: ['ch-field__label', 'ch-field__help', 'ch-field__error', 'is-error'],
};
