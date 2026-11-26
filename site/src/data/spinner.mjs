export default {
  titre: 'Indicateur de chargement',
  famille: 'Retours et fenêtres',
  jalon: 'J5b',
  ref: 'N',
  but: 'Un petit carré dont le bord tourne : une opération est en cours, sans durée connue.',
  quand: 'Pour un chargement bref (un bouton qui envoie, une liste qui se met à jour). Pour une tâche longue avec avancement, la barre de progression.',
  variantes: [
    { titre: 'Trois tailles', exemple: 'spinner/tailles', texte: 'ch-spinner--sm (16 px), base (24 px), --lg (40 px). Le texte ch-spinner__label est masqué à l\'œil mais lu.' },
    { titre: 'À côté d\'un texte', exemple: 'spinner/avec-texte', texte: 'Le texte visible est aria-hidden quand le libellé masqué dit la même chose : une seule lecture.' },
  ],
  etats: [
    'Rotation de 0,9 s. Mouvement réduit : plus de rotation ; deux côtés du carré sont orange, et le mot visible à côté dit « en cours ».',
    'Carré : border-radius 0, même avec un --ch-radius supérieur à 0 sur le site (le carré est la forme de la marque).',
  ],
  a11y: [
    'role="status" et un texte masqué à l\'œil (« Chargement »). Un role="status" présent au chargement n\'est pas annoncé ; pour annoncer, insérer l\'indicateur après le chargement de la page (le role doit exister à ce moment).',
    'Ne pas laisser un indicateur tourner sans fin : au bout d\'un délai, dire l\'échec par une alerte.',
    'Couleurs : acc et line, éléments graphiques ; aucun texte visible.',
  ],
  js: 'aucun',
  classes: ['ch-spinner', 'ch-spinner--sm', 'ch-spinner--lg'],
};
