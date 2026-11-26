// Exécuteur de tests : `node scripts/run.mjs static|browser`.
//   static  : check-dist.mjs, puis chaque scripts/static/*.mjs (ordre alphabétique) ;
//   browser : chaque scripts/browser/*.mjs (à partir de J2a-1 ; sans fichier, échec explicite : rien n'est vérifié).
// Chaque script tourne dans son propre processus node (sans shell), avec l'environnement courant (CH_OUT compris).
// Code de sortie 1 si l'un échoue ; tous sont lancés et résumés.
import { readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const mode = process.argv[2];
if (mode !== 'static' && mode !== 'browser') {
  console.error('usage : node scripts/run.mjs static|browser');
  process.exit(2);
}
const dir = join(here, mode);
const list = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.mjs')).sort().map((f) => join(dir, f)) : [];
const todo = mode === 'static' ? [join(here, 'check-dist.mjs'), ...list] : list;
if (!todo.length) {
  console.error(`run ${mode} : aucun script dans scripts/${mode}/ : rien n'est vérifié (échec volontaire).`);
  process.exit(1);
}
const rows = [];
for (const f of todo) {
  const nom = f.slice(here.length + 1);
  console.log(`\n== ${nom} ==`);
  const r = spawnSync(process.execPath, [f], { stdio: 'inherit', env: process.env });
  rows.push([nom, r.status === null ? 'signal ' + r.signal : r.status]);
}
console.log('\n== résumé ==');
for (const [nom, code] of rows) console.log(`${code === 0 ? 'OK    ' : 'ÉCHEC '} ${nom} (code ${code})`);
const bad = rows.filter(([, c]) => c !== 0).length;
console.log(`run ${mode} : ${rows.length} script(s), ${bad} échec(s)`);
process.exit(bad ? 1 : 0);
