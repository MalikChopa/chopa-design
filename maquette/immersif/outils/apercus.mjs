// Miniatures vivantes des tuiles du mur (maquette immersive, brief 31).
// Une entrée par slug : `html` est du vrai HTML de chopa.css (classes ch-), sans id ni attribut style ;
// `z` (facultatif) réduit la miniature par la propriété CSS zoom (classe im-z50 à im-z80 de immersif.css).
// Les textes sont fictifs. Les tuiles sont décoratives (inert, aria-hidden) : le nom accessible est celui du lien.
const ic = (n) => `<svg class="ch-icon" aria-hidden="true" focusable="false"><use href="chopa/chopa-icons.svg#ch-i-${n}"></use></svg>`;

export const apercus = {
  // ---------- Fondations ----------
  conteneur: { html: `<div class="im-schema im-schema--wrap"><span class="ch-label">ch-wrap · 1240 px</span><div class="im-schema__in"><span class="ch-label">ch-wrap--narrow</span></div></div>` },
  effets: { html: `<div class="ch-band"><p class="ch-band__track"><span class="ch-band__item">Défile</span><span class="ch-band__item">Défile</span></p></div><p class="ch-t-small">Bandes et titres qui apparaissent</p>` },
  grille: { html: `<div class="ch-grid ch-grid--3 im-cases">${'<span class="im-case"></span>'.repeat(6)}</div><span class="ch-label">ch-grid--3</span>` },
  wordmark: { html: `<span class="ch-wordmark ch-wordmark--lg">Chopa<span class="ch-wordmark__dot" aria-hidden="true"></span></span>` },
  pile: { html: `<div class="ch-stack ch-stack--s3 im-cases-v"><span class="im-case"></span><span class="im-case"></span><span class="im-case"></span></div><span class="ch-label">ch-stack--s3</span>` },
  prose: { z: 80, html: `<div class="ch-prose"><h3>Carnet de route</h3><p>Trois jours de marche entre deux refuges, une carte froissée et un thermos de thé.</p></div>` },
  rangee: { html: `<div class="ch-row"><span class="im-case im-case--carre"></span><span class="im-case im-case--carre"></span><span class="im-case im-case--carre"></span></div><span class="ch-label">ch-row</span>` },
  section: { html: `<div class="ch-section ch-section--tight im-section"><span class="ch-label">Section · 03</span><p class="ch-t-h3">Ateliers du jeudi</p></div>` },
  texte: { z: 70, html: `<p class="ch-t-h2">Titre</p><p class="ch-t-h3">Sous-titre</p><p class="ch-t-body">Un texte courant, lisible et posé.</p><p class="ch-t-mono">Étiquette mono</p>` },

  // ---------- Base et formulaires ----------
  'button-icon': { html: `<div class="ch-row"><button class="ch-btn ch-btn--icon ch-btn--primary" type="button" aria-label="Ajouter">${ic('plus')}</button><button class="ch-btn ch-btn--icon ch-btn--secondary" type="button" aria-label="Rechercher">${ic('search')}</button><button class="ch-btn ch-btn--icon ch-btn--ghost" type="button" aria-label="Fermer">${ic('close')}</button></div>` },
  button: { html: `<div class="ch-stack ch-stack--s3"><button class="ch-btn ch-btn--primary" type="button">Me contacter</button><button class="ch-btn ch-btn--secondary" type="button">Voir les projets</button></div>` },
  checkbox: { html: `<div class="ch-stack ch-stack--s2"><label class="ch-choice"><input class="ch-check" type="checkbox"> Sous-titres</label><label class="ch-choice"><input class="ch-check" type="checkbox" checked> Nouveaux articles</label></div>` },
  'input-group': { html: `<label class="ch-field"><span class="ch-label">Boutique</span><span class="ch-input-group ch-input-group--prefix"><span class="ch-input-group__addon">https://</span><input class="ch-input" type="text" placeholder="atelier.fr"></span></label>` },
  input: { html: `<label class="ch-field"><span class="ch-label">Pseudo du joueur</span><input class="ch-input" type="text" placeholder="LoupDesNeiges"></label>` },
  range: { html: `<label class="ch-field"><span class="ch-label">Volume · 60</span><input class="ch-range" type="range" min="0" max="100" value="60"></label>` },
  file: { html: `<label class="ch-field"><span class="ch-label">Couverture</span><input class="ch-file" type="file"></label>` },
  'button-group': { z: 80, html: `<div class="ch-btn-group" role="group" aria-label="Recette"><button class="ch-btn ch-btn--primary" type="button">Cuisiner</button><button class="ch-btn ch-btn--secondary" type="button">Garder</button></div>` },
  fieldset: { z: 80, html: `<fieldset class="ch-fieldset"><legend class="ch-fieldset__legend">Livraison</legend><label class="ch-field"><span class="ch-label">Ville</span><input class="ch-input" type="text" placeholder="Brest"></label></fieldset>` },
  switch: { html: `<div class="ch-stack ch-stack--s2"><label class="ch-choice"><input class="ch-switch" type="checkbox" role="switch"> Économie</label><label class="ch-choice"><input class="ch-switch" type="checkbox" role="switch" checked> Épisodes</label></div>` },
  label: { html: `<label class="ch-field"><span class="ch-field__label">Titre</span><input class="ch-input" type="text" placeholder="Cartes de rando"><span class="ch-field__help">Une phrase courte.</span></label>` },
  select: { html: `<label class="ch-field"><span class="ch-label">Difficulté</span><select class="ch-select"><option>Normal</option><option>Expert</option></select></label>` },
  radio: { html: `<fieldset class="ch-fieldset"><legend class="ch-fieldset__legend">Niveau</legend><label class="ch-choice"><input class="ch-radio" type="radio" name="im-niveau"> Découverte</label><label class="ch-choice"><input class="ch-radio" type="radio" name="im-niveau" checked> Normal</label></fieldset>` },
  search: { z: 80, html: `<div class="ch-search"><input class="ch-input" type="search" aria-label="Rechercher" placeholder="Une étape"><button class="ch-btn ch-btn--primary ch-btn--icon" type="button" aria-label="Rechercher">${ic('search')}</button></div>` },
  textarea: { html: `<label class="ch-field"><span class="ch-label">Message</span><textarea class="ch-textarea" rows="3">Bonjour, une table pour quatre ?</textarea></label>` },

  // ---------- Navigation ----------
  sidebar: { z: 70, html: `<nav class="ch-sidebar" aria-label="Doc"><p class="ch-sidebar__title">Guide</p><ul class="ch-sidebar__list"><li><a class="ch-sidebar__link" href="#d" aria-current="page">Démarrer</a></li><li><a class="ch-sidebar__link" href="#t">Thèmes</a></li><li><a class="ch-sidebar__link" href="#p">Pièces</a></li></ul></nav>` },
  header: { z: 50, html: `<header class="ch-header"><div class="ch-header__inner"><a class="ch-header__brand ch-wordmark" href="#a">Lune<span class="ch-wordmark__dot" aria-hidden="true"></span></a><nav class="ch-header__nav" aria-label="Principale"><ul class="ch-nav"><li><a href="#j" aria-current="page">Jeux</a></li><li><a href="#b">Blog</a></li></ul></nav></div></header>` },
  breadcrumb: { z: 80, html: `<nav class="ch-breadcrumb" aria-label="Fil"><ol class="ch-breadcrumb__list"><li class="ch-breadcrumb__item"><a class="ch-breadcrumb__link" href="#a">Accueil</a></li><li class="ch-breadcrumb__item"><a class="ch-breadcrumb__link" href="#j">Jeux</a></li><li class="ch-breadcrumb__item"><span aria-current="page">Phare</span></li></ol></nav>` },
  skip: { html: `<a class="ch-skip im-skip-vu" href="#c">Aller au contenu</a><span class="ch-label">Visible au focus</span>` },
  dropdown: { z: 80, html: `<div class="ch-dropdown ch-dropdown--ouvert"><button class="ch-btn ch-btn--secondary" type="button">Actions ${ic('chevron-down')}</button><div class="ch-dropdown__panel"><button class="ch-dropdown__item" type="button">Renommer</button><button class="ch-dropdown__item" type="button">Archiver</button></div></div>` },
  tabs: { z: 80, html: `<div class="ch-tabs im-tabs"><div class="ch-tabs__list" role="tablist" aria-label="Jeu"><button class="ch-tabs__tab" type="button" role="tab" aria-selected="true">Histoire</button><button class="ch-tabs__tab" type="button" role="tab" aria-selected="false">Succès</button></div><div class="ch-tabs__panel" role="tabpanel" aria-label="Histoire"><p class="ch-t-small">Une lanterne et douze tours à rallumer.</p></div></div>` },
  pagination: { z: 70, html: `<nav class="ch-pagination" aria-label="Pages"><ul class="ch-pagination__list"><li><a class="ch-pagination__link" href="#p3" aria-label="Page 3">3</a></li><li><a class="ch-pagination__link" href="#p4" aria-label="Page 4" aria-current="page">4</a></li><li><a class="ch-pagination__link" href="#p5" aria-label="Page 5">5</a></li><li><a class="ch-pagination__link" href="#p6" aria-label="Suivant">${ic('chevron-right')}</a></li></ul></nav>` },
  footer: { z: 50, html: `<footer class="ch-footer ch-footer--compact"><div class="ch-footer__inner"><p class="ch-footer__brand"><span class="ch-wordmark ch-wordmark--sm">Lune<span class="ch-wordmark__dot" aria-hidden="true"></span></span></p><p class="ch-footer__legal">© 2026 Studio Lune</p></div></footer>` },
  toc: { z: 80, html: `<nav class="ch-toc" aria-label="Sommaire"><p class="ch-toc__title">Sommaire</p><ol class="ch-toc__list"><li><a class="ch-toc__link" href="#i" aria-current="true">Installer</a></li><li><a class="ch-toc__link" href="#r">Régler</a></li><li><a class="ch-toc__link" href="#p">Publier</a></li></ol></nav>` },
  steps: { z: 70, html: `<ol class="ch-steps ch-steps--vertical"><li class="ch-steps__item is-done"><span class="ch-steps__marker" aria-hidden="true">${ic('check')}</span><span class="ch-steps__body"><span class="ch-steps__state">Terminée : </span><span class="ch-steps__label">Vaisseau</span></span></li><li class="ch-steps__item" aria-current="step"><span class="ch-steps__marker" aria-hidden="true"></span><span class="ch-steps__body"><span class="ch-steps__state">En cours : </span><span class="ch-steps__label">Route</span></span></li><li class="ch-steps__item is-todo"><span class="ch-steps__marker" aria-hidden="true"></span><span class="ch-steps__body"><span class="ch-steps__state">À venir : </span><span class="ch-steps__label">Départ</span></span></li></ol>` },

  // ---------- Contenu et médias ----------
  accordion: { z: 80, html: `<div class="ch-accordion"><details class="ch-accordion__item" open><summary class="ch-accordion__summary">Livraison ${ic('chevron-down').replace('ch-icon', 'ch-icon ch-accordion__icon')}</summary><div class="ch-accordion__panel"><p>Sous trois jours.</p></div></details><details class="ch-accordion__item"><summary class="ch-accordion__summary">Retours ${ic('chevron-down').replace('ch-icon', 'ch-icon ch-accordion__icon')}</summary></details></div>` },
  avatar: { html: `<div class="ch-avatar-group"><span class="ch-avatar ch-avatar--lg">AL</span><span class="ch-avatar ch-avatar--lg">MB</span><span class="ch-avatar ch-avatar--lg">+3</span></div>` },
  badge: { html: `<div class="ch-row"><span class="ch-badge ch-badge--solid">Nouveau</span><span class="ch-badge ch-badge--outline">Bêta</span><span class="ch-badge ch-badge--mute">Archivé</span></div>` },
  code: { z: 80, html: `<div class="ch-code"><pre class="ch-code__pre"><code>&lt;link rel="stylesheet"
  href="chopa/chopa.css"&gt;</code></pre></div>` },
  card: { z: 70, html: `<article class="ch-card"><div class="ch-card__top"><div><span class="ch-label">Série · 12 photos</span><h3 class="ch-card__title">Brumes</h3></div><span class="ch-badge ch-badge--solid">Nouveau</span></div><p class="ch-card__body">Douze vues du marais au lever du jour.</p></article>` },
  stats: { z: 70, html: `<dl class="ch-stats ch-stats--2"><div class="ch-stats__item"><dt class="ch-stats__label">Joueurs</dt><dd class="ch-stats__value">12 480</dd></div><div class="ch-stats__item"><dt class="ch-stats__label">Parties</dt><dd class="ch-stats__value">3 902</dd></div></dl>` },
  quote: { z: 80, html: `<figure class="ch-quote"><blockquote class="ch-quote__text"><p>On dessine la carte en marchant.</p></blockquote><figcaption class="ch-quote__source">Carnet d'Iris</figcaption></figure>` },
  faq: { z: 80, html: `<div class="ch-faq ch-accordion"><details class="ch-accordion__item" open><summary class="ch-accordion__summary">Le jeu est-il gratuit ? ${ic('chevron-down').replace('ch-icon', 'ch-icon ch-accordion__icon')}</summary><div class="ch-accordion__panel"><p>Oui, la démo l'est.</p></div></details></div>` },
  timeline: { z: 70, html: `<ol class="ch-timeline"><li class="ch-timeline__item"><span class="ch-timeline__time">v1.2</span><p class="ch-timeline__title">Mode nuit</p></li><li class="ch-timeline__item"><span class="ch-timeline__time">v1.1</span><p class="ch-timeline__title">Trois niveaux</p></li></ol>` },
  gallery: { html: `<div class="ch-gallery ch-gallery--3 im-galerie">${'<span class="ch-gallery__item"><span class="im-photo"></span></span>'.repeat(6)}</div>` },
  figure: { z: 80, html: `<figure class="ch-figure"><span class="ch-figure__media im-photo im-photo--16x9"></span><figcaption class="ch-figure__caption">Brume sur le marais, 6 h 42.</figcaption></figure>` },
  list: { z: 80, html: `<ul class="ch-list ch-list--rule"><li>Pain de campagne</li><li>Tarte aux pommes</li><li>Soupe d'automne</li></ul>` },
  score: { html: `<div class="ch-row"><span class="ch-score">92</span><span class="ch-score">78</span><span class="ch-score ch-score--cold">41</span></div>` },
  price: { z: 50, html: `<div class="ch-price ch-price--featured"><div class="ch-price__top"><p class="ch-price__name">Atelier</p><p class="ch-price__amount"><span class="ch-price__value">12</span><span class="ch-price__currency">€</span><span class="ch-price__period">/ mois</span></p></div><ul class="ch-price__list"><li>Dix projets</li><li>Thèmes</li></ul></div>` },
  chip: { html: `<div class="ch-row"><button class="ch-chip" type="button" aria-pressed="true">Photo</button><button class="ch-chip" type="button" aria-pressed="false">Vidéo</button><button class="ch-chip" type="button" aria-pressed="false">Son</button></div>` },
  divider: { html: `<div class="ch-stack ch-stack--s4 im-plein"><p class="ch-t-small">Chapitre un</p><div class="ch-divider ch-divider--label" role="separator"><span class="ch-divider__label">ou</span></div><p class="ch-t-small">Chapitre deux</p></div>` },
  table: { z: 60, html: `<table class="ch-table"><thead><tr><th scope="col">Joueur</th><th scope="col" class="ch-table__num">Score</th></tr></thead><tbody><tr><td>Iris</td><td class="ch-table__num">9 820</td></tr><tr><td>Malo</td><td class="ch-table__num">8 410</td></tr><tr><td>Nour</td><td class="ch-table__num">7 990</td></tr></tbody></table>` },
  kbd: { html: `<p class="ch-t-small"><span class="ch-kbd__combo"><kbd class="ch-kbd">Ctrl</kbd><span class="ch-kbd__plus">+</span><kbd class="ch-kbd">K</kbd></span></p><p class="ch-t-small">ouvre la recherche</p>` },

  // ---------- Retours et fenêtres ----------
  alert: { z: 70, html: `<div class="ch-alert ch-alert--info">${ic('info').replace('ch-icon', 'ch-icon ch-alert__icon')}<b class="ch-alert__kind">Info</b> · la mise à jour arrive jeudi.</div>` },
  popover: { z: 70, html: `<div class="ch-popover im-statique"><div class="ch-popover__head"><p class="ch-popover__title">Réglages</p></div><div class="ch-popover__body"><p class="ch-t-small">35 mm, f/5,6, 400 ISO.</p></div></div>` },
  modal: { z: 50, html: `<div class="ch-modal im-statique"><div class="ch-modal__head"><p class="ch-modal__title">Quitter la partie ?</p></div><div class="ch-modal__body"><p class="ch-t-small">La progression est sauvegardée.</p></div><div class="ch-modal__foot"><button class="ch-btn ch-btn--primary" type="button">Quitter</button></div></div>` },
  spinner: { html: `<div class="ch-row"><span class="ch-spinner ch-spinner--sm"></span><span class="ch-spinner"></span><span class="ch-spinner ch-spinner--lg"></span></div>` },
  tooltip: { html: `<span class="ch-tooltip im-tooltip-vu"><button class="ch-btn ch-btn--icon ch-btn--ghost" type="button" aria-label="Aide">${ic('info')}</button><span class="ch-tooltip__bubble">Four à 240 °C</span></span>` },
  toast: { z: 70, html: `<div class="ch-toast ch-toast--info"><p class="ch-toast__body"><b class="ch-toast__kind">Info</b> <span class="ch-toast__text">Partie sauvegardée.</span></p></div>` },
  notfound: { z: 60, html: `<div class="ch-notfound"><p class="ch-notfound__code">404</p><p class="ch-notfound__title">Page perdue en mer</p></div>` },
  progress: { html: `<label class="ch-field im-plein"><span class="ch-label">Téléchargement · 64 %</span><progress class="ch-progress" max="100" value="64">64 %</progress></label>` },
  skeleton: { html: `<div class="ch-stack ch-stack--s2 im-plein"><span class="ch-skeleton ch-skeleton--title"></span><span class="ch-skeleton ch-skeleton--line"></span><span class="ch-skeleton ch-skeleton--line"></span></div>` },
  drawer: { z: 50, html: `<div class="ch-drawer im-statique"><div class="ch-drawer__head"><p class="ch-drawer__title">Panier</p></div><div class="ch-drawer__body"><p class="ch-t-small">Deux carnets, 24 €.</p></div></div>` },
  empty: { z: 60, html: `<div class="ch-empty"><p class="ch-empty__title">Liste vide</p><p class="ch-empty__text">Ajoute un morceau.</p></div>` },
};

