export default {
  titre: 'Liste',
  famille: 'Contenu et médias',
  jalon: 'J4a',
  ref: 'N',
  but: 'Mettre en forme une liste à puces, numérotée ou de définitions, avec des filets ou une image devant chaque élément.',
  quand: 'Pour des éléments de même nature : matériel, étapes d\'une recette, fiche technique. Pour des chiffres clés, préférez les chiffres clés ; pour des liens de navigation, un menu ou une barre latérale.',
  variantes: [
    { titre: 'Liste à puces et liste numérotée', exemple: 'list/defaut', texte: 'ul.ch-list : marqueurs carrés en acc-text. ol.ch-list : chiffres mono en mute. Les marqueurs sont ceux du navigateur : la sémantique de liste est intacte.' },
    { titre: 'Avec filets', exemple: 'list/filets', texte: 'ch-list--rule : un filet entre chaque élément, sans puces. Ajoutez role="list" : Safari retire la sémantique d\'une liste dont les puces sont supprimées.' },
    { titre: 'Avec image', exemple: 'list/media', texte: 'ch-list--media : un avatar ou une image (ch-list__media) devant un bloc de texte (ch-list__text) fait d\'un titre ch-list__title et d\'une précision ch-list__meta.' },
    { titre: 'Liste de définitions', exemple: 'list/definitions', texte: 'dl.ch-list : le terme (dt) en étiquette mono mute, sa définition (dd) en soft. ch-list--rule ajoute des filets.' },
  ],
  etats: ['Pièce statique : aucun survol ni focus.'],
  a11y: [
    'Listes natives (ul, ol, dl) : le nombre d\'éléments et la position sont annoncés tels quels.',
    'Variantes sans puces : role="list" sur la liste, pour que Safari et VoiceOver la lisent encore comme une liste.',
    'Texte soft, fg, mute sur bg, bg2 ou card : 4,5 : 1 au moins ; marqueurs en acc-text.',
  ],
  js: 'aucun',
  classes: ['ch-list', 'ch-list--rule', 'ch-list--media', 'ch-list__media', 'ch-list__text', 'ch-list__title', 'ch-list__meta'],
};
