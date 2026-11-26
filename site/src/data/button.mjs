export default {
  titre: 'Bouton',
  famille: 'Base et formulaires',
  jalon: 'J2b',
  ref: 'P',
  but: 'Déclencher une action (<button>) ou ouvrir une page (<a>), avec trois niveaux d\'importance.',
  quand: 'Principal pour l\'action la plus importante de la page (une seule par zone), secondaire pour les actions de second plan, discret pour les actions légères. Pour changer de page, un lien habillé en bouton ; pour une action, un vrai <button>. Un bouton qui ne montre qu\'une icône est un bouton icône.',
  variantes: [
    { titre: 'Principal', exemple: 'button/primary', texte: 'ch-btn ch-btn--primary : fond d\'accent, texte on-acc. Au survol, fond et bordure en fg, texte en bg.' },
    { titre: 'Secondaire', exemple: 'button/secondary', texte: 'ch-btn--secondary : bordure d\'accent, texte acc-text. Au survol, fond d\'accent.' },
    { titre: 'Discret et désactivé', exemple: 'button/ghost', texte: 'ch-btn--ghost : texte seul, filet d\'accent qui se déroule au survol ; sa zone de clic fait 44 px de haut même sans cadre. Un bouton neutre désactivé est montré avec lui.' },
    { titre: 'Désactivé, trois variantes', exemple: 'button/desactive', texte: 'L\'attribut disabled donne le même rendu aux trois variantes : bordure line, texte mute, curseur « interdit ». Le contraste reste de 4,5 : 1 au moins (pas d\'opacité).' },
    { titre: 'Avec une icône', exemple: 'button/avec-icone', texte: 'Un glyphe du sprite (ch-icon, aria-hidden) à côté du texte : le texte reste le nom du bouton.' },
    { titre: 'Lien en bouton', exemple: 'button/lien', texte: 'ch-btn sur un <a href> : même aspect, même hauteur de 44 px.' },
  ],
  etats: [
    'Repos, survol (couleurs de la planche), focus visible (contour de 2 px, décalé de 3 px), désactivé (attribut disabled).',
    'Le survol et le focus sont mesurés par tests/parity/button.json (thèmes sombre, clair et chaud), pas par une image : un exemple statique ne peut pas les montrer.',
  ],
  a11y: [
    'Un vrai <button> ou un <a href> : Entrée et Espace (bouton), Entrée (lien) marchent sans script.',
    'Cible d\'au moins 44 px de haut ; le bouton discret agrandit sa zone par un ::before invisible.',
    'Le texte du bouton est son nom ; ne jamais le remplacer par une icône sans aria-label (voir Bouton icône).',
    'Désactivé : texte mute sur bg, bg2 ou card, 4,5 : 1 au moins dans les trois thèmes.',
  ],
  js: 'aucun',
  classes: ['ch-btn', 'ch-btn--primary', 'ch-btn--secondary', 'ch-btn--ghost'],
};
