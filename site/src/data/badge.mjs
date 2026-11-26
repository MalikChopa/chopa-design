export default {
  titre: 'Badge',
  famille: 'Contenu et médias',
  jalon: 'J4a',
  ref: 'N',
  but: 'Marquer un objet d\'une étiquette courte : état, nouveauté, catégorie.',
  quand: 'Pour un statut qui accompagne un titre ou une ligne. Pour une action ou un filtre, une puce ; pour un score, une pastille de score.',
  variantes: [
    { titre: 'Les quatre styles', exemple: 'badge/variantes', texte: 'ch-badge (filet line, fg), ch-badge--solid (on-acc sur acc), ch-badge--outline (filet et texte acc-text), ch-badge--mute (mute).' },
    { titre: 'Dans une liste', exemple: 'badge/contexte', texte: 'Le badge suit un titre, dans une rangée ch-row--between ; le mot du badge dit l\'état.' },
  ],
  etats: ['Pièce statique : ni survol ni focus.'],
  a11y: [
    'Le sens est porté par le texte du badge (« Publié », « Brouillon »), jamais par le style : le plein, le contour et le gris ne font que hiérarchiser.',
    'Non interactif : pas de cible de 44 px ; un badge qui devrait réagir est une puce.',
    'Couleurs : fg, acc-text, mute sur bg, bg2, card ; on-acc sur acc (4,5 : 1 au moins dans les 3 thèmes).',
  ],
  js: 'aucun',
  classes: ['ch-badge', 'ch-badge--solid', 'ch-badge--outline', 'ch-badge--mute'],
};
