export default {
  titre: 'Frise',
  famille: 'Contenu et médias',
  jalon: 'J4b',
  ref: 'N',
  but: 'Ranger des événements datés le long d\'un trait : notes de version, dates d\'un parcours, étapes d\'un chantier.',
  quand: 'Pour un historique ou un journal de versions. Pour des étapes à franchir dans l\'ordre, les étapes (avec fait, courant, à faire).',
  variantes: [
    { titre: 'Notes de version, avec une étape courante', exemple: 'timeline/patchs', texte: 'ol.ch-timeline > li.ch-timeline__item > time.ch-timeline__time (attribut datetime) + h3.ch-timeline__title + p.ch-timeline__text. aria-current="date" sur le li met l\'étape en avant : marqueur plein, titre en gras, et le mot « Version actuelle : » (ch-timeline__state, masqué visuellement) lu avant le titre.' },
    { titre: 'Parcours, sans étape courante', exemple: 'timeline/parcours', texte: 'Sans aria-current : tous les marqueurs sont creux.' },
  ],
  etats: [
    'Courant (aria-current="date") : marqueur carré plein acc, titre en gras (800), mot lu en plus. Les autres : marqueur creux mute, titre fg.',
    'La différence tient à la forme (plein ou creux), à la graisse et au texte lu, jamais à la couleur seule.',
  ],
  a11y: [
    'Liste ordonnée ol : le nombre d\'événements et le rang sont annoncés. Chaque date est un élément time avec sa valeur datetime.',
    'Les titres sont des h3 dans les exemples : adaptez le niveau à la page.',
    'Non interactive : aucun arrêt de Tab. Date mute, titre fg, texte soft sur bg, bg2, card : 4,5 : 1 au moins.',
  ],
  js: 'aucun',
  classes: ['ch-timeline'],
};
