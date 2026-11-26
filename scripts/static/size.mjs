// Taille des livrables de dist-lib/ : octets bruts et gzip (niveau 6, celui de `gzip`).
// Échec : chopa.js > 10 Ko gzip, chopa-effects.js > 3 Ko gzip (1 Ko = 1024 octets). Avertissement : un module de
// chopa.js dépasse 120 % de son budget (budgets de docs/ARCHITECTURE.md section 5, estimés, gzip de chaque module seul).
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { DIST } from '../lib/paths.mjs';

const KO = 1024;
const gz = (s) => gzipSync(Buffer.from(s, 'utf8')).length;
const fmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const BUDGET_MODULE_KO = { core: 1.0, tabs: 1.0, menu: 0.9, dropdown: 0.9, dialog: 1.2, toast: 1.1, tooltip: 0.8, sort: 1.1, toc: 0.7, copy: 0.4, range: 0.3 };

const fails = [];
const warns = [];
const line = (nom, s) => console.log(`size : ${nom.padEnd(18)} ${fmt(Buffer.byteLength(s, 'utf8')).padStart(8)} octets, ${fmt(gz(s)).padStart(7)} gzip`);

for (const f of ['chopa.css', 'chopa.js', 'chopa-theme.js', 'chopa-effects.js', 'chopa-icons.svg', 'chopa-reset.css']) {
  const p = join(DIST, f);
  if (existsSync(p)) line(f, readFileSync(p, 'utf8'));
}
if (!existsSync(join(DIST, 'chopa.css'))) fails.push('dist-lib/chopa.css absent (lancer npm run build)');

const js = join(DIST, 'chopa.js');
if (existsSync(js)) {
  const s = readFileSync(js, 'utf8');
  if (gz(s) > 10 * KO) fails.push(`chopa.js : ${gz(s)} o gzip > ${10 * KO} (10 Ko)`);
  // Le build écrit « /* --- chopa/<fichier>.js --- */ » avant chaque module.
  const parts = s.split(/^\/\* --- chopa\/(.+?)\.js --- \*\/$/m);
  for (let i = 1; i < parts.length; i += 2) {
    const nom = parts[i].replace(/^\d+-/, '');
    const g = gz(parts[i + 1]);
    const b = BUDGET_MODULE_KO[nom];
    console.log(`size :   module ${nom.padEnd(10)} ${String(g).padStart(6)} o gzip${b ? ` (budget ${b} Ko)` : ' (sans budget)'}`);
    if (b && g > b * KO * 1.2) warns.push(`module ${nom} : ${g} o gzip > 120 % de ${b} Ko`);
  }
}
const fx = join(DIST, 'chopa-effects.js');
if (existsSync(fx) && gz(readFileSync(fx, 'utf8')) > 3 * KO) fails.push(`chopa-effects.js : ${gz(readFileSync(fx, 'utf8'))} o gzip > ${3 * KO} (3 Ko)`);

for (const w of warns) console.warn('size : AVERTISSEMENT ' + w);
if (fails.length) {
  for (const f of fails) console.error('size : ÉCHEC ' + f);
  process.exit(1);
}
console.log('size : budgets respectés');