// Groupes ajoutés au mur (pages de la doc qui ne sont pas des fiches de pièce).
export const extras = [
  { famille: 'Gabarits', pieces: [
    { slug: 'gabarit-portfolio', titre: 'Portfolio', but: 'Page d\'accueil d\'un photographe fictif.', html: `<div class="im-page"><span class="ch-wordmark ch-wordmark--sm">Iris<span class="ch-wordmark__dot" aria-hidden="true"></span></span><p class="ch-t-h3">Brumes et lumières</p><div class="ch-grid ch-grid--3 im-cases">${'<span class="im-photo"></span>'.repeat(3)}</div></div>` },
    { slug: 'gabarit-jeu', titre: 'Jeu vidéo', but: 'Page d\'un jeu de plateforme fictif.', html: `<div class="im-page"><span class="ch-label">Quête d'Aube</span><p class="ch-t-h3">Rallume les douze tours</p><button class="ch-btn ch-btn--primary" type="button">Jouer</button></div>` },
    { slug: 'gabarit-appli', titre: 'Appli', but: 'Tableau de bord d\'une appli fictive.', html: `<div class="im-page"><span class="ch-label">Tableau de bord</span><div class="ch-row"><span class="ch-score">12</span><span class="ch-score ch-score--cold">4</span></div><span class="ch-skeleton ch-skeleton--line"></span></div>` },
    { slug: 'gabarit-blog', titre: 'Blog', but: 'Article d\'un blog de cuisine fictif.', html: `<div class="im-page"><span class="ch-label">Recette · 12 min</span><p class="ch-t-h3">Pain de campagne</p><p class="ch-t-small">Farine, eau, sel et patience.</p></div>` },
    { slug: 'gabarit-doc', titre: 'Doc', but: 'Page de documentation fictive.', html: `<div class="im-page"><span class="ch-label">Guide · 02</span><p class="ch-t-h3">Installer</p><div class="ch-code"><pre class="ch-code__pre"><code>npm i lune</code></pre></div></div>` },
    { slug: 'gabarit-boutique', titre: 'Boutique', but: 'Fiche produit d\'une boutique fictive.', html: `<div class="im-page"><span class="im-photo im-photo--16x9"></span><p class="ch-t-h3">Carnet A5 · 12 €</p><button class="ch-btn ch-btn--secondary" type="button">Ajouter</button></div>` },
  ] },
  { famille: 'Marque et icônes', pieces: [
    { slug: 'marque', titre: 'Marque', but: 'Le logo CHOPA et son point carré orange.', html: `<span class="ch-wordmark ch-wordmark--xl im-marque-tuile">C<span class="ch-wordmark__dot" aria-hidden="true"></span></span>` },
    { slug: 'icones', titre: 'Icônes', but: 'Les 15 glyphes Carbon du sprite.', html: `<div class="im-icones">${['arrow', 'check', 'close', 'search', 'plus', 'minus', 'menu', 'info', 'alert', 'copy', 'sort', 'chevron-right'].map(ic).join('')}</div>` },
    { slug: 'grain', titre: 'Grain', but: 'Le grain en option, désactivé par défaut.', html: `<div class="im-grain-tuile"><span class="ch-label">ch-grain · option</span></div>` },
  ] },
];
