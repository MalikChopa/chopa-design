export default {
  titre: 'Bouton icône',
  famille: 'Base et formulaires',
  jalon: 'J2b',
  ref: 'N',
  but: 'Un bouton carré de 44 × 44 px qui ne montre qu\'un glyphe : fermer, ajouter, copier, ouvrir le menu.',
  quand: 'Quand le glyphe est universellement compris ou que la place manque. Dans le doute, écrire le texte : un bouton avec une icône et un mot se comprend mieux qu\'une icône seule.',
  variantes: [
    { titre: 'Principal', exemple: 'button-icon/primary', texte: 'ch-btn ch-btn--icon ch-btn--primary.' },
    { titre: 'Secondaire', exemple: 'button-icon/secondary', texte: 'ch-btn ch-btn--icon ch-btn--secondary.' },
    { titre: 'Discret', exemple: 'button-icon/ghost', texte: 'ch-btn ch-btn--icon ch-btn--ghost : sans cadre, le glyphe passe en acc-text au survol.' },
    { titre: 'Désactivé', exemple: 'button-icon/desactive', texte: 'disabled : bordure line, glyphe mute.' },
    { titre: 'Les 15 glyphes du sprite', exemple: 'button-icon/glyphes', texte: 'Glyphes provisoires, dessinés pour Chopa (carrés, trait de 2) ; le jeu définitif remplacera les fichiers de src/icons/ sans toucher aux exemples. Chaque exemple référence le sprite par son nom (#ch-i-<nom>) et n\'embarque aucun tracé.' },
  ],
  etats: ['Repos, survol, focus visible, désactivé : comme le bouton.'],
  a11y: [
    'aria-label obligatoire sur chaque bouton icône (ou aria-labelledby) : sans lui, le bouton n\'a pas de nom. Le script scripts/checks/btn-icon.mjs fait échouer la construction s\'il manque.',
    'Le glyphe est décoratif : aria-hidden="true" et focusable="false" sur le <svg>.',
    'Taille de 44 × 44 px, bordure comprise.',
    'Le nom dit l\'action (« Fermer la fenêtre »), pas l\'image (« croix »).',
  ],
  js: 'aucun',
  classes: ['ch-btn--icon', 'ch-icon'],
};
