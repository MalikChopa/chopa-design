// Couverture (J1b-2) : toute classe `ch-` définie dans le chopa.css construit (racines, variantes, parties) doit figurer
// dans une fiche (champ `classes`) ou dans le HTML d'un exemple d'une fiche. Échoue en nommant chaque classe sans entrée.
// Exceptions : seulement des pièces d'un jalon futur, chacune avec son jalon, affichées à chaque exécution. Une exception
// devient inutile quand la fiche de la pièce existe : la retirer alors (le contrôle le signale).
// J2b : l'exception de ch-btn est retirée (fiche `button`) ; la liste est vide.
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

// Pièces dont la fiche viendra d'un jalon suivant : préfixe de classe -> jalon (ARCHITECTURE.md section 4).
export const EXCEPTIONS = [];

const sansCommentaires = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');
const sansChaines = (css) => css.replace(/"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'/g, '""').replace(/url\([^)]*\)/g, 'url()');

export default async function couverture(ctx) {
  const res = [];
  const add = (nom, ok, detail = '') => res.push({ nom, ok: Boolean(ok), detail });

  // 1. Classes définies : `.ch-xxx` dans les sélecteurs de chopa.css.
  const css = sansChaines(sansCommentaires(ctx.css));
  const definies = [...new Set([...css.matchAll(/\.(ch-[a-z0-9_-]+)/g)].map((m) => m[1]))].sort();
  add(`classes ch- lues dans chopa.css : ${definies.length}`, definies.length > 0);

  // 2. Classes couvertes : champ `classes` des fiches + classes des exemples de leurs variantes.
  const couvertes = new Map();
  const noter = (cls, slug) => { if (!couvertes.has(cls)) couvertes.set(cls, new Set()); couvertes.get(cls).add(slug); };
  for (const rel of ctx.fiches) {
    const slug = rel.replace(/^.*\/([^/]+)\.mjs$/, '$1');
    let f;
    try { f = (await import(pathToFileURL(join(ctx.ROOT, rel)).href)).default; } catch (e) { add(`${slug} : fiche lisible`, false, e.message); continue; }
    for (const c of f?.classes ?? []) noter(c, slug);
    for (const v of f?.variantes ?? []) {
      const p = join(ctx.ROOT, 'site', 'src', 'examples', `${v.exemple}.html`);
      if (!existsSync(p)) continue; // signalé par fiches.mjs
      for (const m of readFileSync(p, 'utf8').matchAll(/\bch-[a-z0-9_-]+/g)) noter(m[0], slug);
    }
  }

  // 3. Exceptions : affichées à chaque exécution.
  const exemptees = new Set();
  for (const e of EXCEPTIONS) {
    const touchees = definies.filter((c) => e.motif.test(c));
    const nonCouvertes = touchees.filter((c) => !couvertes.has(c));
    for (const c of touchees) exemptees.add(c);
    console.log(`couverture : exception ${e.nom}, jalon ${e.jalon} : ${touchees.length} classe(s) définie(s), ${nonCouvertes.length} sans entrée (${nonCouvertes.join(', ') || 'aucune'})`);
    if (touchees.length === 0) add(`exception inutile : ${e.nom} (${e.jalon}) ne correspond à aucune classe`, false, 'retirer l\'exception');
    else if (nonCouvertes.length === 0) add(`exception inutile : ${e.nom} (${e.jalon}) : toutes ses classes sont couvertes`, false, 'retirer l\'exception');
  }

  // 4. Chaque classe définie a une entrée.
  const sansEntree = definies.filter((c) => !couvertes.has(c) && !exemptees.has(c));
  add(`chaque classe ch- définie a une entrée (${definies.length - sansEntree.length - [...exemptees].length} couvertes, ${exemptees.size} en exception)`, sansEntree.length === 0, sansEntree.length ? `sans entrée : ${sansEntree.join(', ')}` : '');
  return res;
}
