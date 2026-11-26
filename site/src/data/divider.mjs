export default {
  titre: 'Séparateur',
  famille: 'Contenu et médias',
  jalon: 'J4b',
  ref: 'N',
  but: 'Tracer un filet entre deux blocs, avec ou sans mot au milieu.',
  quand: 'Pour séparer deux parties qui ne méritent pas un titre, ou proposer « ou » entre deux choix. Pour hiérarchiser, préférez un titre.',
  variantes: [
    { titre: 'Filet simple', exemple: 'divider/defaut', texte: 'hr.ch-divider : un trait de 1 px en line, marges verticales de 24 px.' },
    { titre: 'Avec un mot', exemple: 'divider/etiquette', texte: 'div.ch-divider.ch-divider--label avec role="separator" et aria-label (« ou ») : le séparateur a un nom. Le mot visible (span.ch-divider__label) est aria-hidden pour ne pas être lu deux fois. Deux filets de part et d\'autre.' },
  ],
  etats: ['Statique : aucun survol ni focus.'],
  a11y: [
    'hr a le rôle séparateur natif. La variante avec mot est un div role="separator" nommé par aria-label : le lecteur d\'écran annonce « séparateur, ou ». Le séparateur n\'est pas focalisable.',
    'Mot mute sur bg, bg2, card : 4,5 : 1 au moins ; les filets line sont décoratifs (non-texte).',
  ],
  js: 'aucun',
  classes: ['ch-divider', 'ch-divider--label'],
};
