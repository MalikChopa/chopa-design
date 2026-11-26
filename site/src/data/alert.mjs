export default {
  titre: 'Alerte',
  famille: 'Retours et fenêtres',
  jalon: 'J5b',
  ref: 'P',
  but: 'Un bandeau dans la page qui signale une information, un point d\'attention ou une erreur, avec un glyphe et un mot.',
  quand: 'Pour un message qui doit rester sous les yeux : en tête d\'un formulaire, d\'un guide, d\'une page de réglages. Pour un message passager après une action, la notification.',
  variantes: [
    { titre: 'Info, attention, erreur', exemple: 'alert/variantes', texte: 'ch-alert ch-alert--info (la note de la planche : filet orange à gauche, fond relevé), --warn et --error (fond teinté d\'orange ; l\'erreur est de plus cernée). Le glyphe vient du sprite (ch-icon ch-alert__icon), le mot est dans ch-alert__kind.' },
    { titre: 'Texte plus long', exemple: 'alert/longue', texte: 'Le texte passe à la ligne sous le glyphe ; le mot reste en tête.' },
  ],
  etats: ['Pièce statique : ni survol ni focus. Pas de bouton de fermeture : une alerte qui se ferme est une notification.'],
  a11y: [
    'Chaque alerte porte un glyphe (info, ou point d\'exclamation pour attention et erreur) et un mot (« Info », « Attention », « Erreur ») : elle se lit sans la couleur.',
    'Pas de role dans le code à copier : une alerte présente dans la page au chargement est lue avec le reste. Quand tu l\'insères après le chargement, pose role="alert" pour une erreur (annonce immédiate) ou role="status" pour une information ; il faut que le role soit déjà là au moment de l\'insertion.',
    'Couleurs : soft (texte) et fg (mot) sur bg2 ; soft et fg sur le fond teinté acc-dim composé sur bg, bg2 ou card (4,5 : 1 au moins dans les 3 thèmes).',
    'Parité avec la planche : .note et .note b à 0 écart ; le glyphe est un ajout de Chopa.',
  ],
  js: 'aucun',
  classes: ['ch-alert', 'ch-alert--info', 'ch-alert--warn', 'ch-alert--error'],
};
