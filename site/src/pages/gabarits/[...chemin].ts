// Gabarits (Diapason, 2026-11-16) : chaque fichier site/src/templates/<genre>/<page>.html est un document HTML complet,
// publié tel quel à /gabarits/<genre>/<page>/ (une vraie page, hors du cadre de la doc). Ajouter un gabarit = ajouter un
// fichier : aucune liste à tenir. Contrôles statiques : scripts/checks/gabarits.mjs.
export function getStaticPaths() {
  const fichiers = import.meta.glob('../../templates/*/*.html', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
  return Object.entries(fichiers).map(([f, html]) => {
    const [, genre, page] = f.match(/templates\/([\w-]+)\/([\w-]+)\.html$/) ?? [];
    return { params: { chemin: `${genre}/${page}/index.html` }, props: { html } };
  });
}
export const GET = ({ props }: { props: { html: string } }) =>
  new Response(props.html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
