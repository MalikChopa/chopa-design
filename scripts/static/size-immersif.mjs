// Budgets de la doc immersive (docs/ARCHITECTURE.md §16.5 M12) et ordre de <head> (§16.5, I0).
// Lit chaque page construite de site/dist (sous CH_OUT s'il est défini), suit ses <script type="module" src> et leurs imports
// statiques puis dynamiques (/_astro/…), compte le JS inline propre à la doc immersive (la tête « pageswap »), et mesure en gzip niveau 9.
// Un seuil ne s'applique qu'à ce qui existe : sans la page `/` immersive, pas de mesure « à la demande » à exiger.
// Échec nommé : page, fichier, octets. `chopa.js` et `chopa-effects.js` restent mesurés par size.mjs (inchangé).
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, posix, sep } from 'node:path';
import { gzipSync } from 'node:zlib';
import { SITE_DIST } from '../lib/paths.mjs';

const KO = 1024;
const gz = (buf) => gzipSync(buf, { level: 9 }).length;
const fmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const fails = [];
const echec = (m) => fails.push(m);

if (!existsSync(SITE_DIST)) { console.error(`size-immersif : site/dist introuvable (${SITE_DIST}) : lancer « npm run build »`); process.exit(1); }

function pagesConstruites() {
  const out = [];
  const marche = (dir) => {
    for (const n of readdirSync(dir).sort()) {
      const p = join(dir, n);
      if (statSync(p).isDirectory()) marche(p); else if (n === 'index.html') out.push(p);
    }
  };
  marche(SITE_DIST);
  return out.map((file) => ({ file, route: file.slice(SITE_DIST.length).split(sep).join('/').replace(/index\.html$/, '') || '/' }));
}

