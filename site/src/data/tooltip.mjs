export default {
  titre: 'Infobulle',
  famille: 'Retours et fenêtres',
  jalon: 'J5a',
  ref: 'N',
  but: 'Une courte phrase d\'aide qui apparaît près d\'un bouton ou d\'un lien quand on le survole ou qu\'on le focalise.',
  quand: 'Pour un complément facultatif : une précision sur un réglage, le sens d\'une icône. Jamais pour une information indispensable : sur un téléphone il n\'y a pas de survol, écrivez l\'information dans la page (les exemples le font). Pour du contenu plus long ou avec une action, la bulle d\'info.',
  variantes: [
    { titre: 'Au-dessus du déclencheur', exemple: 'tooltip/haut', texte: 'span.ch-tooltip[data-ch-tooltip] contient le déclencheur (aria-describedby="id") puis span.ch-tooltip__bubble[role="tooltip"][id]. Au-dessus par défaut ; ch-tooltip--haut le dit expressément.' },
    { titre: 'En dessous', exemple: 'tooltip/bas', texte: 'ch-tooltip--bas.' },
    { titre: 'Collée au bord de la fenêtre', exemple: 'tooltip/bord', texte: 'Le module décale la bulle de côté (propriété translate) pour qu\'elle reste à 8 px au moins des bords de la fenêtre, et la retourne de l\'autre côté s\'il manque de place en hauteur.' },
  ],
  etats: [
    'Affichée : classe is-open sur ch-tooltip, posée par le module, au survol ou au focus du déclencheur (ou de la bulle). Elle reste tant que le survol ou le focus durent, puis disparaît.',
    'Masquée par Échap sans que le focus bouge ; elle revient quand le pointeur ou le focus ressort puis rentre.',
    'Sans JavaScript (ou module en échec) : la bulle n\'est jamais affichée. L\'information n\'est jamais indispensable : le déclencheur garde son nom accessible, et la page redit l\'essentiel. (aria-describedby continue de relier la description aux lecteurs d\'écran.)',
    'Mouvement réduit : la bulle apparaît sans transition.',
  ],
  a11y: [
    'Motif Tooltip : role="tooltip" sur la bulle, aria-describedby sur le déclencheur (posé par le module s\'il manque). Le déclencheur garde son propre nom (aria-label ou texte) ; la bulle le complète, elle ne le remplace pas.',
    'WCAG 1.4.13 : masquable (Échap, focus inchangé), survolable (la bulle est dans le conteneur et un pont invisible de 8 px la relie au déclencheur : le pointeur peut passer de l\'un à l\'autre), persistante (jusqu\'à la sortie du survol et du focus, ou Échap).',
    'Aucun contenu interactif dans la bulle : du texte seulement.',
    'Contenu coupé : une bulle dans un parent en overflow: hidden serait rognée (absolute) ; poser l\'infobulle hors d\'un tel parent.',
    'Couleurs : fg sur card ; bordure mute (un bord, pas du texte).',
  ],
  js: 'module tooltip de chopa.js (data-ch-tooltip)',
  classes: ['ch-tooltip', 'ch-tooltip--haut', 'ch-tooltip--bas', 'ch-tooltip__bubble'],
};
