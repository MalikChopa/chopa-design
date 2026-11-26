export default {
  titre: 'Notification',
  famille: 'Retours et fenêtres',
  jalon: 'J5b',
  ref: 'N',
  but: 'Un court message qui apparaît dans un coin de l\'écran après une action (sauvegarde, envoi, suppression), s\'efface seul ou se ferme, sans prendre le focus.',
  quand: 'Pour confirmer une action ou signaler un incident qui ne bloque pas la lecture. Pour un message qui doit rester dans la page, l\'alerte ; pour une réponse obligatoire, la fenêtre modale.',
  variantes: [
    { titre: 'Déclencheurs', exemple: 'toast/declencheurs', texte: 'Un bouton data-ch-toast="texte" affiche une notification. data-ch-toast-type vaut info (défaut), warn ou error ; data-ch-toast-delai fixe le délai en millisecondes ; data-ch-toast-action="Annuler" ajoute un bouton d\'action (le bouton déclencheur reçoit alors l\'événement ch-toast-action). Depuis un script : chopa.toast(texte, { type, delai, action: { texte, fn } }) ; la fonction renvoie l\'élément créé. Le bouton déclencheur porte data-ch-needs-js : sans JavaScript il est masqué.' },
    { titre: 'Anatomie (balisage fixe)', exemple: 'toast/anatomie', texte: 'ch-toast ch-toast--info|warn|error : un glyphe du sprite, ch-toast__body (ch-toast__kind, le mot « Info », « Attention » ou « Erreur », puis ch-toast__text), un ch-toast__action facultatif et ch-toast__close. Le module crée ce balisage lui-même dans une pile fixe ch-toast-stack ; ce balisage statique sert à voir la pièce ou à bâtir une notification fixe dans une page.' },
  ],
  etats: [
    'Délai par défaut : 6 000 ms pour une information ou une attention ; une erreur reste jusqu\'à sa fermeture, sauf delai explicite ; un toast qui porte une action ne se ferme jamais seul. delai: 0 : jamais.',
    'Le délai est suspendu tant que le pointeur survole la notification ou que le focus est dedans (WCAG 2.2.1) ; il repart de zéro quand les deux sont partis.',
    'Plusieurs notifications s\'empilent en bas à droite ; sur un téléphone la pile tient dans la largeur de l\'écran moins 16 px de chaque côté.',
    'Entrée par un fondu et un glissement de 12 px ; pas de sortie animée. Mouvement réduit : aucune transition.',
    'Sans JavaScript : non applicable, les déclencheurs sont masqués. Si le module échoue, ils sont masqués aussi (data-ch-failed).',
  ],
  a11y: [
    'Région vivante persistante : chopa.js crée au chargement une région role="status" masquée à l\'œil (chopa.live()). Un message d\'information ou d\'attention y est écrit à chaque affichage ; la notification visible elle-même n\'a alors pas de role, pour ne pas être lue deux fois.',
    'Une erreur porte son propre role="alert" (annonce immédiate) et n\'est pas écrite dans la région : une seule annonce.',
    'Jamais de vol de focus : la notification apparaît sans que le focus bouge. Sa croix et son bouton d\'action sont dans l\'ordre de Tab (44 px) ; Échap, pressé dans la notification, la ferme et rend le focus à l\'endroit où il était.',
    'Le sens est dit par un mot et un glyphe, pas par la couleur seule.',
    'Limite : une notification qui disparaît après 6 secondes peut être trop courte à lire ; allonger delai pour un texte long. Lecteur d\'écran : non testé.',
    'Couleurs : fg (mot, croix), soft (texte) sur card ; acc-text sur card (bouton d\'action) ; filets line et acc.',
  ],
  js: 'module toast (data-ch-toast, chopa.toast), région du noyau. Non applicable sans JavaScript.',
  classes: ['ch-toast', 'ch-toast--info', 'ch-toast--warn', 'ch-toast--error', 'ch-toast-stack'],
};
