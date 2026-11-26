export default {
  titre: 'Curseur',
  famille: 'Base et formulaires',
  jalon: 'J2c',
  ref: 'N',
  but: 'Choisir une valeur dans une plage continue ou à pas fixe, avec le <input type="range"> natif.',
  quand: 'Pour un volume, un zoom, une luminosité, où la précision exacte compte peu. Pour une valeur exacte, un champ texte.',
  variantes: [
    { titre: 'Avec la valeur', exemple: 'range/defaut', texte: 'ch-range avec data-ch-range, et un <output class="ch-range__value"> vide relié par for : le module range de chopa.js y écrit la valeur après chaque changement. Sans JavaScript, la valeur n\'est pas affichée plutôt qu\'affichée périmée (le curseur natif reste utilisable).' },
    { titre: 'Avec un pas', exemple: 'range/pas', texte: 'min, max, step, et un modèle dans data-ch-range (« {v} sur 5 ») : le texte affiché est aussi posé en aria-valuetext, le lecteur d\'écran lit « 3 sur 5 » plutôt qu\'un nombre brut.' },
    { titre: 'Désactivé', exemple: 'range/desactive', texte: 'disabled : piste en line, poignée en mute.' },
  ],
  etats: [
    'Repos, focus visible (contour de 2 px sur le curseur), désactivé.',
    'Piste de 6 px, poignée carrée de 20 px en accent ; zone de 44 px de haut. Rendu propre à chaque moteur (WebKit/Blink et Gecko) : la poignée est stylée par ::-webkit-slider-thumb et ::-moz-range-thumb.',
  ],
  a11y: [
    'Flèches (±1 pas), Début, Fin, PageHaut et PageBas : natif.',
    'Un libellé visible relié par for ; la valeur affichée est un output relié au champ (aria-live désactivé par le module : le curseur annonce déjà sa valeur).',
    'Cible tactile de la poignée (20 px) : plus petite que 44 px ; la zone du champ fait 44 px de haut, mais la largeur de la poignée n\'est pas mesurée (non vérifié).',
  ],
  js: 'module range de chopa.js (data-ch-range sur le curseur), facultatif : le curseur marche sans, la valeur n\'est alors pas affichée',
  classes: ['ch-range', 'ch-range__value'],
};
