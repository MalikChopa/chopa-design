export default {
  titre: 'Interrupteur',
  famille: 'Base et formulaires',
  jalon: 'J2c',
  ref: 'N',
  but: 'Activer ou couper un réglage qui s\'applique tout de suite, avec un <input type="checkbox" role="switch">.',
  quand: 'Pour « allumer ou éteindre » : notifications, mode économie d\'énergie. Pour un choix qu\'on envoie avec un formulaire, la case à cocher.',
  variantes: [
    { titre: 'Éteint et allumé', exemple: 'switch/defaut', texte: 'Piste carrée de 40 × 24 px ; allumé : fond d\'accent, curseur à droite et marque on-acc. La position dit l\'état autant que la couleur.' },
    { titre: 'Désactivé', exemple: 'switch/desactive', texte: 'Bordure et curseur en line (éteint) ou mute (allumé), texte mute, sans opacité.' },
  ],
  etats: [
    'Éteint, allumé, désactivé (éteint ou allumé), erreur (aria-invalid) ; focus visible.',
    'Le curseur glisse en 0,25 s (--ch-t-fast) ; avec prefers-reduced-motion, la transition tombe à 0,01 ms.',
  ],
  a11y: [
    'role="switch" sur un vrai champ à cocher : les lecteurs d\'écran annoncent « interrupteur, activé ou désactivé » ; Espace bascule.',
    'L\'état ne tient pas qu\'à la couleur : le curseur change de côté.',
    'Texte fg sur le fond de la page ; piste de 24 px dans une étiquette de 44 px.',
  ],
  js: 'aucun',
  classes: ['ch-switch'],
};
