export default {
  titre: 'Accordéon',
  famille: 'Contenu et médias',
  jalon: 'J4b',
  ref: 'N',
  but: 'Replier des réponses ou des réglages derrière leur titre, pour que la page reste courte et que chaque panneau s\'ouvre à la demande.',
  quand: 'Pour des réglages, une fiche technique, des étapes secondaires. Pour des questions fréquentes, la FAQ (même mécanique, largeur de lecture) ; pour passer d\'un contenu à un autre, les onglets.',
  variantes: [
    { titre: 'Exclusif', exemple: 'accordion/defaut', texte: 'div.ch-accordion > details.ch-accordion__item name="…" > summary.ch-accordion__summary + div.ch-accordion__panel. Le même name sur chaque details : en ouvrir un ferme l\'autre. Le glyphe chevron-down (ch-accordion__icon) fait un demi-tour à l\'ouverture. Utilisez un name différent par groupe, unique dans la page.' },
    { titre: 'Libre', exemple: 'accordion/libre', texte: 'Sans name : chaque details est indépendant, plusieurs peuvent rester ouverts. L\'attribut open sur un details l\'ouvre au chargement (un seul par groupe exclusif).' },
  ],
  etats: [
    'Fermé : titre fg, chevron vers le bas. Ouvert (attribut open) : titre en gras et chevron retourné ; jamais la couleur seule.',
    'Survol : le chevron passe en acc-text. Focus clavier : contour de 2 px tracé à l\'intérieur du résumé.',
    'Sans prise en charge de <details name> (navigateur ancien), chaque panneau s\'ouvre et se ferme seul : seule l\'exclusivité est perdue.',
  ],
  a11y: [
    'Élément natif details/summary : bouton replié ou déplié annoncé, Entrée et Espace ouvrent et ferment, Tab passe d\'un résumé au suivant. Aucun JavaScript, aucun role ajouté.',
    'Résumé de 44 px de haut au moins. Le glyphe est décoratif (aria-hidden).',
    'Titre fg et panneau soft sur bg, bg2, card : 4,5 : 1 au moins dans les 3 thèmes.',
  ],
  js: 'aucun (natif)',
  classes: ['ch-accordion'],
};
