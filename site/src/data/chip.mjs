export default {
  titre: 'Puce',
  famille: 'Contenu et médias',
  jalon: 'J4a',
  ref: 'P',
  but: 'Un filtre ou une catégorie cliquable, en petit : bouton à bascule (aria-pressed) ou lien.',
  quand: 'Pour filtrer une liste, choisir une catégorie, retirer un filtre. Pour un statut qui ne réagit pas, un badge ; pour une action principale, un bouton.',
  variantes: [
    { titre: 'Bouton à bascule', exemple: 'chip/defaut', texte: 'button.ch-chip avec aria-pressed. Une puce-bouton ne bascule pas toute seule : le script de votre site inverse aria-pressed au clic (chopa.js n\'a pas de module pour cela). Les deux états sont montrés ici de façon statique.' },
    { titre: 'Lien', exemple: 'chip/liens', texte: 'a.ch-chip : une navigation entre pages ; la page courante porte aria-current (même rendu que « pressée »).' },
    { titre: 'États et icône', exemple: 'chip/etats', texte: 'Repos, pressée, désactivée (disabled : filet en tirets, mute) et une puce avec un glyphe « close » qui retire un filtre (aria-label « Retirer le filtre Rouge », qui reprend le texte visible).' },
  ],
  etats: [
    'Repos : filet line, texte soft. Survol : filet mute. Pressée : fond acc-dim, filet acc, texte fg. Désactivée : tirets, mute. Focus visible : contour de 2 px.',
    'La puce fait 32 px de haut ; sa zone de clic invisible fait 44 px au moins (::before), mesurée par scripts/browser/contenu.mjs.',
  ],
  a11y: [
    'Bouton à bascule : <button type="button" aria-pressed="true|false">, Entrée et Espace ; l\'état ne tient pas qu\'à la couleur (fond teinté et filet d\'accent, et l\'attribut est lu par les lecteurs d\'écran).',
    'Zone de clic de 44 px en ::before (puce de 32 px visibles, 6 px de plus de chaque côté), sans changement visuel.',
    'Puce à icône seule d\'action : le texte visible reste dans le nom accessible (étiquette en un seul mot, aria-label qui le contient).',
    'Texte soft et fg sur bg ou card, fg sur acc-dim, mute désactivé : 4,5 : 1 au moins dans les 3 thèmes.',
  ],
  js: 'aucun (le script du site pose aria-pressed)',
  classes: ['ch-chip'],
};
