// Construit dist-lib/ par glob, sans dépendance (docs/ARCHITECTURE.md, section 2) :
//   - chopa.css  : src/css/** (répertoires puis noms alphabétiques) concaténés ;
//   - chopa.js   : src/js/chopa/*.js concaténés, s'il en existe (un marqueur de commentaire par module) ;
//   - src/js/*.js : copiés tels quels (chopa-theme.js, chopa-effects.js) ;
//   - src/extras/* : copiés tels quels ;
//   - chopa-icons.svg : sprite de src/icons/<jeu>/<nom>.svg, ignoré s'il n'y en a pas ;
//   - fonts/ : polices et licences ;
// puis copie dist-lib/ vers site/public/chopa/. CH_OUT redirige les sorties (voir scripts/lib/paths.mjs).
// Option --watch : reconstruit à chaque changement de src/ et lance `astro dev` en processus fils.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, copyFileSync, rmSync, cpSync, watch, existsSync } from 'node:fs';
import { join, dirname, relative, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { ROOT, OUT, SRC, DIST, PUBLIC_CHOPA, FONTS_FROM } from './lib/paths.mjs';

const byName = (a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0);

// Liste récursive d'un type de fichier : l'ordre alphabétique des chemins donne l'ordre de concaténation.
function files(dir, ext) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true }).sort(byName)) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...files(p, ext));
    else if (e.name.endsWith(ext)) out.push(p);
  }
  return out;
}

// Sprite : un <symbol id="ch-i-<nom>"> par fichier src/icons/<jeu>/<nom>.svg (viewBox conservé).
function sprite() {
  const list = files(join(SRC, 'icons'), '.svg');
  if (!list.length) return null;
  const symbols = list.map((f) => {
    const svg = readFileSync(f, 'utf8');
    const m = svg.match(/<svg\b([^>]*)>([\s\S]*?)<\/svg>/);
    if (!m) throw new Error(`icône illisible : ${relative(ROOT, f)}`);
    const vb = (m[1].match(/viewBox="([^"]+)"/) || [])[1];
    return `<symbol id="ch-i-${basename(f, '.svg')}"${vb ? ` viewBox="${vb}"` : ''}>${m[2].trim()}</symbol>`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" style="display:none">\n${symbols.join('\n')}\n</svg>\n`;
}

export function build() {
  const version = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).version;
  const date = new Date().toISOString().slice(0, 10);
  const header = `/*! Chopa Design v${version} · ${date}
 * Polices : Inter Tight et IBM Plex Mono, SIL OFL 1.1 (textes dans ./fonts/). Ne pas renommer ni modifier les fichiers de police.
 * Fichier généré par scripts/build-css.mjs : ne pas le modifier à la main. */
`;
  const cssDir = join(SRC, 'css');
  const parts = files(cssDir, '.css').map((f) => `/* --- ${relative(cssDir, f)} --- */\n` + readFileSync(f, 'utf8').trim() + '\n');

  rmSync(DIST, { recursive: true, force: true });
  mkdirSync(join(DIST, 'fonts'), { recursive: true });
  writeFileSync(join(DIST, 'chopa.css'), header + '\n' + parts.join('\n'));

  for (const f of readdirSync(FONTS_FROM)) {
    if (f.endsWith('.woff2') || /^LICENSE.*\.txt$/.test(f)) copyFileSync(join(FONTS_FROM, f), join(DIST, 'fonts', f));
  }

  const jsDir = join(SRC, 'js');
  const jsCopied = existsSync(jsDir) ? readdirSync(jsDir, { withFileTypes: true }).filter((e) => e.isFile() && e.name.endsWith('.js')).map((e) => e.name) : [];
  for (const f of jsCopied) copyFileSync(join(jsDir, f), join(DIST, f));
  const modules = files(join(jsDir, 'chopa'), '.js');
  if (modules.length) {
    const body = modules.map((f) => `/* --- chopa/${basename(f)} --- */\n` + readFileSync(f, 'utf8').trim() + '\n');
    writeFileSync(join(DIST, 'chopa.js'), `/*! Chopa Design v${version} · chopa.js (facultatif) */\n` + body.join('\n'));
  }

  const extras = join(SRC, 'extras');
  const extrasCopied = existsSync(extras) ? readdirSync(extras, { withFileTypes: true }).filter((e) => e.isFile()).map((e) => e.name) : [];
  for (const f of extrasCopied) copyFileSync(join(extras, f), join(DIST, f));

  const svg = sprite();
  if (svg) writeFileSync(join(DIST, 'chopa-icons.svg'), svg);

  rmSync(PUBLIC_CHOPA, { recursive: true, force: true });
  mkdirSync(dirname(PUBLIC_CHOPA), { recursive: true });
  cpSync(DIST, PUBLIC_CHOPA, { recursive: true });

  const rel = (p) => (p.startsWith(ROOT) ? relative(ROOT, p) : p);
  console.log(`build-css : ${rel(DIST)}/chopa.css (${parts.length} fichiers CSS, ${modules.length} modules JS, ${jsCopied.length} JS copiés, ${extrasCopied.length} extras, sprite ${svg ? 'oui' : 'non'}) -> ${rel(PUBLIC_CHOPA)}/`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  build();
  if (process.argv.includes('--watch')) {
    let timer;
    const rebuild = () => { clearTimeout(timer); timer = setTimeout(() => { try { build(); } catch (e) { console.error(e.message); } }, 100); };
    watch(SRC, { recursive: true }, rebuild);
    const astro = spawn(process.execPath, [join(ROOT, 'node_modules', 'astro', 'bin', 'astro.mjs'), 'dev'], { cwd: ROOT, stdio: 'inherit' });
    const stop = () => { astro.kill(); process.exit(0); };
    process.on('SIGINT', stop); process.on('SIGTERM', stop);
    astro.on('exit', (code) => process.exit(code ?? 0));
  }
}
