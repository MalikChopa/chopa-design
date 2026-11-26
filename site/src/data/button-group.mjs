export default {
  titre: 'Groupe de boutons',
  famille: 'Base et formulaires',
  jalon: 'J2b',
  ref: 'N',
  but: 'Réunir des boutons liés sous un même nom, espacés ou soudés.',
  quand: 'Pour des actions d\'un même objet (cuisiner, enregistrer, partager) ou un choix d\'affichage à bascule. Pour une simple ligne de boutons sans lien entre eux, la rangée suffit.',
  variantes: [
    { titre: 'Par défaut', exemple: 'button-group/defaut', texte: 'ch-btn-group : boutons espacés de 12 px, retour à la ligne permis.' },
    { titre: 'Soudé, choix d\'affichage', exemple: 'button-group/attached', texte: 'ch-btn-group--attached : les bordures se recouvrent de 1 px. aria-pressed="true" marque le bouton actif (le script du site bascule l\'attribut). Sur téléphone, le texte des boutons passe à la ligne plutôt que de déborder.' },
    { titre: 'Soudé, boutons secondaires', exemple: 'button-group/secondaires', texte: 'Les variantes de bouton gardent leur aspect dans un groupe soudé ; ici le premier bouton est désactivé (début de la liste).' },
  ],
  etats: ['Bouton actif : aria-pressed="true" (fond d\'accent, texte on-acc).', 'Bouton désactivé dans le groupe : bordure line, texte mute.'],
  a11y: [
    'role="group" et aria-label sur le conteneur : le nom du groupe est lu avant le premier bouton.',
    'Chaque bouton garde son nom et sa cible de 44 px ; l\'ordre de tabulation est l\'ordre du HTML.',
    'Un choix à bascule se dit par aria-pressed (pas par la couleur seule : le bouton actif change aussi de fond).',
  ],
  js: 'aucun',
  classes: ['ch-btn-group', 'ch-btn-group--attached'],
};
