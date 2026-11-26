# Chopa Design

La bibliothèque design de l'identité Chopa : une feuille de style à copier dans ses sites, quelques scripts facultatifs, et un site de documentation qui montre chaque pièce en direct avec son code.

Noir, blanc, gris et un seul orange (`#ff5a1f`). Coins carrés partout (seul le bouton radio est rond). Trois thèmes : sombre (par défaut), clair, chaud. Polices Inter Tight et IBM Plex Mono.

## Utiliser la bibliothèque dans un site

1. Copie le dossier `dist-lib/` dans ton site, de façon qu'il soit servi à l'adresse `/chopa/` (par exemple `public/chopa/`).
2. Dans le `<head>` de chaque page :

```html
<html lang="fr" data-ch-theme="sombre">
<head>
  <link rel="stylesheet" href="/chopa/chopa.css">
  <link rel="stylesheet" href="/chopa/chopa-reset.css">   <!-- site neuf seulement -->
  <script src="/chopa/chopa.js" defer
    onerror="document.documentElement.classList.remove('ch-js')"></script>
  <script src="/chopa/chopa-theme.js"></script>
  <script src="/chopa/chopa-effects.js" defer></script>    <!-- seulement pour les bandes et les titres révélés -->
</head>
```

3. Copie le code d'une pièce depuis le site de documentation (pages « Composants » et « Gabarits »).

Le détail, pas à pas, est sur la page « Installation » du site de documentation.

### Ce que contient `dist-lib/`

| Fichier | Rôle | Obligatoire |
|---|---|---|
| `chopa.css` | jetons, thèmes et toutes les pièces : 63 fiches (60 composants, la section, le logotype, les effets) ; classes `ch-`, jetons `--ch-` | oui |
| `fonts/` | Inter Tight et IBM Plex Mono (`woff2`) et leurs licences SIL OFL 1.1 ; à garder à côté de `chopa.css` | oui |
| `chopa-reset.css` | remise à zéro globale (police, couleurs et marges du `body`), pour un site neuf | non |
| `chopa.js` | onglets, menus, tri des tableaux, copie du code, fenêtres, infobulles, notifications, sommaire, valeur du curseur (7 Ko gzip, sans dépendance) | non |
| `chopa-theme.js` | bascule de thème mémorisée (`data-ch-theme-set="sombre\|clair\|chaud"`) | non |
| `chopa-effects.js` | bandes qui défilent et titres révélés (1,4 Ko gzip) | non |
| `chopa-icons.svg` | les 15 icônes (jeu Carbon d'IBM) en sprite : `<use href="/chopa/chopa-icons.svg#ch-i-close">` | si tu utilises des icônes |
| `LICENSE-icones-carbon.txt` | licence Apache-2.0 des icônes Carbon : à garder avec le dossier | avec les icônes |

Sans JavaScript, chaque pièce reste lisible. Le mouvement respecte `prefers-reduced-motion`.

### Changer les couleurs ou l'arrondi d'un site

La page « Créer ton thème » du site de documentation calcule, pour un autre accent, les réglages qui gardent tous les contrastes à 4,5 : 1 au moins, et donne un extrait à coller après `chopa.css`.

### Mettre à jour

Recopie `dist-lib/` par-dessus l'ancien dossier.

## Travailler sur la bibliothèque

Prérequis : node 24 et npm 11.

| Commande | Effet |
|---|---|
| `npm install` | installe les dépendances exactes (Astro, playwright-core, axe-core) |
| `npm run build` | construit `dist-lib/` depuis `src/`, puis le site de documentation dans `site/dist/` |
| `npm run dev` | reconstruit à chaque changement et sert la documentation en local |
| `npm test` | contrôles rapides : structure, contraste, jetons, coins, tailles, thèmes |
| `npm run test:browser` | contrôles dans le navigateur (environ 22 minutes) : accessibilité, débordement, fidélité à la planche, palette, clavier, mouvement réduit, comportements |
| `npm run check` | les deux |
| `node scripts/icones-adopter.mjs <jeu>` | change de jeu d'icônes (essai à blanc, puis `--appliquer`) |

### Où sont les choses

| Dossier | Contenu |
|---|---|
| `src/css/` | un fichier par composant (`40-components/`), les jetons et les thèmes ; concaténés en `dist-lib/chopa.css` |
| `src/js/` | `chopa/` (modules de `chopa.js`), `chopa-theme.js`, `chopa-effects.js` |
| `src/icons/` | le jeu d'icônes en usage (Carbon) |
| `site/src/data/`, `site/src/examples/` | la fiche et les exemples de chaque pièce |
| `site/src/templates/` | les 13 gabarits de pages |
| `scripts/` | construction et contrôles |
| `tests/` | données des contrôles (parité, clavier, fixtures) |
| `maquette/` | la planche de style validée, référence visuelle |
| `docs/ARCHITECTURE.md` | les choix techniques et leurs raisons |

## Licences

- Polices Inter Tight et IBM Plex Mono : SIL Open Font License 1.1 (fichiers dans `dist-lib/fonts/`). Le nom « Plex » est réservé : on ne renomme ni ne modifie le fichier de police.
- Icônes : Carbon 11.91.0 d'IBM, Apache-2.0 (`dist-lib/LICENSE-icones-carbon.txt`).
- Le reste : © 2026 Malik Moussaoui (Chopa), tous droits réservés (voir `LICENSE`). Le dépôt est public pour être lu, pas réutilisé.
