export default {
  titre: 'Onglets',
  famille: 'Navigation',
  jalon: 'J3a',
  ref: 'N',
  but: 'Ranger plusieurs panneaux de contenu parallèles derrière une rangée d\'onglets : un seul panneau est visible à la fois.',
  quand: 'Pour des vues d\'un même objet (description, entretien, livraison). Pour une suite d\'étapes, des étapes ; pour une longue page à parcourir, un sommaire ; pour des questions courtes, un accordéon.',
  variantes: [
    { titre: 'Trois onglets', exemple: 'tabs/defaut', texte: 'data-ch-tabs sur ch-tabs ; une liste ch-tabs__list de boutons ch-tabs__tab, puis un ch-tabs__panel par onglet, avec un titre ch-tabs__heading. Les identifiants et les attributs ARIA sont posés par le module.' },
    { titre: 'Un onglet désactivé', exemple: 'tabs/desactive', texte: 'aria-disabled="true" : l\'onglet reste visible en mute, les flèches le sautent, un clic ne fait rien.' },
    { titre: 'Un autre onglet actif au départ', exemple: 'tabs/deuxieme', texte: 'aria-selected="true" sur le bouton à ouvrir en premier (sinon le premier onglet non désactivé).' },
  ],
  etats: [
    'Onglet : repos (soft), survol (fg), actif (aria-selected : fg et barre de 2 px), désactivé (aria-disabled : mute), focus visible.',
    'Sans JavaScript : la rangée de boutons est masquée ; chaque panneau s\'affiche à la suite avec son titre.',
    'Module en échec (data-ch-failed) : même affichage qu\'une page sans JavaScript, tous les panneaux visibles.',
  ],
  a11y: [
    'Motif Tabs de l\'APG, activation automatique : Flèche gauche et droite (avec retour au début et à la fin), Début, Fin ; un seul onglet dans l\'ordre de Tab (tabindex itinérant) ; l\'onglet désactivé est sauté.',
    'role="tablist", "tab", "tabpanel", aria-selected, aria-controls et aria-labelledby posés par le module (identifiants uniques créés si absents).',
    'Un panneau sans élément focalisable reçoit tabindex="0" : un utilisateur du clavier peut y entrer.',
    'Le titre de chaque panneau (utile sans JavaScript) est masqué quand les onglets fonctionnent : l\'onglet porte déjà le nom.',
    'Texte soft, fg ou mute sur bg ; l\'onglet actif se reconnaît à la barre et non à la seule couleur.',
    'Classe ch-js : posée sur <html> par chopa-theme.js (si chopa.js est déclaré avant lui) ou par chopa.js ; elle active les règles qui masquent les panneaux inactifs. Retirée par le onerror de la balise si chopa.js ne charge pas.',
  ],
  js: 'module tabs de chopa.js (data-ch-tabs)',
  classes: ['ch-tabs', 'ch-js'],
};
