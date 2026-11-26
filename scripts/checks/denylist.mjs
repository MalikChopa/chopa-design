// Contenu fictif (J1b-1, docs/ARCHITECTURE.md section 8) : aucun mot de tests/denylist.txt dans
// site/dist/**/*.html ni dans les sources de contenu (site/src/examples, templates, data ; src/examples s'il existe).
// Échoue si la liste est absente ou vide, ou si aucune page n'a été lue : un vert vide ne prouve rien.
import { readFileSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const sansAccents = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');
const echappe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Une entrée -> expression : mots entiers, pluriel en s/x admis, espaces souples ; un trait d'union ou un tiret bas
// collé au mot l'exclut (classe CSS `doc-lead`).
export function motif(entree) {
  const corps = sansAccents(entree.trim().toLowerCase()).split(/\s+/).map(echappe).join('\\s+');
  return new RegExp(`(?<![\\p{L}\\p{N}_-])${corps}[sx]?(?![\\p{L}\\p{N}_-])`, 'u');
}

export function lireListe(fichier) {
  return readFileSync(fichier, 'utf8').split('\n').map((l) => l.replace(/#.*$/, '').trim()).filter(Boolean);
}

// Trois lectures d'un HTML : brut, balises retirées (« Entreprise</span><span> Exemple » se rejoint), balises en espaces.
function variantes(texte, estHtml) {
  const base = sansAccents(texte).toLowerCase();
  if (!estHtml) return [base];
  return [base, base.replace(/<[^>]*>/g, ''), base.replace(/<[^>]*>/g, ' ')].map((v) => v.replace(/&nbsp;|&#160;/g, ' ').replace(/&#x27;|&#39;|&apos;/g, "'"));
}

export default function denylist(ctx) {
  const liste = join(ctx.ROOT, 'tests', 'denylist.txt');
  if (!existsSync(liste)) return [{ nom: 'tests/denylist.txt présent', ok: false }];
  const entrees = lireListe(liste);
  const res = [{ nom: 'liste non vide', ok: entrees.length > 0, detail: 'tests/denylist.txt ne contient aucune entrée' }];
  const motifs = entrees.map((e) => [e, motif(e)]);

  const pages = ctx.walk(ctx.dist.site).filter((f) => f.endsWith('.html'));
  const sources = ['src/examples', 'site/src/examples', 'site/src/templates', 'site/src/data']
    .flatMap((d) => ctx.walk(join(ctx.ROOT, d)))
    .filter((f) => /\.(html|mjs|astro|md|json|svg)$/.test(f));
  res.push({ nom: 'pages construites lues (> 0)', ok: pages.length > 0, detail: `site/dist : ${pages.length} fichier(s) html` });

  const trouves = [];
  for (const f of [...pages, ...sources]) {
    const vues = variantes(readFileSync(f, 'utf8'), f.endsWith('.html'));
    for (const [entree, re] of motifs) if (vues.some((v) => re.test(v))) trouves.push(`${relative(ctx.ROOT, f)} : « ${entree} »`);
  }
  res.push({ nom: `${pages.length} page(s) et ${sources.length} source(s) sans mot interdit (${entrees.length} entrées)`, ok: trouves.length === 0, detail: trouves.join(' ; ') });
  return res;
}
