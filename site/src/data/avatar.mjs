export default {
  titre: 'Avatar',
  famille: 'Contenu et médias',
  jalon: 'J4a',
  ref: 'N',
  but: 'Représenter une personne ou un compte par une photo ou ses initiales, dans un carré.',
  quand: 'À côté d\'un nom, dans une liste de membres, dans un commentaire. Toujours carré : le carré est celui de l\'identité, même si votre site règle --ch-radius.',
  variantes: [
    { titre: 'Image et initiales', exemple: 'avatar/defaut', texte: 'img.ch-avatar avec un alt, ou span.ch-avatar role="img" aria-label="Nom complet" qui contient les initiales.' },
    { titre: 'Quatre tailles', exemple: 'avatar/tailles', texte: 'ch-avatar--sm (32 px), base (40 px), ch-avatar--lg (56 px), ch-avatar--xl (80 px).' },
    { titre: 'Groupe', exemple: 'avatar/groupe', texte: 'ch-avatar-group : les avatars se recouvrent de 8 px ; le dernier peut compter les autres (« +5 »), avec un nom accessible qui le dit.' },
  ],
  etats: ['Pièce statique : ni survol ni focus. Le rayon de coin est 0 en dur sur l\'élément, son image et ses pseudo-éléments : il reste 0 même avec --ch-radius: 8px (mesuré par scripts/browser/contenu.mjs).'],
  a11y: [
    'Image : alt avec le nom de la personne (ou alt="" si le nom est écrit juste à côté). Initiales : role="img" et aria-label avec le nom complet, car « MR » seul ne veut rien dire.',
    'Initiales fg sur bg2, filet line : 4,5 : 1 au moins dans les 3 thèmes.',
    'Un avatar qui doit réagir se met dans un lien ou un bouton, qui porte alors la cible de 44 px.',
  ],
  js: 'aucun',
  classes: ['ch-avatar', 'ch-avatar--sm', 'ch-avatar--lg', 'ch-avatar--xl', 'ch-avatar-group'],
};
