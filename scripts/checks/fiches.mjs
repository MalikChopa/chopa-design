// Une fiche, une page, une entrée de navigation et de recherche par pièce (J1b-1, docs/ARCHITECTURE.md sections 8 et 9).
// Pour chaque site/src/data/<slug>.mjs : champs obligatoires, exemples présents, page site/dist/composants/<slug>/index.html,
// lien dans la navigation (accueil) et entrée dans recherche.json. Sans fiche, ne rend qu'un contrôle d'état (0 fiche).
import { existsSync, readFileSync } from 'node:fs';
import { join, basename } from 'node:path';
import { pathToFileURL } from 'node:url';

const TEXTES = ['titre', 'famille', 'jalon', 'but'];

export default async function fiches(ctx) {
  const res = [];
  const add = (nom, ok, detail = '') => res.push({ nom, ok: Boolean(ok), detail });
  const site = ctx.dist.site;
  const accueil = existsSync(join(site, 'index.html')) ? readFileSync(join(site, 'index.html'), 'utf8') : '';
  let recherche = [];
  try { recherche = JSON.parse(readFileSync(join(site, 'recherche.json'), 'utf8')); } catch { add('recherche.json lisible', false); }

  add(`${ctx.fiches.length} fiche(s) de pièce lue(s)`, true);
  for (const rel of ctx.fiches) {
    const slug = basename(rel, '.mjs');
    let f;
    try { f = (await import(pathToFileURL(join(ctx.ROOT, rel)).href)).default; } catch (e) { add(`${slug} : import de la fiche`, false, e.message); continue; }
    if (!f || typeof f !== 'object') { add(`${slug} : export par défaut (objet)`, false); continue; }
    for (const k of TEXTES) add(`${slug} : « ${k} » renseigné`, typeof f[k] === 'string' && f[k].trim() !== '');
    add(`${slug} : « ref » vaut P ou N`, f.ref === 'P' || f.ref === 'N');
    add(`${slug} : au moins une variante`, Array.isArray(f.variantes) && f.variantes.length > 0);
    for (const v of f.variantes ?? []) add(`${slug} : exemple présent : ${v.exemple}`, typeof v.exemple === 'string' && ctx.exemples.includes(`site/src/examples/${v.exemple}.html`));
    add(`${slug} : page construite`, existsSync(join(site, 'composants', slug, 'index.html')));
    add(`${slug} : lien dans la navigation`, accueil.includes(`href="/composants/${slug}/"`));
    add(`${slug} : entrée dans la recherche`, recherche.some((x) => x.url === `/composants/${slug}/`));
  }
  return res;
}
