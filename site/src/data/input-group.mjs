export default {
  titre: 'Champ avec préfixe ou suffixe',
  famille: 'Base et formulaires',
  jalon: 'J2b',
  ref: 'N',
  but: 'Accoler à un champ un texte fixe : une unité (kg, €) avant ou après la saisie.',
  quand: 'Quand l\'unité ou le début d\'une adresse est connu et ne doit pas être saisi. L\'ajout est un repère visuel : l\'unité est aussi dite dans le libellé.',
  variantes: [
    { titre: 'Préfixe', exemple: 'input-group/prefix', texte: 'ch-input-group ch-input-group--prefix : l\'ajout (ch-input-group__addon) précède le champ.' },
    { titre: 'Suffixe', exemple: 'input-group/suffix', texte: 'ch-input-group--suffix : l\'ajout suit le champ ; le libellé relié par for et id dit l\'unité.' },
    { titre: 'Erreur', exemple: 'input-group/erreur', texte: 'Le champ porte aria-invalid ; is-error sur ch-field colore aussi l\'ajout.' },
  ],
  etats: ['Repos, survol, focus visible, erreur : ceux du champ texte ; l\'ajout suit la couleur d\'erreur.'],
  a11y: [
    'Le libellé est lié au champ (for et id, ou enveloppant) et nomme l\'unité : l\'ajout visuel peut être aria-hidden s\'il répète le libellé.',
    'Ajout : soft sur card, 4,5 : 1 au moins dans les trois thèmes.',
    'Hauteur de 44 px pour le champ et l\'ajout.',
  ],
  js: 'aucun',
  classes: ['ch-input-group', 'ch-input-group--prefix', 'ch-input-group--suffix', 'ch-input-group__addon'],
};
