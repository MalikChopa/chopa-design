// Exécuteur des contrôles de structure : charge chaque scripts/checks/*.mjs par glob (ordre alphabétique).
// Un fichier exporte par défaut `ctx => [{ nom, ok, detail }]`, éventuellement async. Les 22 contrôles de J0 sont
// dans checks/00-core.mjs, les « 0 data-theme » dans checks/01-no-data-theme.mjs (déplacés à J1b-1).
// Lit dist-lib/ et site/dist/ (sous CH_OUT s'il est défini), liste tous les échecs, code 1 si échec.
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT, OUT, DIST, SITE_DIST } from './lib/paths.mjs';

const fails = [];
let n = 0;
const check = (name, ok, detail = '') => { n++; if (!ok) fails.push(`${name}${detail ? ' : ' + detail : ''}`); };

// Tous les fichiers d'un dossier (récursif), sans .astro ni node_modules.
const walk = (dir) => {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((nom) => {
    const p = join(dir, nom);
    if (nom === '.astro' || nom === 'node_modules') return [];
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
};
const listFiles = (dir, ext) => walk(dir).filter((f) => f.endsWith(ext)).map((f) => relative(ROOT, f)).sort();
const readOpt = (p) => (existsSync(p) ? readFileSync(p, 'utf8') : '');

const checksDir = join(ROOT, 'scripts', 'checks');
const ctx = {
  ROOT, OUT, walk, listFiles,
  css: readOpt(join(DIST, 'chopa.css')),
  js: readOpt(join(DIST, 'chopa.js')),
  dist: { lib: DIST, site: SITE_DIST },
  exemples: listFiles(join(ROOT, 'site', 'src', 'examples'), '.html'),
  fiches: listFiles(join(ROOT, 'site', 'src', 'data'), '.mjs'),
};
if (!ctx.css) check('fichier absent : dist-lib/chopa.css', false);

const checkFiles = existsSync(checksDir) ? readdirSync(checksDir).filter((f) => f.endsWith('.mjs')).sort() : [];
for (const f of checkFiles) {
  try {
    const mod = await import(pathToFileURL(join(checksDir, f)).href);
    for (const r of await mod.default(ctx)) check(`${f} : ${r.nom}`, r.ok, r.detail);
  } catch (e) {
    check(`${f} : chargement`, false, e.message);
  }
}

if (fails.length) {
  console.error(`check-dist : ${fails.length} échec(s) sur ${n} contrôles`);
  for (const f of fails) console.error('  - ' + f);
  process.exit(1);
}
console.log(`check-dist : ${n} contrôles, 0 échec (${checkFiles.length} fichier(s) dans scripts/checks/)`);
