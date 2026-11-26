export default {
  titre: 'Champ texte',
  famille: 'Base et formulaires',
  jalon: 'J2b',
  ref: 'P',
  but: 'Saisir une ligne de texte : un libellé, un champ, une aide facultative.',
  quand: 'Pour un nom, une adresse, un code. Pour plusieurs lignes, la zone de texte ; pour un choix dans une liste fermée, la liste déroulante ; pour une unité ou un préfixe, le champ avec préfixe ou suffixe.',
  variantes: [
    { titre: 'Par défaut', exemple: 'input/defaut', texte: 'ch-field autour d\'un libellé (ch-label) et d\'un ch-input : le libellé enveloppe le champ, aucun identifiant n\'est nécessaire.' },
    { titre: 'Avec une aide', exemple: 'input/aide', texte: 'ch-field__help liée au champ par aria-describedby ; libellé relié par for et id.' },
    { titre: 'Erreur', exemple: 'input/erreur', texte: 'aria-invalid="true" sur le champ, is-error sur ch-field : bordure d\'accent, aide en acc-text avec le glyphe alert et une phrase qui dit quoi corriger.' },
    { titre: 'Désactivé', exemple: 'input/desactive', texte: 'disabled : texte mute, bordure line, sans fond.' },
    { titre: 'Lecture seule', exemple: 'input/lecture-seule', texte: 'readonly : bordure pointillée, texte soft ; la valeur reste sélectionnable et envoyée.' },
  ],
  etats: [
    'Repos, survol (bordure mute), focus visible (bordure et contour focus), erreur (bordure acc), désactivé, lecture seule.',
    'Le survol, le focus et l\'erreur sont comparés à la planche (tests/parity/input.json).',
  ],
  a11y: [
    'Un libellé visible pour chaque champ (le placeholder n\'est pas un libellé : il disparaît à la saisie).',
    'Erreur : aria-invalid="true" et un texte relié par aria-describedby ; le glyphe et la phrase disent l\'erreur, pas la couleur seule.',
    'Hauteur de 44 px ; le texte saisi est fg sur bg2, le repère (placeholder) mute sur bg2.',
    'Désactivé et lecture seule : texte mute ou soft, 4,5 : 1 au moins, sans opacité.',
  ],
  js: 'aucun',
  classes: ['ch-field', 'ch-field__help', 'ch-input', 'is-error'],
};
