// Génère la page du mur (index.html) et les données des pages de pièce (donnees.js) de la maquette immersive.
// Lit les fiches site/src/data/*.mjs (lecture seule) et les miniatures de outils/apercus.mjs.
// Usage, depuis la racine du projet : node maquette/immersif/outils/generer.mjs
// N'écrit que dans maquette/immersif/ (index.html et donnees.js).
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { apercus, extras } from './apercus.mjs';

const ICI = dirname(fileURLToPath(import.meta.url));
const MAQ = join(ICI, '..');
const DATA = join(ICI, '../../../site/src/data');
const FAMILLES = ['Fondations', 'Base et formulaires', 'Navigation', 'Contenu et médias', 'Retours et fenêtres'];

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const rang = (f) => { const i = FAMILLES.indexOf(f); return i < 0 ? FAMILLES.length : i; };
const ancre = (f) => f.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const fiches = [];
for (const f of readdirSync(DATA).filter((n) => n.endsWith('.mjs')).sort()) {
  const mod = await import(pathToFileURL(join(DATA, f)).href);
  fiches.push({ slug: f.replace(/\.mjs$/, ''), ...mod.default });
}
fiches.sort((a, b) => rang(a.famille) - rang(b.famille) || a.titre.localeCompare(b.titre, 'fr'));

const groupes = FAMILLES.map((famille) => ({ famille, pieces: fiches.filter((p) => p.famille === famille) }));
for (const x of extras) groupes.push({ famille: x.famille, pieces: x.pieces });

const manquants = fiches.filter((p) => !apercus[p.slug]).map((p) => p.slug);
if (manquants.length) throw new Error(`miniature manquante : ${manquants.join(', ')}`);

const lien = (slug) => (slug === 'button' ? 'bouton.html' : `piece.html?p=${encodeURIComponent(slug)}`);
const donnees = [];
let html = '';
let nav = '';
let total = 0;
groupes.forEach((g, gi) => {
  const nf = String(gi + 1).padStart(2, '0');
  const id = ancre(g.famille);
  nav += `<li><a class="im-familles__lien" href="#famille-${id}" data-famille="${gi}"><span class="im-familles__num" aria-hidden="true">${nf}</span> ${esc(g.famille)}</a></li>\n`;
  html += `<section class="im-famille" id="famille-${id}" data-famille="${gi}" data-nom="${esc(g.famille)}" data-num="${nf}" aria-labelledby="t-${id}">\n`;
  html += `<h2 class="im-famille__titre" id="t-${id}"><span class="im-famille__num" aria-hidden="true">${nf}</span> ${esc(g.famille)} <span class="im-famille__compte">${g.pieces.length} pièces</span></h2>\n`;
  html += `<ul class="im-tuiles" role="list">\n`;
  g.pieces.forEach((p, pi) => {
    const a = apercus[p.slug] ?? { html: p.html };
    const num = `${nf}·${String(pi + 1).padStart(2, '0')}`;
    const z = a.z ? ` im-z${a.z}` : '';
    html += `<li class="im-tuile" id="p-${p.slug}" data-slug="${p.slug}" data-famille="${gi}">`
      + `<div class="im-tuile__apercu${z}" inert aria-hidden="true">${a.html}</div>`
      + `<p class="im-tuile__pied"><span class="im-tuile__num" aria-hidden="true">${num}</span><a class="im-tuile__lien" href="${lien(p.slug)}">${esc(p.titre)}</a></p></li>\n`;
    donnees.push({ slug: p.slug, titre: p.titre, famille: g.famille, num, but: p.but ?? '', href: lien(p.slug), apercu: a.html, z: a.z ?? 0 });
    total++;
  });
  html += `</ul>\n</section>\n`;
});

const gabarit = readFileSync(join(ICI, 'index.gabarit.html'), 'utf8');
const sortie = gabarit
  .replace('<!--TUILES-->', html.trimEnd())
  .replace('<!--FAMILLES-->', nav.trimEnd())
  .replaceAll('<!--TOTAL-->', String(total))
  .replaceAll('<!--NB-FAMILLES-->', String(groupes.length));
writeFileSync(join(MAQ, 'index.html'), sortie);
writeFileSync(join(MAQ, 'donnees.js'),
  `// Généré par outils/generer.mjs depuis site/src/data/*.mjs et outils/apercus.mjs : ne pas modifier à la main.\n`
  + `export const pieces = ${JSON.stringify(donnees, null, 0)};\n`);
console.log(`index.html : ${total} tuiles en ${groupes.length} familles ; donnees.js : ${donnees.length} pièces`);
