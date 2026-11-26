# Architecture : Chopa Design (v2.1, bibliothèque complète, corrigée après l'audit 2)

Statut : version 2.1 · 2026-11-15. Remplace la v2. Références : `FICHE.md` (v2), `JOURNAL.md` (J0 vérifié), `maquette/index.html` (planche : référence visuelle, à reproduire), `ARCHITECTURE_AUDIT_2.md`, `CLAUDE.md` (décisions du 2026-11-15).
Versions : `npm view`, 2026-11-15. « non vérifié » = ni mesuré ni sourcé.

## 1. La décision en tête

**Un `chopa.css` concaténé par un script node depuis un fichier par composant ; des jetons à deux niveaux dont 6 réglages re-thèment un site ; un `chopa.js` facultatif (10 Ko gzip au plus, sans dépendance ni minifieur), activé par `data-ch-*`, sur du HTML natif ; un site Astro qui lit ces mêmes fichiers ; un banc de test construit tôt, étendu par des fichiers ajoutés, jamais par des fichiers partagés modifiés.**

Trois raisons :
1. **Une source par donnée, à 60 pièces.** Exemples, fiches, contrôles, parités et scénarios clavier sont des fichiers par pièce, découverts par glob (CSS, JS, icônes, nav, recherche, contrôles de structure) : on ajoute des fichiers, on n'en modifie pas de partagés. C'est ce qui rend sûres les paires parallèles (section 11).
2. **Zéro outil lourd.** Ni bundler, ni PostCSS, ni framework : concaténation, CSS moderne lu tel quel (section 6), JS ES2020 sans module. Intégration par un `<link>` et, au besoin, un `<script defer>`.
3. **Le natif d'abord.** `<dialog>`, `<details name>`, `popover`, `progress`, `input range` portent accessibilité et clavier ; `chopa.js` ne comble que le manque. Sans JavaScript, le contenu reste lisible.

**Prix à payer :**
- 60 pièces à écrire, avec 8 points de contrôle de l'utilisateur (un par famille, section 10), donc un défaut visuel peut être trouvé jusqu'à un lot plus tard ; entre deux points, Diapason vérifie chaque sous-jalon (build, tests, navigateur).
- Préfixe `ch-` partout et une étape de build avant de voir un changement dans un site qui copie.
- La majorité des pièces n'a pas de référence dans la planche : test de palette et validation à l'œil.
- Le banc dépend d'un navigateur (Chromium et WebKit du cache ; Firefox non testé) et de 2 dépendances de développement (J2a). Avant J2a, aucun contrôle ne tourne dans un navigateur : Diapason regarde à la main.
- `chopa.js` est un fichier de plus, avec un budget serré.

**Options écartées** : bundler ou PostCSS (poids, un outil de plus) ; Tailwind ou utilitaires seuls (pas de composants nommés à copier) ; composants Web ou Astro comme livrable (les sites copient du CSS) ; Pagefind (dépendance, recherche locale suffit) ; `@layer chopa` (voir point ouvert 4) ; positionnement par ancre (section 6) ; visionneuse d'images (lightbox) ; intégration Git de Cloudflare (section 13) ; thème automatique `prefers-color-scheme`, paquet npm privé, Figma, Artifact (hors v2).

## 2. Structure du dépôt et construction

```
chopa-design/
├─ package.json     build, dev, test (statique), test:browser, check (les deux) : touché par J2a-1 et la Livraison
├─ astro.config.mjs root, srcDir, publicDir, outDir : 4 chemins absolus ; racine de sortie lue dans CH_OUT (défaut : le dépôt)
├─ src/css/         00-fonts · 10-tokens · 20-themes · 30-base · 40-components/<slug>.css · 50-layout · 55-prose · 60-utilities · 70-effects
├─ src/extras/      fichiers facultatifs copiés tels quels (chopa-reset.css)
├─ src/js/          chopa-theme.js (séparé, <head>) · chopa/00-core.js, chopa/<module>.js · chopa-effects.js
├─ src/lib/         color.mjs (WCAG, OKLCH, texte accent, force de teinte) · css-tokens.mjs (lecture de chopa.css)
├─ src/icons/       <jeu>/<nom>.svg (15 glyphes à J2b ; jeu choisi à J8a) → sprite
├─ dist-lib/        SORTIE copiable, versionnée : chopa.css, chopa.js, chopa-theme.js, chopa-effects.js, chopa-icons.svg,
│                   chopa-reset.css (option), fonts/ (6 woff2 + 2 licences)
├─ scripts/         run.mjs · check-dist.mjs · checks/*.mjs (contrôles de structure) · static/*.mjs · browser/*.mjs · lib/
├─ tests/           parity/<slug>.json · keyboard/<slug>.json · fixtures/ · host.html · denylist.txt
├─ site/src/        pages/ · components/ · data/<slug>.mjs · examples/<slug>/*.html · templates/<genre>/*.html · doc.css (préfixe .doc-)
├─ site/public/chopa/  copie de dist-lib/ (build, non versionnée) ; sortie : site/dist/
└─ maquette/ · docs/
```

- **Build** (`scripts/build-css.mjs`) : à J0 lecture à plat de `src/css/` et de `src/js/*.js`. **J1a-1 le rend entièrement piloté par glob**, et plus personne d'autre ne le modifie : CSS (`src/css/**`, ordre : répertoires puis noms alphabétiques), JS (`src/js/chopa/*.js` concaténés en `chopa.js` s'il en existe ; `src/js/*.js` copiés), `src/extras/*`, sprite de `src/icons/**/*.svg` (ignoré s'il n'y en a pas), polices et licences, puis `dist-lib/` vers `site/public/chopa/`. **Règle d'ordre** : une variante vit dans le fichier de son composant (`ch-btn--icon` dans `btn.css`) ; `check-tokens` échoue si `.ch-x--y` apparaît hors de `x.css`. `CH_OUT` (variable d'environnement) redirige `dist-lib/`, `site/public/chopa/` et `site/dist/` : sert aux paires parallèles (section 11). `npm run dev` = `--watch` + `astro dev` en fils (J0). `chopa.css` à J0 : 5 643 octets, 1 933 gzip.
- **Exécuteur de tests** : `scripts/run.mjs static|browser` lance `check-dist.mjs` puis chaque fichier de `scripts/static/` (ou `scripts/browser/`) ; `npm test` = `run.mjs static`, `npm run test:browser` = `run.mjs browser`. Créé à J1a-1 ; les scripts suivants ajoutent un fichier. `check-dist` est lui-même un exécuteur : il charge **chaque `scripts/checks/*.mjs`** (export par défaut `ctx => [{ nom, ok, detail }]`, `ctx` = CSS, JS, dist, exemples, fiches). Les contrôles de J0 y sont déplacés à J1b-1 (`00-core.mjs`, mêmes 22 contrôles). Une pièce avec règle propre ajoute `scripts/checks/<slug>.mjs`.
- **Astro** (J0) : `outDir`, `srcDir` et `publicDir` se résolvent depuis le dossier courant ; 4 chemins absolus (`new URL(…, import.meta.url)`).
- **Nommage** : préfixe `ch-` (0 occurrence dans `portfolio-nb/src`, mesuré en v1, non remesuré). Variantes `ch-x--y`, parties `ch-x__z`, états par attribut ARIA, sinon `is-…`. Pas de style en ligne.
- **Remise à zéro (D4, modifie J0)** : `:where([class^="ch-"], [class*=" ch-"], [class*="\9 ch-"], [class*="\A ch-"])` (espace, tabulation, saut de ligne) vise **l'élément portant la classe, pas ses descendants** : `box-sizing`, `margin`, `padding` à 0 et `font: inherit` sur `button, input, select, textarea`. Un descendant sans classe `ch-` est à l'hôte. Exception : les conteneurs de contenu explicites (`ch-prose`) stylent eux-mêmes leurs enfants. La remise à zéro est à spécificité nulle : **chaque composant déclare lui-même `margin`, `padding` et `box-sizing` sur ses éléments et parties**, pour ne pas dépendre des règles `p`, `ul`, `h2` de l'hôte (spécificité de classe > spécificité d'élément). Test : `tests/host.html` (section 9). `chopa-reset.css` (global, option) est créé à J2a-2.
- **Thèmes (D3, modifie J0)** : attribut **`data-ch-theme`** (évite les collisions avec `data-theme` des sites hôtes) : `:root, [data-ch-theme="sombre"]`, `[data-ch-theme="clair"]`, `[data-ch-theme="chaud"]` ; le fond et la couleur ne sont posés que par ces trois sélecteurs explicites (le `[data-theme] {…}` de J0 était trop large : un hôte en `data-theme="light"` aurait reçu le sombre) ; clé `localStorage` `ch-theme` inchangée.
- **Coins** : `--ch-radius: 0`. **Seule exception : le bouton radio** (`border-radius: 50%` sur le contrôle et son point). Avatar, indicateur de chargement et point du logo sont carrés. `check-radius` : source `0` ou `var(--ch-radius)` ; liste d'exceptions = le sélecteur du radio, rien d'autre.
- **Zones de clic 44 px** : puces de 32 px visibles, zone invisible en `::before` (hauteur, 6 px de chaque côté) ; idem liens de navigation et `ch-btn--ghost`. Exception : liens dans une phrase. Mesure : `getComputedStyle(el, '::before')` et `elementFromPoint`.

**Migration du J0 (J1a-1)** : renommer `data-theme` en `data-ch-theme` dans `20-themes.css`, `chopa-theme.js`, `ThemeSwitch.astro`, `DocLayout.astro` (`<html lang="fr" data-ch-theme="sombre">`), `Example.astro` (cadre local), `check-dist.mjs` (3 sélecteurs) ; restreindre la règle de fond ; remplacer la remise à zéro `:where(…) :where(*)` par la version ci-dessus ; passer `build-css` en glob. Tout le reste du J0 est conservé tel que vérifié (clé `ch-theme`, chemins Astro, polices, licences, `Example`). Critère : `check-dist` toujours à 22 contrôles verts, plus un contrôle « 0 occurrence de `data-theme` » dans `src/` et `site/src/`.

## 3. Jetons à deux niveaux

**Niveau 1, primitives** (`--ch-p-*`, dans `:root`, jamais lues par un composant) : `ink-950 #050505`, `paper-100 #f4f4f1`, greys `#0d0d0d #111111 #262626 #8c8c88 #d6d6d2 #ebebe7 #fbfbf9 #2b2b29 #5c5c58`, famille chaude (`#0b0807 #130f0d #19130f #f3ebe3 #d9cec4 #a1938a #2a211c`), `orange-500 #ff5a1f`, `orange-ink #c23300`.
**Niveau 2, rôles** (posés par thème, seuls autorisés dans `40-components/`) :

| Groupe | Rôles |
|---|---|
| Surfaces | `--ch-bg`, `--ch-bg2`, `--ch-card`, `--ch-line` |
| Texte | `--ch-fg`, `--ch-soft`, `--ch-mute` |
| Accent | `--ch-acc` (fonds), `--ch-acc-text` (texte, liens), `--ch-on-acc` (texte sur `acc`), `--ch-dim-pct` (force de teinte), `--ch-acc-dim` (fond teinté), `--ch-focus` |
| Police | `--ch-sans`, `--ch-display`, `--ch-mono`, `--ch-display-weight`, `--ch-display-track` |
| Mesure | `--ch-s1`…`--ch-s9`, `--ch-hit` (44px), `--ch-measure` (65ch), `--ch-wrap-max` (1240px) |
| Forme et mouvement | `--ch-radius`, `--ch-t-fast`, `--ch-t-panel`, `--ch-z-bar` (80), `--ch-z-overlay` (100) |

Noms J0 conservés. `check-tokens` (J1a-1) échoue si un composant lit un jeton hors liste ou contient un hex.

