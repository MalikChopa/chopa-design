export default {
  titre: 'Zone de texte',
  famille: 'Base et formulaires',
  jalon: 'J2b',
  ref: 'N',
  but: 'Saisir un texte sur plusieurs lignes.',
  quand: 'Pour un message, un commentaire, une description. Pour une seule ligne, le champ texte.',
  variantes: [
    { titre: 'Par défaut', exemple: 'textarea/defaut', texte: 'ch-textarea : 120 px de haut au minimum, redimensionnable en hauteur seulement.' },
    { titre: 'Erreur', exemple: 'textarea/erreur', texte: 'aria-invalid="true" et une aide qui dit quoi corriger.' },
    { titre: 'Désactivée et lecture seule', exemple: 'textarea/desactive', texte: 'disabled : texte mute ; readonly : bordure pointillée, texte soft.' },
  ],
  etats: ['Repos, survol, focus visible, erreur, désactivée, lecture seule : comme le champ texte.'],
  a11y: [
    'Libellé visible, relié par for et id ou enveloppant.',
    'Erreur par aria-invalid et aria-describedby, jamais par la couleur seule.',
    'Texte fg sur bg2 ; repère mute sur bg2.',
  ],
  js: 'aucun',
  classes: ['ch-textarea'],
};