const cache = new Map();
function lire(urlPath) { // /_astro/x.js -> { buf, texte } ou null
  if (!cache.has(urlPath)) {
    const f = join(SITE_DIST, urlPath.split('?')[0]);
    cache.set(urlPath, existsSync(f) ? (() => { const buf = readFileSync(f); return { buf, texte: buf.toString('utf8') }; })() : null);
  }
  return cache.get(urlPath);
}
const resoudre = (de, spec) => (spec.startsWith('/') ? spec : posix.join(posix.dirname(de), spec));
function importsDe(urlPath, texte) {
  const statiques = new Set(), dynamiques = new Set();
  // Diapason (I2) : Vite écrit aussi import(`…`) avec des guillemets obliques.
  for (const m of texte.matchAll(/\bimport\s*\(\s*["'`]([^"'`]+)["'`]\s*\)/g)) dynamiques.add(resoudre(urlPath, m[1]));
  for (const m of texte.matchAll(/(?:\bimport|\bexport)\s*(?:[\w*${},\s]*?\bfrom\s*)?["'](\.{0,2}\/[^"']+\.m?js)["']/g)) statiques.add(resoudre(urlPath, m[1]));
  return { statiques, dynamiques };
}

/** Fichiers JS atteints depuis une page : { depart: Map(url -> octets gzip), demande: Map, inlineGz, inlineOctets, scriptsModuleInline }. */
function analyser(html, route) {
  // Seul le JS de la doc immersive compte. Sur « / » et sur une page de pièce, tout module de la page en fait partie (mur, aimants) ;
  // ailleurs, seulement le module du gabarit (DocLayout) : le script propre à une page (ex. « Créer ton thème ») n'est pas de la doc immersive.
  const toutLeJs = route === '/' || estPiece(route);
  const depart = new Map(), demande = new Map();
  const visiter = (url, dansDemande) => {
    const cible = dansDemande ? demande : depart;
    if (cible.has(url) || (!dansDemande && demande.has(url) && false)) return;
    const f = lire(url);
    if (!f) { echec(`${route} : fichier JS introuvable ${url}`); return; }
    cible.set(url, gz(f.buf));
    const { statiques, dynamiques } = importsDe(url, f.texte);
    for (const s of statiques) visiter(s, dansDemande);
    for (const d of dynamiques) visiter(d, true);
  };
  let inlineGz = 0, inlineOctets = 0;
  const sources = [];
  for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
    const attrs = m[1], corps = m[2];
    const src = /\bsrc="([^"]+)"/.exec(attrs);
    if (/type="module"/.test(attrs)) {
      if (src && src[1].startsWith('/_astro/')) { if (toutLeJs || /\/DocLayout\./.test(src[1])) { sources.push(src[1]); visiter(src[1], false); } }
      else if (!src) { // module en ligne : ses imports sont suivis, son corps compte
        inlineGz += gz(Buffer.from(corps)); inlineOctets += Buffer.byteLength(corps);
        const { statiques, dynamiques } = importsDe('/', corps);
        for (const s of statiques) visiter(s, false);
        for (const d of dynamiques) visiter(d, true);
      }
    } else if (!src && /\bpageswap\b/.test(corps)) { // la tête en ligne de la doc immersive (tete.js)
      inlineGz += gz(Buffer.from(corps)); inlineOctets += Buffer.byteLength(corps);
    }
  }
  for (const u of depart.keys()) demande.delete(u);
  return { depart, demande, inlineGz, inlineOctets, sources };
}
const somme = (m) => [...m.values()].reduce((a, b) => a + b, 0);
const estGabaritPublie = (route) => /^\/gabarits\/[^/]+\/[^/]+\/$/.test(route);
const estPiece = (route) => /^\/composants\/[^/]+\/$/.test(route);

const pages = pagesConstruites();
let nbDoc = 0, maxAutre = 0, maxPiece = 0, depart = null, demande = null, tailleIndex = 0, nbPieces = 0, nbAutres = 0;
const fichiersThree = new Set();
const lignes = [];

// Fichiers de /_astro/ qui portent la marque de three.
const astro = join(SITE_DIST, '_astro');
if (existsSync(astro)) for (const n of readdirSync(astro)) if (n.endsWith('.js') && readFileSync(join(astro, n), 'utf8').includes('__THREE__')) fichiersThree.add('/_astro/' + n);

for (const { file, route } of pages) {
  const html = readFileSync(file, 'utf8');
  const a = analyser(html, route);
  const totalDepart = a.inlineGz + somme(a.depart), totalDemande = somme(a.demande);

  if (estGabaritPublie(route)) {
    // Les gabarits publiés ne reçoivent rien (§16.3 M4) : ni script de la doc, ni inscription de transition.
    if (a.depart.size || a.demande.size || a.inlineGz) echec(`${route} : un gabarit publié charge du JS de la doc immersive (${totalDepart + totalDemande} o gzip)`);
    if (/@view-transition/.test(html)) echec(`${route} : un gabarit publié porte @view-transition`);
  } else {
    nbDoc++;
    // Ordre de <head> : meta, title, puis l'inscription, puis la tête en ligne, avant toute feuille ou autre script.
    const head = (/<head>([\s\S]*?)<\/head>/.exec(html) || [, ''])[1];
    const els = [...head.matchAll(/<(?:(meta|link)\b([^>]*)>|(title|style|script)\b([^>]*)>([\s\S]*?)<\/\3>)/g)]
      .map((m) => ({ tag: m[1] || m[3], attrs: m[2] ?? m[4] ?? '', corps: m[5] || '' }));
    const nom = (e) => (e.tag === 'script' ? (/\bsrc=/.test(e.attrs) ? 'script-src' : /\bpageswap\b/.test(e.corps) ? 'tete' : 'script-en-ligne') : e.tag === 'style' ? (/@view-transition/.test(e.corps) ? 'inscription' : 'style') : e.tag);
    const ordre = els.map(nom);
    const pos = (n) => ordre.indexOf(n);
    const iTitle = pos('title'), iVt = pos('inscription'), iTete = pos('tete');
    if (iVt < 0) echec(`${route} : inscription @view-transition absente de <head>`);
    else {
      if (iTitle < 0 || iVt !== iTitle + 1) echec(`${route} : l'inscription doit être le premier élément après <title> (ordre lu : ${ordre.slice(0, 6).join(', ')})`);
      if (!/navigation\s*:\s*auto/.test(els[iVt].corps) || /@media/.test(els[iVt].corps)) echec(`${route} : inscription incorrecte : ${els[iVt].corps.slice(0, 80)}`);
    }
    if (iTete < 0) echec(`${route} : tête en ligne (pageswap) absente de <head>`);
    else {
      if (iTete !== iVt + 1) echec(`${route} : la tête en ligne doit suivre l'inscription (ordre lu : ${ordre.slice(0, 6).join(', ')})`);
      if (/\b(defer|async)\b|type="module"/.test(els[iTete].attrs)) echec(`${route} : la tête en ligne porte defer, async ou type=module`);
    }
  }

  // Aucune page autre que « / » n'atteint un fichier contenant __THREE__.
  if (route !== '/') for (const u of [...a.depart.keys(), ...a.demande.keys()]) if (fichiersThree.has(u)) echec(`${route} : atteint ${u} qui contient __THREE__ (${(a.depart.get(u) ?? a.demande.get(u))} o gzip)`);

  if (route === '/') {
    depart = totalDepart; demande = totalDemande; tailleIndex = gz(Buffer.from(html));
    if (totalDepart > 8 * KO) echec(`/ : JS au départ ${totalDepart} o gzip > ${8 * KO} (8 Ko) : ${[...a.depart].map(([u, n]) => `${u} ${n}`).join(', ')}`);
    if (totalDemande > 40 * KO) echec(`/ : JS à la demande ${totalDemande} o gzip > ${40 * KO} (40 Ko) : ${[...a.demande].map(([u, n]) => `${u} ${n}`).join(', ')}`);
    if (tailleIndex > 40 * KO) echec(`/ : index.html ${tailleIndex} o gzip > ${40 * KO} (40 Ko)`);
  } else if (!estGabaritPublie(route)) {
    const tout = totalDepart + totalDemande;
    if (estPiece(route)) { nbPieces++; maxPiece = Math.max(maxPiece, tout); if (tout > 6 * KO) echec(`${route} : JS de la doc immersive ${tout} o gzip > ${6 * KO} (6 Ko) : ${[...a.depart, ...a.demande].map(([u, n]) => `${u} ${n}`).join(', ')}`); }
    else { nbAutres++; maxAutre = Math.max(maxAutre, tout); if (tout > 4 * KO) echec(`${route} : JS de la doc immersive ${tout} o gzip > ${4 * KO} (4 Ko) : ${[...a.depart, ...a.demande].map(([u, n]) => `${u} ${n}`).join(', ')}`); }
  }
  lignes.push(`${route.padEnd(34)} départ ${String(totalDepart).padStart(6)} o, demande ${String(totalDemande).padStart(6)} o gzip (en ligne ${a.inlineGz} o, ${a.depart.size} fichier(s) de départ)`);
}

for (const l of lignes.filter((l, i) => !estGabaritPublie(pages[i].route) && (pages[i].route === '/' || !estPiece(pages[i].route))).slice(0, 14)) console.log('size-immersif : ' + l);
console.log(`size-immersif : ${nbDoc} page(s) de la doc ; plus gros JS immersif d'une pièce ${fmt(maxPiece)} o (${nbPieces} pièce(s), budget ${6 * KO}), d'une autre page ${fmt(maxAutre)} o (${nbAutres} page(s), budget ${4 * KO}) ; fichiers __THREE__ : ${fichiersThree.size}`);
if (depart !== null) console.log(`size-immersif : « / » départ ${fmt(depart)} o (budget ${8 * KO}), à la demande ${fmt(demande)} o (budget ${40 * KO}), index.html ${fmt(tailleIndex)} o gzip (budget ${40 * KO})`);
if (fails.length) {
  for (const f of fails) console.error('size-immersif : ÉCHEC ' + f);
  process.exit(1);
}
console.log('size-immersif : budgets et ordre de <head> respectés');
