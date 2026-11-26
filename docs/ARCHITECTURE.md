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
