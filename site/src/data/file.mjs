export default {
  titre: 'Envoi de fichier',
  famille: 'Base et formulaires',
  jalon: 'J2b',
  ref: 'N',
  but: 'Choisir un fichier à envoyer, avec le sélecteur natif habillé par Chopa.',
  quand: 'Pour une image, un document, une sauvegarde. Le choix du fichier, le glisser-déposer du système et le lecteur d\'écran restent ceux du navigateur.',
  variantes: [
    { titre: 'Par défaut', exemple: 'file/defaut', texte: 'ch-file : le bouton natif (::file-selector-button) prend la police mono et le fond card ; le nom du fichier choisi s\'affiche à droite.' },
    { titre: 'Désactivé', exemple: 'file/desactive', texte: 'disabled : texte mute, sans fond.' },
    { titre: 'Erreur', exemple: 'file/erreur', texte: 'aria-invalid="true" et une aide qui dit le format et le poids attendus.' },
  ],
  etats: ['Repos, survol (bouton en fg sur bg), focus visible, erreur, désactivé.'],
  a11y: [
    'Libellé visible, relié par for et id ou enveloppant ; le format et le poids attendus sont dans l\'aide, reliée par aria-describedby.',
    'Hauteur de 44 px, bouton compris ; clavier : Espace ou Entrée ouvre le sélecteur.',
    'Le texte « Aucun fichier choisi » est fourni par le navigateur (langue du navigateur).',
  ],
  js: 'aucun',
  classes: ['ch-file'],
};
