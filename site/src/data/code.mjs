export default {
  titre: 'Bloc de code',
  famille: 'Contenu et médias',
  jalon: 'J4a',
  ref: 'N',
  but: 'Afficher du code ou une commande à copier, dans un cadre qui défile sans jamais faire défiler la page.',
  quand: 'Pour un extrait de plusieurs lignes ou une commande. Pour un mot de code dans une phrase, la balise <code> de la prose.',
  variantes: [
    { titre: 'Avec bouton « Copier »', exemple: 'code/defaut', texte: 'div.ch-code[data-ch-copy] > pre.ch-code__pre[tabindex="0"] > code. Le module copy insère la barre et le bouton « Copier » ; il copie exactement le texte du code (ni le texte du bouton, ni espace ajouté).' },
    { titre: 'HTML', exemple: 'code/html', texte: 'Les chevrons s\'écrivent &lt; et &gt; dans le code source ; le texte copié est le vrai code.' },
    { titre: 'Ligne très longue', exemple: 'code/long', texte: 'Le bloc défile à l\'horizontale dans son cadre ; la page ne déborde pas, même à 375 px.' },
    { titre: 'Sans bouton', exemple: 'code/sans-bouton', texte: 'Sans l\'attribut data-ch-copy : le bloc seul.' },
  ],
  etats: [
    'Bouton : repos soft, survol fg ; après la copie, « Copié » en acc-text pendant 2,5 s ; si le presse-papiers est refusé ou absent, le code est sélectionné et le bouton dit « Ctrl+C ou ⌘C » (message complet dans la région aria-live).',
    'Sans JavaScript : ni barre ni bouton ; le code reste lisible et sélectionnable.',
    'La doc colorie ses propres blocs (Shiki) ; ce bloc-ci n\'est pas coloré : texte fg sur card.',
  ],
  a11y: [
    'Le <pre> défilant est focalisable (tabindex="0") : le clavier peut le faire défiler avec les flèches.',
    'Bouton « Copier » : un vrai <button> de 44 px de haut au moins, nom visible ; la réussite et l\'échec sont annoncés par la région aria-live persistante de chopa.js (chopa.live()).',
    'Texte fg sur card, bouton soft et acc-text sur card : 4,5 : 1 au moins dans les 3 thèmes.',
  ],
  js: 'module copy de chopa.js (data-ch-copy) ; facultatif : sans lui, bloc lisible sans bouton',
  classes: ['ch-code', 'ch-code__pre', 'ch-code__bar', 'ch-code__copy'],
};
