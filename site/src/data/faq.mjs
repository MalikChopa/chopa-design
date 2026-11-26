export default {
  titre: 'FAQ',
  famille: 'Contenu et médias',
  jalon: 'J4b',
  ref: 'N',
  but: 'Lister des questions fréquentes dont chaque réponse se déplie sous sa question.',
  quand: 'Pour une page d\'aide, une recette, une notice de jeu. Pour des réglages ou des fiches, l\'accordéon (mêmes éléments, sans largeur de lecture).',
  variantes: [
    { titre: 'Exclusive', exemple: 'faq/defaut', texte: 'div.ch-faq > details.ch-accordion__item name="faq-…" > summary.ch-accordion__summary (la question) + div.ch-accordion__panel (la réponse). La FAQ réutilise les classes de l\'accordéon ; ch-faq ajoute la largeur de lecture (65 caractères) et des questions plus grandes. Même name partout : une seule réponse ouverte.' },
    { titre: 'Libre', exemple: 'faq/libre', texte: 'Sans name : on peut garder plusieurs réponses ouvertes, par exemple pour les comparer.' },
  ],
  etats: [
    'Identiques à l\'accordéon : question en gras et chevron retourné quand la réponse est ouverte ; survol du chevron en acc-text ; focus clavier à l\'intérieur du résumé.',
  ],
  a11y: [
    'details/summary natifs : Entrée et Espace déplient, Tab passe à la question suivante ; rien à ajouter.',
    'Résumé de 44 px de haut au moins ; question fg, réponse soft sur bg, bg2, card : 4,5 : 1 au moins.',
    'Sans prise en charge de <details name>, chaque question reste utilisable seule.',
  ],
  js: 'aucun (natif)',
  classes: ['ch-faq'],
};
