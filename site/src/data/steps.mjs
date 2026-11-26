export default {
  titre: 'Étapes',
  famille: 'Navigation',
  jalon: 'J3b',
  ref: 'N',
  but: 'Montrer la progression dans un parcours en plusieurs étapes : ce qui est fait, ce qui est en cours, ce qui reste.',
  quand: 'Pour un assistant de création, une commande en plusieurs temps, une recette ou une quête. Pour parcourir des pages d\'une même liste, la pagination.',
  variantes: [
    { titre: 'Étapes en rangée', exemple: 'steps/defaut', texte: 'ol.ch-steps > li.ch-steps__item. Fait : classe is-done (carré plein avec le glyphe check) ; courant : aria-current="step" (anneau épais, libellé fg en gras) ; à faire : is-todo (anneau en tirets, numéro mute). Chaque item commence par un mot masqué visuellement (ch-steps__state) que le lecteur d\'écran lit. En rangée dès 640 px, en colonne sous cette largeur.' },
    { titre: 'Étapes en colonne', exemple: 'steps/vertical', texte: 'ch-steps--vertical force la colonne à toute largeur, avec un trait de liaison vertical.' },
    { titre: 'Toutes terminées', exemple: 'steps/terminees', texte: 'Quand le parcours est fini, aucune étape n\'est courante : aucun aria-current.' },
  ],
  etats: [
    'Fait (is-done) : carré acc, glyphe check on-acc, libellé soft, trait de liaison acc.',
    'Courant (aria-current="step") : anneau de 2 px acc-text, numéro fg, libellé fg en gras.',
    'À faire (is-todo) : anneau en tirets mute, numéro et libellé mute.',
    'Chaque état est porté par une forme (glyphe, anneau épais, tirets) et par un mot lu, jamais par la couleur seule.',
  ],
  a11y: [
    'Liste ordonnée ol : le nombre d\'étapes est annoncé.',
    'aria-current="step" sur l\'étape en cours ; mots « Terminée : », « Étape en cours : », « À venir : » masqués visuellement mais lus.',
    'Le marqueur (numéro ou glyphe) est décoratif (aria-hidden) : le rang vient de la liste.',
    'Non interactif : aucun arrêt de Tab. Pour des étapes qui sont des liens, mettre un lien dans ch-steps__label (le focus visible vient de la base).',
  ],
  js: 'aucun',
  classes: ['ch-steps'],
};
