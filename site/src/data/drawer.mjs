export default {
  titre: 'Tiroir',
  famille: 'Retours et fenêtres',
  jalon: 'J5a',
  ref: 'N',
  but: 'Un panneau modal collé au bord gauche ou droit de la fenêtre, sur toute la hauteur : un panier, des filtres, un menu.',
  quand: 'Pour une liste ou un formulaire qui accompagne la page sans la remplacer (panier, filtres, détail d\'un élément). Pour une courte question, la fenêtre modale ; pour une aide attachée à un mot, une infobulle.',
  variantes: [
    { titre: 'Tiroir à gauche', exemple: 'drawer/gauche', texte: 'ch-drawer--left : même marquage que la fenêtre modale (data-ch-dialog-open, data-ch-dialog-close), avec ch-drawer__head, ch-drawer__body et ch-drawer__foot. Ici des filtres de recettes.' },
    { titre: 'Tiroir à droite qui défile', exemple: 'drawer/droite', texte: 'ch-drawer--right. Plein hauteur : quand la liste est longue, seul ch-drawer__body défile (tabindex="0" pour le clavier), le pied et l\'en-tête restent.' },
  ],
  etats: [
    'Fermé : rien ne s\'affiche. Ouvert : le tiroir glisse depuis son bord avec le voile ; sous prefers-reduced-motion, aucune animation.',
    'Largeur : 420 px au plus, et jamais plus que la fenêtre (100 % à 375 px). Hauteur : toute la fenêtre.',
    'Sans JavaScript (ou module en échec) : le contenu s\'affiche dans la page et les boutons d\'ouverture et de fermeture sont masqués, comme pour la fenêtre modale.',
  ],
  a11y: [
    'Même comportement que la fenêtre modale : <dialog> ouvert par showModal(), Échap ferme, Tab et Maj+Tab bouclent dans le tiroir, focus rendu à l\'ouvreur, clic sur le fond qui ferme, page non défilante.',
    'aria-labelledby vers le titre visible (ch-drawer__title). Croix de fermeture de 44 px avec aria-label.',
    'Le tiroir ne sert pas de navigation permanente : il est modal, donc le reste de la page est inerte tant qu\'il est ouvert.',
    'Couleurs : fg, soft sur card ; filets line ; voile bg à 72 %.',
  ],
  js: 'module dialog de chopa.js (le même que la fenêtre modale)',
  classes: ['ch-drawer', 'ch-drawer--left', 'ch-drawer--right'],
};
