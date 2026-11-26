export default {
  titre: 'Prix',
  famille: 'Contenu et médias',
  jalon: 'J4b',
  ref: 'N',
  but: 'Présenter une offre : son nom, son prix avec la devise et la période, ce qu\'elle comprend, et une seule action.',
  quand: 'Pour les formules d\'un abonnement, les éditions d\'un jeu, les offres d\'une boutique. Une seule offre à la fois peut être mise en avant.',
  variantes: [
    { titre: 'Une offre mise en avant', exemple: 'price/offre', texte: 'article.ch-price.ch-price--featured : l\'offre recommandée seule, avec son badge « Recommandée », son filet de 2 px en acc-text et son bouton primaire. La structure est détaillée dans l\'exemple suivant.' },
    { titre: 'Trois offres, une recommandée', exemple: 'price/defaut', texte: 'article.ch-price > ch-price__top (ch-price__name + badge) + ch-price__amount (ch-price__value, ch-price__currency, ch-price__period) + ch-price__desc + ul.ch-price__list (glyphe check devant chaque ligne) + ch-price__foot (un bouton). ch-price--featured met l\'offre en avant : filet de 2 px en acc-text, bouton primaire, et le badge « Recommandée » (le mot, pas seulement la couleur).' },
    { titre: 'Deux éditions, paiement unique', exemple: 'price/jeu', texte: 'La période se dit en toutes lettres (« une seule fois », « par mois »). Les boutons ont un nom qui contient celui de l\'offre (« Acheter l\'édition collector »).' },
  ],
  etats: [
    'Repos : fond card, filet line. Offre mise en avant : filet acc-text de 2 px (filet et ombre interne), badge « Recommandée », bouton primaire (les autres : secondaire).',
    'Le bouton prend les états de ch-btn (survol, focus, désactivé).',
  ],
  a11y: [
    'Chaque offre est un article avec son titre (h3 dans les exemples). La liste de ce qui est compris est une vraie liste ; les glyphes check sont décoratifs.',
    'La mise en avant est dite par du texte (« Recommandée ») et par une forme (filet épais), en plus de la couleur.',
    'Montant et nom fg, description et liste soft, période mute sur card : 4,5 : 1 au moins ; badge solid on-acc sur acc.',
  ],
  js: 'aucun',
  classes: ['ch-price', 'ch-price--featured'],
};
