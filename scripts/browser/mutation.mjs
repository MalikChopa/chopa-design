// Mutation (J2a-2) : un écart introduit à dessein fait échouer la parité, puis la parité repasse quand l'écart est retiré.
// L'écart vit dans une COPIE EN MÉMOIRE de chopa.css, servie à la place du fichier : rien n'est écrit sur disque, src/ et
// dist-lib/ ne sont jamais touchés (empreintes SHA-256 comparées avant et après). Même mécanique pour « fiche P sans JSON ».
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { withBench } from '../lib/browser.mjs';
import { ROOT, DIST } from '../lib/paths.mjs';
import { parityServer, loadParityFiles, loadDataFiles, missingParity, runParity } from '../lib/parity.mjs';

const t0 = Date.now();
const fails = [];
const log = [];

// Empreinte de tout ce qu'un test ne doit pas changer : src/, tests/, dist-lib/, site/src/.
function fingerprint() {
  const h = createHash('sha256');
  const walk = (d) => {
    for (const n of readdirSync(d).sort()) {
      const p = join(d, n);
      if (statSync(p).isDirectory()) walk(p); else { h.update(p); h.update(readFileSync(p)); }
    }
  };
  for (const d of [join(ROOT, 'src'), join(ROOT, 'tests'), DIST, join(ROOT, 'site', 'src')]) walk(d);
  return h.digest('hex');
}
const before = fingerprint();

const REAL = readFileSync(join(DIST, 'chopa.css'), 'utf8');
// Chaque mutation : [nom, remplacement exact dans chopa.css, fichier de parité visé, texte attendu dans un message d'échec]
const MUTATIONS = [
  ['ch-btn : min-height 44px -> 40px (repos)', 'min-height: 44px; padding: 0 20px;', 'min-height: 40px; padding: 0 20px;', 'button', /min-height|height/],
  ['ch-btn--primary:hover : fond fg -> bg (survol)', '.ch-btn--primary:hover { background: var(--ch-fg);', '.ch-btn--primary:hover { background: var(--ch-bg);', 'button', /background-color/],
  ['ch-btn--ghost::after : bottom 10px -> 11px (pseudo-élément)', 'right: 100%; bottom: 10px;', 'right: 100%; bottom: 11px;', 'button', /::after bottom/],
  ['ch-t-h3 : 22px -> 23px (texte)', '.ch-t-h3 { font-family: var(--ch-sans); font-size: 22px;', '.ch-t-h3 { font-family: var(--ch-sans); font-size: 23px;', 'texte', /font-size/],
  ['ch-grid : gap s4 -> s3 (mise en page)', '.ch-grid { box-sizing: border-box; margin: 0; padding: 0; width: 100%; display: grid; gap: var(--ch-s4); }', '.ch-grid { box-sizing: border-box; margin: 0; padding: 0; width: 100%; display: grid; gap: var(--ch-s3); }', 'grille', /gap/],
];
const all = loadParityFiles();
const pick = (slug) => all.filter((f) => f.data.slug === slug);

async function run(css, files, themes, onlyStates) {
  let result;
  await withBench(async ({ server, launch }) => {
    const c = await launch('chromium');
    result = await runParity({ browser: c.browser, server, parityFiles: files, themes, onlyStates });
  }, parityServer({ chopaCss: css }));
  return result;
}

try {
  for (const [nom, from, to, slug, attendu] of MUTATIONS) {
    if (REAL.split(from).length !== 2) { fails.push(`${nom} : motif de mutation introuvable ou ambigu dans chopa.css (la mutation ne prouve rien)`); continue; }
    const files = pick(slug);
    const mutated = await run(REAL.replace(from, to), files, ['sombre'], null);
    const hit = mutated.fails.filter((f) => attendu.test(f));
    if (!mutated.fails.length) fails.push(`${nom} : la parité n'a PAS échoué (écart non détecté)`);
    else if (!hit.length) fails.push(`${nom} : échec, mais pas sur la propriété attendue : ${mutated.fails[0]}`);
    const restored = await run(REAL, files, ['sombre'], null);
    if (restored.fails.length) fails.push(`${nom} : après retrait de l'écart la parité échoue encore : ${restored.fails[0]}`);
    log.push(`${nom} : ${mutated.fails.length} écart(s) détecté(s) (ex. « ${(hit[0] || mutated.fails[0] || '').slice(0, 110)} »), retiré : ${restored.fails.length} écart(s)`);
  }
  // Fiche ref 'P' sans JSON de parité (en mémoire : aucune fiche temporaire n'est écrite).
  const real = await loadDataFiles();
  const base = missingParity(real, all);
  const faux = missingParity([...real, { slug: 'fantome', ref: 'P' }], all);
  if (base.length) fails.push(`fiches réelles sans JSON de parité : ${base.join(' ; ')}`);
  if (faux.length !== 1 || !faux[0].includes('fantome')) fails.push(`fiche P fantôme non détectée (messages : ${JSON.stringify(faux)})`);
  log.push(`fiche P sans JSON : réelles ${base.length} manquante(s) ; avec une fiche « fantome » ajoutée : ${faux.length} (« ${faux[0] || ''} »)`);
} catch (e) {
  fails.push(`exception : ${e.stack || e}`);
}
const after = fingerprint();
if (before !== after) fails.push('une empreinte de src/, tests/, dist-lib/ ou site/src/ a changé pendant les tests (un fichier a été écrit)');
else log.push('aucun fichier modifié (empreinte SHA-256 de src/, tests/, dist-lib/, site/src/ identique avant et après)');
for (const l of log) console.log('mutation : ' + l);
for (const f of fails) console.log('ÉCHEC ' + f);
console.log(`mutation : ${MUTATIONS.length} écart(s) voulu(s) + fiche fantôme, ${fails.length} échec(s), ${((Date.now() - t0) / 1000).toFixed(1)} s`);
process.exit(fails.length ? 1 : 0);
