// Index de recherche : généré des fiches (data/) et de la navigation de premier niveau. Aucune liste à tenir à la main.
import { pieces, classesDe, pagesNav } from '../lib/pieces.mjs';

export const GET = () => {
  const items = [
    ...pagesNav.filter((p) => p.existe).map((p) => ({ titre: p.titre, famille: 'Pages', but: p.but, classes: [], url: p.chemin })),
    ...pieces.map((p) => ({ titre: p.titre, famille: p.famille, but: p.but, classes: classesDe(p), url: `/composants/${p.slug}/` })),
  ];
  return new Response(JSON.stringify(items), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
};
