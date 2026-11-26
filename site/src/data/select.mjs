export default {
  titre: 'Liste déroulante',
  famille: 'Base et formulaires',
  jalon: 'J2b',
  ref: 'P',
  but: 'Choisir une valeur dans une courte liste fermée, avec le <select> natif du navigateur.',
  quand: 'Pour 3 à une douzaine d\'options. Au-delà, ou pour plusieurs choix, une autre pièce (cases à cocher, J2c). Le menu ouvert est celui du système : Chopa habille seulement le champ.',
  variantes: [
    { titre: 'Par défaut', exemple: 'select/defaut', texte: 'ch-select dans un ch-field, libellé enveloppant.' },
    { titre: 'Erreur', exemple: 'select/erreur', texte: 'aria-invalid="true", première option vide « Choisir une taille », aide qui dit quoi faire.' },
    { titre: 'Désactivée', exemple: 'select/desactive', texte: 'disabled : texte mute, bordure line.' },
  ],
  etats: [
    'Repos : identique à la planche (tests/parity/select.json, toutes les propriétés).',
    'Survol et focus : bordure mute puis focus, comme le champ texte ; la planche n\'a pas ces états pour le select, c\'est un ajout voulu (comparé sans les couleurs de bordure).',
    'Erreur, désactivée.',
  ],
  a11y: [
    'Élément natif : clavier (flèches, lettres, Entrée) et lecteur d\'écran gérés par le navigateur.',
    'Libellé visible ; erreur par aria-invalid et aria-describedby.',
    'Hauteur de 44 px ; texte fg sur bg2.',
  ],
  js: 'aucun',
  classes: ['ch-select'],
};
