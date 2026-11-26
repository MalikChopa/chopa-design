// Parité avec la planche (J2a-2) : pour chaque pièce P (tests/parity/<slug>.json), les propriétés calculées de l'élément
// `ch-` égalent celles de l'élément de la planche (maquette/index.html), 3 thèmes, repos / :hover / :focus-visible,
// ::before et ::after, mesurées après la fin des transitions. Échec aussi si une fiche `ref: 'P'` n'a pas de JSON.
// Moteur : scripts/lib/parity.mjs. Fiches lues dans site/src/data (ou CH_DATA).
import { withBench } from '../lib/browser.mjs';
import { parityServer, loadParityFiles, loadDataFiles, missingParity, runParity } from '../lib/parity.mjs';

const t0 = Date.now();
const fails = [];
let stats = { cases: 0, comparisons: 0, props: 0 };
let nFiles = 0, nData = 0;
try {
  const parityFiles = loadParityFiles();
  nFiles = parityFiles.length;
  const dataFiles = await loadDataFiles();
  nData = dataFiles.filter((d) => d.ref === 'P').length;
  fails.push(...missingParity(dataFiles, parityFiles));
  await withBench(async ({ server, launch: l }) => {
    const c = await l('chromium');
    if (c.note) console.log(c.note);
    const r = await runParity({ browser: c.browser, server, parityFiles });
    fails.push(...r.fails);
    stats = r.stats;
  }, parityServer());
} catch (e) {
  fails.push(`exception : ${e.stack || e}`);
}
for (const f of fails) console.log('ÉCHEC ' + f);
console.log(`parity : ${nFiles} fichier(s) de parité (${nData} fiche(s) ref P), ${stats.cases} cas, ${stats.comparisons} comparaisons (thèmes × états × pseudo-éléments non compris), ${stats.props} propriétés comparées, ${fails.length} écart(s), ${((Date.now() - t0) / 1000).toFixed(1)} s`);
process.exit(fails.length ? 1 : 0);
