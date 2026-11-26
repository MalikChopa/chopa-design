export default {
  titre: 'Logotype',
  famille: 'Fondations',
  jalon: 'J8a',
  ref: 'P',
  but: 'Écrire le nom d\'un site en majuscules grasses, suivi d\'un point carré orange : ch-wordmark et ch-wordmark__dot.',
  quand: 'Dans l\'en-tête, le pied de page, une page de titre. Le nom est libre : CHOPA pour la marque, le nom de ton site pour les autres. Pour la marque elle-même (tailles minimales, zone de protection, interdits), voir la page Marque.',
  variantes: [
    { titre: 'CHOPA', exemple: 'wordmark/defaut', texte: 'span.ch-wordmark : le nom, puis span.ch-wordmark__dot aria-hidden="true". Le texte est écrit en minuscules ou en capitales : la feuille met en majuscules.' },
    { titre: 'Quatre tailles', exemple: 'wordmark/tailles', texte: 'ch-wordmark--sm (14 px), défaut (18 px), --lg (32 px), --xl (64 px). Le point suit la taille : il mesure 0,34 em.' },
    { titre: 'Un autre nom, en lien', exemple: 'wordmark/nom-libre', texte: 'Le logotype d\'un site porte son propre nom ; posé sur un lien, il garde l\'aspect (a.ch-wordmark) et le lien reçoit un aria-label.' },
  ],
  etats: [
    'Pièce statique : pas de survol propre (un lien garde son focus visible comme tout lien).',
    'Taille minimale : 12 px (point de 4,08 px) ; en en-tête, 16 px. Détail et mesures : page Marque.',
    'Comparé à la planche (tests/parity/wordmark.json) : .wm.wm-c et .wm-c .dot.',
  ],
  a11y: [
    'Le point est un décor : aria-hidden="true". Le nom est du vrai texte, lu tel quel (« Chopa »).',
    'Texte fg sur bg, bg2, card : 4,5 : 1 au moins dans les 3 thèmes.',
    'Le point garde border-radius: 0, même si un site règle --ch-radius.',
  ],
  js: 'aucun',
  classes: ['ch-wordmark', 'ch-wordmark--sm', 'ch-wordmark--lg', 'ch-wordmark--xl', 'ch-wordmark__dot'],
};
