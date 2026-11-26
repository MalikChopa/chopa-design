export default {
  titre: 'Page 404',
  famille: 'Retours et fenêtres',
  jalon: 'J5b',
  ref: 'N',
  but: 'Le contenu d\'une page « introuvable » : un grand 404, un titre, une phrase et des liens pour repartir.',
  quand: 'Pour la page servie quand l\'adresse n\'existe pas. Pour une liste vide, l\'état vide.',
  variantes: [
    { titre: 'Page perdue d\'un blog', exemple: 'notfound/blog', texte: 'Sur une vraie page, pose la classe ch-notfound sur <main> (un seul main par page) et un h1 pour le titre. Dans la doc, l\'exemple est un <section> avec un h2, car il est déjà dans le <main> de la doc : un main imbriqué serait invalide.' },
    { titre: 'Niveau introuvable d\'un jeu', exemple: 'notfound/jeu', texte: 'Même marquage, deux liens de secours.' },
  ],
  etats: ['Liens : soulignés, de 44 px de haut, focus visible. Le code « 404 » est décoratif (aria-hidden="true") : le titre le dit.'],
  a11y: [
    'Une page 404 a un seul h1 et un <main> ; la pièce se pose sur ce <main>. Le serveur doit aussi répondre avec le statut 404 (hors de portée du CSS).',
    'Le grand « 404 » est aria-hidden : le titre porte le message.',
    'Couleurs : fg (code, titre), soft (texte) et acc-text (liens) sur bg.',
  ],
  js: 'aucun',
  classes: ['ch-notfound'],
};
