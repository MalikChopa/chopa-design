export default {
  titre: 'Progression',
  famille: 'Retours et fenêtres',
  jalon: 'J5b',
  ref: 'N',
  but: 'Une barre native (progress) qui montre l\'avancement d\'une tâche : un envoi, une analyse, un téléchargement.',
  quand: 'Pour une tâche dont on connaît l\'avancement (valeur) ou dont on sait seulement qu\'elle dure (indéterminée). Pour un chargement bref sans durée, l\'indicateur ; pour une page en cours de remplissage, le squelette.',
  variantes: [
    { titre: 'Progression connue', exemple: 'progress/determinee', texte: '<progress class="ch-progress" max="100" value="64"> et un <label for> visible. Dire la valeur aussi en texte.' },
    { titre: 'Durée inconnue', exemple: 'progress/indeterminee', texte: 'Sans attribut value : une barre orange glisse. Le libellé dit « en cours ».' },
  ],
  etats: [
    'Déterminée : remplissage orange proportionnel à value / max, sur une piste cernée de gris.',
    'Indéterminée : glissement de 1,4 s. Mouvement réduit : plus de glissement, la piste est rayée sur toute sa longueur (elle se lit « en cours » et ne montre aucune valeur).',
    'Carrée (border-radius 0) quel que soit le réglage du site. Moteurs testés : Chromium (pseudo-éléments ::-webkit-progress-*) ; Firefox (::-moz-progress-bar) écrit, non testé.',
  ],
  a11y: [
    'Élément natif : rôle progressbar, valeur lue par le navigateur. Un nom est obligatoire : label lié (for), ou aria-label.',
    'Indéterminée : pas d\'attribut value ; le libellé visible dit que la tâche est en cours.',
    'Couleurs : le remplissage (acc) et le cadre (mute) sont des éléments graphiques, sans texte ; le libellé et la valeur sont en texte fg ou mute sur la surface de la page.',
  ],
  js: 'aucun : élément natif',
  classes: ['ch-progress'],
};
