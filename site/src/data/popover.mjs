export default {
  titre: 'Bulle d\'info',
  famille: 'Retours et fenêtres',
  jalon: 'J5a',
  ref: 'N',
  but: 'Un petit panneau natif (attribut popover) qui s\'ouvre au clic sur un bouton, avec un titre, un texte court et une croix de fermeture.',
  quand: 'Pour un détail qui s\'ouvre à la demande et n\'empêche pas de lire la page : les réglages d\'une photo, une liste de raccourcis. Pour une réponse obligatoire, la fenêtre modale ; pour un menu d\'actions, le menu déroulant ; pour une phrase au survol, l\'infobulle.',
  variantes: [
    { titre: 'Bulle avec titre et texte', exemple: 'popover/defaut', texte: 'Un bouton popovertarget="id" et un div.ch-popover[id][popover] avec ch-popover__head (titre h3, croix popovertargetaction="hide") et ch-popover__body. Aucun module.' },
    { titre: 'Bulle avec touches', exemple: 'popover/raccourcis', texte: 'Même marquage, avec des touches (ch-kbd) dans le corps.' },
  ],
  etats: [
    'Fermée : masquée par le navigateur. Ouverte (:popover-open) : au centre de la fenêtre (le positionnement par ancre n\'est pas utilisé), jamais plus large que la fenêtre moins 32 px, en fondu ; sans voile.',
    'Fermeture : Échap, clic ailleurs (light dismiss), ou la croix ; le focus revient au bouton, par le navigateur.',
    'Sans JavaScript : tout marche, la pièce n\'a pas de module. Dans un navigateur sans support de popover (avant janvier 2025 environ : statut Newly available, MDN consulté le 2026-11-15), le bouton reste sans effet et le panneau s\'affiche dans la page : non testé.',
  ],
  a11y: [
    'Attributs natifs popover et popovertarget : l\'état ouvert est porté par le navigateur ; Échap ferme ; le contenu de la bulle suit le bouton dans l\'ordre de Tab.',
    'La croix de fermeture a un aria-label précis ; le titre est un titre de niveau 3.',
    'Pas de role ni d\'aria-label sur la bulle (un div sans rôle n\'en accepte pas) : le titre la nomme pour qui la lit.',
    'Couleurs : fg, soft sur card ; filets line.',
  ],
  js: 'aucun : popover natif',
  classes: ['ch-popover'],
};
