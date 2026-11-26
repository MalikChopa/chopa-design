export default {
  titre: 'Case à cocher',
  famille: 'Base et formulaires',
  jalon: 'J2c',
  ref: 'P',
  but: 'Dire oui ou non à une option, ou en choisir plusieurs dans une liste, avec le <input type="checkbox"> natif.',
  quand: 'Pour une option indépendante ou plusieurs choix cumulables. Pour un seul choix parmi plusieurs, le radio ; pour un réglage qui agit tout de suite, l\'interrupteur.',
  variantes: [
    { titre: 'Par défaut', exemple: 'checkbox/defaut', texte: 'ch-choice (l\'étiquette, 44 px de haut, toute sa surface se clique) autour d\'un ch-check : case carrée de 20 px, cochée en accent avec une marque de 8 px.' },
    { titre: 'Indéterminée', exemple: 'checkbox/indetermine', texte: 'Une case « tout sélectionner » dont les enfants sont en partie cochés : barre au lieu du carré. L\'état indeterminate n\'existe qu\'en JavaScript (propriété du champ), l\'exemple le pose avec une ligne de script.' },
    { titre: 'Désactivée', exemple: 'checkbox/desactive', texte: 'disabled : bordure line, texte mute, sans opacité ; cochée, la marque passe en mute.' },
    { titre: 'Erreur', exemple: 'checkbox/erreur', texte: 'aria-invalid="true" sur la case, bordure d\'accent, ch-field__error reliée par aria-describedby : le texte dit l\'erreur.' },
  ],
  etats: [
    'Repos, cochée, indéterminée, désactivée (cochée ou non), erreur ; focus visible (contour de 2 px, comme sur la planche).',
    'Pas de survol ni de transition : la planche n\'en a pas (parité : tests/parity/checkbox.json, repos et focus).',
  ],
  a11y: [
    'Élément natif : Espace coche et décoche, Tab entre les cases, lecteur d\'écran sans rien ajouter.',
    'Le libellé est le texte du <label> : toute sa surface se clique (hauteur 44 px) ; la case reste de 20 px.',
    'Erreur : aria-invalid et un texte relié (aria-describedby), jamais la couleur seule.',
    'Texte fg (ou mute si désactivé) sur le fond de la page, paires autorisées ≥ 4,5 : 1.',
  ],
  js: 'aucun (l\'état indéterminé se règle par la propriété indeterminate du champ)',
  classes: ['ch-choice', 'ch-check'],
};