**Dérivés (CSS)** : `--ch-acc-dim: color-mix(in srgb, var(--ch-acc) var(--ch-dim-pct), transparent)` ; `--ch-dim-pct` est posé par thème (défaut 13,3 % sombre et chaud, 12,2 % clair : équivalents des `#ff5a1f22` et `#ff5a1f1f` de la planche) ; fond de barre = `color-mix(in srgb, var(--ch-bg) 88%, transparent)` ; voile de modale idem à 72 % ; `--ch-focus: var(--ch-acc-text)`. **`--ch-acc-text` n'est jamais un simple `var(--ch-acc)` par défaut** : pour un accent bleu `#2563eb`, `acc` brut fait 3,65 sur `card` en sombre ; la valeur est toujours calculée par thème.
**Non calculable en CSS** : `acc-text`, `on-acc` et `dim-pct` demandent de résoudre un seuil de contraste (`contrast-color()` : non vérifié). `src/lib/color.mjs` les calcule ; il sert au banc et à la page « créer ton thème » (test croisé).
**Algorithme de `acc-text`** (bidirectionnel) : en OKLCH, garder teinte et chroma, déplacer la clarté par pas fins **vers le clair** dans les thèmes sombre et chaud, **vers le foncé** dans le thème clair, jusqu'à ≥ 4,6 sur le pire de `bg`, `bg2`, `card` ; si la clarté atteint le blanc ou le noir sans y parvenir : accent refusé, avec la paire en cause. `on-acc` : noir `#050505` ou blanc cassé `#f4f4f1`, le meilleur ; refusé sous 4,5. **`dim-pct`** : part de la valeur par défaut, abaissée par pas de 0,5 point (plancher 6 %) jusqu'à ce que toutes les paires autorisées sur `acc-dim` atteignent 4,5 ; sinon la paire en cause est affichée avec la raison.
Repères mesurés (audit 2) : accent bleu `#2563eb` → `acc-text` `#4479ee` (sombre), `#245fe2` (clair), `#467aee` (chaud), `on-acc` blanc cassé 4,69 (marge mince) ; accent jaune `#ffd400` → `acc-text` = `acc` en sombre et chaud, `#7a6600` en clair, `on-acc` noir 14,24, et `mute` sur `acc-dim` sur `card` en sombre = 4,20 : **la correction de `dim-pct` est le cas d'essai** (à 10 %, 4,60).

**Re-thémer un site : 6 réglages** : (1) `--ch-acc` ; (2) `--ch-acc-text`, par thème, calculé ; (3) `--ch-on-acc`, calculé ; (4) `--ch-dim-pct`, par thème, calculé ; (5) polices `--ch-sans`, `--ch-display`, `--ch-mono` (le site charge ses `@font-face`) ; (6) `--ch-radius`. `--ch-focus` et `--ch-acc-dim` suivent seuls. Les surfaces restent celles des 3 thèmes.

**Page « créer ton thème »** (J1c) : accent (hex), polices, arrondi ; aperçu en direct sur 6 composants ; paires autorisées recalculées sur les 3 thèmes ; sortie : un bloc `:root` et un bloc par thème, bouton copier. Elle ajuste `acc-text`, `on-acc` et `dim-pct` jusqu'à ce que toutes les paires autorisées atteignent 4,5 : 1, ou montre quelle paire échoue et pourquoi. La palette stricte ne vaut que pour les 3 thèmes Chopa ; un arrondi > 0 s'affiche comme écart assumé.

## 4. Inventaire des composants

