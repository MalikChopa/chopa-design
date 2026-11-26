// Les deux familles propres au mur (docs/ARCHITECTURE.md §16.4, décision M8) : la seule liste écrite à la main.
// Chaque entrée : slug (nom du fichier site/src/tuiles/<slug>.html), titre, but, href (page construite).
// JavaScript pur : checks/tuiles.mjs l'importe sous node, donnees-mur.mjs sous Vite.
// Gabarits : une tuile par genre (dossier site/src/templates/<genre>/), vers une page du genre.
export const FAMILLES_MUR = [
  { famille: 'Gabarits', pieces: [
    { slug: 'gabarit-portfolio', titre: 'Portfolio', but: 'Page d\'accueil d\'un photographe fictif.', href: '/gabarits/portfolio/accueil/' },
    { slug: 'gabarit-jeu', titre: 'Jeu vidéo', but: 'Page d\'un jeu de plateforme fictif.', href: '/gabarits/jeu/accueil/' },
    { slug: 'gabarit-appli', titre: 'Appli', but: 'Tableau de bord d\'une appli fictive.', href: '/gabarits/appli/tableau-de-bord/' },
    { slug: 'gabarit-blog', titre: 'Blog', but: 'Article d\'un blog de cuisine fictif.', href: '/gabarits/blog/liste/' },
    { slug: 'gabarit-doc', titre: 'Doc', but: 'Page de documentation fictive.', href: '/gabarits/doc/accueil/' },
    { slug: 'gabarit-boutique', titre: 'Boutique', but: 'Fiche produit d\'une boutique fictive.', href: '/gabarits/boutique/liste/' },
  ] },
  { famille: 'Marque et icônes', pieces: [
    { slug: 'marque', titre: 'Marque', but: 'Le logo CHOPA et son point carré orange.', href: '/marque/' },
    { slug: 'icones', titre: 'Icônes', but: 'Les 15 glyphes Carbon du sprite.', href: '/icones/' },
    { slug: 'grain', titre: 'Grain', but: 'Le grain en option, désactivé par défaut.', href: '/effets/' },
  ] },
];
