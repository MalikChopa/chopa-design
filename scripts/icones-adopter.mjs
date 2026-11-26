// Adopte un jeu d'icônes dans src/icons/ (J8a). Usage :
//   node scripts/icones-adopter.mjs <maison|carbon|material|lucide>            essai à blanc : liste, ne touche à rien
//   node scripts/icones-adopter.mjs <jeu> --appliquer                           fait les changements et écrit la liste d'annulation
//   node scripts/icones-adopter.mjs --annuler                                   défait le dernier --appliquer
// Sources : maison = les glyphes actuels de src/icons/core/ (ou ceux déjà adoptés : rien à écrire) ;
// carbon, material, lucide = site/src/icones-candidats/<jeu>/ (15 SVG + LICENSE).
// Chaque SVG écrit est normalisé : width, height, class, fill, stroke retirés de <svg>, commentaires retirés,
// viewBox conservé, dessin enveloppé dans un <g> qui impose la couleur (remplissage currentColor pour carbon et material ;
// trait currentColor, épaisseur 2, bouts arrondis pour lucide). Le sprite (scripts/build-css.mjs) reprend l'intérieur du <svg>,
// donc le <g> voyage avec le symbole : icon.css n'a pas à changer pour que le rendu soit juste.
// Aucune dépendance, rien hors du dossier du projet. La liste d'annulation est .out/icones-annulation.json (contenu des fichiers retirés ou remplacés).
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, rmSync, rmdirSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ICONS = join(ROOT, 'src', 'icons');
const CAND = join(ROOT, 'site', 'src', 'icones-candidats');
const UNDO = join(ROOT, '.out', 'icones-annulation.json');
const NOMS = ['chevron-up', 'chevron-down', 'chevron-left', 'chevron-right', 'close', 'check', 'arrow', 'search', 'sort', 'plus', 'minus', 'info', 'alert', 'menu', 'copy'];
const JEUX = {
  maison: { mode: 'tel', licence: null, note: 'glyphes maison : trait 2, bouts carrés, jointures en angle (déjà écrits dans les fichiers)' },
  carbon: { mode: 'plein', licence: 'Apache-2.0', note: 'Carbon 11.91.0 : remplissage, grille 32' },
  material: { mode: 'plein', licence: 'Apache-2.0', note: 'Material Symbols sharp 0.48.2 : remplissage, grille 960' },
  lucide: { mode: 'trait', licence: 'ISC', note: 'Lucide 1.66.0 : trait 2, bouts et jointures arrondis' },
};
const rel = (p) => relative(ROOT, p);
const args = process.argv.slice(2);
const appliquer = args.includes('--appliquer');

function normaliser(brut, mode) {
  const m = brut.match(/<svg\b([^>]*)>([\s\S]*?)<\/svg>/);
  if (!m) throw new Error('SVG illisible');
  const vb = (m[1].match(/viewBox="([^"]+)"/) || [])[1];
  if (!vb) throw new Error('viewBox absent');
  const dessin = m[2].replace(/<!--[\s\S]*?-->/g, '').replace(/\s+/g, ' ').replace(/> </g, '><').trim();
  const g = mode === 'plein' ? `<g fill="currentColor" stroke="none">${dessin}</g>`
    : mode === 'trait' ? `<g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${dessin}</g>`
    : dessin;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}">${g}</svg>\n`;
}
const lister = (dir) => (existsSync(dir) ? readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? lister(join(dir, e.name)) : [join(dir, e.name)])) : []);

if (args.includes('--annuler')) {
  if (!existsSync(UNDO)) { console.error('Rien à annuler : .out/icones-annulation.json absent.'); process.exit(1); }
  const u = JSON.parse(readFileSync(UNDO, 'utf8'));
  for (const f of u.crees) { rmSync(join(ROOT, f), { force: true }); }
  for (const [f, contenu] of Object.entries(u.sauvegardes)) { mkdirSync(dirname(join(ROOT, f)), { recursive: true }); writeFileSync(join(ROOT, f), contenu); }
  for (const d of u.dossiers ?? []) { try { rmdirSync(join(ROOT, d)); } catch { /* non vide ou absent */ } }
  rmSync(UNDO);
  console.log(`Annulé : ${u.crees.length} fichier(s) créé(s) retiré(s), ${Object.keys(u.sauvegardes).length} restauré(s).`);
  process.exit(0);
}

const jeu = args.find((a) => !a.startsWith('--'));
if (!jeu || !JEUX[jeu]) { console.error('Usage : node scripts/icones-adopter.mjs <maison|carbon|material|lucide> [--appliquer] | --annuler'); process.exit(2); }
const J = JEUX[jeu];

// Source des 15 SVG.
const srcDir = jeu === 'maison' ? join(ICONS, 'core') : join(CAND, jeu);
const dstDir = jeu === 'maison' ? join(ICONS, 'core') : join(ICONS, jeu);
const sources = NOMS.map((n) => ({ nom: n, from: join(srcDir, `${n}.svg`) }));
const manque = sources.filter((s) => !existsSync(s.from));
if (manque.length) { console.error(`Source incomplète : ${manque.map((s) => rel(s.from)).join(', ')}`); process.exit(1); }