P = présent dans la planche (parité automatique) ; N = nouveau (palette + validation à l'œil au point de contrôle de sa famille). JS : « natif » = navigateur ; `module` = module de `chopa.js`. Toute pièce : 3 thèmes, focus visible, cible ≥ 44 px, mouvement réduit respecté. Compte : 60 pièces, accepté par l'utilisateur (la fiche dit « au moins 45 » ; hors 6 fondations, 54).

| # | Pièce | Classes | Natif | Variantes · états | Motif a11y | JS | Réf | Jalon |
|---|---|---|---|---|---|---|---|---|
| | **Fondations** | | | | | | | |
| 1 | Texte | `ch-t-giant/-h2/-h3/-body/-small/-mono`, `ch-label` | h1–h6, p | échelle fluide `clamp()` | hiérarchie des titres | aucun | P | J1b-2 |
| 2 | Conteneur | `ch-wrap` | div | `--narrow`, `--wide` | — | aucun | P | J1b-2 |
| 3 | Pile | `ch-stack` | div | `--s2`…`--s7` | — | aucun | N | J1b-2 |
| 4 | Grille | `ch-grid` | div | `--2/3/4`, 1 colonne < 800 px | — | aucun | P | J1b-2 |
| 5 | Rangée | `ch-row` | div | `--between`, `--nowrap` | — | aucun | P | J1b-2 |
| 6 | Prose | `ch-prose` | article | titres, listes, citation, code, tableau, figure, liens | sémantique native | aucun | N | J1b-2 |
| | **Base et formulaires** | | | | | | | |
| 7 | Bouton | `ch-btn` | button, a | `--primary/--secondary/--ghost` · hover, focus, disabled | Button | aucun | P | J2b |
| 8 | Groupe de boutons | `ch-btn-group` | div | `--attached` | group + `aria-label` | aucun | N | J2b |
| 9 | Bouton icône | `ch-btn--icon` | button | 3 variantes · `aria-label` obligatoire | Button | aucun | N | J2b |
| 10 | Champ texte | `ch-field`, `ch-input` | input | hover, focus, erreur, disabled, readonly | label natif | aucun | P | J2b |
| 11 | Zone de texte | `ch-textarea` | textarea | idem | label natif | aucun | N | J2b |
| 12 | Liste déroulante | `ch-select` | select | idem | natif | aucun | P | J2b |
| 13 | Recherche | `ch-search` | input type=search | avec bouton | rôle `search` | aucun | N | J2b |
| 14 | Envoi de fichier | `ch-file` | input type=file | disabled, erreur | natif | aucun | N | J2b |
| 15 | Champ préfixe, suffixe | `ch-input-group` | div | `--prefix`, `--suffix` | label lié | aucun | N | J2b |
| 16 | Case à cocher | `ch-check` | input checkbox | coché, indéterminé | natif | aucun | P | J2c |
| 17 | Radio (seul cercle) | `ch-radio` | input radio | coché | natif + fieldset | aucun | N | J2c |
| 18 | Interrupteur | `ch-switch` | input checkbox | on, off | Switch | aucun | N | J2c |
| 19 | Curseur | `ch-range` | input range | valeur affichée | Slider (natif) | module `range` (J3a) | N | J2c |
| 20 | Libellé, aide, erreur | `ch-field__label/__help/__error` | label, p | `is-error` | `aria-describedby`, `aria-invalid` | aucun | P | J2c |
| 21 | Groupe de champs | `ch-fieldset` | fieldset | — | légende native | aucun | N | J2c |
| | **Navigation** | | | | | | | |
| 22 | En-tête, menu téléphone | `ch-header`, `ch-nav` | header, nav | `aria-current` ; menu ouvert/fermé | Disclosure Navigation | module `menu` | P (nav) / N | J3a |
| 23 | Onglets | `ch-tabs` | div | actif, disabled | Tabs | module `tabs` | N | J3a |
| 24 | Menu déroulant | `ch-dropdown` | button + `popover` | ouvert | Menu Button (actions) ; Disclosure (si navigation) | popover + module `dropdown` | N | J3a |
| 25 | Fil d'Ariane | `ch-breadcrumb` | nav > ol | courant | Breadcrumb | aucun | N | J3b |
| 26 | Pagination | `ch-pagination` | nav > ul | courant, disabled | nav + `aria-label` | aucun | N | J3b |
| 27 | Étapes | `ch-steps` | ol | fait, courant, à faire | `aria-current="step"` | aucun | N | J3b |
| 28 | Sommaire | `ch-toc` | nav > ol | section active | nav + `aria-current` | module `toc` (facultatif) | N | J3a |
| 29 | Barre latérale | `ch-sidebar` | aside > nav | repliable sur téléphone | landmark ; Disclosure | natif (`details`, `::details-content` si disponible ; repli : toujours ouverte) | N | J3b |
| 30 | Pied de page | `ch-footer` | footer | colonnes | contentinfo | aucun | N | J3b |
| 31 | Lien d'évitement | `ch-skip` | a | visible au focus | lien natif | aucun | N | J3b |
| | **Contenu et médias** | | | | | | | |
| 32 | Carte | `ch-card` | article | `--media`, `--link`, `--horizontal` · hover | lien unique étendu | aucun | P | J4a |
| 33 | Liste | `ch-list` | ul, ol, dl | `--rule`, `--media` | liste native | aucun | N | J4a |
| 34 | Tableau triable | `ch-table` | table | `--sortable`, `th.num` | Sortable Table | module `sort` | P (tableau) / N | J4a |
| 35 | Badge | `ch-badge` | span | `--solid`, `--outline`, `--mute` | sens porté par le texte | aucun | N | J4a |
| 36 | Puce | `ch-chip` | button, a | `aria-pressed` | bouton à bascule | aucun | P | J4a |
| 37 | Avatar (carré) | `ch-avatar` | img, span | tailles, groupe | `alt` | aucun | N | J4a |
| 38 | Citation | `ch-quote` | figure > blockquote | avec source | natif | aucun | N | J4a |
| 39 | Bloc de code | `ch-code` | pre > code | bouton copier | natif + bouton | module `copy` | N | J4a |
| 40 | Touche clavier | `ch-kbd` | kbd | — | natif | aucun | N | J4a |
| 41 | Image, vidéo légendée | `ch-figure` | figure | ratios 16:9, 4:3, 1:1 | `alt`, `figcaption`, `controls` | aucun | N | J4b |
| 42 | Galerie | `ch-gallery` | ul | `--2/3/4` | liste d'images, sans lightbox | aucun | N | J4b |
| 43 | Accordéon | `ch-accordion` | `details name` | ouvert, exclusif | Accordion (natif) | aucun (pas de module) | N | J4b |
| 44 | Frise | `ch-timeline` | ol | — | liste ordonnée | aucun | N | J4b |
| 45 | Chiffres clés | `ch-stats` | dl | 2 à 4 colonnes | liste de définitions | aucun | P (gabarit mini) | J4b |
| 46 | Prix | `ch-price` | article | `--featured` | natif | aucun | N | J4b |
| 47 | FAQ | `ch-faq` | accordéon | — | Accordion | natif | N | J4b |
| 48 | Séparateur | `ch-divider` | hr | `--label` | `separator` | aucun | N | J4b |
| 49 | Pastille de score | `ch-score` | span | `--cold` | texte | aucun | P | J4b |
| | **Retours et fenêtres** | | | | | | | |
| 50 | Fenêtre modale | `ch-modal` | dialog | tailles | Dialog (Modal), `aria-labelledby` | natif + module `dialog` | N | J5a |
| 51 | Tiroir | `ch-drawer` | dialog | `--left`, `--right` | Dialog (Modal) | module `dialog` | N | J5a |
| 52 | Infobulle | `ch-tooltip` | span `role=tooltip` | haut, bas | Tooltip | module `tooltip` | N | J5a |
| 53 | Bulle d'info | `ch-popover` | `[popover]` | ouverte | popover natif | natif | N | J5a |
| 54 | Notification | `ch-toast` | région `aria-live` | fermable, délai | `status` / `alert` | module `toast` | N | J5b |
| 55 | Alerte | `ch-alert` | div | `--info`, `--warn`, `--error` (icône + texte) | `status` / `alert` | aucun | P (note) | J5b |
| 56 | Progression | `ch-progress` | progress | indéterminée | natif | aucun | N | J5b |
| 57 | Squelette | `ch-skeleton` | div `aria-hidden` | — | `aria-busy` sur le parent | aucun | N | J5b |
| 58 | Indicateur (carré) | `ch-spinner` | span `role=status` | tailles | `status` | aucun | N | J5b |
| 59 | État vide | `ch-empty` | div | avec action | titres natifs | aucun | N | J5b |
| 60 | Page 404 | `ch-notfound` | main | — | landmark | aucun | N | J5b |

Marque, icônes, effets (J8) et gabarits (J6, J7) sont hors tableau.
**Glyphes (15, J2b), noms stables `icon-<nom>`** : `chevron-up/-down/-left/-right` (en-tête, onglets, pagination, sélecteur, accordéon), `close` (modale, tiroir, notification, puce), `check` (case, étapes), `arrow` (liens, boutons), `search` (recherche), `sort` (tableau), `plus`, `minus` (champs, curseur), `info` (alerte info), `alert` (alertes `--warn` et `--error`), `menu` (menu téléphone), `copy` (bloc de code). Les exemples et gabarits n'embarquent aucun tracé : ils référencent le sprite par nom, de sorte que J8a ne remplace que les fichiers de `src/icons/`.

## 5. `chopa.js`

- **Un fichier** `dist-lib/chopa.js`, ES2020, IIFE, sans dépendance ; `<script src=".../chopa.js" defer>` dans `<head>`. Sources : `src/js/chopa/00-core.js` + un fichier par module, concaténés par glob (alphabétique) par `build-css.mjs` (déjà prêt dès J1a-1). **Pas de minifieur** (aucune dépendance nouvelle).
- **Auto-init** au `DOMContentLoaded` sur les attributs ci-dessous. API : `window.chopa = { version, init(racine), toast(texte, options) }` ; `init` est idempotent et relance les modules sur du HTML ajouté. Chaque module est enveloppé : une erreur pose `data-ch-failed` sur l'élément concerné, et `.ch-js [data-ch-failed]` rend tout son contenu visible (jamais un panneau caché pour toujours).

| Module | Attribut | Rôle | Sans JS |
|---|---|---|---|
| `core` | — | `init`, région `aria-live` persistante créée avant toute notification, garde d'erreur | — |
| `tabs` | `data-ch-tabs` | flèches, Début, Fin, tabindex itinérant, `aria-controls`/`aria-labelledby` ; **activation automatique** (choisie) ; panneau focalisable s'il n'a aucun élément focalisable | tous les panneaux en liste |
| `menu` | `data-ch-menu` | menu de l'en-tête (Disclosure Navigation, pas `role=menu`) ; `Escape` + retour du focus | liens affichés en liste |
| `dropdown` | `data-ch-dropdown` | actions : `role=menu`/`menuitem`, flèches, Début/Fin, `Escape` ; navigation : motif Disclosure ; repli sans `popover` par `hidden` | contenu masqué par le popover natif |
| `dialog` | `data-ch-dialog-open="#id"`, `-close` | ouvreurs, retour du focus, clic sur le fond, verrou de défilement | déclencheur masqué (`data-ch-needs-js`) |
| `toast` | `data-ch-toast` | notifications dans la région persistante ; `role=status`/`alert` ; **pause au survol et au focus**, fermable (WCAG 2.2.1) | non applicable |
| `tooltip` | `data-ch-tooltip` | `role=tooltip` + `aria-describedby` ; `Escape`, **survolable et persistante** (WCAG 1.4.13) ; ne porte jamais d'information indispensable (pas de survol sur téléphone) | texte du `title` ou masqué |
| `sort` | `data-ch-sort` | un `<button>` dans chaque `<th>` triable, `aria-sort` sur le seul en-tête trié, ordre numérique | tableau non trié |
| `toc` | `data-ch-toc` | section active selon le défilement | liste d'ancres |
| `copy` | `data-ch-copy` | copie le texte exact du bloc | bouton masqué |
| `range` | `data-ch-range` | affiche la valeur courante (`output`) | curseur natif sans valeur affichée |

- **Budget : 10 Ko gzip au plus pour `chopa.js`** (D7), mesuré à chaque jalon par `size.mjs` (J1a-1), qui échoue au-delà du total et avertit si un module dépasse 120 % de son budget. Budgets par module (gzip, estimés, non mesurés) : `core` 1,0 ; `tabs` 1,0 ; `menu` + `dropdown` 1,8 ; `dialog` 1,2 ; `toast` 1,1 ; `tooltip` 0,8 ; `sort` 1,1 ; `toc` 0,7 ; `copy` 0,4 ; `range` 0,3 = **9,4 Ko**, marge 0,6. Étalonnage de l'audit 2 : un module `tabs` complet, non minifié, fait 756 o gzip ; `chopa-theme.js` 598 o.
- **`ch-js`** : posée par `chopa-theme.js` (dans `<head>`, sans `defer`) **uniquement si** un `script[src*="chopa.js"]` est déjà présent ; règle à J3a. Seules les règles `.ch-js …` masquent les panneaux inactifs. Le `<script>` de `chopa.js` porte `onerror="document.documentElement.classList.remove('ch-js')"` (échec de chargement). Ainsi pas de saut de mise en page au chargement. Popover, `details`, `progress`, `range` marchent sans JS.
- **Thème** : `chopa-theme.js` reste séparé, dans `<head>` sans `defer`. `chopa-effects.js` (J8b, ≤ 3 Ko gzip, facultatif).

## 6. Support navigateurs

Consulté le 2026-11-15 (MDN, audit 2 compris). Les pages donnent le statut et la date, pas les versions (« non vérifié »).

| Fonction | Statut Baseline | Source | Usage et repli |
|---|---|---|---|
| `<dialog>` | Widely available, mars 2022 | MDN | modale, tiroir ; `closedby`, `requestClose()` : non vérifiés, non utilisés |
| `popover` | Newly available, janvier 2025 | MDN | bulle, menu ; repli `hidden` (section 5) |
| `:has()` | Widely available, décembre 2023 | MDN | jamais indispensable |
| `color-mix()` | Widely available, mai 2023 | MDN | repli : couleur unie précédente |
| `@starting-style` | Newly available, août 2024 | MDN | entrée des modales, popovers, notifications ; sortie animée (`allow-discrete`) non vérifiée |
| `<details name>` | Newly available, 3 septembre 2024 (audit 2 : web-features ; MDN décrit l'attribut sans statut séparé) | MDN | accordéon exclusif ; **repli** : sans support l'accordéon fonctionne, seule l'exclusivité est perdue |
| `::details-content` | Newly available, septembre 2025 (MDN, statut seul) | MDN | barre latérale (pièce 29) ; repli : toujours ouverte |
| Positionnement par ancre | Newly available, janvier 2026 | web.dev (janv. 2026) | **non utilisé** : infobulle et menu en `position: relative` |

## 7. Bloc de code de la doc

**Constat (J0)** : Shiki `github-dark`, fond `#24292e`, toujours sombre. **Décision** : thème Shiki `css-variables` (Shiki 4.6.0 installé ; Astro gère `theme="css-variables"` : source lue par l'audit 2, **non exécuté**, test à J1b-1). Préfixe de variables `--astro-code-`, fixées par `doc.css` pour chaque thème depuis les rôles.
- **Surface** : `--ch-card` dans les 3 thèmes (`acc-text` y fait 5,38 en clair, 4,66 sur `bg2`).
- **Coloration** : seulement des couleurs, **sans gras ni italique** (D6 : le thème `css-variables` n'en pose pas ; documenté sur la page « code ») ; 4 niveaux : mot-clé `acc-text` ; chaîne, nombre, paramètre `soft` ; fonction, balise (`string-expression`), attribut, texte `fg` ; commentaire, ponctuation `mute`. Ajoutées à la matrice : `link`, `inserted`, `deleted`, `changed`, `parameter`, `background` (toutes sur `card`).
- **Contraste** : chaque variable est ajoutée aux paires autorisées (texte × `card`, 3 thèmes, ≥ 4,5). Calculé : `mute` sur `card` 6,48 / 5,59 / 6,18 (clair, sombre, chaud) ; `acc-text` 5,38 / 6,06 / 5,90.
- **Repli** (conservé) si `<Code theme="css-variables">` échoue : `<pre><code>` échappé monochrome en `--ch-fg`.

## 8. Site de doc

- **Une fiche par composant** : `site/src/data/<slug>.mjs` exporte `{ titre, famille, jalon, ref: "P"|"N", but, quand, variantes: [{ titre, exemple }], etats, a11y: [], js }` ; exemples dans `site/src/examples/<slug>/*.html`. `pages/composants/[slug].astro` (`getStaticPaths` sur `import.meta.glob`) affiche but, usage, variantes, états, accessibilité, JS requis et chaque exemple (`Example`, aperçu + code, cadre `data-ch-theme` local pour 3 thèmes côte à côte). Ajouter une pièce = ajouter ses fichiers.
- **Navigation et recherche** : générées par la même glob, groupées par famille ; `pages/recherche.json.ts` (titre, famille, but, classes) et un filtre d'environ 40 lignes ; pas de Pagefind. La navigation de premier niveau (composants, jetons, thème, gabarits, marque, icônes, effets, installation) est écrite une fois dans `DocLayout` à J1b-1.
- **Autres pages** : accueil et installation (créées à J1b-1, installation complétée à la Livraison) ; jetons (J1a-2) ; « créer ton thème » (J1c) ; gabarits, marque, icônes, effets. Gabarits : page autonome par gabarit dans un `<iframe>`, lien « ouvrir seul ». Marque : « CHOPA » seul, jamais le vrai nom de l'utilisateur.
- **Gabarits** : les 4 genres de la fiche (portfolio, jeu, appli, blog-doc-boutique) = **6 familles de gabarit, 12 pages** : portfolio 2, jeu 2, appli 3, boutique 2, blog 2, doc 1. Contenu fictif, varié.
- **Contenu fictif (dès J1b-1)** : `tests/denylist.txt` (vocabulaire commercial ou de prospection, noms réels, vrai nom de l'utilisateur ; entrées fournies par Diapason, pas par l'agent) lue par `scripts/checks/denylist.mjs`, qui scanne `site/src/examples`, `templates`, `data`. Contrôle actif de J1b-1 à la fin.
- **Dogfooding** (J0) : la doc charge `chopa.css` ; `doc.css` n'habille que navigation, aperçu, cadre de code. `<Example file="slug/nom" />` lit le `.html` (`?raw`).
- **Installation (< 5 minutes)** : copier `dist-lib/` ; `<link rel="stylesheet" href="…/chopa.css">` ; `<html lang="fr" data-ch-theme="sombre">` ; facultatif : `chopa-theme.js` dans `<head>` sans `defer`, `chopa.js` avec `defer` (et `onerror`, section 5), `chopa-reset.css`, `chopa-effects.js`, `class="ch-grain"` ; coller l'extrait de « créer ton thème ». Mise à jour : recopier le dossier. Test de copie : `tests/host.html` et Livraison.

## 9. Banc de test

`npm test` (statique) et `npm run test:browser`, via `scripts/run.mjs` (section 2). Cibles découvertes par glob. Navigateur (J2a-1) : cache Playwright `chromium-1248` et `webkit-2370` (lus dans `browsers.json` de `portfolio-nb`, lecture seule) ; repli Chrome par `executablePath` ; Firefox absent. **Avant J2a-2 aucun jalon n'a de critère navigateur** : ils sont vérifiés à la main par Diapason, puis rejoués par script à J2a-2.

| Contrôle | Script (jalon) | Ce qu'il mesure |
|---|---|---|
| Contraste | `static/check-contrast.mjs` (J1a-2) | **paires autorisées** (D5), 3 thèmes, ≥ 4,5, focus ≥ 3 ; voir ci-dessous |
| Thèmes re-réglés | `check-contrast --fixture` (J1a-2) | `tests/fixtures/retheme-bleu.css` et `retheme-jaune.css` (accents `#2563eb`, `#ffd400` ; radius 8px ; polices système) : mêmes paires |
| Jetons | `static/check-tokens.mjs` (J1a-1) | rôles autorisés seulement, aucun hex, variantes dans le fichier de leur composant |
| Coins | `static/check-radius.mjs` (J1a-1) | source : `0`, `var(--ch-radius)` ; exception : le radio |
| Taille | `static/size.mjs` (J1a-1) | octets bruts et gzip de `chopa.css`, `chopa.js` (≤ 10 Ko), `chopa-effects.js` (≤ 3 Ko), budgets par module |
| Structure | `check-dist.mjs` + `checks/*.mjs` (J0, J1b-1) | classes `ch-` des exemples présentes dans `chopa.css`, pas de style en ligne, une fiche et une page par pièce, `denylist`, 0 `data-theme`, 0 tracé SVG dans les exemples ; règles par pièce (`btn-icon.mjs` : `aria-label` ; `figure.mjs` : `alt`) |
| Navigateur | `browser/lib` (J2a-1) | lanceur, 0 erreur console, 0 requête en échec |
| Accessibilité | `browser/a11y.mjs` (J2a-1) | axe-core 4.14.0 : 0 violation par page, 3 thèmes + fixtures |
| Débordement | `browser/check-overflow.mjs` (J2a-1) | boîtes des éléments à 375, 1024, 1440 px |
| Parité | `browser/parity.mjs` (J2a-2), `tests/parity/<slug>.json` | pièces P : propriétés calculées égales à la planche, 3 thèmes, repos, `:hover`, `:focus-visible`, `::before/::after`. **Mesure après la fin des transitions** (`getAnimations()` vide ou ≥ 350 ms ; `transition-*` lu dans un passage séparé, sans mouvement réduit). Échec si une fiche `ref: "P"` n'a pas de JSON de parité (les pièces N sont couvertes par `palette`) |
| Palette | `browser/palette.mjs` (J2a-2) | toute couleur calculée d'un exemple appartient aux valeurs du thème |
| Hôte | `browser/host.mjs` (J2a-2), `tests/host.html` | deux pages : nue, et avec une feuille hôte hostile (marges, puces, `box-sizing` sur `p, ul, h1–h6, button, input, textarea` ; `<html data-theme="light">` ; classe `ch-` suivie d'un saut de ligne). Attendu : éléments de l'hôte intacts (styles calculés = ceux de l'hôte), éléments `ch-` conformes à la parité |
| Clavier | `browser/keyboard.mjs` (J2c), `tests/keyboard/<slug>.json` | ordre de Tab, Entrée/Espace, flèches, `Escape`, retour du focus, piège du focus ; un fichier par pièce interactive |
| Mouvement réduit | `browser/motion.mjs` (J2c) | `prefers-reduced-motion: reduce` : `document.getAnimations().length === 0`, transitions ≤ 0,01 ms |
| Mutation | `browser/mutation` (J2a-2) | un écart introduit à dessein fait échouer la parité |

**Paires autorisées (D5)**, générées des rôles et non « tout texte × tout fond » (`fg` sur `acc` = 2,83 par construction) :
- `fg`, `soft`, `mute`, `acc-text` sur `bg`, `bg2`, `card` ;
- `fg`, `soft`, `mute` sur `acc-dim` composé sur `bg`, `bg2`, `card` ; **`acc-text` sur `acc-dim` : interdit** (clair 4,42 / 4,09) ;
- `on-acc` sur `acc` ;
- variables de coloration du code sur `card` ; focus (`--ch-focus`) ≥ 3 sur `bg`, `bg2`, `card`.
Tout le reste est interdit, listé dans les fiches de jetons. `src/lib/css-tokens.mjs` lit `chopa.css` en ne résolvant que `var()` et `color-mix(in srgb, …)` ; toute autre forme fait échouer le script (risque de J1a-2).
Limites : axe n'attrape qu'une partie des problèmes ; lecteur d'écran non testé ; WebKit de Playwright n'est pas Safari ; cible tactile de la poignée du curseur à mesurer à part (hors critères, variable selon moteur).

## 10. Jalons

Un agent Sonnet par jalon, ≤ environ 300 k tokens (S ≈ 100–160 k, M ≈ 160–300 k ; non mesurés sur ce forfait). **Les agents ne commitent jamais** : Diapason vérifie (build, tests, navigateur) puis commit. Tous les sous-jalons sont vérifiés par Diapason ; l'utilisateur ne regarde qu'aux 8 points de contrôle.

**Critères communs (C)** : `npm run build` code 0 ; contrôles actifs au jalon verts ; par pièce : fiche, page, ≥ 1 exemple par variante, `chopa.js` et fichiers ≤ budget. **Contrôles actifs** (D1) : jusqu'à J1b-1 : `check-dist`, contraste, jetons, coins, taille (statique) ; **avant J2a-2 : aucun critère navigateur** (à la main, Diapason) ; à partir de J2a-1 : + `a11y`, `check-overflow` ; à partir de J2a-2 : + parité (P), palette, hôte, mutation ; à partir de J2c : + clavier, mouvement réduit. Les critères navigateur de J1 (`acc-dim` suit `--ch-acc` ; pages rendues ; axe sur les pièces 1–6 ; parité des pièces 1, 2, 4, 5 ; 0 débordement de la prose à 375) sont **rejoués par script à J2a-2**. « Fichiers » = ceux que le jalon crée ; un jalon ne modifie jamais un exécuteur (`build-css`, `run.mjs`, `check-dist`, `DocLayout`, `[slug].astro`) sauf s'il le crée.

| Jalon | Contenu et fichiers | Scripts créés | Critères propres (en plus de C) | Taille |
|---|---|---|---|---|
| **J0** | fait, vérifié | `build-css`, `check-dist` | — | fait |
| **J1a-1** migration, exécuteurs | migration D3/D4 (section 2), `build-css` par glob + `CH_OUT` + `src/extras` + sprite, `run.mjs`, `package.json` (scripts) | `run`, `check-tokens`, `check-radius`, `size` | `check-dist` 22 contrôles verts + 0 `data-theme` ; `check-radius` échoue sur un `border-radius: 8px` ajouté puis retiré (mutation à la main) ; `size` rend 5 643 / 1 933 avant migration | M |
| **J1a-2** jetons, contraste | `10-tokens`, `20-themes` (`--ch-dim-pct`), `src/lib/{color,css-tokens}.mjs`, page jetons, fixtures bleu et jaune | `check-contrast` | clair `acc-text` 5,06 et chaud `mute` 6,71 retrouvés ; paires autorisées ≥ 4,5 sur 3 thèmes ; échoue si un jeton baisse ; jaune : `mute` sur `acc-dim`/`card` sombre 4,20 avant correction, ≥ 4,5 après réglage de `dim-pct` ; bleu : `acc-text` calculé (sombre ≥ 4,6) ; vérification Diapason : `acc-dim` suit `--ch-acc` | M |
| **J1b-1** infrastructure de doc | `DocLayout` final, `data/`, `[slug].astro`, nav + recherche par glob, Shiki, pages accueil et installation, `doc.css`, `scripts/checks/{00-core,denylist}.mjs`, `tests/denylist.txt` | — | `<Code theme="css-variables">` OK ou repli noté ; variables de code dans les paires ; nav et recherche passent de 0 à N fiches sans éditer de fichier partagé ; `denylist` actif ; 22 contrôles de J0 inchangés dans `00-core.mjs` | M |
| **J1b-2** texte, layout, prose | `30-base`, `50-layout`, `55-prose`, pièces 1–6 | — | pièces 1–6 : fiche, page, exemples ; couverture « classe `ch-` sans entrée » verte ; vérification Diapason : prose complète sans débordement à 375 | M |
| **J1c** « créer ton thème » | `pages/theme.astro`, `site/src/theme-maker/` | — | accents `#2563eb` et `#ffd400` : sortie collée dans les fixtures, toutes paires ≥ 4,5 sur 3 thèmes ; `on-acc` < 4,5 : accent refusé avec la paire ; le jaune est corrigé par `dim-pct` ; mêmes résultats que `check-contrast` (test croisé) | M |
| **J2a-1** banc, 1re partie | `scripts/lib/browser.mjs`, `browser/{a11y,check-overflow}.mjs`, `package.json` (2 dépendances accordées) | `browser`, `a11y`, `check-overflow` | lancement Chromium et WebKit (ou repli) ; axe sur la page d'accueil : 0 violation ; un débordement introduit à dessein est détecté | M |
| **J2a-2** banc, 2e partie | `browser/{parity,palette,host,mutation}.mjs`, `tests/{host.html,parity/}`, `src/extras/chopa-reset.css` | `parity`, `palette`, `host`, `mutation` | parité de `ch-btn` 0 écart ; un écart voulu fait échouer ; `host.html` (nue et hostile) vert ; **critères navigateur de J1 rejoués** ; fiches `ref: "P"` sans JSON de parité : échec | M |
| **J2b** boutons, champs | pièces 7–15, 15 glyphes `src/icons/core/`, `checks/btn-icon.mjs` | — | `ch-btn--icon` sans `aria-label` fait échouer `check-dist` ; fiches de 7–15 ; parité P ; états (hover, focus, erreur) couverts | M |
| **J2c** choix, libellés | pièces 16–21, `tests/keyboard/` pour 7–21 | `keyboard`, `motion` | case, radio (flèches, **seul cercle**, `border-radius: 50%` accepté par `check-radius`), interrupteur (Espace), curseur (flèches) ; mouvement réduit : 0 animation | M |
| **J3a** `chopa.js`, nav interactive | `src/js/chopa/{00-core,tabs,menu,dropdown,toc,range}.js`, `ch-js` dans `chopa-theme.js`, pièces 22–24, 28 | — | `chopa.js` ≤ 10 Ko gzip, budgets par module relevés ; JS désactivé : onglets en liste ; flèches, Début, Fin ; `Escape` + retour du focus ; `init` idempotent ; erreur forcée dans un module : panneaux visibles | M |
| **J3b** nav statique | pièces 25–27, 29–31 | — | `aria-current` ; lien d'évitement visible au focus ; barre latérale : repli « toujours ouverte » vérifié | S |
| **J4a** contenu 1 | pièces 32–40, modules `sort`, `copy` | — | bouton dans `th`, `aria-sort` unique, ordre numérique ; copier : texte exact ; carte : un seul lien ≥ 44 px ; **puces : zone ≥ 44 px (`::before`)** ; avatar : `border-radius` calculé 0 | M |
| **J4b** contenu 2 | pièces 41–49, `checks/figure.mjs` | — | accordéon exclusif (`name`) ; image sans `alt` fait échouer ; galerie : 0 débordement à 375 | M |
| **J5a** fenêtres | pièces 50–53, modules `dialog`, `tooltip` | — | piège du focus, `Escape`, focus rendu, fond non défilant, `aria-labelledby` ; infobulle fermable, survolable, persistante (WCAG 1.4.13) | M |
| **J5b** retours | pièces 54–60, module `toast` | — | région `aria-live` persistante : le message inséré est annoncé ; pause au survol et au focus ; fermable au clavier ; alertes lisibles sans couleur ; indicateur : `border-radius` 0 ; **testeur Sonnet n° 1** ensuite | M |
| **J6** portfolio, jeu | 2 genres × 2 pages : `templates/`, index | — | par page : 0 débordement à 375, 1024, 1440 ; axe 0 ; 1 `h1` ; denylist vide ; relecture des exemples J1b–J5b contre la denylist | M |
| **J7a** appli, boutique | appli : tableau de bord, réglages, connexion ; boutique : liste, produit | — | idem J6 ; formulaires étiquetés ; tableau triable au clavier | M |
| **J7b** blog, doc | blog : liste, article ; doc : page avec barre latérale et sommaire | — | idem J6 ; sommaire suit le défilement | M |
| **J8a** marque, icônes | page marque, comparaison de 3 jeux aux 3 thèmes, `src/icons/<jeu>/` | — | logo : `border-radius: 0`, point carré, 2 tailles minimales lues ; **l'utilisateur choisit le jeu pendant le point de contrôle J8** ; seuls les fichiers de `src/icons/` changent : 0 tracé dans les exemples et gabarits ; icône seule : `aria-label` ou `aria-hidden` | M |
| **J8b** effets, grain | `70-effects`, `chopa-effects.js`, `ch-grain`, page effets | — | critères ci-dessous ; **testeur n° 2** ensuite | M |
| **Livraison** | README, installation complétée, `dist-lib/` final, envoi (après accord) | — | tout vert ; copie de `dist-lib/` dans un site vide : page correcte ; accès refusé sans connexion (production, aperçu) ; OK après connexion | S |

**Points de contrôle de l'utilisateur** (U2) : Diapason les présente après vérification des sous-jalons de la famille.

| # | Après | Famille | L'utilisateur regarde |
|---|---|---|---|
| 1 | J1c | Fondations | jetons, 3 thèmes, texte, prose, page « créer ton thème » |
| 2 | J2c | Base et formulaires | boutons, champs, choix |
| 3 | J3b | Navigation | en-tête, onglets, menus, pied de page |
| 4 | J4b | Contenu et médias | cartes, tableau, code, galerie, accordéon |
| 5 | J5b | Retours et fenêtres | modale, tiroir, notifications ; testeur 1 ; Safari à la main |
| 6 | J7a ‖ J6 (fin de J6) | Gabarits portfolio et jeu | 4 pages |
| 7 | J7b | Gabarits appli, blog, doc, boutique | 8 pages |
| 8 | J8b | Marque, icônes, effets | logo, choix du jeu d'icônes, effets, grain ; testeur 2 |

**Effets** (référence : « bandes qui défilent au rythme du défilement, apparition des titres » ; le portfolio ne contient que des bandes statiques, constaté en v1). Deux effets en JS natif : `transform` des bandes liée au défilement (`requestAnimationFrame`, écouteur passif), révélation des titres (`IntersectionObserver`) ; animations pilotées par le défilement : non vérifié, non utilisées. **Critères J8b** : sans JS tout le texte visible ; après 500 px de défilement la `transform` d'une bande a changé ; le titre passe à `opacity: 1` ; mouvement réduit : 0 animation, `transform: none` ; grain : `pointer-events: none`, `z-index` explicite, `elementFromPoint` le traverse ; `chopa-effects.js` ≤ 3 Ko gzip.

## 11. Parallélisme (2 agents au plus)

Règles (D2) : les exécuteurs (`build-css`, `run.mjs`, `check-dist`, `DocLayout`, `[slug].astro`) sont écrits par le jalon qui les crée (J1a-1, J1b-1) et jamais ensuite ; les jalons suivants ajoutent des fichiers (CSS, JS, fiches, exemples, `scripts/checks/*`, `tests/…`). **Une paire n'est permise que si** chaque agent construit dans sa propre racine de sortie (`CH_OUT=/chemin/agent-a`, `…/agent-b`) et touche des fichiers disjoints. Pas de `git worktree` : les agents ne commitent pas, Diapason commite après vérification de chaque agent séparément. `package.json` n'est touché que par J1a-1 (scripts), J2a-1 (dépendances) et la Livraison.

| Paire possible | Fichiers disjoints | Condition |
|---|---|---|
| J1b-2 ‖ J1c | J1b-2 : `src/css`, exemples, fiches ; J1c : `theme.astro`, `theme-maker/`, `color.mjs` figé | J1b-1 terminé (lien « thème » déjà dans `DocLayout`) |
| J3b ‖ J4a | CSS, fiches, exemples distincts ; `sort`, `copy` dans J4a | J3a terminé |
| J4b ‖ J5a | idem | J4a, J3a terminés |
| J6 ‖ J7a | gabarits dans des dossiers distincts | composants de J5b présents |
| J7b ‖ J8a | gabarits ≠ `src/icons/` et page marque | J7a terminé |

Séquentiels : J1a-1 → J1a-2 → J1b-1 (tous trois touchent des exécuteurs ou `DocLayout`) ; J1b-2/J1c → J2a-1 → J2a-2 ; J2b → J2c ; J3a avant J4 et J5 ; J8b après J3a. Le banc de J2a n'est pas parallélisé : un seul agent écrit `scripts/lib/browser.mjs` puis les scripts qui en dépendent.

## 12. Dépendances npm par jalon

Versions exactes (`save-exact`). `npm view` du 2026-11-15.

| Jalon | Paquet | Version | Licence | Pourquoi |
|---|---|---|---|---|
| J0 (fait) | `astro` | 7.4.12 | MIT | site de doc ; Shiki (4.6.0) en vient |
| J1a-1 … J1c | aucune | | | contraste en JS pur |
| J2a-1 | `playwright-core` | 1.64.1 | Apache-2.0 | piloter Chromium et WebKit du cache ; **accord de l'utilisateur donné le 2026-11-15** |
| J2a-1 | `axe-core` | 4.14.0 | MPL-2.0 | audit d'accessibilité, outil de dev ; **accord donné le 2026-11-15** |
| J2b à J7b | aucune | | | |
| J8a | `lucide-static` / `@tabler/icons` / `@phosphor-icons/core` | 1.73.0 / 3.52.0 / 2.1.1 | ISC / MIT / MIT | comparaison ; accord à redemander avant d'installer ; deux désinstallés après le choix |
| Livraison | `wrangler` via `npx` (non enregistré) | 4.162.0 | MIT OR Apache-2.0 | envoi direct ; accord à redemander |

## 13. Mise en ligne (inchangée)

**Envoi direct** (`npx wrangler pages deploy site/dist`) plutôt que l'intégration Git : git reste local, seul `site/dist/` part. Limites gratuites : 500 constructions par mois, 20 000 fichiers par site (INDEX) ; décompte en envoi direct : non vérifié. **Fenêtre d'exposition** : dès le premier envoi l'URL `*.pages.dev` est publique tant qu'Access n'est pas réglé (contenu fictif) ; chaque envoi crée des URL d'aperçu. Access se règle à la main ; le site n'est privé qu'après un test sans connexion sur la production et sur un aperçu. Rien n'est envoyé sans accord.

## 14. Risques et points ouverts

**Risques**
- **Dérive des pièces N** : parade `palette`, `check-tokens`, `check-radius`, points de contrôle (lot de 8, défaut visuel trouvé au plus un lot plus tard).
- **Hôte** : remise à zéro réduite à l'élément ; parade : composants autonomes et `tests/host.html` hostile (J2a-2). Avant J2a-2, non testé par script.
- **`chopa.js`** : 9,4 Ko estimés pour 10 Ko, non mesuré ; `size.mjs` bloque dès le premier module ; non minifié.
- **`css-parser` maison** (`css-tokens.mjs`, J1a-2) : ne lit que `var()` et `color-mix(in srgb)` ; une autre forme dans les jetons fait échouer le script.
- **Sortie animée des dialogs** : `allow-discrete` non vérifié.
- **Moteurs** : Chromium et WebKit de Playwright ; Safari réel et Firefox non testés (Safari à la main au point 5).
- **Coloration `css-variables`** : non exécutée (J1b-1), repli prévu.
- **Quota** : 21 sous-jalons à venir ; l'estimation de la fiche (2 à 3,5 M de tokens) est peut-être basse pour 60 pièces : non mesuré.
- **Grain** : coût sur téléphone non mesuré. **Licence Inter Tight** : OFL 1.1 (Fontsource) ; dépôt officiel à consulter avant redistribution publique. **Carte bancaire Zero Trust** : non vérifiée.

**Points ouverts**
1. Plafond de `chopa-effects.js` (3 Ko gzip) à confirmer ; celui de `chopa.js` est fixé à 10 Ko (D7).
2. Versions minimales des navigateurs : à lire avant la Livraison.
3. *Fermé (U1)* : seul le radio est rond.
4. `@layer chopa` : écarté ; à reprendre si un hôte a des conflits de priorité.
5. Pages ou Workers, télémétrie de `wrangler` : non vérifié ; à contrôler à la Livraison.
6. `chopa.min.css`, thème automatique, paquet npm privé, composants Astro, Artifact, Figma : hors v2.
7. Positionnement par ancre : à reprendre si la collision de bords devient un besoin.
8. *Fermé (U4)* : environ 60 pièces acceptées.

## 15. Journal des corrections (audit 2)

Décisions de l'utilisateur et choix de Diapason appliqués : **U1** (cercles : sections 2, 4, 14, 10 J2c/J4a/J5b) ; **U2** (8 points de contrôle : sections 1, 10) ; **U3** (J2a-1, section 12) ; **U4** (section 4, point ouvert 8) ; **D1** (section 10, contrôles actifs) ; **D2** (sections 2, 11) ; **D3** (sections 2, 10 J1a-1) ; **D4** (section 2, 9) ; **D5** (sections 3, 9) ; **D6** (section 7) ; **D7** (section 5) ; **D8** (section 10, `denylist` à J1b-1, J1a/J1b/J2a scindés) ; **D9** (section 6, pièce 43). Les choix D1–D9 sont « délégué (Diapason) ».

| Point | Section | Ce qui a changé |
|---|---|---|
| 1 | 9, 10 | Critères navigateur retirés de J1a–J2a-1 ; contrôles actifs listés par jalon ; critères J1 rejoués par script à J2a-2 |
| 2 | 2, 9, 11 | `check-dist` exécuteur de `scripts/checks/*.mjs` (J1b-1) ; `build-css` par glob (J1a-1) ; `run.mjs` ; seul le créateur d'un exécuteur le modifie |
| 3 | 2, 9 | Remise à zéro : élément seul, variantes tabulation et saut de ligne, `textarea`, composants autonomes (marges déclarées), `host.html` hostile |
| 4 | 2 | Fond et couleur sur trois sélecteurs explicites, attribut `data-ch-theme` (D3) ; test hôte `data-theme="light"` |
| 5 | 3, 9, 10 | `dim-pct` calculé (6e réglage), `mute` autorisé sur `acc-dim` après correction ; fixture jaune ; `acc-text` sur `acc-dim` interdit |
| 6 | 9 | Paires autorisées par rôle, remplacent la matrice complète ; liste des interdits dite |
| 7 | 7 | Gras et italique retirés (D6) ; 4 niveaux de couleur ; variables `link`, `inserted`, `deleted`, `changed`, `parameter`, `background` ajoutées ; test à J1b-1 conservé |
| 8 | 9 | Parité mesurée après les transitions (`getAnimations()` vide ou ≥ 350 ms) ; `transition-*` lu à part |
| 9 | 10 | J1a scindé (J1a-1, J1a-2), J1b scindé (J1b-1, J1b-2), J2a scindé (J2a-1, J2a-2) ; risque du parseur noté (section 14) |
| 10 | 11 | Parallélisme par racine de sortie `CH_OUT` et fichiers disjoints ; pas de worktree (agents ne commitent pas) ; paires restantes listées |
| 11 | 8, 10 | `denylist` et sa règle créées à J1b-1 ; relecture à J6 ; entrées fournies par Diapason (y compris le vrai nom) |
| 12 | 10 | Critère « puces 44 px » déplacé à J4a |
| 13 | 2, 10 | `chopa-reset.css` : source `src/extras/`, créé à J2a-2 |
| 14 | 2 | Règle d'ordre : variantes dans le fichier du composant, vérifiée par `check-tokens` ; copie JS et extras par glob dans `build-css` |
| 15 | 5 | Tableau module / attribut / rôle / sans JS ; module `accordion` supprimé (natif) ; `tooltip` : `data-ch-tooltip` |
| 16 | 5 | `ch-js` posée par `chopa-theme.js` si `chopa.js` est présent ; `onerror` ; `data-ch-failed` |
| 17 | 4 | 15 glyphes (ajoutés : `alert`, `menu`, `copy`), usages par pièce |
| 18 | 8 | « 4 genres de la fiche, 6 familles de gabarit, 12 pages » ; accueil et installation créées à J1b-1 |
| 19 | 4, 10 | Noms `icon-<nom>` stables ; exemples sans tracé SVG, vérifié par `check-dist` ; J8a ne remplace que `src/icons/` |
| 20 | 4 | Compte préciser : 60 pièces, 54 hors fondations ; accepté (U4) |
| 21 | 4, 14 | `ch-avatar--round` supprimé ; point ouvert 3 fermé par U1 |
| 6 section « Accessibilité » (audit §6) | 5, 10 | Onglets (tabindex itinérant, activation automatique), dropdown (Menu Button ou Disclosure), dialog (`aria-labelledby`), infobulle (survolable, persistante), toast (région persistante, pause), tableau (bouton, `aria-sort` unique), `::details-content` (sidebar), critères J3a–J5b |
| Budget `chopa.js` (audit §2) | 5 | 10 Ko, budgets par module à 9,4 Ko (D7) |
| Algorithme `acc-text` (audit §2 b) | 3 | Bidirectionnel, décrit |
| Sources (audit §5) | 6 | `<details name>` : Newly available, 3 septembre 2024 ; `::details-content` ajouté |

## 16. Doc immersive (avenant du 2026-11-26)

Statut : proposé (concepteur, brief 32) · 2026-11-26, à auditer puis à valider. Références : `FICHE.md` (avenant du 2026-11-26), `JOURNAL.md` (« Maquette immersive » et sa vérification), `maquette/immersif/` (référence validée). Sections 1 à 15 inchangées ; cette section ne touche ni `chopa.css` ni `dist-lib/`.

### 16.1 La décision en tête

**L'accueil `/` devient le mur, construit par Astro depuis les fiches et un fichier de miniature par pièce (`site/src/tuiles/<slug>.html`) ; three 0.187.0 n'est importé que par le mur, en module chargé à la demande et réduit par Vite aux seules classes utilisées ; tout le reste (titre vivant, curseur carré, aimants, transitions entre pages) est du JavaScript sans dépendance, posé une fois par trois exécuteurs touchés chacun par un seul jalon ; la grille immobile des mêmes tuiles est la page de base, le mur une couche ajoutée par-dessus quand tout est réuni.**

Trois raisons :
1. **La grille d'abord, le mur ensuite.** Les 72 liens des tuiles existent dans le HTML construit, sans JavaScript ; le mur les clone en décor `aria-hidden`. Clavier, lecteur d'écran, mouvement réduit, petit écran, absence de 3D, lenteur et échec de chargement retombent tous sur la même grille, déjà mesurée dans la maquette (axe 0, 72 liens, 0 défilement à 375 px).
2. **Une source par donnée, comme en section 1.** Titre, famille, ordre et lien viennent des fiches (`pieces.mjs`, lu sans être modifié) ; la miniature est un fichier par pièce, découvert par glob et contrôlé par `checks/tuiles.mjs`. Ajouter une pièce = ajouter sa fiche, ses exemples et sa tuile.
3. **Un poids mesuré, payé seulement sur l'accueil.** Bundle jetable fait le 2026-11-26 avec le Vite installé (section 16.5) : three réduit aux imports du mur = 26,3 Ko gzip ; module de la scène complet = 30,8 Ko gzip, chargé après l'affichage, et seulement en mode mur. Les pages de pièce n'en chargent rien.

**Prix à payer :**
- 72 miniatures écrites à la main (reprises de la maquette) à tenir à jour : une pièce nouvelle sans tuile fait échouer `check-dist`.
- En mode mur, chaque tuile existe deux fois dans le DOM (lien de la grille hors de la vue, clone 3D décoratif) ; mémoire GPU de 72 calques 3D non mesurée (parade : élagage, section 16.11).
- La cause des transitions abandonnées de la maquette n'est pas prouvée : la parade (section 16.7) est une garde plus un test de 60 navigations, avec un plan de repli si le test reste rouge.
- Le banc tourne sans GPU (SwiftShader) : la fluidité réelle, Safari réel et Firefox se regardent à la main au point de contrôle 9.
- `DocLayout`, `index.astro` et `[slug].astro` sont réécrits une fois chacun (un jalon chacun) : un défaut de l'un se corrige dans ce jalon ou par Diapason, jamais par un autre jalon.

### 16.2 Options écartées

- **Miniature = premier exemple de la fiche, automatiquement** : ids et références à réécrire, tailles prévues pour la page et pas pour 260 px, états fermés (modale, menu) qui ne montrent qu'un bouton ; la maquette validée repose sur des miniatures faites main.
- **Champ `tuile` dans chaque fiche `.mjs`** : du HTML dans des chaînes JavaScript, que les contrôles HTML (`svg-sans-trace`, `btn-icon`, `figure`) ne lisent pas.
- **Calque WebGL** (`three.module.js`, lumière, grain en shader) : écarté par la maquette (poids, couleurs mélangées hors palette).
- **Routeur client d'Astro (`<ClientRouter />`)** : navigation façon appli, scripts relancés autrement, hypothèses du banc cassées ; les transitions natives entre documents suffisent.
- **Mur sur une page à part (`/mur/`)** : l'avenant dit « l'accueil est un espace 3D ».
- **Mur simplifié sur téléphone** : choix 2 de la maquette, grille sous 900 × 560 px.
- **Copier `three.core.js` dans `public/`** (1 474 799 octets bruts) : Vite n'en garde que 92 058 octets minifiés.
- **Caméra CSS écrite à la main, sans three** : plus légère (non mesuré), mais l'accord de l'utilisateur vise three ; gardée comme repli si le budget de 16.5 saute.

### 16.3 Où vont les choses (décisions M1 à M6)

**M1. Accueil `/` = le mur.** Le contenu d'aujourd'hui y reste en « introduction » : `h1` (logotype CHOPA, texte « Chopa Design » pour le lecteur d'écran), phrase d'accroche, « Par où commencer » (Installation, Jetons, Créer ton thème, Composants), « Un exemple en direct » (`<Example file="button/primary" />`, puis `secondary` et `ghost`) et « Ce que la bibliothèque garantit ». **Contrainte du banc** : `checks/00-core.mjs` exige sur `site/dist/index.html` l'aperçu et le bloc de code de `button/primary`, le lien `chopa.css` et le script de thème en ligne sans `defer` ; `checks/fiches.mjs` exige `href="/composants/<slug>/"` pour chaque fiche (les liens des tuiles le portent, sans `#` ni paramètre). En mode grille, l'introduction est au-dessus des familles. En mode mur, elle est hors de la vue comme la grille, et le script lui pose `inert` (retiré en mode grille) : rien de focalisable n'est caché, le `h1` reste en dehors de la partie `inert`.
**M2. `/composants/` = la grille immobile des 63 pièces** (5 familles, jamais de 3D), même composant que la grille du mur ; elle remplace la liste en cartes. C'est la cible du lien « Composants » et l'adresse stable de la version sans mouvement.
**M3. Pages de pièce `/composants/<slug>/`** : mise en page « pleine » de la maquette (`bouton.html`), sans barre latérale. En-tête de pièce (`view-transition-name: im-piece`) : fil « Le mur · famille · numéro » (lien vers `/#p-<slug>`), `h1` en typo vivante, but, **la tuile de la pièce en grand** (`inert`, `aria-hidden` : c'est l'image de la tuile qui devient la page). Puis le contenu actuel inchangé (Quand l'employer, Variantes avec `Example`, Dans les trois thèmes, États, Accessibilité, JavaScript requis), avec un sommaire `ch-toc` (`data-ch-toc`) à gauche dès 1 000 px, et « Pièces voisines » (précédente, suivante dans l'ordre du mur). Boutons aimantés : les `.ch-btn` actifs des aperçus (`.doc-example__preview`) et de l'en-tête. Ancres des sections préfixées `s-` (`s-variantes`…) pour ne jamais croiser un id d'exemple.
**M4. Autres pages de la doc** (installation, jetons, thème, gabarits, marque, icônes, effets) : mise en page actuelle avec la barre latérale ; elles reçoivent le curseur carré, le fondu de transition et le titre vivant sur leur premier `h1` de `#contenu` (taille inchangée, aucun fichier de page modifié). Pas d'aimants (la page « créer ton thème » est un outil de travail). **Les gabarits publiés (`/gabarits/<genre>/<page>/`) ne reçoivent rien** : ce sont des pages faites seulement avec la bibliothèque (`checks/gabarits.mjs`).
**M5. Barre du haut, commune** (`DocLayout`) : marque, recherche, thèmes, bouton « Version calme », et en mise en page pleine un menu natif `<details>` « Menu » avec les pages de premier niveau (`pagesNav`) et « Toutes les pièces » (`/composants/`), qui remplace la barre latérale. La barre porte `view-transition-name: im-barre` (elle ne bouge pas pendant une transition).
**M6. « Version calme »** : un bouton à bascule (`aria-pressed`) dans la barre de toutes les pages de la doc, absent sans JavaScript et en mouvement réduit (qui l'impose déjà). Mémorisé dans `localStorage` sous la clé `doc-calme` (`'1'`). Effet : mur remplacé par la grille, ni titre vivant, ni aimants, ni curseur carré, et transitions réduites au fondu (pas de plongée). Décidé dans `<head>` avant le premier rendu, comme dans la maquette.

| Page | Mur 3D | Titre vivant | Curseur carré | Aimants | Transition |
|---|---|---|---|---|---|
| `/` | oui (sinon grille) | logotype de la scène ; `h1` de la grille | oui | non | plongée → page de pièce ; fondu |
| `/composants/` | jamais | oui | oui | non | fondu |
| `/composants/<slug>/` | non | oui (en-tête) | oui | `.ch-btn` des aperçus et de l'en-tête | en-tête ↔ tuile ; fondu |
| installation, jetons, thème, gabarits, marque, icônes, effets | non | premier `h1` | oui | non | fondu |
| `/gabarits/<genre>/<page>/` | non | non | non | non | aucune |

### 16.4 Données des tuiles (décisions M7 à M9)

**M7. Un fichier de miniature par tuile : `site/src/tuiles/<slug>.html`**, lu par `import.meta.glob('../tuiles/*.html', { query: '?raw', eager: true })`. 63 fichiers nommés comme les fiches, plus 9 pour les familles propres au mur (`gabarit-portfolio`, `gabarit-jeu`, `gabarit-appli`, `gabarit-blog`, `gabarit-doc`, `gabarit-boutique`, `marque`, `icones`, `grain`). Contenu repris de `maquette/immersif/outils/apercus.mjs` au jalon I1 (icônes en `/chopa/chopa-icons.svg#ch-i-<nom>`). Règles (`checks/tuiles.mjs`) : classes `ch-`, `is-` et `im-` seulement ; aucun `id`, `name`, `for`, `form`, attribut de référence ARIA (`aria-labelledby`, `aria-describedby`, `aria-controls`…), `style`, `<style>`, `<script>`, `<dialog>` ouvert par script ni `popover` actif ; `href` seulement `#` ; aucun tracé SVG ; bouton icône avec `aria-label` ; mots de `tests/denylist.txt` interdits (`motif` et `lireListe` importés de `checks/denylist.mjs`, sans le modifier) ; une tuile par fiche et par entrée de `familles-mur.mjs`, aucune tuile orpheline. Réduction facultative : la racine du fichier peut porter `im-z50`, `im-z60`, `im-z70` ou `im-z80` (propriété `zoom`, comme la maquette).
**M8. Familles et ordre** : `site/src/immersif/donnees-mur.mjs` (nouveau) importe `pieces` et `FAMILLES` de `site/src/lib/pieces.mjs` (**non modifié**) : les 5 familles dans l'ordre de `FAMILLES`, les pièces dans l'ordre de `pieces` (famille, puis titre en français), numéros `NN·MM` calculés. Puis les 2 familles propres au mur, déclarées dans `site/src/immersif/familles-mur.mjs` (seule liste écrite à la main, 9 entrées : `slug`, `titre`, `but`, `href`) : Gabarits (une tuile par genre, vers la première page du genre ; `checks/tuiles.mjs` échoue si un dossier de `site/src/templates/` n'a pas sa tuile ou si un `href` ne vise pas une page construite) et Marque et icônes (Marque → `/marque/`, Icônes → `/icones/`, Grain → `/effets/`). « Logotype » et « Effets de défilement » restent dans Fondations, comme leurs fiches. Total : 72 tuiles, 7 familles.
**M9. Rendu** : `site/src/components/Tuiles.astro` rend la grille (`<section>` par famille, `h2`, compte, `<ul role="list">`) ; chaque tuile `<li class="im-tuile" id="p-<slug>" data-slug data-famille>` contient l'aperçu (`inert`, `aria-hidden`) et le pied avec le lien (nom accessible = titre). Une tuile sans fichier fait échouer la construction avec le nom du fichier manquant (comme `Example`).

### 16.5 Code, three et poids (décisions M10 à M12)

**M10. Où vit le code** : tout dans `site/src/immersif/` (préfixe de classes `im-`, jamais dans `src/css/` ni dans `chopa.css`) :

| Fichier | Rôle | Chargé par | Jalon |
|---|---|---|---|
| `tete.js` | en ligne dans `<head>` (`?raw`, comme `chopa-theme.js`) : drapeau calme et mouvement réduit (`im-calme` sur `<html>`), garde des transitions (16.7) | `DocLayout` | I0 |
| `socle.css` | barre, menu plein, curseur, typo vivante, règles des transitions, mise en page pleine | `DocLayout` (import) | I0 |
| `curseur.js`, `vivant.js`, `calme.js` | curseur carré ; titre vivant (`[data-im-vivant]`, sinon premier `h1` de `#contenu`) ; bouton « Version calme » | `DocLayout` (`<script>` traité par Astro, module) | I0 |
| `tuiles.css`, `donnees-mur.mjs`, `familles-mur.mjs` | grille et tuiles ; données | `Tuiles.astro` | I1 |
| `mode.js` | en ligne dans `<head>` de `/` (fente `head`) : décision mur ou grille avant le premier rendu (repris de `outils/index.gabarit.html`) | `index.astro` | I2 |
| `mur.js`, `mur.css` | mode, clavier, liens, `inert` de l'introduction, garde de lenteur | `index.astro` | I2 |
| `scene.js` | three + `CSS3DRenderer`, caméra, plongée, fond en canevas 2D, élagage | `import()` dans `mur.js` | I2 |
| `aimants.js`, `piece.css` | boutons aimantés ; en-tête et corps de page de pièce | `[slug].astro` | I3 |

**M11. three par Vite** : `scene.js` importe `import { Scene, PerspectiveCamera, Object3D, Vector3 } from 'three'` et `import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js'` (chemin ouvert par le champ `exports` de three 0.187.0 : `"./examples/jsm/*"`, lu le 2026-11-26 ; `sideEffects` de three = `["./src/nodes/**/*"]`). `mur.js` le charge par `import('./scene.js')` seulement en mode mur : Vite en fait un fichier séparé sous `/_astro/`. Rien n'est copié dans `public/`. **Mesure** (2026-11-26, bundle jetable `.out/archi/`, Vite 8.3.8 installé avec Astro 7.4.12, minification par défaut, gzip niveau 9, copies des fichiers de la maquette) :

| Module | Octets | gzip |
|---|---|---|
| three seul (les 6 imports ci-dessus) | 92 058 | 26 345 |
| `scene.js` + three (fichier chargé à la demande) | 102 576 | 30 791 |
| `mur.js` | 5 366 | 2 336 |
| typo vivante + aimants + copie (`page.js` sans la page modèle) | 4 011 | 1 778 |
| `curseur.js` | 2 175 | 919 |
| `transitions.js` | 230 | 173 |

Aucun moteur WebGL dans le fichier (0 occurrence de `WebGLRenderer`). **La mention de licence de three disparaît à la minification** (`@license` absent du fichier produit) : I2 ajoute `site/src/pages/licences/three.txt.ts` (renvoie `node_modules/three/LICENSE` à la construction) et une ligne « three.js (MIT) » dans le pied du mur. Ces chiffres viennent de Vite seul, pas de `astro build` : `size-immersif` les remesure sur `site/dist`.
**M12. Budgets** (`scripts/static/size-immersif.mjs`, créé à I0 avec tous ses seuils ; un seuil ne s'applique qu'à ce qui existe) : il lit chaque page construite, suit ses `<script type="module" src>` et leurs imports statiques (`/_astro/…`) puis les imports dynamiques, et mesure en gzip niveau 9 :
- JS de la doc immersive chargé **au départ** sur `/` : ≤ 8 Ko (estimé 4,5 à 5 Ko d'après les mesures ci-dessus) ;
- JS chargé **à la demande** sur `/` (scène + three) : ≤ 40 Ko (mesuré 30,8 Ko) ;
- tout le JS de la doc immersive d'une page de pièce : ≤ 6 Ko (estimé 2,9 Ko) ;
- toute autre page : ≤ 4 Ko ;
- **aucune page autre que `/` n'atteint un fichier contenant `__THREE__`** (marque posée par three, retrouvée dans le fichier produit) ;
- `site/dist/index.html` : ≤ 40 Ko gzip (estimé : la page de la maquette fait 8,2 Ko gzip, sans barre ni exemples) ;
- `chopa.js`, `chopa-effects.js` restent mesurés par `size.mjs`, inchangé.

**Exécuteurs touchés (règle D2 : un seul jalon chacun, jamais en paire)** : `DocLayout.astro` → I0 ; `index.astro` → I2 ; `[slug].astro` → I3 ; `pieces.mjs` → **aucun** (lu par `donnees-mur.mjs`) ; `build-css`, `run.mjs`, `check-dist`, `Example.astro`, `astro.config.mjs`, `package.json` → aucun.
**`DocLayout` à I0, exactement** : (1) premier enfant de `<head>` après `meta` et `title` : `<style is:inline>@view-transition { navigation: auto; }</style>` ; (2) juste après, `tete.js` en ligne ; (3) inchangés : `chopa.css`, `chopa.js` avec `defer` et `onerror`, script de thème en ligne sans `defer` ; (4) `<slot name="head" />` ; (5) prop `plein` (sans barre latérale, menu `<details>` dans la barre) ; (6) `<slot name="barre" />` ; (7) bouton « Version calme » `hidden` ; (8) `import '../immersif/socle.css'` et les `<script>` de `curseur.js`, `vivant.js`, `calme.js`.

### 16.6 Accessibilité et version calme (décisions M13 et M14)

**M13. Comportement exact du mur**, repris de la maquette mesurée :
- **Sans JavaScript** : la grille ; 72 tuiles visibles, 72 liens distincts ; bouton « Version calme » caché ; titres en texte simple ; curseur natif.
- **Sans 3D CSS** (`CSS.supports('transform-style', 'preserve-3d')` faux), **sans WebGL** (indice d'accélération, il ne dessine rien), **module non chargé** (filet : grille rendue 1,5 s après `load`), **trop lent** (nouveau, M14) : la grille.
- **Mouvement réduit** : la grille ; scène jamais lancée (`display: none`, 0 image) ; ni titre vivant, ni aimants, ni curseur carré ; transitions sautées ; `document.getAnimations().length === 0` après chargement, pointeur et molette.
- **Sous 900 × 560 px** : la grille ; passage grille ↔ mur au franchissement du seuil sans recharger (écouteurs `change`).
- **Clavier** : lien d'évitement « Aller aux pièces » (`#pieces`) ; un seul jeu de focalisables, les liens de la grille (famille par famille, colonne par colonne) ; en mode mur ils restent dans le document, hors de la vue, la caméra suit le lien focalisé et le clone 3D porte l'anneau (2 px `--ch-focus`, décalé de 3 px) ; flèches = tuile voisine ; Entrée = plongée (1,15 s) puis page ; index des familles en bas = trajet jusqu'à la famille ; l'introduction est `inert` en mode mur.
- **Lecteur d'écran** : scène `aria-hidden`, clones sans lien ni id ni `name`, aperçus `inert` ; la page se lit comme la grille (`h1`, une `h2` par famille avec son compte, une liste de liens nommés par le titre).
- **Contraste sur la scène** : tout texte posé en 3D (étiquettes, légende, aide, pied des tuiles) est sur une plaque opaque `--ch-bg` ou `--ch-card` ; les particules (couleurs `--ch-line`, `--ch-mute`, `--ch-acc`, lues dans les jetons) passent derrière, jamais sous un texte ; seules les paires autorisées de la section 9 sont permises, mesurées par le test (axe ne lit pas un calque `aria-hidden`).
- **Curseur** : seulement avec `(hover: hover) and (pointer: fine)`, hors mouvement réduit et hors calme ; natif sur les champs de texte ; `pointer-events: none` ; caché dès Tab ou une flèche et laissé petit (14 px, vide) sur l'élément `:focus-visible` : il ne couvre jamais l'anneau. Il vit dans un calque fixe `inset: 0; overflow: hidden` et n'est créé qu'au premier mouvement de souris (sinon `check-overflow` le verrait hors de la fenêtre à sa position de départ, −100 px dans la maquette).
- **Typo vivante** : le texte entier reste dans une copie lisible (`im-sr`), les lettres découpées sont `aria-hidden` ; le nom accessible du `h1` ne change pas.
**M14. Garde de lenteur** (nouveau, non présent dans la maquette) : après le démarrage du mur, si plus d'un tiers des 90 premières images dépassent 50 ms, retour à la grille, `sessionStorage['doc-mur-lent'] = '1'` pour la session et message dans une région `role="status"` (« Version calme : l'affichage était trop lent »). Seuils estimés, à régler à I4.

### 16.7 Transitions de page (décisions M15 et M16)

**Constat** (maquette) : « Transition was aborted because of invalid state. ViewTransition opt-in disabled » par intermittence, toujours avec `bouton.html` au départ ou à l'arrivée ; « … Page already revealed » vu par Diapason dans un volet masqué. **Lecture des sources** (2026-11-26) : le brouillon de la spécification (CSS View Transitions 1, version de travail du 16 février 2025) saute une transition avec `InvalidStateError` si le document est caché au départ ou le devient pendant la transition, si un `view-transition-name` est en double dans l'ancien ou le nouvel état, si la taille du bloc conteneur des captures change, ou si une capture est trop grande ; il rejette alors `ready` sans le marquer comme traité (d'où le rejet non traité si aucun `catch` n'est posé à temps) ; `skipTransition()` saute avec `AbortError`. « opt-in disabled » ne figure pas dans la partie lue de la spécification (les 100 000 premiers caractères) : message propre à Chromium, probablement (non vérifié). **Hypothèse, non vérifiée** : dans la maquette, deux scripts bloquants (`transitions.js`, `chopa-theme.js`) précèdent la feuille qui porte `@view-transition` ; un calcul de style fait avant la lecture de cette feuille verrait l'inscription absente et annulerait la transition déjà préparée pour le nouveau document. Une page de départ cachée (volet masqué) explique l'autre message.
**M15. Conception gardée** :
1. Inscription `@view-transition { navigation: auto; }` dans un `<style>` en ligne, **premier** dans `<head>`, hors de toute requête média, sur toutes les pages de la doc (I0).
2. Garde en ligne juste après (`tete.js`), écouteurs posés avant tout autre script : sur `pageswap` et `pagereveal`, `catch` posé tout de suite sur `ready`, `finished` et `updateCallbackDone` ; puis `skipTransition()` si le document n'est pas visible, si le mouvement est réduit, ou si la navigation est un rechargement (`navigation.activation.navigationType === 'reload'` quand l'API existe ; type non vérifié pour Safari).
3. Un seul élément nommé `im-piece` par page : la scène en mode mur, l'en-tête sur une page de pièce, rien ailleurs (vérifié par le test). `im-barre` sur la barre de toutes les pages. Aucune transition dans un même document (le changement de thème n'en lance pas).
4. Mouvement réduit : saut par la garde, plus `animation: none` sur les pseudo-éléments de transition (filet CSS de la maquette, conservé).
5. Sans prise en charge (Firefox avant la 162, sortie annoncée le 2026-12-08 selon le relevé MDN du brief 31, non revérifié) : navigation ordinaire.
**M16. Repli mesuré** : si le test de 60 navigations d'I0 ou d'I4 voit encore une erreur après la garde, (1) diagnostic noté au JOURNAL ; (2) retrait du nom `im-piece` (fondu seul) ; (3) retrait de l'inscription (navigation simple). Chaque étape est décidée par Diapason et dite à l'utilisateur ; le site reste juste à chaque étape.

### 16.8 Banc de test

Nouveaux fichiers seulement ; aucun script existant n'est modifié. Tous partent de `scripts/lib/browser.mjs` (`withBench`, `openPage`, `listPages`) et lisent `CH_OUT`.

| Script (jalon) | Ce qu'il mesure |
|---|---|
| `static/size-immersif.mjs` (I0) | budgets de M12 ; échec nommé (page, fichier, octets) |
| `checks/tuiles.mjs` (I1, chargé par `check-dist`) | règles de M7 et M8 ; 72 tuiles ; tuile manquante ou orpheline |
| `browser/immersif-socle.mjs` (I0) | 60 navigations enchaînées entre pages existantes (Chromium, 3 thèmes) et 20 (WebKit) : 0 erreur console ou de page, `pagereveal.viewTransition` présent ou sauté avec sa raison notée ; un seul `im-piece` et un seul `im-barre` par page ; mouvement réduit : 0 animation pendant et après la navigation ; curseur : absent au toucher (`hasTouch`) et en mouvement réduit, caché après Tab, `elementFromPoint` le traverse ; titre vivant : nom accessible du `h1` inchangé, 0 lettre transformée en mouvement réduit ; calme : `aria-pressed`, mémorisé après rechargement, curseur et titre vivant arrêtés |
| `browser/immersif-grille.mjs` (I1) | `/composants/` : 63 tuiles en 5 familles dans l'ordre de `pieces`, chaque lien répond 200 ; couleurs calculées des tuiles au repos dans les valeurs du thème (3 thèmes ; liste des rôles lue sur la page) ; 375 px : 0 défilement horizontal |
| `browser/immersif-mur.mjs` (I2) | `/` à 1 440 × 900 : mode mur, 72 tuiles 3D, 72 liens ; clic sur une tuile → la bonne page ; Tab : les 10 premières tuiles dans l'ordre, la caméra suit, 1 seul anneau 3D ; flèches ; Entrée → page en moins de 2 s ; sans JS, sans WebGL, sans 3D CSS, mouvement réduit, 800 × 600, calme : grille immobile de 72 liens, 0 image de scène ; seuil franchi sans recharger dans les deux sens ; 375 px : 0 défilement ; orbite 5 s : ≥ 50 images par seconde et pire intervalle ≤ 50 ms (banc sans GPU) ; ≤ 30 tuiles 3D visibles au repos (élagage) et ≤ 8 000 nœuds DOM (`Performance.getMetrics`, estimé) ; textes de la scène : paires autorisées ≥ 4,5 ; axe 0 en mode mur et en mode grille, 3 thèmes ; introduction `inert` en mode mur ; arbre ARIA de `/` en mode mur = celui de la grille (API `ariaSnapshot` de Playwright à confirmer) |
| `browser/immersif-pieces.mjs` (I3) | pages de pièce : en-tête et tuile en grand présents, 1 `h1`, ancres `s-` ; aimant : un `.ch-btn` se déplace vers le pointeur (≤ 14 px) puis revient à `transform: none` ; aucun aimant au toucher, en mouvement réduit, en calme ; pièces voisines = ordre du mur ; « Le mur » mène à `/#p-<slug>` ; axe 0 sur 5 pages choisies × 3 thèmes (toutes les pages restent couvertes par `a11y.mjs`) |
| `browser/immersif-transitions.mjs` (I4) | boucle mur → plongée → pièce → retour → mur, pièce → voisine, pièce → autre page, avec rechargements intercalés : 60 navigations Chromium (3 thèmes), 20 WebKit ; 0 erreur ; à l'arrivée après plongée, transition présente ; au retour, la caméra part de la tuile et finit libre ; mouvement réduit : 0 animation ; garde de lenteur : ralentissement CPU ×20 (`Emulation.setCPUThrottlingRate`) ou, à défaut, `requestAnimationFrame` ralenti injecté avant chargement → grille en moins de 5 s, message `status`, 0 erreur |

**Les scripts existants doivent rester verts sur les pages changées, sans retouche** :
- `00-core` et `fiches` (statiques) : contraintes de M1 sur `/`.
- `ids-uniques` : tuiles sans id (règle M7), ancres `s-` ; les clones 3D n'existent qu'à l'exécution.
- `denylist` : pages construites ; plus la passe de `checks/tuiles.mjs` sur les sources.
- `a11y` : toutes les pages × 3 thèmes à 1 280 px (mode mur sur `/` si le Chromium sans fenêtre a WebGL, comme dans la maquette), à 375 px (grille), et l'accueil en WebKit × 3 thèmes (mode mur si WebKit a WebGL : non vérifié).
- `check-overflow` : scène, grille cachée et calque du curseur sont dans des boîtes `overflow: hidden`, ignorées par le script ; le curseur n'existe pas tant que la souris n'a pas bougé.
- `motion` : en mouvement réduit tout est à plat. **Coût connu** : ses survols visent aussi les contrôles des miniatures, `inert` et couverts par le lien de la tuile ; chacun attend 2 s avant d'être passé (au plus 25 par page) : environ +50 s sur `/` et +50 s sur `/composants/` (estimé, non mesuré).
- `palette` : ne lit que `.doc-example__preview` ; les aimants ne changent que `transform`. Les tuiles sont lues par `immersif-grille`.
- `parity`, `keyboard`, `host`, `mutation` : pages d'essai `/parity/…` et `tests/host.html`, non touchées.
- `chopa-js`, `contenu`, `medias`, `fenetres`, `retours`, `nav-statique`, `effets` : ils agissent sur les exemples des pages de pièce et sur `/effets/` ; les aimants ne bougent pas un bouton sous un pointeur posé en son centre, et le curseur ne capte aucun clic. **À prouver par I0 et I3** : toute la suite verte.
- **Aucun contrôle existant n'a besoin d'apprendre les nouvelles pages** : `/` et `/composants/` restent des `index.html` trouvés par `listPages`. Les seuls ajouts sont `checks/tuiles.mjs` et les scripts ci-dessus.

### 16.9 Jalons

Un agent Sonnet par jalon (S ≈ 100–160 k, M ≈ 160–300 k tokens, non mesurés). Les agents ne commitent pas ; Diapason vérifie (build, `npm test`, `npm run test:browser`, navigateur) puis commite. **Critères communs (C′)** : critères C de la section 10 ; `npm run build`, `npm test` et `npm run test:browser` à 0 avec **tous** les scripts existants inchangés (`git diff --stat scripts/ tests/` ne montre que des fichiers ajoutés) ; `src/`, `dist-lib/` et `chopa.css` inchangés ; 0 erreur console sur les pages touchées ; textes fictifs.

| Jalon | Contenu et fichiers | Scripts créés | Critères propres (en plus de C′) | Taille |
|---|---|---|---|---|
| **I0** socle commun (le plus petit squelette qui tourne) | `DocLayout.astro` (seul jalon qui le touche, détail en 16.5) ; `site/src/immersif/{tete.js, socle.css, curseur.js, vivant.js, calme.js}` | `static/size-immersif.mjs`, `browser/immersif-socle.mjs` | sur les pages existantes : 60 navigations Chromium et 20 WebKit, **0 erreur** (sinon M16) ; inscription en tête de `<head>` lue dans le HTML construit ; curseur, titre vivant, calme et mouvement réduit selon 16.8 ; JS ajouté ≤ 4 Ko gzip par page ; 0 `__THREE__` | M |
| **I1** tuiles et grille | `site/src/tuiles/*.html` (72, reprises de la maquette) ; `site/src/immersif/{donnees-mur.mjs, familles-mur.mjs, tuiles.css}` ; `site/src/components/Tuiles.astro` ; `pages/composants/index.astro` | `checks/tuiles.mjs`, `browser/immersif-grille.mjs` | `checks/tuiles` vert, et rouge sur une tuile retirée, un `id`, un `style`, un `<path>`, un mot de la denylist (mutations à la main, restaurées, notées au JOURNAL) ; `/composants/` : 63 tuiles, ordre de `pieces`, liens 200, axe 0 × 3 thèmes, 375 px sans défilement, couleurs des tuiles dans la palette | M |
| **I2** le mur | `pages/index.astro` (seul jalon) ; `site/src/immersif/{mode.js, mur.js, mur.css, scene.js}` ; `pages/licences/three.txt.ts` | `browser/immersif-mur.mjs` | tous les points d'`immersif-mur` (16.8) ; `00-core` et `fiches` verts sur la nouvelle accueil ; budgets `/` (≤ 8 Ko au départ, ≤ 40 Ko à la demande) ; garde de lenteur et élagage écrits (mesurés à I4) | M |
| **I3** pages de pièce | `pages/composants/[slug].astro` (seul jalon) ; `site/src/immersif/{aimants.js, piece.css}` | `browser/immersif-pieces.mjs` | tous les points d'`immersif-pieces` ; `chopa-js`, `contenu`, `medias`, `fenetres`, `retours`, `nav-statique` verts sans retouche ; budget pièce ≤ 6 Ko ; 63 pages construites | M |
| **I4** transitions et intégration | aucun exécuteur ; retouches permises dans `site/src/immersif/**` seulement | `browser/immersif-transitions.mjs` | boucle de 60 + 20 navigations à 0 erreur (sinon M16) ; garde de lenteur déclenchée ; seuils de M14 réglés et notés ; suite complète verte ; temps total du banc noté | S |

**Point de contrôle n° 9 (utilisateur), après I4** : le mur sur le Mac réel (Chrome, Safari), une plongée, une page de pièce, la version calme, le téléphone (grille) ; la fluidité se juge ici (le banc n'a pas de GPU). **Testeur Sonnet n° 3** ensuite, sur la doc immersive (référence : `maquette/immersif/`), avant la mise en ligne.

### 16.10 Parallélisme et ordre avec la mise en ligne

Règles de la section 11 (racine `CH_OUT` par agent, fichiers disjoints, Diapason vérifie chaque agent à part puis l'ensemble).

| Paire | Fichiers disjoints | Condition |
|---|---|---|
| I0 ‖ I1 | I0 : `DocLayout`, `immersif/{tete, socle, curseur, vivant, calme}`, 2 scripts ; I1 : `tuiles/`, `immersif/{donnees-mur, familles-mur, tuiles.css}`, `Tuiles.astro`, `composants/index.astro`, 2 scripts | aucune ; Diapason rejoue la suite complète après les deux |
| I2 ‖ I3 | I2 : `index.astro`, `immersif/{mode, mur, mur.css, scene}`, `licences/` ; I3 : `[slug].astro`, `immersif/{aimants, piece.css}` | I0 et I1 vérifiés ; la plongée vers une page de pièce se teste à I4 |

Séquentiel : I4 après I2 et I3. **Mise en ligne (proposition)** : le réglage d'Access (étape 2 en pause) peut se faire quand l'utilisateur veut, puisqu'il ne dépend pas du contenu ; le vrai `site/dist` n'est envoyé qu'**après** le point de contrôle 9 et le testeur n° 3. Raisons : un seul envoi au lieu de deux (chaque envoi crée des adresses d'aperçu), et l'accueil change entièrement. Rien n'est envoyé sans accord.

### 16.11 Risques et points ouverts

**Risques**
- **Transitions abandonnées** : cause non prouvée (16.7) ; parade M15, test de 60 + 20 navigations dès I0, repli M16.
- **Sans GPU ou machine lente** : WebGL sert d'indice, mais un rendu logiciel (SwiftShader, celui du banc) le satisfait aussi ; parade M14 (garde de lenteur). Fluidité réelle non mesurée avant le point de contrôle 9.
- **Mémoire** : 72 calques 3D de 260 px (environ 1 Mo chacun à une densité de 2, soit environ 75 Mo pour le tout : estimation, non mesurée) ; agrandissement pendant la plongée. Parade : élagage (tuile hors de la fenêtre élargie à 2 largeurs : `visibility: hidden`, plus de calque), ≤ 30 tuiles visibles mesurées à I2.
- **Safari et Firefox** : 3D CSS courante ; transitions entre documents dans Safari 18.2 et Chrome 126 (relevé MDN du brief 31) ; Firefox sans elles jusqu'à la 162 (annoncée le 2026-12-08, non revérifié) ; le banc a le WebKit de Playwright, pas Safari ; netteté du texte grossi en fin de plongée vue un peu floue dans la maquette.
- **Focus en 3D** : le lien focalisé est invisible par construction, seul son clone porte l'anneau ; si la scène se fige, l'anneau disparaît. Parade : garde de lenteur, filet du module, test « 1 seul anneau 3D par Tab ».
- **Banc plus long** : `motion` (+100 s estimés), deux scripts de 60 navigations, `a11y` sur un accueil plus lourd ; non mesuré.
- **Scripts Astro** : placement et regroupement des `<script>` traités par Astro 7.4.12 non vérifiés ; I0 lit le HTML construit et note ce qui sort.
- **Aimants et tests existants** : un test qui viserait un point près d'un bouton plutôt que son centre verrait le bouton bouger ; parade : I3 rejoue toute la suite.
- **Arbre ARIA** : lecteur d'écran réel non testé (limite de la section 9).

**Points ouverts (à soumettre à l'utilisateur)**
1. Ordre avec la mise en ligne (16.10) : Access quand il veut, envoi du site après le point de contrôle 9.
2. `/composants/` devient la grille immobile (fin de la liste en cartes).
3. Plus de barre latérale sur les pages de pièce (menu dans la barre, pièces voisines), comme la maquette.
4. « Version calme » sur toutes les pages, pas seulement sur le mur.
5. Titre vivant sur le premier `h1` de toutes les pages de la doc.
6. Seuils de la garde de lenteur (M14) et de l'élagage : estimés, réglés à I4.

### 16.12 Ce que les exécuteurs ne font pas

- Modifier un script ou un contrôle existant (`scripts/**`, `tests/**`), `src/css`, `src/js`, `dist-lib/`, `package.json`, `astro.config.mjs`, `Example.astro`, `pieces.mjs`, ou un exécuteur réservé à un autre jalon.
- Ajouter une dépendance (ni GSAP, ni bibliothèque de défilement, ni routeur), importer `three.module.js` ou un moteur WebGL, copier three dans `public/`, utiliser `<ClientRouter />`.
- Mettre une classe `im-` dans la bibliothèque, ou une couleur hors des jetons (canevas compris).
- Désactiver un effet parce que la page est pilotée par un robot (`navigator.webdriver`), masquer une erreur de console autrement que par la garde de 16.7, cacher un anneau de focus, rendre focalisable un élément du calque 3D.
- Écrire un vrai nom ou un texte non fictif ; commiter ; envoyer quoi que ce soit en ligne.
