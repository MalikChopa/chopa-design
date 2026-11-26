export default {
  titre: 'Menu déroulant',
  famille: 'Navigation',
  jalon: 'J3a',
  ref: 'N',
  but: 'Un bouton qui ouvre une courte liste d\'actions (ou de liens), avec le popover natif du navigateur.',
  quand: 'Pour regrouper 3 à 7 actions secondaires (renommer, dupliquer, archiver) ou quelques destinations. Pour la navigation principale, l\'en-tête ; pour un choix à conserver, une liste déroulante.',
  variantes: [
    { titre: 'Menu d\'actions', exemple: 'dropdown/defaut', texte: 'data-ch-dropdown sur ch-dropdown ; un bouton popovertarget et un panneau popover avec des ch-dropdown__item. Le module ajoute role="menu" et "menuitem", place le panneau sous le bouton et envoie le focus au premier choix.' },
    { titre: 'Menu de navigation', exemple: 'dropdown/navigation', texte: 'data-ch-dropdown="navigation" : des liens, motif Disclosure, sans role="menu" ; Tab parcourt les liens.' },
    { titre: 'Menu ouvert', exemple: 'dropdown/ouvert', texte: 'ch-dropdown--ouvert montre le menu ouvert dans le flux, sans popover : pour l\'illustrer ou le tester. Un vrai menu s\'ouvre au clic.' },
  ],
  etats: [
    'Choix : repos, survol et focus (fond acc-dim, filet de 2 px à gauche), focus visible dans le panneau.',
    'Sans JavaScript : le popover natif s\'ouvre à sa place par défaut (centré dans la fenêtre, jamais plus large qu\'elle) et se ferme à l\'Échap ou au clic à côté.',
    'Avec JavaScript : le panneau est placé sous le bouton (top et left posés par le module, replacé au défilement et au redimensionnement ; au-dessus s\'il manque de la place en bas).',
    'Sans support du popover : repli par l\'attribut hidden, le panneau reste sous le bouton.',
  ],
  a11y: [
    'Actions : motif Menu Button. Entrée ou Espace ouvre et place le focus sur le premier choix ; Flèches haut et bas (avec retour), Début, Fin ; Échap ferme et rend le focus au bouton ; Tab ferme le menu.',
    'Navigation : motif Disclosure, des liens simples ; Échap ferme et rend le focus au bouton.',
    'Les rôles menu et menuitem sont ajoutés par le module, jamais écrits dans le HTML : sans JavaScript, ce sont de simples boutons dans un popover.',
    'aria-expanded sur le bouton suit l\'état ; aria-haspopup="menu" pour les actions.',
    'Choix de 44 px de haut ; texte fg sur card.',
  ],
  js: 'popover natif ; module dropdown de chopa.js (data-ch-dropdown) pour les rôles, le clavier et la position',
  classes: ['ch-dropdown'],
};
