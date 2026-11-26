// Images et vidéos (J4b, docs/ARCHITECTURE.md sections 4 et 9) : dans les exemples (site/src/examples/**) et les gabarits
// (site/src/templates/**), toute balise <img> porte un attribut `alt` et toute balise <video> porte l'attribut `controls`.
// `alt=""` (image décorative) est permis mais compté et affiché à chaque exécution. Les valeurs entre guillemets sont
// retirées avant la recherche d'un attribut : un « alt » ou un « controls » dans une adresse de données n'est pas pris pour l'attribut.
import { readFileSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const BALISE = (nom) => new RegExp(`<${nom}\\b(?:[^>"']|"[^"]*"|'[^']*')*>`, 'gi');
const sansValeurs = (tag) => tag.replace(/"[^"]*"|'[^']*'/g, '""');
const aAttribut = (tag, nom) => new RegExp(`\\s${nom}(?=[\\s=/>])`, 'i').test(sansValeurs(tag));
const valeur = (tag, nom) => { const m = tag.match(new RegExp(`\\s${nom}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'i')); return m ? (m[1] ?? m[2]) : null; };

export default function figure(ctx) {
  const racines = [join(ctx.ROOT, 'site', 'src', 'examples'), join(ctx.ROOT, 'site', 'src', 'templates')];
  const fichiers = racines.filter((r) => existsSync(r)).flatMap((r) => ctx.walk(r).filter((f) => f.endsWith('.html')));
  let imgs = 0, videos = 0;
  const vides = [], sansAlt = [], sansControls = [];
  for (const f of fichiers) {
    const html = readFileSync(f, 'utf8');
    const rel = relative(ctx.ROOT, f);
    for (const m of html.matchAll(BALISE('img'))) {
      imgs++;
      if (!aAttribut(m[0], 'alt')) sansAlt.push(`${rel} : ${m[0].slice(0, 80)}…`);
      else if ((valeur(m[0], 'alt') ?? '').trim() === '') vides.push(rel);
    }
    for (const m of html.matchAll(BALISE('video'))) {
      videos++;
      if (!aAttribut(m[0], 'controls')) sansControls.push(`${rel} : ${m[0].slice(0, 80)}…`);
    }
  }
  const parFichier = [...new Set(vides)].map((f) => `${f} ×${vides.filter((v) => v === f).length}`);
  console.log(`figure : ${imgs} <img> lue(s), ${videos} <video> lue(s), ${vides.length} alt="" (image décorative)${parFichier.length ? ' : ' + parFichier.join(', ') : ''}`);
  return [
    { nom: `${imgs} <img> et ${videos} <video> lus dans ${fichiers.length} fichier(s) HTML d'exemples et de gabarits`, ok: true },
    { nom: 'chaque <img> a un attribut alt (alt="" permis, décoratif)', ok: sansAlt.length === 0, detail: sansAlt.join(' ; ') },
    { nom: 'chaque <video> a l\'attribut controls', ok: sansControls.length === 0, detail: sansControls.join(' ; ') },
    { nom: `${vides.length} image(s) décorative(s) (alt="") comptée(s)`, ok: true, detail: parFichier.join(', ') },
  ];
}
