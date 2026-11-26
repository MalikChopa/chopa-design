export default {
  titre: 'Barre latérale',
  famille: 'Navigation',
  jalon: 'J3b',
  ref: 'N',
  but: 'La navigation d\'une section (documentation, manuel, boutique) rangée à côté du contenu, repliable sur téléphone.',
  quand: 'Dans une documentation ou un manuel de plus de quelques pages, avec le sommaire de la page en regard. Pour la navigation du site entier, l\'en-tête.',
  variantes: [
    { titre: 'Un groupe de liens', exemple: 'sidebar/defaut', texte: 'aside (nommé) > details.ch-sidebar__details[open] > summary.ch-sidebar__summary + nav.ch-sidebar__nav (nommé) > ch-sidebar__group > ch-sidebar__title + ul.ch-sidebar__list > li > a.ch-sidebar__link. Le lien de la page courante porte aria-current="page".' },
    { titre: 'Plusieurs groupes', exemple: 'sidebar/groupes', texte: 'Un ch-sidebar__group par thème, chacun avec son titre (mute). Largeur maximale 280 px.' },
  ],
  etats: [
    'Lien : soft ; survol : fg ; courant : fg, gras et filet de 2 px à gauche ; focus visible.',
    'Résumé (ch-sidebar__summary) : visible sous 800 px de fenêtre, 44 px de haut, plie et déplie le contenu à Entrée ou Espace.',
    'Repli « toujours ouverte » (comportement de base) : le HTML porte l\'attribut open ; sans ::details-content, rien n\'est jamais caché au chargement.',
    'Amélioration (@supports selector(::details-content), dès 800 px) : le résumé disparaît et le contenu reste affiché même si le détail avait été replié.',
  ],
  a11y: [
    'aside = repère complémentaire ; il porte un aria-label, ainsi que le nav qu\'il contient (deux noms différents). Sur une page, un repère nommé par rôle et par nom.',
    'Motif Disclosure natif : <summary> est un bouton au clavier (Entrée, Espace) ; aucun JavaScript, aucun aria-expanded à tenir à jour (le navigateur l\'expose).',
    'Le lien courant se reconnaît au filet, au gras et à fg, pas à la couleur seule ; 44 px de haut par lien.',
    'Dans la page de la doc, l\'aside se trouve dans <main> : c\'est un repère « complémentaire » non de premier niveau, ce qui ne se produit pas dans un vrai gabarit où l\'aside est frère de <main>.',
  ],
  js: 'aucun (HTML natif : details et summary)',
  classes: ['ch-sidebar'],
};
