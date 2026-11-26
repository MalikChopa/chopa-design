export default {
  titre: 'Conteneur',
  famille: 'Fondations',
  jalon: 'J1b-2',
  ref: 'P',
  but: 'Centrer le contenu et limiter sa largeur, avec une marge intérieure qui se réduit sur téléphone.',
  quand: 'Une fois par bande de page (en-tête, section, pied de page). Ne pas l\'imbriquer : un conteneur dans un conteneur double la marge.',
  variantes: [
    { titre: 'Standard', exemple: 'conteneur/standard', texte: '1240 px au plus (jeton --ch-wrap-max).' },
    { titre: 'Étroit', exemple: 'conteneur/narrow', texte: '760 px au plus, pour la lecture.' },
    { titre: 'Large', exemple: 'conteneur/wide', texte: '1520 px au plus.' },
  ],
  etats: ['Aucun état. Sous 800 px la marge intérieure passe de 28 à 16 px.'],
  a11y: ['Aucun rôle : un simple div. Le conteneur ne change ni l\'ordre de lecture ni la structure.'],
  js: 'aucun',
  classes: ['ch-wrap', 'ch-wrap--narrow', 'ch-wrap--wide'],
};
