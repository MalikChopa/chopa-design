export default {
  titre: 'Effets de défilement',
  famille: 'Fondations',
  jalon: 'J8b',
  ref: 'N',
  but: 'Une bande de texte qui défile avec la page, un titre qui apparaît quand il entre dans la fenêtre, et un grain facultatif : ch-band, ch-reveal et ch-grain.',
  quand: 'Pour une page de présentation ou de portfolio qui veut un peu de mouvement. Tout est facultatif : sans chopa-effects.js, la bande reste immobile et les titres restent visibles. Le détail, le script à charger et l\'interrupteur du grain sont sur la page Effets.',
  variantes: [
    { titre: 'Bande', exemple: 'effets/bande', texte: 'div.ch-band > p.ch-band__track > span.ch-band__item. Un seul élément suffit : le script ajoute les copies (aria-hidden) et déplace la piste avec le défilement. Ici le script n\'est pas chargé : la bande est immobile.' },
    { titre: 'Titre qui apparaît', exemple: 'effets/titre', texte: 'Ajouter ch-reveal à un titre. Le script le fait glisser et apparaître à son arrivée dans la fenêtre. Sans le script, il est visible dès le début.' },
    { titre: 'Grain', exemple: 'effets/grain', texte: 'ch-grain sur html ou body pour toute la page ; ch-grain ch-grain--zone pour une zone seulement. Absent par défaut ; la souris le traverse.' },
  ],
  etats: [
    'Sans JavaScript, ou si chopa-effects.js ne se charge pas : bande immobile, titres visibles.',
    'Mouvement réduit : aucun mouvement, aucun titre caché ; le grain, immobile, reste réglé par la classe.',
    'La bande est rognée dans sa boîte : elle ne fait jamais défiler la page de côté.',
  ],
  a11y: [
    'Les copies de la bande sont aria-hidden="true" : le texte est lu une seule fois. Le séparateur carré est un décor (pseudo-élément).',
    'Le grain ne reçoit jamais la souris (pointer-events: none) et son opacité (5 %) garde tout texte à 4,5 : 1 au moins.',
    'Le mouvement est coupé si le visiteur demande « mouvement réduit ».',
  ],
  js: 'chopa-effects.js (facultatif, à part de chopa.js)',
  classes: ['ch-band', 'ch-band__track', 'ch-band__item', 'ch-reveal', 'ch-grain', 'ch-grain--zone'],
};