const plan = { ecrire: [], remplacer: [], retirer: [], licence: null };
for (const s of sources) {
  const to = join(dstDir, `${s.nom}.svg`);
  if (jeu === 'maison') continue; // déjà en place : aucune écriture
  const sortie = normaliser(readFileSync(s.from, 'utf8'), J.mode);
  (existsSync(to) ? plan.remplacer : plan.ecrire).push({ to, sortie, from: s.from });
}
if (J.licence) plan.licence = { from: join(CAND, jeu, 'LICENSE'), to: join(dstDir, 'LICENSE') };
// Retirer les glyphes des autres jeux (dossiers de src/icons/ autres que le jeu adopté).
for (const f of lister(ICONS)) if (!f.startsWith(dstDir + '/')) plan.retirer.push(f);

console.log(`Jeu : ${jeu} (${J.note})${appliquer ? '' : ' [ESSAI À BLANC : rien n\'est écrit]'}`);
console.log(`Source : ${rel(srcDir)}/ ; destination : ${rel(dstDir)}/`);
console.log(`\nNormalisation : ${J.mode === 'plein' ? 'remplissage : <g fill="currentColor" stroke="none">' : J.mode === 'trait' ? 'trait : <g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' : 'aucune (fichiers laissés tels quels)'} ; width, height, class, commentaires retirés ; viewBox conservé.`);
console.log(`\nÀ écrire (${plan.ecrire.length}) :`); for (const e of plan.ecrire) console.log(`  + ${rel(e.to)}  <- ${rel(e.from)}`);
console.log(`À remplacer (${plan.remplacer.length}) :`); for (const e of plan.remplacer) console.log(`  ~ ${rel(e.to)}  <- ${rel(e.from)}`);
console.log(`À retirer (${plan.retirer.length}) :`); for (const f of plan.retirer) console.log(`  - ${rel(f)}`);
console.log(`Licence : ${plan.licence ? `copier ${rel(plan.licence.from)} -> ${rel(plan.licence.to)} (${J.licence})` : 'aucune (dessins du projet)'}`);
console.log(`\nConstruction : scripts/build-css.mjs ne lit que les *.svg de src/icons/ (sprite) ; il NE copie PAS la licence dans dist-lib/.${plan.licence ? ' À ajouter par Diapason : copier src/icons/' + jeu + '/LICENSE vers dist-lib/ (par ex. dist-lib/LICENSE-icones.txt) et citer le jeu dans l\'en-tête de chopa.css et sur la page Installation.' : ''}`);
console.log(`icon.css : ${J.mode === 'plein' ? 'aucun changement obligatoire (le <g> de chaque symbole impose fill currentColor et stroke none). Facultatif, pour la lisibilité : remplacer « fill: none; stroke: currentColor » par « fill: currentColor; stroke: none » dans .ch-icon.' : 'aucun changement obligatoire (trait currentColor, déjà la règle de .ch-icon ; le <g> impose en plus l\'épaisseur et les bouts).'}`);
console.log(`\nEffet sur les exemples et gabarits : aucun (ils référencent #ch-i-<nom> ; les 15 noms sont conservés).`);

if (!appliquer) { console.log('\nEssai à blanc terminé. Pour appliquer : ajouter --appliquer (accord de suppression des autres jeux requis).'); process.exit(0); }

// Application : sauvegarde du contenu avant, puis écriture.
const sauvegardes = {}; const crees = []; const dossiers = [];
for (const f of plan.retirer) sauvegardes[rel(f)] = readFileSync(f, 'utf8');
for (const e of plan.remplacer) sauvegardes[rel(e.to)] = readFileSync(e.to, 'utf8');
if (plan.licence && existsSync(plan.licence.to)) sauvegardes[rel(plan.licence.to)] = readFileSync(plan.licence.to, 'utf8');
if (!existsSync(dstDir)) dossiers.push(rel(dstDir));
mkdirSync(dstDir, { recursive: true });
for (const e of [...plan.ecrire, ...plan.remplacer]) { writeFileSync(e.to, e.sortie); if (!(rel(e.to) in sauvegardes)) crees.push(rel(e.to)); }
if (plan.licence) { if (!(rel(plan.licence.to) in sauvegardes)) crees.push(rel(plan.licence.to)); writeFileSync(plan.licence.to, readFileSync(plan.licence.from, 'utf8')); }
for (const f of plan.retirer) rmSync(f);
for (const d of readdirSync(ICONS, { withFileTypes: true })) if (d.isDirectory() && join(ICONS, d.name) !== dstDir && !lister(join(ICONS, d.name)).length) rmSync(join(ICONS, d.name), { recursive: true });
mkdirSync(dirname(UNDO), { recursive: true });
writeFileSync(UNDO, JSON.stringify({ jeu, date: new Date().toISOString(), crees, sauvegardes, dossiers }, null, 1));
console.log(`\nFait. Liste d'annulation : ${rel(UNDO)} (défaire : node scripts/icones-adopter.mjs --annuler).`);
